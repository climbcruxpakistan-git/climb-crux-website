import mongoose from 'mongoose'

/**
 * Public Session — administered by Climb Crux (admin dashboard → Sessions).
 *
 * Customers never pick a date from a calendar for public sessions; they choose
 * one of these scheduled sessions on the Book Now form. Only sessions with
 * status `published` and remaining capacity are offered.
 *
 * The legacy `time` / `spots` free-text fields are retained (and tolerated) so
 * pre-migration documents still load — see services/sessionMigration.js.
 */
const sessionSchema = new mongoose.Schema({
  // ── Core scheduling ──
  title: { type: String, default: '' },
  date: { type: String, default: '' },            // YYYY-MM-DD (machine readable)
  startTime: { type: String, default: '' },       // e.g. "08:00 AM"
  endTime: { type: String, default: '' },         // e.g. "12:00 PM"

  // ── Location ──
  locationName: { type: String, default: '' },
  mapsUrl: { type: String, default: '' },

  // ── Status lifecycle ──
  // draft | published | full | cancelled | archived
  status: { type: String, default: 'published', enum: ['draft', 'published', 'full', 'cancelled', 'archived'] },

  // ── Capacity (0 = unlimited) ──
  maxParticipants: { type: Number, default: 0 },
  registrationClosingDate: { type: String, default: '' }, // YYYY-MM-DD

  // ── Meeting point (optional; shown only in confirmations) ──
  meetingPoint: { type: String, default: '' },
  meetingPointMapsUrl: { type: String, default: '' },
  meetingTime: { type: String, default: '' },

  // ── Notes ──
  specialNotes: { type: String, default: '' },

  // ── Legacy pre-migration fields (kept for backward compatibility) ──
  time: { type: String, default: '' },
  spots: { type: String, default: 'Open' },
}, { timestamps: true })

export default mongoose.model('Session', sessionSchema)
