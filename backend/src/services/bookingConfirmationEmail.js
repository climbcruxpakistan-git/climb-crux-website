import Booking from '../models/Booking.js'
import Session from '../models/Session.js'
import { generateBookingPdf } from './pdfService.js'
import { sendBookingApprovedEmail } from './emailService.js'

export const CONFIRMATION_EMAIL_RETRY_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 8

export function bookingTypeLabel(sessionId) {
  return String(sessionId || '').toLowerCase() === 'public' ? 'Public Session' : 'Private Session'
}

async function resolveSessionTime(booking) {
  let sessionTime = booking.time || ''
  if (booking.session_start_time || booking.session_end_time) {
    sessionTime = [booking.session_start_time, booking.session_end_time].filter(Boolean).join(' – ')
  } else if (!sessionTime) {
    try {
      const session = booking.date ? await Session.findOne({ date: booking.date }) : null
      sessionTime = session?.time || ''
    } catch { /* ignore */ }
  }
  return sessionTime
}

/**
 * Send the confirmed-booking email for an already-confirmed booking and persist
 * the delivery result on the booking. Returns true only when Resend accepted it.
 */
export async function deliverBookingConfirmationEmail(booking) {
  if (!booking?._id) return false

  const attempts = Number(booking.confirmation_email_attempts || 0) + 1

  if (!booking.customer_email) {
    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          confirmation_email_status: 'failed',
          confirmation_email_attempts: attempts,
          confirmation_email_last_error: 'No customer email on booking',
        },
      }
    )
    console.warn(`[confirmation-email] ${booking.booking_number || booking._id}: no customer email`)
    return false
  }

  const sessionType = bookingTypeLabel(booking.session_id)
  const sessionTime = await resolveSessionTime(booking)

  let pdfBuffer = null
  try {
    pdfBuffer = await generateBookingPdf(booking, {
      status: 'confirmed',
      sessionType,
      time: sessionTime,
    })
  } catch (err) {
    console.error('[confirmation-email] PDF generation failed:', err.message)
  }

  let sent = false
  try {
    sent = await sendBookingApprovedEmail({ booking, sessionType, pdfBuffer })
  } catch (err) {
    console.error('[confirmation-email] Send threw:', err.message)
  }

  if (sent) {
    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          confirmation_email_status: 'sent',
          confirmation_email_sent_at: new Date(),
          confirmation_email_attempts: attempts,
          confirmation_email_last_error: '',
        },
      }
    )
    return true
  }

  const status = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending'
  await Booking.updateOne(
    { _id: booking._id },
    {
      $set: {
        confirmation_email_status: status,
        confirmation_email_attempts: attempts,
        confirmation_email_last_error: 'Resend send failed — see server logs',
      },
    }
  )
  console.error(
    `[confirmation-email] ${booking.booking_number || booking._id}: send failed (attempt ${attempts}/${MAX_ATTEMPTS})` +
      (status === 'failed' ? ' — giving up' : ' — will retry')
  )
  return false
}

let retrying = false

/** Retry every confirmed booking whose confirmation email is still pending. */
export async function retryPendingConfirmationEmails() {
  if (retrying) return { sent: 0, retried: 0, skipped: true }
  retrying = true
  try {
    const pending = await Booking.find({
      confirmation_email_status: 'pending',
      booking_status: 'confirmed',
      payment_status: 'paid',
      customer_email: { $nin: ['', null] },
      confirmation_email_attempts: { $lt: MAX_ATTEMPTS },
    })

    let sent = 0
    for (const booking of pending) {
      const ok = await deliverBookingConfirmationEmail(booking)
      if (ok) sent += 1
    }

    if (pending.length > 0) {
      console.log(`[confirmation-email] retry pass: ${sent}/${pending.length} sent`)
    }
    return { sent, retried: pending.length }
  } finally {
    retrying = false
  }
}
