/**
 * Admin notification emails (kept as Resend templates per user request).
 * Alert the Climb Crux team to new bookings, new membership applications,
 * and confirmed payments. Built on the same shared layout as the customer emails.
 */
import { renderEmailLayout, summaryTable } from './emailLayout.js'
import { MEMBERSHIP_FEE } from '../membershipForm.js'

/** New booking created → admin alert. */
export function adminBookingNotification({ booking, sessionType = 'Public Session' }) {
  const rows = [
    ['Customer', booking.customer_name || '—'],
    ['Email', booking.customer_email || '—'],
    ['Phone', booking.customer_phone || '—'],
    ['Booking Type', sessionType],
    ['Booking Number', booking.booking_number || '—'],
    ['Preferred Date', booking.date || '—'],
    ['Participants', String(booking.participants || 1)],
    ['Amount', `PKR ${(booking.amount || 0).toLocaleString()}`],
    ['Status', booking.booking_status || 'pending_payment'],
  ]

  return {
    subject: `🧗 New Booking — ${booking.customer_name}`,
    html: renderEmailLayout({
      headerTitle: 'New Booking Request',
      headerSubtitle: 'A new session booking needs attention',
      bodyHtml: `
        <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
          <strong>${booking.customer_name}</strong> just booked a ${sessionType.toLowerCase()}.
        </p>
        <div style="margin:14px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Booking details</div>
        ${summaryTable(rows)}
      `,
    }),
  }
}

/** New membership application → admin alert. */
export function adminMembershipNotification({ application }) {
  const rows = [
    ['Member', application.full_name || '—'],
    ['Email', application.email || '—'],
    ['Phone', application.phone || '—'],
    ['CNIC', application.cnic || '—'],
    ['City', application.city || '—'],
    ['Membership ID', application.application_id || '—'],
    ['Membership Start', application.membership_start_date || '—'],
    ['Fee', MEMBERSHIP_FEE],
    ['Payment Method', application.payment_method === 'bank_transfer' ? 'Bank Transfer' : application.payment_method === 'easypaisa' ? 'EasyPaisa' : '—'],
    ['Status', 'Pending Review'],
  ]

  return {
    subject: `🧗 New Membership Application — ${application.full_name}`,
    html: renderEmailLayout({
      headerTitle: 'New Membership Application',
      headerSubtitle: 'A membership application needs review',
      bodyHtml: `
        <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
          <strong>${application.full_name}</strong> just applied for the monthly membership.
        </p>
        <div style="margin:14px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Application details</div>
        ${summaryTable(rows)}
      `,
    }),
  }
}

/** Payment approved → admin alert. */
export function adminPaymentNotification({ booking }) {
  const rows = [
    ['Customer', booking.customer_name || '—'],
    ['Booking Number', booking.booking_number || '—'],
    ['Amount', `PKR ${(booking.amount || 0).toLocaleString()}`],
    ['Payment Method', booking.payment_method || '—'],
    ['Status', 'Confirmed'],
  ]

  return {
    subject: `✅ Payment Confirmed — ${booking.customer_name} (${booking.booking_number || ''})`,
    html: renderEmailLayout({
      headerTitle: 'Payment Confirmed',
      headerSubtitle: 'A booking has been paid and confirmed',
      bodyHtml: `
        <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
          <strong>${booking.customer_name}</strong> paid
          <strong>PKR ${(booking.amount || 0).toLocaleString()}</strong> via
          ${booking.payment_method || 'bank transfer'}. The booking is now confirmed.
        </p>
        <div style="margin:14px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Payment details</div>
        ${summaryTable(rows)}
      `,
    }),
  }
}
