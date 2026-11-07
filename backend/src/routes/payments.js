import { Router } from 'express'
import jwt from 'jsonwebtoken'
import Payment from '../models/Payment.js'
import Booking from '../models/Booking.js'
import { deliverBookingConfirmationEmail } from '../services/bookingConfirmationEmail.js'
import { deliverBookingDeclinedEmail } from '../services/bookingDeclinedEmail.js'

/** Append an event to the booking's audit history (bounded to the last 100). */
function logEvent(booking, entry) {
  const history = Array.isArray(booking.history) ? booking.history : []
  history.push({
    type: entry.type || '',
    description: entry.description || '',
    actor: entry.actor || '',
    details: entry.details || {},
    timestamp: new Date(),
  })
  booking.history = history.slice(-100)
}

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET

// GET /api/payments/pending — returns payments awaiting verification with booking data
// Requires admin auth (unlike public GET endpoints, this exposes customer & payment data)
router.get('/pending', async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    jwt.verify(header.split(' ')[1], JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  try {
    const payments = await Payment.find({ status: 'verification_required' })
      .populate('booking_id')
      .sort({ created_at: -1 })
    res.json(payments)
  } catch (err) { next(err) }
})

// POST /api/payments/verify — approve or reject a payment
router.post('/verify', async (req, res, next) => {
  try {
    const { booking_id, action } = req.body

    if (!booking_id || !action) {
      return res.status(400).json({ error: 'booking_id and action (approve|reject) are required' })
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' })
    }

    // Find the most recent pending payment for this booking
    const payment = await Payment.findOne({
      booking_id,
      status: 'verification_required',
    }).sort({ created_at: -1 })

    if (!payment) {
      return res.status(404).json({ error: 'No pending payment found for this booking' })
    }

    const booking = await Booking.findById(booking_id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Double-action guard — a booking in a final state (confirmed/declined) can
    // only be re-processed after an explicit status reset.
    if (['confirmed', 'cancelled'].includes(booking.booking_status)) {
      return res.status(409).json({
        error: `This booking is already ${booking.booking_status}. Reset its status before processing it again.`,
      })
    }

    const adminEmail = req.user?.email || req.body?.verified_by || 'Admin'

    if (action === 'approve') {
      payment.status = 'paid'
      payment.paid_at = new Date()
      await payment.save()

      booking.payment_status = 'paid'
      booking.booking_status = 'confirmed'
      booking.verified_by = adminEmail
      booking.approval_date = new Date().toISOString()
      booking.rejected_by = ''
      booking.rejection_date = ''
      booking.confirmation_email_status = 'pending'
      booking.confirmation_email_attempts = 0
      booking.confirmation_email_last_error = ''
      logEvent(booking, {
        type: 'booking_approved',
        description: 'Booking approved and payment verified',
        actor: adminEmail,
        details: { from: 'pending', to: 'confirmed' },
      })
      await booking.save()

      // Await the send so the response reflects the real result. If it fails,
      // the booking stays 'pending' and the background retry loop resends it.
      const emailSent = await deliverBookingConfirmationEmail(booking)

      res.json({
        success: true,
        message: 'Payment approved and booking confirmed',
        booking,
        emailSent,
        note: emailSent
          ? undefined
          : 'Booking confirmed. The confirmation email is queued and will retry automatically.',
        payment: {
          id: payment._id,
          status: payment.status,
          paid_at: payment.paid_at,
        },
      })
    } else {
      payment.status = 'failed'
      await payment.save()

      booking.payment_status = 'failed'
      booking.booking_status = 'cancelled'
      booking.rejected_by = adminEmail
      booking.rejection_date = new Date().toISOString()
      logEvent(booking, {
        type: 'booking_rejected',
        description: 'Booking declined (payment could not be verified)',
        actor: adminEmail,
        details: { from: 'pending', to: 'cancelled', reason: 'payment' },
      })
      await booking.save()

      // Notify the customer their booking was declined. Awaited so the response
      // reports the real delivery result instead of losing failures to a
      // fire-and-forget send.
      const emailSent = await deliverBookingDeclinedEmail({ booking, reason: 'payment' })

      res.json({
        success: true,
        message: 'Payment rejected',
        booking,
        emailSent,
        note: emailSent
          ? undefined
          : 'Payment rejected, but the decline email could not be sent. Check the server logs.',
        payment: {
          id: payment._id,
          status: payment.status,
        },
      })
    }
  } catch (err) { next(err) }
})

export default router
