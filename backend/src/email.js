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
      family: 4,
      auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_APP_PASSWORD,
      },
    })
  }
  return _transporter
}

/* ── Helper — booking details HTML table ── */
function bookingDetailsHtml(booking) {
  const sessionLabel = (booking.session_id || '').replace(/-/g, ' ')
  const rows = [
    ['Booking Number', `<span style="font-family:'Courier New',monospace;font-weight:700;letter-spacing:1px">${booking.booking_number || '—'}</span>`],
    ['Customer', booking.customer_name || '—'],
    ['Email', booking.customer_email || '—'],
    ['Phone', booking.customer_phone || '—'],
    ['Session', sessionLabel || '—'],
    ['Date', booking.date || '—'],
    ['Participants', String(booking.participants || '1')],
    ['Amount', `PKR ${(booking.amount || 0).toLocaleString()}`],
    ['Payment Method', booking.payment_method || '—'],
  ]
  return rows
    .map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;font-size:0.85rem">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;font-size:0.85rem">${value}</td></tr>`)
    .join('')
}

/* ── Email wrapper template ── */
function emailWrapper({ headerColor, headerTitle, headerDesc, bodyHtml }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:${headerColor};padding:24px 28px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">${headerTitle}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">${headerDesc}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:0 0 12px 12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            ${bodyHtml || ''}
            <p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">
              Climb Crux Pakistan &middot; <a href="https://climb-crux-admin.vercel.app" style="color:#f36f21;text-decoration:none">Admin Dashboard</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Send an admin notification email (new booking, payment confirmed, etc.)
 */
export async function sendAdminNotification({ subject, title, description, booking }) {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('Gmail SMTP not configured — skipping admin notification')
    return false
  }
  if (!NOTIFICATION_EMAIL) {
    console.warn('NOTIFICATION_EMAIL not set — skipping admin notification')
    return false
  }

  const html = emailWrapper({
    headerColor: 'linear-gradient(135deg,#f36f21,#e85d0f)',
    headerTitle: title,
    headerDesc: description,
    bodyHtml: `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        ${bookingDetailsHtml(booking)}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#666;text-align:center">
        <a href="https://climb-crux-admin.vercel.app/bookings" style="display:inline-block;background:#f36f21;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600">View in Admin Dashboard</a>
      </p>`,
  })

  try {
    await transporter.sendMail({
      from: `"Climb Crux" <${GMAIL_EMAIL}>`,
      to: NOTIFICATION_EMAIL,
      subject,
      html,
    })
    console.log(`Admin notification sent: ${subject}`)
    return true
  } catch (err) {
    console.error('Failed to send admin notification:', err.message)
    return false
  }
}
