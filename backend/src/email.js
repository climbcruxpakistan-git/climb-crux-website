import nodemailer from 'nodemailer'

const GMAIL_EMAIL = process.env.GMAIL_EMAIL || ''
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ''
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || ''

let _transporter = null
function getTransporter() {
  if (!_transporter) {
    if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) return null
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_APP_PASSWORD,
      },
    })
  }
  return _transporter
}

/* ── Shared helper — booking details table ── */
function bookingDetailsHtml(booking) {
  const sessionLabel = (booking.session_id || '').replace(/-/g, ' ')
  const rows = [
    ['Booking Number', `<span style="font-family:'Courier New',monospace;font-weight:700;letter-spacing:1px">${booking.booking_number || '—'}</span>`],
    ['Session', sessionLabel || '—'],
    ['Date', booking.date || '—'],
    ['Participants', String(booking.participants || '1')],
    ['Amount', `PKR ${(booking.amount || 0).toLocaleString()}`],
  ]
  return rows
    .map(([label, value]) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">${label}</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:0.88rem">${value}</td></tr>`)
    .join('')
}

/* ── Shared helper — email wrapper ── */
function emailWrapper({ headerColor, borderColor, headerTitle, headerDesc, booking, bodyHtml, footerText }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:${headerColor};padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">${headerTitle}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">${headerDesc}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            <!-- Booking number callout -->
            <div style="border:2px dashed ${borderColor};padding:20px;text-align:center;margin-bottom:24px;border-radius:8px">
              <p style="margin:0 0 4px;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:#888">Booking Number</p>
              <p style="margin:0;font-family:'Courier New',monospace;font-size:1.5rem;font-weight:700;letter-spacing:2px">${booking.booking_number || '—'}</p>
            </div>
            ${bodyHtml || ''}
            ${footerText ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#666;text-align:center">${footerText}</p>` : ''}
            <p style="margin:18px 0 0;font-size:12px;color:#999;text-align:center">Climb Crux Pakistan &middot; climbcrux.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* ── 1. Booking Received (sent to customer) ── */
export async function sendBookingReceivedEmail(booking) {
  const transporter = getTransporter()
  if (!transporter || !booking.customer_email) {
    console.warn('Cannot send booking received email — missing Gmail config or email')
    return
  }

  const html = emailWrapper({
    headerColor: 'linear-gradient(135deg,#f36f21,#e85d0f)',
    borderColor: '#f36f21',
    headerTitle: '🧗 Booking Received!',
    headerDesc: 'Your booking has been created successfully.',
    booking,
    bodyHtml: `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Name</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:0.88rem">${booking.customer_name}</td></tr>
              ${bookingDetailsHtml(booking)}
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Status</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#d97706;font-size:0.88rem;font-weight:600">Pending Payment</td></tr>
            </table>
            <p style="font-size:14px;line-height:1.6;color:#444;text-align:center;margin:24px auto 0;max-width:400px">
              We'll notify you once your payment is confirmed. If you chose Bank Transfer or EasyPaisa, please send your payment proof on WhatsApp for faster verification.
            </p>`,
    footerText: 'Thank you for choosing Climb Crux! 🧗',
  })

  try {
    await transporter.sendMail({
      from: `"Climb Crux" <${GMAIL_EMAIL}>`,
      to: booking.customer_email,
      subject: `🧗 Booking Received — ${booking.booking_number || 'Climb Crux'}`,
      html,
    })
    console.log(`Booking received email sent to ${booking.customer_email}`)
  } catch (err) {
    console.error('Failed to send booking received email:', err.message)
  }
}

/* ── Admin notification (sent when booking created) ── */
export async function sendBookingNotification(booking) {
  if (!NOTIFICATION_EMAIL) {
    console.warn('NOTIFICATION_EMAIL not set — skipping email')
    return
  }
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('Gmail SMTP not configured — skipping email')
    return
  }

  const sessionLabel = (booking.session_id || '').replace(/-/g, ' ')

  const html = emailWrapper({
    headerColor: 'linear-gradient(135deg,#f36f21,#e85d0f)',
    borderColor: '#f36f21',
    headerTitle: '🧗 New Booking Request',
    headerDesc: 'A customer just submitted a booking on Climb Crux',
    booking,
    bodyHtml: `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Name</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:0.88rem">${booking.customer_name}</td></tr>
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Email</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:0.88rem">${booking.customer_email}</td></tr>
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Phone</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:0.88rem">${booking.customer_phone || '—'}</td></tr>
              ${bookingDetailsHtml(booking)}
            </table>`,
    footerText: `Manage this booking in the <a href="https://climb-crux-admin.vercel.app/bookings" style="color:#f36f21;text-decoration:none;font-weight:600">Admin Dashboard</a>`,
  })

  try {
    await transporter.sendMail({
      from: `"Climb Crux" <${GMAIL_EMAIL}>`,
      to: NOTIFICATION_EMAIL,
      subject: `🧗 New booking from ${booking.customer_name} — ${sessionLabel || 'Climb Crux'}`,
      html,
    })
    console.log(`Booking notification sent to ${NOTIFICATION_EMAIL}`)
  } catch (err) {
    console.error('Failed to send booking notification email:', err.message)
  }
}

