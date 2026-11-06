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

/**
 * Solid background that survives auto dark-mode inversion (Gmail / Outlook.com).
 * Using a gradient image as well as background-color stops most clients from recoloring it.
 */
export const bg = (c) => `background-color:${c};background-image:linear-gradient(${c},${c})`
export const FONT = "'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

/** Escape user-provided values before interpolating them into email HTML. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Turn a phone number (see shared/contact.js) into a wa.me deep link. */
export function whatsappLink(number) {
  return `https://wa.me/${String(number || '').replace(/[^0-9]/g, '')}`
}

/** Format a phone number as "+92 XXX XXXXXXX" for display. */
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

/**
 * Dark "ticket" card carrying the booking number and its status pill.
 * Used on the booking-approved email only (referenceBox/statusChip stay the
 * shared blocks for every other email).
 */
export function bookingTicket({ number }) {
  const CARD = '#1f1f21'
  const PAGE = '#ffffff' // must equal the body background behind the card
  const H = 116          // ticket content height in px
  const M = H - 16       // middle (dashed) section height
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" bgcolor="${CARD}"
         style="margin:22px 0 8px;${bg(CARD)};border-radius:14px;border-collapse:separate">
    <tr>
      <!-- Left: booking number -->
      <td class="tk-col" height="${H}" valign="middle" style="height:${H}px;padding:0 16px 0 24px;vertical-align:middle">
        <div style="font-family:${FONT};font-size:11px;line-height:1.4;color:#9a9a9f;text-transform:uppercase;letter-spacing:0.22em;margin:0 0 8px;white-space:nowrap">Booking Number</div>
        <div class="tk-num" style="font-family:${FONT};font-size:32px;line-height:1.1;font-weight:700;letter-spacing:1px;color:#f36f21;white-space:nowrap">${escapeHtml(number)}</div>
      </td>

      <!-- Middle: dashed divider + notches (hidden on mobile) -->
      <td class="tk-col tk-div" width="16" height="${H}" valign="top" style="width:16px;height:${H}px;padding:0;font-size:0;line-height:0">
        <table role="presentation" cellpadding="0" cellspacing="0" width="16" height="${H}" style="width:16px;height:${H}px;border-collapse:collapse">
          <tr>
            <td colspan="2" height="8" style="height:8px;padding:0;font-size:0;line-height:0">
              <div style="width:16px;height:8px;font-size:0;line-height:0;${bg(PAGE)};border-radius:0 0 8px 8px">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td width="7" height="${M}" style="width:7px;height:${M}px;padding:0;border-right:2px dashed #4a4a4e;font-size:0;line-height:0">&nbsp;</td>
            <td width="7" height="${M}" style="width:7px;height:${M}px;padding:0;font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td colspan="2" height="8" valign="bottom" style="height:8px;padding:0;font-size:0;line-height:0">
              <div style="width:16px;height:8px;font-size:0;line-height:0;${bg(PAGE)};border-radius:8px 8px 0 0">&nbsp;</div>
            </td>
          </tr>
        </table>
      </td>

      <!-- Right: status -->
      <td class="tk-col tk-right" width="150" height="${H}" valign="middle" style="width:150px;height:${H}px;padding:0 20px;vertical-align:middle;text-align:center">
        <div style="font-family:${FONT};font-size:11px;line-height:1.4;color:#9a9a9f;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 10px">Status</div>
        <table class="tk-pill" role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
          <tr>
            <td bgcolor="#f36f21" style="${bg('#f36f21')};border-radius:999px;padding:10px 20px;font-family:${FONT};font-size:14px;font-weight:700;color:#ffffff;white-space:nowrap">
              <span style="color:#ffffff">&#10003;&nbsp; Confirmed</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

/**
 * Dark booking-number card with a split "PENDING | Payment verification" pill.
 * Used ONLY by the booking-request-received email.
 * (referenceBox/statusChip are untouched; other emails still use them.)
 */
export function bookingRequestCard({ number }) {
  const CARD = '#1c1c1c'
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" bgcolor="${CARD}"
         style="margin:22px 0 8px;${bg(CARD)};border-radius:16px;border-collapse:separate">
    <tr>
      <td class="rq-pad" align="center" style="padding:28px 20px 0;text-align:center">
        <div style="font-family:${FONT};font-size:11px;line-height:1.4;color:#9a9a9f;text-transform:uppercase;letter-spacing:0.3em">Booking Number</div>
        <div class="rq-num" style="font-family:${FONT};font-size:34px;line-height:1.25;font-weight:700;letter-spacing:2px;color:#f36f21;margin-top:6px;white-space:nowrap">${escapeHtml(number)}</div>
      </td>
    </tr>
    <tr>
      <td class="rq-pad" style="padding:18px 28px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr><td height="1" bgcolor="#3a3a3e" style="height:1px;font-size:0;line-height:0;${bg('#3a3a3e')}">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="rq-pad" align="center" style="padding:18px 20px 28px;text-align:center">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;border-collapse:separate">
          <tr>
            <td class="rq-p1" bgcolor="#f5a623" style="${bg('#f5a623')};border-radius:999px 0 0 999px;padding:9px 14px 9px 18px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.14em;color:#1c1c1c;white-space:nowrap">PENDING</td>
            <td class="rq-p2" bgcolor="#2c2c30" style="${bg('#2c2c30')};border-radius:0 999px 999px 0;padding:9px 18px 9px 14px;font-family:${FONT};font-size:12px;font-weight:600;color:#ffffff;white-space:nowrap">Payment verification</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
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
          <div style="font-size:13px;font-weight:700;color:#1c1c1c;margin-bottom:4px">💬 Complete your payment via WhatsApp</div>
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
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${headerTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    @media only screen and (max-width:480px) {
      .px { padding-left:20px !important; padding-right:20px !important; }
      .tk-col { display:block !important; width:100% !important; height:auto !important;
                box-sizing:border-box !important; padding:20px 22px !important; }
      .tk-div { display:none !important; height:0 !important; width:0 !important; }
      .tk-right { border-top:2px dashed #4a4a4e !important; text-align:left !important; }
      .tk-pill { margin:0 !important; }
      .tk-num { font-size:28px !important; }
      .rq-num { font-size:28px !important; letter-spacing:1px !important; }
      .rq-pad { padding-left:12px !important; padding-right:12px !important; }
      .rq-p1 { padding:8px 10px 8px 14px !important; font-size:10px !important; }
      .rq-p2 { padding:8px 14px 8px 10px !important; font-size:11px !important; }
    }
  </style>
</head>
<body bgcolor="#f5f5f5" style="margin:0;padding:0;${bg('#f5f5f5')};font-family:${FONT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f5f5" style="${bg('#f5f5f5')};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;width:100%;${bg('#ffffff')};border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr>
          <td class="px" bgcolor="#1c1c1c" style="${bg('#1c1c1c')};padding:28px 32px 24px;text-align:center">
            <img src="${LOGO_URL}" alt="Climb Crux" width="150" style="max-width:150px;height:auto;display:inline-block" />
            <div style="margin-top:14px;font-family:${FONT};font-size:21px;font-weight:700;color:#ffffff;letter-spacing:0.02em">${headerTitle}</div>
            <div style="margin-top:4px;font-family:${FONT};font-size:13px;color:#b8b8b8">${headerSubtitle}</div>
          </td>
        </tr>
        <!-- Orange accent bar -->
        <tr><td style="height:5px;background:linear-gradient(90deg,#f36f21,#e85d0f)"></td></tr>
        <!-- Body -->
        <tr>
          <td class="px" bgcolor="#ffffff" style="${bg('#ffffff')};padding:28px 32px 24px;font-family:${FONT}">
            ${greeting ? `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;color:#1c1c1c;font-weight:700">${greeting}</p>` : ''}
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td class="px" bgcolor="#fafafa" style="${bg('#fafafa')};border-top:1px solid #eee;padding:22px 32px;text-align:center">
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
