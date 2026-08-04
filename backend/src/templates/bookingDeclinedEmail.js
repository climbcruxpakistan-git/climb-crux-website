/**
 * Booking decline email — sent to the customer when an administrator cannot
 * approve their booking. The reason picks the variant:
 *   · 'payment'      → payment could not be verified
 *   · 'information'  → personal information was incorrect/incomplete
 */
import { renderEmailLayout, referenceBox, statusChip, escapeHtml, summaryTable } from './emailLayout.js'

const STATUS = 'Declined'

/**
 * @param {{ booking: object, sessionType: 'Public Session'|'Private Session', reason: 'payment'|'information' }} props
 * @returns {{ subject: string, html: string }}
 */
export function bookingDeclinedEmail({ booking, sessionType = 'Public Session', reason = 'payment' }) {
  const reference = booking.booking_number || '—'

  const declinedFor = reason === 'information'
    ? 'the personal information provided with your booking was incomplete or incorrect'
    : 'we were unable to verify the payment for your booking'

  const rows = [
    ['Customer', booking.customer_name || '—'],
    ['Booking Type', sessionType],
    ['Status', STATUS],
    ['Preferred Date', booking.date || '—'],
    ['Participants', String(booking.participants || 1)],
    ['Total', `PKR ${(booking.amount || 0).toLocaleString()}`],
  ]

  const html = renderEmailLayout({
    headerTitle: 'Booking Declined',
    headerSubtitle: 'An update on your booking request',
    greeting: `Hi ${escapeHtml((booking.customer_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Unfortunately, ${declinedFor}, so your booking could not be confirmed.
        Your booking has been <strong>declined</strong> and no payment has been
        charged.
      </p>
      ${referenceBox('Booking Number', reference)}
      ${statusChip(STATUS)}
      <div style="margin:18px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Booking summary</div>
      ${summaryTable(rows)}
      <p style="margin:18px 0 0;font-size:14px;color:#444;line-height:1.7">
        A PDF copy of your booking request has been attached to this email for
        your records.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:18px 0 0">
        <tr>
          <td style="padding:0;text-align:center">
            <a href="https://climbcruxpakistan.com/book-now" style="display:inline-block;background:#f36f21;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:8px">Book Again</a>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-size:14px;color:#444;line-height:1.7">
        If you believe this is a mistake or need help, contact us at
        climbcruxpakistan@gmail.com.
      </p>
    `,
  })

  return {
    subject: 'Update on Your Climb Crux Booking',
    html,
  }
}
