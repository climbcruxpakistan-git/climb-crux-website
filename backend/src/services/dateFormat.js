/**
 * Shared date formatting helpers — the site-wide date format is
 * Day-Month-Year (DD-MM-YYYY), e.g. 05-08-2026.
 *
 * Accepts a Date, an ISO timestamp, or a plain "YYYY-MM-DD" string and
 * always returns the calendar date in DD-MM-YYYY (the time portion, when
 * present, is discarded). Plain "YYYY-MM-DD" strings are reordered without
 * parsing so the date can never shift due to timezone handling.
 */

/** Format a date as DD-MM-YYYY (e.g. 05-08-2026). */
export function formatDateDDMMYYYY(value) {
  if (!value) return ''
  // Plain YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS… — reorder the calendar date
  // directly so UTC parsing can't shift the day.
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getFullYear()}`
}

/**
 * Format a date as "Weekday, DD-MM-YYYY" (e.g. "Saturday, 01-10-2026").
 * Used for announced public-session dates in customer emails and the booking
 * PDF so scheduled events read naturally while keeping the site-wide
 * DD-MM-YYYY date standard.
 */
export function formatLongDate(value) {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return `${weekdays[d.getDay()]}, ${m[3]}-${m[2]}-${m[1]}`
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${dd}-${mm}-${d.getFullYear()}`
}

/** Format a datetime as "DD-MM-YYYY, HH:MM AM/PM" (e.g. 05-08-2026, 2:30 PM). */
export function formatDateTimeDDMMYYYY(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${dd}-${mm}-${d.getFullYear()}, ${time}`
}
