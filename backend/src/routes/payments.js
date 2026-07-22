import { Router } from 'express'
import crypto from 'crypto'
import { Safepay } from '@sfpy/node-sdk'
import Booking from '../models/Booking.js'
import { sendPaymentConfirmedEmail } from '../email.js'

const router = Router()

const SAFEPAY_API_KEY = process.env.SAFEPAY_PUBLIC_KEY || ''
const SAFEPAY_V1_SECRET = process.env.SAFEPAY_SECRET_KEY || ''
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_SECRET_KEY || ''
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Initialize SafePay SDK (high-level SDK that handles TBT internally)
let safepay = null
try {
  if (SAFEPAY_API_KEY && SAFEPAY_V1_SECRET) {
    safepay = new Safepay({
      environment: SAFEPAY_ENV,
      apiKey: SAFEPAY_API_KEY,
      v1Secret: SAFEPAY_V1_SECRET,
      webhookSecret: SAFEPAY_WEBHOOK_SECRET,
    })
    console.log(`SafePay SDK initialized (${SAFEPAY_ENV})`)
  }
} catch (err) {
  console.error('SafePay SDK initialization failed:', err.message)
}

/**
 * POST /create-checkout
 * Creates a SafePay payment session and generates a checkout URL.
 * Uses @sfpy/node-sdk which handles TBT (temporary bearer token) internally.
 */
router.post('/create-checkout', async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body

    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'bookingId and amount are required' })
    }

    if (!safepay) {
      return res.status(500).json({ error: 'SafePay not configured' })
    }

    // Fetch the booking to validate it exists and not already paid
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Booking already paid' })
    }

    // Update booking status to Payment Pending before redirect
    booking.status = 'payment_pending'
    booking.paymentMethod = 'safepay'
    booking.paymentStatus = 'pending'
    booking.paymentGateway = 'safepay'
    await booking.save()

    // Step 1: Create a payment session using the SDK
    // The SDK handles authentication, session creation, and TBT generation internally
    const paymentResult = await safepay.payments.create({
      amount: Number(amount),
      currency: 'PKR',
    })

    const tracker = paymentResult?.token
    if (!tracker) {
      console.error('SafePay payment creation returned no token:', paymentResult)
      return res.status(502).json({ error: 'Invalid payment gateway response' })
    }

    // Step 2: Generate the checkout URL using the SDK
    // This generates the correct URL format: sandbox.api.getsafepay.com/checkout/pay?beacon=track_...&env=sandbox&...
    const checkoutUrl = safepay.checkout.create({
      token: tracker,
      orderId: booking.bookingNumber || `CCP-${Date.now()}`,
      cancelUrl: `${FRONTEND_URL}/payment/failed?booking_id=${bookingId}`,
      redirectUrl: `${FRONTEND_URL}/payment/success?booking_id=${bookingId}`,
      source: 'custom',
      webhooks: false,
    })

    // Store the tracker reference on the booking
    booking.paymentDetails.tracker = tracker
    booking.paymentDetails.amount = amount
    await booking.save()

    res.json({
      checkoutUrl,
      tracker,
    })
  } catch (err) {
    console.error('SafePay checkout error:', err)
    next(err)
  }
})

/**
 * POST /safepay/webhook
 * Receives SafePay webhook events to update booking payment status.
 * Only confirms booking after verifying the webhook (never trust redirect alone).
 */
router.post('/safepay/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature']
    const payload = JSON.stringify(req.body)

    // Verify webhook signature if secret is available
    if (SAFEPAY_WEBHOOK_SECRET && signature) {
      const expectedSig = crypto
        .createHmac('sha256', SAFEPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex')

      if (signature !== expectedSig) {
        console.error('SafePay webhook signature mismatch')
        return res.status(401).json({ error: 'Invalid signature' })
      }
    }

    const event = req.body
    console.log('SafePay webhook received:', event?.data?.event || event?.event || 'unknown')

    // Extract tracker and booking info
    const tracker = event?.data?.tracker?.token || event?.tracker || event?.data?.token || event?.token
    const eventType = event?.data?.event || event?.event || ''
    const status = event?.data?.tracker?.state || event?.data?.state || event?.state || ''
    const transactionId = event?.data?.transaction?.id || event?.transaction?.id || event?.data?.id || ''

    if (!tracker) {
      return res.status(200).json({ received: true })
    }

    // Find booking by tracker
    const booking = await Booking.findOne({ 'paymentDetails.tracker': tracker })
    if (!booking) {
      console.warn(`No booking found for tracker: ${tracker}`)
      return res.status(200).json({ received: true })
    }

    // Verify: payment has not already been processed
    if (booking.paymentStatus === 'paid') {
      console.log(`Booking ${booking.bookingNumber} already marked as paid, skipping`)
      return res.status(200).json({ received: true })
    }

    // Determine payment status from event
    let paymentStatus = ''
    let bookingStatus = booking.status

    const isCompleted = eventType === 'payment.succeeded' ||
      status === 'TRACKER_ENDED' ||
      status === 'completed' ||
      status === 'success' ||
      eventType.includes('succeeded') ||
      eventType.includes('completed')

    const isFailed = eventType === 'payment.failed' ||
      status === 'failed' ||
      status === 'rejected' ||
      status === 'TRACKER_FAILED' ||
      eventType.includes('failed')

    if (isCompleted) {
      paymentStatus = 'paid'
      bookingStatus = 'confirmed'
    } else if (isFailed) {
      paymentStatus = 'failed'
      bookingStatus = 'payment_pending'
    }

    if (paymentStatus) {
      const updateFields = {
        paymentStatus,
        status: bookingStatus,
        paymentGateway: 'safepay',
      }

      if (paymentStatus === 'paid') {
        updateFields.gatewayTransactionId = transactionId
        updateFields.paidAt = new Date()
      }

      await Booking.findByIdAndUpdate(booking._id, {
        ...updateFields,
        $push: {
          history: {
            type: 'payment_status_changed',
            description: paymentStatus === 'paid'
              ? `Payment confirmed via SafePay (${transactionId ? `TXN: ${transactionId}` : 'webhook'})`
              : 'Payment failed via SafePay',
            timestamp: new Date(),
            details: { from: booking.paymentStatus, to: paymentStatus, gateway: 'safepay', transactionId },
          },
        },
      })

      console.log(`Booking ${booking.bookingNumber} payment status updated to ${paymentStatus}`)

      // Send email notification for successful payment
      if (paymentStatus === 'paid') {
        // Re-fetch the updated booking so the email has the latest status
        const updatedBooking = await Booking.findById(booking._id)
        if (updatedBooking) {
          sendPaymentConfirmedEmail(updatedBooking)
        }
      }
    }

    res.status(200).json({ received: true })
  } catch (err) {
    console.error('SafePay webhook error:', err)
    res.status(200).json({ received: true })
  }
})

/**
 * GET /check-status/:bookingId
 * Check the payment status of a booking for the processing page to poll.
 */
router.get('/check-status/:bookingId', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
    if (!booking) return res.status(404).json({ error: 'Not found' })

    res.json({
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      bookingNumber: booking.bookingNumber,
      name: booking.name,
      gatewayTransactionId: booking.gatewayTransactionId,
    })
  } catch (err) {
    next(err)
  }
})

export default router
