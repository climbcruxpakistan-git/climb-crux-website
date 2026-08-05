/**
 * Shared, responsive HTML email layout for Climb Crux.
 *
 * ONE layout reused by every email template. Templates supply content through
 * renderEmailLayout() and compose it from the exported block helpers
 * (summaryTable, referenceBox, statusChip, whatsappBlock, closingBlock).
 *
 * Branding mirrors the Climb Crux website: ink text, orange (#f36f21) accents,
 * stone grays, and the site logo hosted at climbcruxpakistan.com/logo.png.
 */

import { formatLongDate } from '../services/dateFormat.js'

export const LOGO_URL = 'https://climbcruxpakistan.com/logo.png'
export const SITE_URL = 'https://climbcruxpakistan.com'
export const SITE_EMAIL = 'climbcruxpakistan@gmail.com'

/** Escape user-provided values before interpolating them into email HTML. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Turn "+923132690377" into a wa.me deep link. */
export function whatsappLink(number) {
  return `https://wa.me/${String(number || '').replace(/[^0-9]/g, '')}`
}

/** Format "+923132690377" as "+92 313 2690377" for display. */
export function formatWhatsApp(number) {
  const digits = String(number || '').replace(/[^0-9]/g, '')
  if (digits.length >= 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`
  }
  return String(number || '')
}

/** Summary key/value table used in the email body. URL values become clickable links. */
export function summaryTable(rows = []) {
  const body = rows
    .map(([label, value]) => {
      const safeValue = escapeHtml(value)
      const rendered = /^https?:\/\/\S+$/i.test(String(value || '').trim())
        ? `<a href="${safeValue}" style="color:#f36f21;font-weight:700;text-decoration:none;word-break:break-all">${safeValue}</a>`
        : safeValue
      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;letter-spacing:0.05em;width:42%;vertical-align:top">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#1c1c1c;font-weight:600;text-align:right;vertical-align:top">${rendered}</td>
      </tr>`
    })
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${body}</table>`
}

/**
 * Booking-summary rows for admin-managed public sessions (from the snapshot
 * stored on the booking). Returns an empty array for private/legacy bookings.
 *
 * The Session Name is the primary identifier — the generic "Public Session"
 * type label is never shown here. Meeting-point rows are only included on
 * confirmation (confirmed = true).
 */
export function bookingSessionRows(booking, { confirmed = false } = {}) {
  const hasSnapshot = Boolean(booking.session_title || booking.session_date)
  if (!hasSnapshot) return []
  const rows = []
  if (booking.session_title) rows.push(['Session', booking.session_title])
  rows.push(['Date', formatLongDate(booking.session_date || booking.date) || booking.session_date || booking.date])
  const time = [booking.session_start_time, booking.session_end_time].filter(Boolean).join(' – ')
  if (time) rows.push(['Time', time])
  if (booking.session_location) rows.push(['Climbing Location', booking.session_location])
  if (booking.session_maps_url) rows.push(['View Map', booking.session_maps_url])
  if (confirmed) {
    // Meeting point falls back to the climbing location when not provided.
    rows.push(['Meeting Point', booking.session_meeting_point || booking.session_location])
    rows.push(['Meeting Point Map', booking.session_meeting_point_maps_url || booking.session_maps_url])
    const meetingTime = booking.session_meeting_time || booking.session_start_time
    if (meetingTime) rows.push(['Meeting Time', meetingTime])
  }
  return rows
}

/** Prominent reference number (Booking Number / Membership ID) card. */
export function referenceBox(label, value) {
  return `
    <div style="background:#fff7f0;border:1px solid #fde3d2;border-radius:10px;padding:14px 18px;text-align:center;margin:16px 0">
      <div style="font-size:11px;color:#8a8a8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${escapeHtml(label)}</div>
      <div style="font-family:'Courier New',monospace;font-size:20px;font-weight:700;letter-spacing:1.5px;color:#e85d0f">${escapeHtml(value)}</div>
    </div>`
}

/** Orange pill showing the booking/membership status. */
export function statusChip(text) {
  return `<div style="display:inline-block;background:#f36f21;color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;margin:4px 0 18px">${text}</div>`
}

/** WhatsApp payment-instruction block with a prominent chat button. */
export function whatsappBlock({ number, items = [], confirmText = '' }) {
  const list = items
    .map((item) => `<li style="margin:5px 0;font-size:14px;color:#444;line-height:1.5">${item}</li>`)
    .join('')
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:22px 0 0;background:#f6faf6;border:1px solid #e0efe0;border-radius:12px">
      <tr>
        <td style="padding:20px 22px">
          <div style="font-size:13px;font-weight:800;color:#1c1c1c;margin-bottom:4px">💬 Complete your payment via WhatsApp</div>
          <p style="margin:6px 0 10px;font-size:13px;color:#666;line-height:1.6">Please send the following to our official WhatsApp number:</p>
          <ul style="margin:0 0 12px;padding-left:18px">${list}</ul>
          ${confirmText ? `<p style="margin:0 0 14px;font-size:13px;color:#666;line-height:1.6">${confirmText}</p>` : ''}
          <a href="${whatsappLink(number)}" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:8px">Chat on WhatsApp · ${formatWhatsApp(number)}</a>
        </td>
      </tr>
    </table>`
}

/** Closing message block. */
export function closingBlock(text) {
  return `<p style="margin:22px 0 0;font-size:14px;color:#444;line-height:1.7">${text}</p>`
}

/**
 * Wraps template content in the full Climb Crux branded email shell.
 * @param {{headerTitle:string, headerSubtitle:string, greeting?:string, bodyHtml:string}} props
 */
export function renderEmailLayout({ headerTitle, headerSubtitle, greeting = '', bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr>
          <td style="background:#1c1c1c;padding:28px 32px 24px;text-align:center">
            <img src="${LOGO_URL}" alt="Climb Crux" width="150" style="max-width:150px;height:auto;display:inline-block" />
            <div style="margin-top:14px;font-size:21px;font-weight:800;color:#ffffff;letter-spacing:0.02em">${headerTitle}</div>
            <div style="margin-top:4px;font-size:13px;color:#b8b8b8">${headerSubtitle}</div>
          </td>
        </tr>
        <!-- Orange accent bar -->
        <tr><td style="height:5px;background:linear-gradient(90deg,#f36f21,#e85d0f)"></td></tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px 24px">
            ${greeting ? `<p style="margin:0 0 14px;font-size:15px;color:#1c1c1c;font-weight:700">${greeting}</p>` : ''}
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #eee;padding:22px 32px;text-align:center">
            <div style="font-size:13px;color:#666;line-height:1.8">
              <strong style="color:#1c1c1c">Climb Crux Pakistan</strong><br />
              <a href="${SITE_URL}" style="color:#f36f21;text-decoration:none">climbcruxpakistan.com</a><br />
              <a href="mailto:${SITE_EMAIL}" style="color:#f36f21;text-decoration:none">${SITE_EMAIL}</a>
            </div>
            <div style="margin-top:12px;font-size:11px;color:#b8b8b8">You received this email because you submitted a request on the Climb Crux website.</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
