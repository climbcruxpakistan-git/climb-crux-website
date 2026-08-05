/**
 * Shared admin date helpers — the site-wide date format is
 * Day-Month-Year (DD-MM-YYYY), e.g. 05-08-2026.
 */

/** Format a date as DD-MM-YYYY (e.g. 05-08-2026). Accepts Date, ISO string, or YYYY-MM-DD. */
export function formatDate(value) {
  if (!value) return ''
  // Plain YYYY-MM-DD (or YYYY-MM-DDTHH:MM:SS…) — reorder the calendar date
  // directly so UTC parsing can't shift the day.
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getFullYear()}`
}

/** Format a datetime as "DD-MM-YYYY, HH:MM AM/PM" (e.g. 05-08-2026, 2:30 PM). */
export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${dd}-${mm}-${d.getFullYear()}, ${time}`
}
