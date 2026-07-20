import { Resend } from 'resend'

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || ''

let _resend = null
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) return null
    _resend = new Resend(key)
  }
  return _resend
}

export async function sendBookingNotification(booking) {
  if (!NOTIFICATION_EMAIL) {
    console.warn('NOTIFICATION_EMAIL not set — skipping email')
    return
  }
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return
  }

  const typeLabel = (booking.type || '').replace(/-/g, ' ')
  const experienceLabel = {
    beginner: 'First time — never climbed before',
    some: 'A few times — knows the basics',
    intermediate: 'Regular climber — working on grades',
    advanced: 'Experienced — training for harder routes',
  }[booking.experience] || booking.experience || 'Not specified'

  const items = [
    ['Name', booking.name],
    ['Email', booking.email],
    ['Phone', booking.phone || '—'],
    ['Session Type', typeLabel || '—'],
    ['Preferred Date', booking.date || '—'],
    ['Group Size', booking.groupSize || '1'],
    ['Experience', experienceLabel],
    ['Message', booking.message || '—'],
  ]

  const rows = items
    .map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#555;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222">${value}</td></tr>`)
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,#f36f21,#e85d0f);padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">🧗 New Booking Request</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">A customer just submitted a booking on Climb Crux</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
              ${rows}
            </table>
            <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">
              Manage this booking in the
              <a href="http://localhost:5174/bookings" style="color:#f36f21;text-decoration:none;font-weight:600">Climb Crux Admin Dashboard</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `🧗 New booking from ${booking.name} — ${typeLabel || 'Climb Crux'}`,
      html,
    })
    console.log(`Booking notification sent to ${NOTIFICATION_EMAIL}`)
  } catch (err) {
    console.error('Failed to send booking notification email:', err.message)
  }
}
