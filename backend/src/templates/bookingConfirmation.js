/**
 * Booking confirmation email — sent to the customer after a Public or Private
 * session booking is successfully created.
 */
import {
  renderEmailLayout,
  summaryTable,
  referenceBox,
  statusChip,
  closingBlock,
  escapeHtml,
} from './emailLayout.js'

const STATUS = 'Pending Payment Verification'

/**
 * Build the booking confirmation email.
 * @param {{ booking: object, sessionType: 'Public Session'|'Private Session', whatsapp: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function bookingConfirmation({ booking, sessionType = 'Public Session', whatsapp = '' }) {
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
    headerTitle: 'Booking Request Received',
    headerSubtitle: 'Thanks for booking with Climb Crux',
    greeting: `Hi ${escapeHtml((booking.customer_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Thank you for booking with Climb Crux. Your booking request has been
        received and is now <strong>pending payment verification</strong>.
      </p>
      ${referenceBox('Booking Number', reference)}
      ${statusChip(STATUS)}
      <div style="margin:18px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Next steps</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:10px 0 0;background:#fff7f0;border:1px solid #fde3d2;border-radius:12px">
        <tr>
          <td style="padding:18px 22px">
            <ol style="margin:0;padding-left:18px">
              <li style="margin:6px 0;font-size:14px;color:#444;line-height:1.6">Go to the payment page and choose <strong>Bank Transfer</strong> or <strong>EasyPaisa</strong>.</li>
              <li style="margin:6px 0;font-size:14px;color:#444;line-height:1.6">Complete the payment using the account details shown.</li>
              <li style="margin:6px 0;font-size:14px;color:#444;line-height:1.6"><strong>Upload your payment screenshot</strong> on the payment page and submit it for verification.</li>
              <li style="margin:6px 0;font-size:14px;color:#444;line-height:1.6">You'll receive an email once your payment is verified and your booking is confirmed.</li>
            </ol>
          </td>
        </tr>
      </table>
      ${closingBlock('Please do not reply to this email. If you have any queries, reach out to Climb Crux on WhatsApp or at climbcruxpakistan@gmail.com.')}
    `,
  })

  return {
    subject: 'Booking Request Received – Climb Crux',
    html,
  }
}
