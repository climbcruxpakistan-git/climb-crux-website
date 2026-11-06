/**
 * Booking confirmation email — sent to the customer after a Public or Private
 * session booking is successfully created ("Booking Request Received").
 */
import {
  renderEmailLayout,
  summaryTable,
  bookingRequestCard,
  escapeHtml,
  whatsappLink,
  bookingSessionRows,
  bg,
  FONT,
} from './emailLayout.js'
import { formatDateDDMMYYYY } from '../services/dateFormat.js'

/** Display the WhatsApp number (see shared/contact.js) as "+92 XXX XXXXXXX" for the contact line. */
function displayNumber(number) {
  const digits = String(number || '').replace(/[^0-9]/g, '')
  if (digits.length >= 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  return String(number || '')
}

/**
 * Build the booking confirmation email.
 * @param {{ booking: object, sessionType: 'Public Session'|'Private Session', whatsapp: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function bookingConfirmation({ booking, sessionType = 'Public Session', whatsapp = '' }) {
  const reference = booking.booking_number || '—'

  const rows = [
    ['Customer', booking.customer_name || '—'],
  ]
  // Public sessions lead with the announced Session Name (snapshot on the booking).
  // The generic type label is only meaningful for private/legacy bookings.
  if (!booking.session_title && !booking.session_date) rows.push(['Booking Type', sessionType])
  rows.push(...bookingSessionRows(booking))
  if (!booking.session_date) {
    rows.push(['Preferred Date', formatDateDDMMYYYY(booking.date) || '—'])
    if (booking.time) rows.push(['Preferred Time', booking.time])
  }
  rows.push(['Participants', String(booking.participants || 1)])
  rows.push(['Total', `PKR ${(booking.amount || 0).toLocaleString()}`])

  const firstName = (booking.customer_name || 'there').split(' ')[0]
  const sectionTitle = `margin:22px 0 4px;font-family:${FONT};font-size:12px;font-weight:700;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em`
  const step = `margin:6px 0;font-family:${FONT};font-size:14px;color:#444;line-height:1.6`

  const html = renderEmailLayout({
    headerTitle: 'Booking Request Received',
    headerSubtitle: 'Thanks for booking with Climb Crux',
    bodyHtml: `
      <p style="margin:0 0 12px;font-family:${FONT};font-size:24px;font-weight:700;color:#1c1c1c">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 6px;font-family:${FONT};font-size:16px;color:#5f5f64;line-height:1.7">
        Thank you for booking with Climb Crux. Your booking request has been
        received and is now <strong style="color:#e85d0f">pending payment verification</strong>.
      </p>
      ${bookingRequestCard({ number: reference })}
      <div style="${sectionTitle}">Booking summary</div>
      ${summaryTable(rows)}
      <div style="${sectionTitle}">Next steps</div>
      <table role="presentation" cellpadding="0" cellspacing="0" bgcolor="#fff7f0" style="width:100%;margin:10px 0 0;${bg('#fff7f0')};border:1px solid #fde3d2;border-radius:12px;border-collapse:separate">
        <tr>
          <td style="padding:18px 22px">
            <ol style="margin:0;padding-left:18px">
              <li style="${step}">Go to the payment page and choose <strong>Bank Transfer</strong> or <strong>EasyPaisa</strong>.</li>
              <li style="${step}">Complete the payment using the account details shown.</li>
              <li style="${step}"><strong>Upload your payment screenshot</strong> on the payment page and submit it for verification.</li>
              <li style="${step}">You'll receive an email once your payment is verified and your booking is confirmed.</li>
            </ol>
          </td>
        </tr>
      </table>
      <p style="margin:22px 0 0;font-family:${FONT};font-size:14px;color:#444;line-height:1.7">
        Please do not reply to this email. If you have any queries, contact
        <strong>Team Climb Crux</strong> at
        <a href="${whatsappLink(whatsapp)}" style="color:#f36f21;font-weight:700;text-decoration:none">${displayNumber(whatsapp)}</a>.
      </p>
    `,
  })

  return {
    subject: 'Booking Request Received – Climb Crux',
    html,
  }
}
