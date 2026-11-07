/**
 * Decline-email delivery — one place that builds the declined-booking PDF and
 * sends the customer notification. Every admin path that declines a booking
 * (the dedicated decline endpoint, a plain status change to cancelled, the
 * booking edit form, and the pending-payments queue) goes through this, so a
 * decline never ends silently without an email.
 *
 * Never throws: a failed PDF or send is logged and reported as `false`, so the
 * decline itself is never blocked by email problems.
 */
import Session from '../models/Session.js'
import { generateBookingPdf } from './pdfService.js'
import { sendBookingDeclinedEmail } from './emailService.js'
import { bookingTypeLabel } from './bookingConfirmationEmail.js'

/** Snapshot times first, then legacy lookup — mirrors the confirmation email. */
async function resolveSessionTime(booking) {
  if (booking.session_start_time || booking.session_end_time) {
    return [booking.session_start_time, booking.session_end_time].filter(Boolean).join(' – ')
  }
  let sessionTime = booking.time || ''
  if (!sessionTime) {
    try {
      const session = booking.date ? await Session.findOne({ date: booking.date }) : null
      sessionTime = session?.time || ''
    } catch { /* ignore */ }
  }
  return sessionTime
}

/**
 * Send the declined-booking email for a booking that has just been declined.
 * @returns {Promise<boolean>} true only when Resend accepted the message.
 */
export async function deliverBookingDeclinedEmail({ booking, reason = 'payment' }) {
  if (!booking?._id) return false
  if (!booking.customer_email) {
    console.warn(`[decline-email] ${booking.booking_number || booking._id}: no customer email on booking`)
    return false
  }

  const sessionType = bookingTypeLabel(booking.session_id)
  const sessionTime = await resolveSessionTime(booking)

  let pdfBuffer = null
  try {
    pdfBuffer = await generateBookingPdf(booking, { status: 'declined', sessionType, time: sessionTime })
  } catch (err) {
    console.error('[decline-email] PDF generation failed:', err.message)
  }

  try {
    return await sendBookingDeclinedEmail({ booking, sessionType, reason, pdfBuffer })
  } catch (err) {
    console.error('[decline-email] Send threw:', err.message)
    return false
  }
}
