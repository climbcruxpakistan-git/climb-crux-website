import { Router } from 'express'
import crypto from 'crypto'
import Booking from '../models/Booking.js'
import { sendPaymentConfirmedEmail } from '../email.js'

const router = Router()

const SAFEPAY_PUBLIC_KEY = process.env.SAFEPAY_PUBLIC_KEY || ''
const SAFEPAY_SECRET = process.env.SAFEPAY_SECRET_KEY || ''
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox'

// Determine SafePay API base from environment
const SAFEPAY_BASE = SAFEPAY_ENV === 'production'
  ? 'https://api.getsafepay.com'
  : 'https://sandbox.api.getsafepay.com'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

/**
 * POST /create-checkout
 * Creates a SafePay payment session (tracker) for a booking.
 * Sends booking_number, customer details in the payload.
 * Returns the checkout URL to redirect the user to.
 */
router.post('/create-checkout', async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body

    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'bookingId and amount are required' })
    }

    if (!SAFEPAY_PUBLIC_KEY || !SAFEPAY_SECRET) {
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

    // Create SafePay order session with booking_number in metadata
    // SafePay API expects: client (API key), environment, amount in rupees (float)
    const orderPayload = {
      client: SAFEPAY_PUBLIC_KEY,
      amount: Number(amount), // In rupees (e.g. 2500.00)
      currency: 'PKR',
      environment: SAFEPAY_ENV,
      intent: 'CYBERSOURCE',
      mode: 'payment',
      entry_mode: 'redirect',
      metadata: {
        booking_id: bookingId,
        booking_number: booking.bookingNumber,
        customer_name: booking.name,
        customer_email: booking.email,
      },
      redirect_urls: {
        success: `${FRONTEND_URL}/payment/success?booking_id=${bookingId}`,
        cancel: `${FRONTEND_URL}/payment/failed?booking_id=${bookingId}`,
        failure: `${FRONTEND_URL}/payment/failed?booking_id=${bookingId}`,
      },
    }

    const orderRes = await fetch(`${SAFEPAY_BASE}/order/v1/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    })

    const orderData = await orderRes.json()

    if (!orderRes.ok || orderData?.status?.message !== 'success') {
      console.error('SafePay order creation failed:', orderData)
      return res.status(502).json({ error: 'Payment gateway error', details: orderData?.status?.errors || orderData })
    }

    const tracker = orderData?.data?.token

    if (!tracker) {
      console.error('SafePay response missing tracker:', orderData)
      return res.status(502).json({ error: 'Invalid payment gateway response' })
    }

    // Store the tracker reference
    booking.paymentDetails.tracker = tracker
    booking.paymentDetails.amount = amount
    await booking.save()

    const checkoutUrl = `https://pay.getsafepay.com/checkout?tracker=${tracker}`

    res.json({
      checkoutUrl,
      tracker,
    })
  } catch (err) {
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
    if (SAFEPAY_SECRET && signature) {
      const expectedSig = crypto
        .createHmac('sha256', SAFEPAY_SECRET)
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
    const status = event?.data?.order?.status || event?.order?.status || event?.data?.state || event?.state || ''
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

    // Verify: amount matches
    const webhookAmount = event?.data?.order?.amount || event?.order?.amount || 0
    const expectedAmount = (booking.paymentDetails?.amount || 0) * 100
    if (webhookAmount && Math.abs(webhookAmount - expectedAmount) > 1) {
      console.error(`Amount mismatch for booking ${booking.bookingNumber}: expected ${expectedAmount}, got ${webhookAmount}`)
      return res.status(200).json({ received: true })
    }

    // Determine payment status from event
    let paymentStatus = ''
    let bookingStatus = booking.status

    if (
      eventType === 'payment.completed' ||
      status === 'completed' ||
      status === 'success' ||
      eventType.includes('completed') ||
      eventType.includes('success')
    ) {
      paymentStatus = 'paid'
      bookingStatus = 'confirmed'
    } else if (
      eventType === 'payment.failed' ||
      status === 'failed' ||
      status === 'rejected' ||
      eventType.includes('failed') ||
      eventType.includes('rejected')
    ) {
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
        sendPaymentConfirmedEmail(booking)
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
 * Only returns the current status from our database (webhook-driven).
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
