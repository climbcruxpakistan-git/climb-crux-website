/**
 * Booking approval email — sent to the customer after an administrator
 * verifies their payment screenshot and confirms the booking.
 */
import { renderEmailLayout, referenceBox, statusChip, escapeHtml, summaryTable, whatsappLink } from './emailLayout.js'
import { formatDateDDMMYYYY } from '../services/dateFormat.js'

const STATUS = 'Confirmed'

/** Display "+923132690377" as "+92 313 2690377" for the contact line. */
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

  const rows = [
    ['Customer', booking.customer_name || '—'],
    ['Booking Type', sessionType],
    ['Status', STATUS],
    ['Preferred Date', formatDateDDMMYYYY(booking.date) || '—'],
    ['Participants', String(booking.participants || 1)],
    ['Total', `PKR ${(booking.amount || 0).toLocaleString()}`],
  ]

  const html = renderEmailLayout({
    headerTitle: 'Booking Confirmed',
    headerSubtitle: 'Your payment has been verified 🧗',
    greeting: `Hi ${escapeHtml((booking.customer_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Great news — your payment has been <strong>verified</strong> and your
        <strong>${escapeHtml(sessionType)}</strong> booking is now
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
