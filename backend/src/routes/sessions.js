import { Router } from 'express'
import Session from '../models/Session.js'
import Booking from '../models/Booking.js'
import { migrateLegacySession } from '../services/sessionMigration.js'

const router = Router()

const PUBLIC_STATUSES = new Set(['published'])
const HIDDEN_STATUSES = new Set(['draft', 'cancelled', 'archived'])

/** Today's date as YYYY-MM-DD (server-local). */
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function pad(n) {
  return String(n).padStart(2, '0')
}

/**
 * Count confirmed bookings per public session id (one aggregate for the whole
 * list — avoids N queries). Only confirmed bookings reduce available capacity.
 */
async function confirmedCounts(sessions) {
  const ids = sessions.map((s) => String(s._id))
  const rows = await Booking.aggregate([
    { $match: { public_session_id: { $in: ids }, booking_status: 'confirmed' } },
    { $group: { _id: '$public_session_id', n: { $sum: 1 } } },
  ])
  const map = {}
  for (const r of rows) map[r._id] = r.n
  return map
}

/** Serialize a session: migrate legacy fields, attach remaining capacity + effective status. */
function serialize(session, counts = {}) {
  const migrated = migrateLegacySession(session)
  const confirmed = counts[String(session._id)] || 0
  const max = Number(session.maxParticipants) || 0
  const remaining = max > 0 ? Math.max(0, max - confirmed) : null
  const effectiveStatus =
    max > 0 && remaining === 0 ? 'full' : migrated.status
  return {
    id: session._id,
    title: migrated.title,
    date: migrated.date,
    startTime: migrated.startTime,
    endTime: migrated.endTime,
    locationName: migrated.locationName,
    mapsUrl: migrated.mapsUrl,
    status: effectiveStatus,
    maxParticipants: max,
    confirmedCount: confirmed,
    remaining,
    registrationClosingDate: session.registrationClosingDate || '',
    meetingPoint: session.meetingPoint || '',
    meetingPointMapsUrl: session.meetingPointMapsUrl || '',
    meetingTime: session.meetingTime || '',
    specialNotes: session.specialNotes || '',
    createdAt: session.createdAt,
  }
}

// GET /api/sessions — all sessions (admin dashboard)
router.get('/', async (_req, res, next) => {
  try {
    const sessions = await Session.find().sort({ date: 1, createdAt: 1 })
    const counts = await confirmedCounts(sessions)
    res.json(sessions.map((s) => serialize(s, counts)))
  } catch (err) { next(err) }
})

// GET /api/sessions/available — public, bookable sessions only
router.get('/available', async (_req, res, next) => {
  try {
    const sessions = await Session.find().sort({ date: 1, createdAt: 1 })
    const counts = await confirmedCounts(sessions)
    const today = todayStr()
    const available = sessions
      .map((s) => serialize(s, counts))
      .filter((s) => {
        if (!PUBLIC_STATUSES.has(s.status)) return false
        if (s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && s.date < today) return false
        if (s.registrationClosingDate && s.registrationClosingDate < today) return false
        if (s.remaining !== null && s.remaining <= 0) return false
        return true
      })
    res.json(available)
  } catch (err) { next(err) }
})

function pickSessionFields(body) {
  return {
    title: String(body.title || '').trim(),
    date: String(body.date || '').trim(),
    startTime: String(body.startTime || '').trim(),
    endTime: String(body.endTime || '').trim(),
    locationName: String(body.locationName || '').trim(),
    mapsUrl: String(body.mapsUrl || '').trim(),
    status: body.status || 'published',
    maxParticipants: Math.max(0, Number(body.maxParticipants) || 0),
    registrationClosingDate: String(body.registrationClosingDate || '').trim(),
    meetingPoint: String(body.meetingPoint || '').trim(),
    meetingPointMapsUrl: String(body.meetingPointMapsUrl || '').trim(),
    meetingTime: String(body.meetingTime || '').trim(),
    specialNotes: String(body.specialNotes || '').trim(),
  }
}

function validateFields(fields) {
  if (!fields.title) return 'Session title is required'
  if (!fields.date) return 'Session date is required'
  if (!fields.startTime) return 'Start time is required'
  if (!fields.endTime) return 'End time is required'
  if (!fields.locationName) return 'Climbing location is required'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) return 'Session date must be a valid date (YYYY-MM-DD)'
  if (!['draft', 'published', 'full', 'cancelled', 'archived'].includes(fields.status)) {
    return 'Invalid session status'
  }
  return ''
}

// POST /api/sessions
router.post('/', async (req, res, next) => {
  try {
    const fields = pickSessionFields(req.body)
    const error = validateFields(fields)
    if (error) return res.status(400).json({ error })
    const session = await Session.create(fields)
    res.status(201).json(serialize(session))
  } catch (err) { next(err) }
})

// PUT /api/sessions/:id
router.put('/:id', async (req, res, next) => {
  try {
    const fields = pickSessionFields(req.body)
    const error = validateFields(fields)
    if (error) return res.status(400).json({ error })
    const session = await Session.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true })
    if (!session) return res.status(404).json({ error: 'Not found' })
    res.json(serialize(session))
  } catch (err) { next(err) }
})

// DELETE /api/sessions/:id — only allowed when no bookings reference the session
router.delete('/:id', async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    const hasBookings = await Booking.exists({ public_session_id: String(session._id) })
    if (hasBookings) {
      return res.status(400).json({
        error: 'This session already has bookings and cannot be deleted. Archive or cancel it instead to preserve booking history.',
      })
    }
    await Session.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
