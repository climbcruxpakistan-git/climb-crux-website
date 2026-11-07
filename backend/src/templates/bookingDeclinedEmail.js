/**
 * Booking decline email — sent to the customer when an administrator cannot
 * approve their booking. The reason picks the variant:
 *   · 'payment'      → payment could not be verified
 *   · 'information'  → personal information was incorrect/incomplete
 *
 * Design mirrors the booking-approved email (dark ticket card, large greeting,
 * plain contact line) so accept/decline read as one family.
 */
import { renderEmailLayout, bookingTicket, escapeHtml, summaryTable, whatsappLink, bookingSessionRows } from './emailLayout.js'
import { formatDateDDMMYYYY, formatTime12h } from '../services/dateFormat.js'

const STATUS = 'Declined'

/** Display the WhatsApp number (see shared/contact.js) as "+92 XXX XXXXXXX" for the contact line. */
function displayNumber(number) {
  const digits = String(number || '').replace(/[^0-9]/g, '')
  if (digits.length >= 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  return String(number || '')
}

/**
 * @param {{ booking: object, sessionType: 'Public Session'|'Private Session', reason: 'payment'|'information', whatsapp: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function bookingDeclinedEmail({ booking, sessionType = 'Public Session', reason = 'payment', whatsapp = '' }) {
  const reference = booking.booking_number || '—'

  const declinedFor = reason === 'information'
    ? 'the personal information provided with your booking was incomplete or incorrect'
    : 'we were unable to verify the payment for your booking'

  // Public sessions lead with the announced Session Name instead of the generic
  // type label (snapshot on the booking).
  const sessionTitle = booking.session_title || sessionType
  const rows = [
    ['Customer', booking.customer_name || '—'],
  ]
  if (!booking.session_title && !booking.session_date) rows.push(['Booking Type', sessionType])
  rows.push(['Status', STATUS])
  rows.push(...bookingSessionRows(booking))
  if (!booking.session_date) {
    rows.push(['Preferred Date', formatDateDDMMYYYY(booking.date) || '—'])
    if (booking.time) rows.push(['Preferred Time', formatTime12h(booking.time)])
  }
  rows.push(['Participants', String(booking.participants || 1)])
  rows.push(['Total', `PKR ${(booking.amount || 0).toLocaleString()}`])

  const firstName = (booking.customer_name || 'there').split(' ')[0]

  const html = renderEmailLayout({
    headerTitle: 'Booking Declined',
    headerSubtitle: 'An update on your booking request',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1c1c1c">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 6px;font-size:16px;color:#5f5f64;line-height:1.7">
        Unfortunately, ${declinedFor}, so your
        <strong style="color:#1c1c1c">${escapeHtml(sessionTitle)}</strong> booking could not be
        confirmed. Your booking has been
        <strong style="color:#1c1c1c">declined</strong> and no payment has been charged.
      </p>
      ${bookingTicket({ number: reference, status: STATUS, icon: '&#10005;' })}
      <div style="margin:18px 0 4px;font-size:12px;font-weight:700;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Booking summary</div>
      ${summaryTable(rows)}
      <p style="margin:18px 0 0;font-size:14px;color:#444;line-height:1.7">
        A <strong>PDF copy of your booking request</strong> has been attached to
        this email for your records.
      </p>
      <p style="margin:14px 0 0;font-size:14px;color:#444;line-height:1.7">
        If you believe this is a mistake or have any queries, contact
        <strong>Team Climb Crux</strong> at
        <a href="${whatsappLink(whatsapp)}" style="color:#f36f21;font-weight:700;text-decoration:none">${displayNumber(whatsapp)}</a>.
      </p>
    `,
  })

  return {
    subject: 'Update on Your Climb Crux Booking',
    html,
  }
}