/* ── 2. Payment Confirmed (sent to customer) ── */
export async function sendPaymentConfirmedEmail(booking) {
  const transporter = getTransporter()
  if (!transporter || !booking.customer_email) {
    console.warn('Cannot send confirmation email — missing Gmail config or email')
    return
  }

  const html = emailWrapper({
    headerColor: 'linear-gradient(135deg,#16a34a,#15803d)',
    borderColor: '#16a34a',
    headerTitle: '✅ Payment Confirmed!',
    headerDesc: 'Your booking has been confirmed.',
    booking,
    bodyHtml: `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Name</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:0.88rem">${booking.customer_name}</td></tr>
              ${bookingDetailsHtml(booking)}
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Status</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#16a34a;font-size:0.88rem;font-weight:700">Confirmed ✓</td></tr>
            </table>
            <p style="font-size:14px;line-height:1.6;color:#444;text-align:center;margin:24px auto 0;max-width:400px">
              See you on the rocks! 🧗<br>
              If you have any questions, reach out to us on WhatsApp.
            </p>`,
    footerText: 'Climb Crux Pakistan',
  })

  try {
    await transporter.sendMail({
      from: `"Climb Crux" <${GMAIL_EMAIL}>`,
      to: booking.customer_email,
      subject: `✅ Payment Confirmed — ${booking.booking_number || 'Climb Crux Booking'}`,
      html,
    })
    console.log(`Payment confirmation email sent to ${booking.customer_email}`)
  } catch (err) {
    console.error('Failed to send payment confirmation email:', err.message)
  }
}

/* ── 3. Payment Failed (sent to customer) ── */
export async function sendPaymentRejectedEmail(booking) {
  const transporter = getTransporter()
  if (!transporter || !booking.customer_email) {
    console.warn('Cannot send rejection email — missing Gmail config or email')
    return
  }

  const html = emailWrapper({
    headerColor: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    borderColor: '#dc2626',
    headerTitle: '⚠️ Payment Not Confirmed',
    headerDesc: 'We were unable to verify your payment.',
    booking,
    bodyHtml: `
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Name</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#222;font-size:0.88rem">${booking.customer_name}</td></tr>
              ${bookingDetailsHtml(booking)}
              <tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.88rem">Status</td><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#dc2626;font-size:0.88rem;font-weight:600">Payment Failed</td></tr>
            </table>
            <p style="font-size:14px;line-height:1.6;color:#444;text-align:center;margin:24px auto 0;max-width:400px">
              We couldn't verify your payment. This could be due to an incorrect transfer amount or missing transaction details.
            </p>
            <p style="font-size:14px;line-height:1.6;color:#444;text-align:center;margin:12px auto 0;max-width:400px">
              Please check your payment and try again, or contact us on WhatsApp for assistance.
            </p>`,
    footerText: 'Climb Crux Pakistan &middot; WhatsApp: +92 300 1234567',
  })

  try {
    await transporter.sendMail({
      from: `"Climb Crux" <${GMAIL_EMAIL}>`,
      to: booking.customer_email,
      subject: `⚠️ Payment Not Confirmed — ${booking.booking_number || 'Climb Crux Booking'}`,
      html,
    })
    console.log(`Payment rejection email sent to ${booking.customer_email}`)
  } catch (err) {
    console.error('Failed to send payment rejection email:', err.message)
  }
}
