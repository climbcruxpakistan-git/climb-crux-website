import { Router } from 'express'
import Booking from '../models/Booking.js'
import MembershipApplication from '../models/MembershipApplication.js'

const router = Router()

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

/** Map a booking document to one of the public status keys. */
export function bookingStatusKey(b) {
  if (b.booking_status === 'confirmed') return 'booking_confirmed'
  if (b.booking_status === 'cancelled') return 'booking_declined'
  if (b.booking_status === 'pending_verification') return 'under_verification'
  // pending_payment — distinguish "just received" from "payment started"
  return b.payment_method ? 'payment_pending' : 'booking_received'
}

/** Map a membership application to one of the public status keys. */
export function membershipStatusKey(a) {
  if (a.status === 'approved') return 'membership_active'
  if (a.status === 'rejected') return 'membership_declined'
  return 'membership_pending'
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
      return res.json({ found: true, code: booking.booking_number, status: bookingStatusKey(booking) })
    }
    if (application) {
      clearFailures(ip)
      return res.json({
        found: true,
        code: application.application_id || application.membership_id,
        status: membershipStatusKey(application),
      })
    }

    recordFailure(ip)
    res.json({ found: false })
  } catch (err) {
    next(err)
  }
})

export default router
