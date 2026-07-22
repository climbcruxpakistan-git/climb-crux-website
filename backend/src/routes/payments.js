import { Router } from 'express'
import crypto from 'crypto'
import Booking from '../models/Booking.js'
import { sendPaymentConfirmedEmail } from '../email.js'

const router = Router()

const SAFEPAY_SECRET = process.env.SAFEPAY_SECRET_KEY || ''
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY || ''
const SAFEPAY_BASE = process.env.SAFEPAY_BASE || 'https://sandbox.api.getsafepay.com'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

/**
 * POST /create-checkout
 * Creates a SafePay payment session (tracker) for a booking.
 * Returns the checkout URL to redirect the user to.
 */
router.post('/create-checkout', async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body

    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'bookingId and amount are required' })
    }

    if (!SAFEPAY_SECRET || !SAFEPAY_API_KEY) {
      return res.status(500).json({ error: 'SafePay not configured' })
    }

    // Fetch the booking to validate it exists
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Create SafePay order session
    const orderPayload = {
      merchant_api_key: SAFEPAY_API_KEY,
      amount: Math.round(amount * 100), // Convert to minor units (paisa)
      currency: 'PKR',
      intent: 'CYBERSOURCE',
      mode: 'payment',
      entry_mode: 'redirect',
      metadata: {
        booking_id: bookingId,
        customer_name: booking.name,
        customer_email: booking.email,
      },
      redirect_urls: {
        success: `${FRONTEND_URL}/book-now?payment=success&booking_id=${bookingId}`,
        cancel: `${FRONTEND_URL}/book-now?payment=cancelled&booking_id=${bookingId}`,
      },
    }

    const orderRes = await fetch(`${SAFEPAY_BASE}/order/v1/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SAFEPAY_SECRET}`,
      },
      body: JSON.stringify(orderPayload),
    })

    const orderData = await orderRes.json()

    if (!orderRes.ok) {
      console.error('SafePay order creation failed:', orderData)
      return res.status(502).json({ error: 'Payment gateway error', details: orderData })
    }

    const tracker = orderData?.data?.tracker?.token || orderData?.data?.token || orderData?.token

    if (!tracker) {
      console.error('SafePay response missing tracker:', orderData)
      return res.status(502).json({ error: 'Invalid payment gateway response' })
    }

    // Update the booking with SafePay tracker reference
    await Booking.findByIdAndUpdate(bookingId, {
      paymentMethod: 'safepay',
      paymentStatus: 'pending',
      'paymentDetails.tracker': tracker,
      'paymentDetails.amount': amount,
    })

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
 * POST /webhook
 * Receives SafePay webhook events to update booking payment status.
 */
router.post('/webhook', async (req, res) => {
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
    const tracker = event?.data?.tracker?.token || event?.tracker || event?.data?.token
    const eventType = event?.data?.event || event?.event || ''
    const status = event?.data?.order?.status || event?.order?.status || ''

    if (!tracker) {
      return res.status(200).json({ received: true })
    }

    // Find booking by tracker
    const booking = await Booking.findOne({ 'paymentDetails.tracker': tracker })
    if (!booking) {
      console.warn(`No booking found for tracker: ${tracker}`)
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
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus
      booking.status = bookingStatus
      await booking.save()

      console.log(`Booking ${booking._id} payment status updated to ${paymentStatus}`)

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
 * Check the payment status of a booking.
 * If the status is still 'pending' and we have a SafePay tracker,
 * proactively query the SafePay API for the actual order status.
 */
router.get('/check-status/:bookingId', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
    if (!booking) return res.status(404).json({ error: 'Not found' })

    // If still pending and has a SafePay tracker, check SafePay directly
    if (booking.paymentStatus === 'pending' && booking.paymentDetails?.tracker && SAFEPAY_SECRET) {
      try {
        const trackerRes = await fetch(`${SAFEPAY_BASE}/order/v1/tracker/${booking.paymentDetails.tracker}`, {
          headers: {
            Authorization: `Bearer ${SAFEPAY_SECRET}`,
          },
        })
        if (trackerRes.ok) {
          const trackerData = await trackerRes.json()
          const remoteStatus = trackerData?.data?.order?.status || trackerData?.order?.status || ''

          if (remoteStatus === 'completed' || remoteStatus === 'success') {
            booking.paymentStatus = 'paid'
            booking.status = 'confirmed'
            await booking.save()
            sendPaymentConfirmedEmail(booking)
          } else if (remoteStatus === 'failed' || remoteStatus === 'rejected') {
            booking.paymentStatus = 'failed'
            await booking.save()
          }
        }
      } catch (err) {
        console.warn('Failed to query SafePay tracker status:', err.message)
      }
    }

    res.json({
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      tracker: booking.paymentDetails?.tracker || null,
    })
  } catch (err) {
    next(err)
  }
})

export default router
