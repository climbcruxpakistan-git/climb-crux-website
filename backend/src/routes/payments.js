import { Router } from 'express'
import jwt from 'jsonwebtoken'
import Payment from '../models/Payment.js'
import Booking from '../models/Booking.js'
import Session from '../models/Session.js'
import { generateBookingPdf } from '../services/pdfService.js'
import { sendBookingApprovedEmail, sendBookingDeclinedEmail } from '../services/emailService.js'

/** Classify a booking as Public or Private based on its session_id. */
function bookingTypeLabel(sessionId) {
  return String(sessionId || '').toLowerCase() === 'public' ? 'Public Session' : 'Private Session'
}

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
    const sessionType = bookingTypeLabel(booking.session_id)

    if (action === 'approve') {
      payment.status = 'paid'
      payment.paid_at = new Date()
      await payment.save()

      booking.payment_status = 'paid'
      booking.booking_status = 'confirmed'
      booking.verified_by = adminEmail
      booking.approval_date = new Date().toISOString().slice(0, 10)
      booking.rejected_by = ''
      booking.rejection_date = ''
      logEvent(booking, {
        type: 'booking_approved',
        description: 'Booking approved and payment verified',
        actor: adminEmail,
        details: { from: 'pending', to: 'confirmed' },
      })
      await booking.save()

      // Best-effort session time (from the sessions list) for the PDF
      let sessionTime = ''
      try {
        const s = booking.date ? await Session.findOne({ date: booking.date }) : null
        sessionTime = s?.time || ''
      } catch { /* ignore */ }
      // Generate the confirmed-booking PDF (best-effort)
      let pdfBuffer = null
      try {
        pdfBuffer = await generateBookingPdf(booking, { status: 'confirmed', sessionType, time: sessionTime })
      } catch (pdfErr) {
        console.error('[payments] Confirmation PDF failed:', pdfErr.message)
      }

      // Send the customer confirmation email (don't block response on failure).
      // No admin notification here — the admin was already alerted when the
      // payment screenshot was submitted, and this is an admin-initiated action.
      sendBookingApprovedEmail({ booking, sessionType, pdfBuffer }).catch(() => {})

      res.json({
        success: true,
        message: 'Payment approved and booking confirmed',
        booking,
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
      booking.rejection_date = new Date().toISOString().slice(0, 10)
      logEvent(booking, {
        type: 'booking_rejected',
        description: 'Booking declined (payment could not be verified)',
        actor: adminEmail,
        details: { from: 'pending', to: 'cancelled', reason: 'payment' },
      })
      await booking.save()

      // Best-effort session time (from the sessions list) for the PDF
      let sessionTime = ''
      try {
        const s = booking.date ? await Session.findOne({ date: booking.date }) : null
        sessionTime = s?.time || ''
      } catch { /* ignore */ }
      // Generate the booking-form PDF (best-effort)
      let pdfBuffer = null
      try {
        pdfBuffer = await generateBookingPdf(booking, { status: 'declined', sessionType, time: sessionTime })
      } catch (pdfErr) {
        console.error('[payments] Decline PDF failed:', pdfErr.message)
      }

      // Notify the customer their booking was declined
      sendBookingDeclinedEmail({ booking, sessionType, reason: 'payment', pdfBuffer }).catch(() => {})

      res.json({
        success: true,
        message: 'Payment rejected',
        booking,
        payment: {
          id: payment._id,
          status: payment.status,
        },
      })
    }
  } catch (err) { next(err) }
})

export default router
