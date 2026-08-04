/**
 * Booking approval email — sent to the customer after an administrator
 * verifies their payment screenshot and confirms the booking.
 */
import { renderEmailLayout, referenceBox, statusChip, escapeHtml, summaryTable } from './emailLayout.js'

const STATUS = 'Confirmed'

/**
 * @param {{ booking: object, sessionType: 'Public Session'|'Private Session' }} props
 * @returns {{ subject: string, html: string }}
 */
export function bookingApprovedEmail({ booking, sessionType = 'Public Session' }) {
  const reference = booking.booking_number || '—'

  const rows = [
    ['Customer', booking.customer_name || '—'],
    ['Booking Type', sessionType],
    ['Status', STATUS],
    ['Preferred Date', booking.date || '—'],
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
        We can't wait to see you on the rocks. For any questions, contact us at
        climbcruxpakistan@gmail.com.
      </p>
    `,
  })

  return {
    subject: 'Your Climb Crux Booking Is Confirmed',
    html,
  }
}
