import { Router } from 'express'
import Booking from '../models/Booking.js'
import MembershipApplication from '../models/MembershipApplication.js'

const router = Router()

/** Today's date as YYYY-MM-DD in the server's local timezone. */
function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * A scheduled session date (YYYY-MM-DD) is considered past once the day
 * itself is over — strictly before today. On the session day the booking
 * still shows its confirmation status; from the following day it flips to
 * completed (confirmed bookings) or expired (payments never completed).
 */
function sessionPassed(dateStr) {
  return Boolean(dateStr) && dateStr < todayStr()
}

/**
 * Failed-lookup monitor (in-memory, single instance): per-IP consecutive
 * failure counter so repeated probing of non-existent codes is visible in the
 * logs. Counters reset on a successful lookup.
 */
const failedLookups = new Map()
const FAILURE_LOG_EVERY = 10

/**
 * Normalize a reference code for exact matching: trim, uppercase, strip
 * control characters. We never validate the format here — an unrecognized
 * code simply returns the same generic "no record" response.
 */
function normalizeCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
}

/** Map a booking document to one of the public lifecycle status keys. */
export function bookingStatusKey(b) {
  if (b.booking_status === 'cancelled') return 'booking_declined'
  if (b.booking_status === 'confirmed') {
    // Automatic lifecycle: once the session date has passed, "Booking
    // Confirmed" gives way to "Session Completed" (record is NOT overwritten).
    return sessionPassed(b.date) ? 'session_completed' : 'booking_confirmed'
  }
  // Payment was never completed before the session date passed → expired.
  if (sessionPassed(b.date)) return 'booking_expired'
  if (b.booking_status === 'pending_verification') return 'under_verification'
  // pending_payment — distinguish "just received" from "payment started"
  return b.payment_method ? 'payment_pending' : 'booking_received'
}

/** Map a membership application to one of the public lifecycle status keys. */
export function membershipStatusKey(a) {
  if (a.status === 'rejected') return 'membership_declined'
  if (a.membership_status === 'cancelled') return 'membership_declined'
  if (a.status === 'approved') {
    // Automatic lifecycle: expired memberships (explicit status, or expiry
    // date in the past) take precedence over "Membership Active".
    if (a.membership_status === 'expired') return 'membership_expired'
    // Normalize to YYYY-MM-DD defensively (admin forms send plain dates, but a
    // timestamp could arrive via other paths).
    const expiry = String(a.office_expiry_date || '').slice(0, 10)
    if (expiry && expiry < todayStr()) return 'membership_expired'
    return 'membership_active'
  }
  // pending_review — how far the applicant got with the payment
  if (a.payment_screenshot_url) return 'under_verification'
  if (a.payment_method) return 'payment_pending'
  return 'membership_received'
}

function recordFailure(ip) {
  // Cap the map so sustained probing from many distinct IPs can't grow memory.
  if (failedLookups.size > 5000) failedLookups.clear()
  const count = (failedLookups.get(ip) || 0) + 1
  failedLookups.set(ip, count)
  if (count % FAILURE_LOG_EVERY === 0) {
    console.warn(`[status-check] Repeated failed lookups from ${ip}: ${count} in a row`)
  }
}

function clearFailures(ip) {
  if (failedLookups.has(ip)) failedLookups.delete(ip)
}

/**
 * POST /api/status/check — public
 * Body: { code: string }
 *
 * Searches session bookings AND membership applications by their reference
 * code (exact match, case-insensitive via normalization). Responds with ONLY
 * the status key + code — never names, contact details, payments, uploads or
 * admin notes. Not-found and invalid input both return the identical generic
 * `{ found: false }` so the endpoint cannot be used to probe which codes or
 * formats exist.
 */
router.post('/check', async (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  const code = normalizeCode(req.body?.code)

  try {
    // Blank or oversized input gets the same generic response as a miss.
    if (!code || code.length > 40) {
      recordFailure(ip)
      return res.json({ found: false })
    }

    // Run both lookups in parallel so response timing doesn't reveal which
    // record type (or whether any record) matched.
    const [booking, application] = await Promise.all([
      Booking.findOne({ booking_number: code }),
      MembershipApplication.findOne({
        $or: [{ application_id: code }, { membership_id: code }],
      }),
    ])

    if (booking) {
      clearFailures(ip)
      return res.json({
        found: true,
        code: booking.booking_number,
        type: 'booking',
        status: bookingStatusKey(booking),
      })
    }
    if (application) {
      clearFailures(ip)
      return res.json({
        found: true,
        code: application.application_id || application.membership_id,
        type: 'membership',
        status: membershipStatusKey(application),
        // Non-personal membership dates (shown with the Active/Expired cards)
        startDate: application.office_start_date || '',
        expiryDate: application.office_expiry_date || '',
      })
    }

    recordFailure(ip)
    res.json({ found: false })
  } catch (err) {
    next(err)
  }
})

export default router
