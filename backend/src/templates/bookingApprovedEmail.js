/**
 * Booking approval email — sent to the customer after an administrator
 * verifies their payment screenshot and confirms the booking.
 */
import { renderEmailLayout, referenceBox, statusChip, escapeHtml, summaryTable, whatsappLink, bookingSessionRows } from './emailLayout.js'
import { formatDateDDMMYYYY } from '../services/dateFormat.js'

const STATUS = 'Confirmed'

/** Display the WhatsApp number (see shared/contact.js) as "+92 XXX XXXXXXX" for the contact line. */
function displayNumber(number) {
  const digits = String(number || '').replace(/[^0-9]/g, '')
  if (digits.length >= 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  return String(number || '')
}

/**
 * @param {{ booking: object, sessionType: 'Public Session'|'Private Session', whatsapp: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function bookingApprovedEmail({ booking, sessionType = 'Public Session', whatsapp = '' }) {
  const reference = booking.booking_number || '—'

  // Public bookings lead with the announced Session Name instead of the generic
  // type label (snapshot on the booking).
  const sessionTitle = booking.session_title || sessionType
  const rows = [
    ['Customer', booking.customer_name || '—'],
  ]
  if (!booking.session_title && !booking.session_date) rows.push(['Booking Type', sessionType])
  rows.push(['Status', STATUS])
  // Public sessions carry the announced-session details + meeting point (confirmed)
  rows.push(...bookingSessionRows(booking, { confirmed: true }))
  if (!booking.session_date) {
    rows.push(['Preferred Date', formatDateDDMMYYYY(booking.date) || '—'])
    if (booking.time) rows.push(['Preferred Time', booking.time])
  }
  rows.push(['Participants', String(booking.participants || 1)])
  rows.push(['Total', `PKR ${(booking.amount || 0).toLocaleString()}`])

  const html = renderEmailLayout({
    headerTitle: 'Booking Confirmed',
    headerSubtitle: 'Your payment has been verified 🧗',
    greeting: `Hi ${escapeHtml((booking.customer_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Great news — your payment has been <strong>verified</strong> and your
        <strong>${escapeHtml(sessionTitle)}</strong> booking is now
        <strong>confirmed</strong>.
      </p>
      ${referenceBox('Booking Number', reference)}
      ${statusChip(STATUS)}
      <div style="margin:18px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Booking summary</div>
      ${summaryTable(rows)}
      <p style="margin:18px 0 0;font-size:14px;color:#444;line-height:1.7">
        A <strong>PDF copy of your confirmed booking</strong> has been attached to
        this email for your records.
      </p>
      <p style="margin:14px 0 0;font-size:14px;color:#444;line-height:1.7">
        We can't wait to see you on the rocks. If you have any queries, contact
        <strong>Team Climb Crux</strong> at
        <a href="${whatsappLink(whatsapp)}" style="color:#f36f21;font-weight:700;text-decoration:none">${displayNumber(whatsapp)}</a>.
      </p>
    `,
  })

  return {
    subject: 'Your Climb Crux Booking Is Confirmed',
    html,
  }
}
