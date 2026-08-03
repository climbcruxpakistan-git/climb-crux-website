/**
 * Booking confirmation email — sent to the customer after a Public or Private
 * session booking is successfully created.
 */
import {
  renderEmailLayout,
  summaryTable,
  referenceBox,
  statusChip,
  whatsappBlock,
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
      <div style="margin:18px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Booking summary</div>
      ${summaryTable(rows)}
      ${whatsappBlock({
        number: whatsapp,
        items: ['Your Booking Number: ' + escapeHtml(reference), 'Payment screenshot or transaction receipt'],
        confirmText: 'Once your payment has been verified, your booking will be confirmed via WhatsApp.',
      })}
      ${closingBlock('Please do not reply to this email. If you have any queries, reach out to the WhatsApp number of Climb Crux mentioned above.')}
    `,
  })

  return {
    subject: 'Booking Request Received – Climb Crux',
    html,
  }
}
