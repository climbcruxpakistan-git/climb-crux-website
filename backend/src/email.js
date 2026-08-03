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
      port: 465,
      secure: true,
      // Force IPv4 — Render has no IPv6 route to Gmail (ENETUNREACH otherwise)
      family: 4,
      // Explicit timeouts so failures surface clearly in logs instead of hanging
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
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

/* ── Helper — membership application details HTML table ── */
function membershipDetailsHtml(application) {
  const methodLabel = application.payment_method === 'bank_transfer'
    ? 'Bank Transfer'
    : application.payment_method === 'easypaisa'
      ? 'EasyPaisa'
      : '—'
  const rows = [
    ['Application ID', `<span style="font-family:'Courier New',monospace;font-weight:700;letter-spacing:1px">${application.application_id || '—'}</span>`],
    ['Member', application.full_name || '—'],
    ['Email', application.email || '—'],
    ['Phone', application.phone || '—'],
    ['CNIC', application.cnic || '—'],
    ['City', application.city || '—'],
    ['Membership Start', application.membership_start_date || '—'],
    ['Payment Method', methodLabel],
    ['Status', 'Pending Review'],
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
    console.error('Failed to send admin notification:', err.code || '', err.message)
    return false
  }
}

/**
 * Send a confirmation email to a membership applicant.
 */
export async function sendMembershipConfirmation({ to, application }) {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('Gmail SMTP not configured — skipping membership confirmation')
    return false
  }

  const html = emailWrapper({
    headerColor: 'linear-gradient(135deg,#f36f21,#e85d0f)',
    headerTitle: 'Membership Application Received',
    headerDesc: `Welcome to Climb Crux${application.full_name ? `, ${application.full_name.split(' ')[0]}` : ''}!`,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.6">
        Thanks for applying for the <strong>Monthly Membership (4 Sessions)</strong>.
        Your application has been received and is now under review.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:4px">
        ${membershipDetailsHtml(application)}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#666;line-height:1.6">
        <strong>What happens next:</strong> Our team will review your application and
        confirm your payment. Once approved you will receive a confirmation email with
        your membership ID and active start date. If you have any questions, reply to
        this email or contact us at +92 313 2690377.
      </p>`,
  })

  try {
    await transporter.sendMail({
      from: `"Climb Crux" <${GMAIL_EMAIL}>`,
      to,
      subject: `Your Climb Crux Membership Application — ${application.application_id || ''}`,
      html,
    })
    console.log(`Membership confirmation sent to ${to}`)
    return true
  } catch (err) {
    console.error('Failed to send membership confirmation:', err.code || '', err.message)
    return false
  }
}

/**
 * Send an admin notification when a new membership application is submitted.
 */
export async function sendAdminMembershipNotification({ application }) {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('Gmail SMTP not configured — skipping membership admin notification')
    return false
  }
  if (!NOTIFICATION_EMAIL) {
    console.warn('NOTIFICATION_EMAIL not set — skipping membership admin notification')
    return false
  }

  const html = emailWrapper({
    headerColor: 'linear-gradient(135deg,#f36f21,#e85d0f)',
    headerTitle: '🧗 New Membership Application',
    headerDesc: `${application.full_name || 'A member'} just applied for the Monthly Membership`,
    bodyHtml: `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
        ${membershipDetailsHtml(application)}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#666;text-align:center">
        <a href="https://climb-crux-admin.vercel.app/membership-applications" style="display:inline-block;background:#f36f21;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600">Review in Admin Dashboard</a>
      </p>`,
  })

  try {
    await transporter.sendMail({
      from: `"Climb Crux" <${GMAIL_EMAIL}>`,
      to: NOTIFICATION_EMAIL,
      subject: `🧗 New Membership Application — ${application.full_name || 'Unknown'}`,
      html,
    })
    console.log('Membership admin notification sent')
    return true
  } catch (err) {
    console.error('Failed to send membership admin notification:', err.code || '', err.message)
    return false
  }
}
