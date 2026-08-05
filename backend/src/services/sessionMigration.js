/**
 * Legacy session migration — converts pre-feature Session documents (free-text
 * `date` like "Sun, Aug 16" and `time` like "8:00 AM – 1:00 PM") into the new
 * structured fields (title, date YYYY-MM-DD, startTime, endTime, status).
 *
 * Migration happens on read (the transformed value is returned, the document
 * is not rewritten) and is persisted the next time the admin saves the session
 * through the dashboard form.
 */

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }

function pad(n) {
  return String(n).padStart(2, '0')
}

/** Best-effort parse of a legacy label like "Sun, Aug 16" → YYYY-MM-DD ('' when unparseable). */
export function legacyDateToISO(label) {
  if (!label) return ''
  const m = String(label).match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})/i)
  if (!m) return ''
  const month = MONTHS[m[1].toLowerCase().slice(0, 3)]
  if (month === undefined) return ''
  const day = parseInt(m[2], 10)
  if (!day || day < 1 || day > 31) return ''
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let year = now.getFullYear()
  if (new Date(year, month, day) < today) year += 1 // "Sun, Aug 16" without a year → next occurrence
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/** Split a legacy time range "8:00 AM – 1:00 PM" into [start, end]. */
export function legacyTimeRange(range) {
  if (!range) return ['', '']
  const parts = String(range).split(/[–—-]/).map((p) => p.trim()).filter(Boolean)
  return [parts[0] || '', parts[1] || '']
}

/**
 * Convert a session document (legacy or already structured) into the new shape.
 *
 * Accepts a plain object OR a mongoose document. `{ ...mongooseDoc }` only
 * spreads the document internals (`$__`, `_doc`, `$errors`, `$isNew`) — never
 * the stored fields — so mongoose docs are flattened with `toObject()` first.
 * Without this, title/date/times/location were silently dropped from the
 * serialized response even though they were saved to MongoDB.
 */
export function migrateLegacySession(raw) {
  const s = raw && typeof raw === 'object'
    ? (typeof raw.toObject === 'function' ? raw.toObject() : { ...raw })
    : {}
  if (s.date && !/^\d{4}-\d{2}-\d{2}/.test(String(s.date))) {
    s.date = legacyDateToISO(s.date) || s.date
  }
  if (!s.startTime || !s.endTime) {
    const [start, end] = legacyTimeRange(s.time)
    s.startTime = s.startTime || start
    s.endTime = s.endTime || end
  }
  s.title = s.title || (s.date ? `Public Session — ${s.date}` : 'Public Session')
  s.status = s.status || 'published'
  s.maxParticipants = Number(s.maxParticipants) || 0
  return s
}
