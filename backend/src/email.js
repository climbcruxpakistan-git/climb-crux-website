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

/* ---------- Booking confirmed email (to customer) ---------- */

export async function sendBookingConfirmedEmail(booking) {
  if (!booking.email) {
    console.warn('No customer email — skipping booking confirmed email')
    return
  }
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping booking confirmed email')
    return
  }

  const typeLabel = (booking.type || '').replace(/-/g, ' ')
  const sessionDate = booking.date || 'To be confirmed'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,#383839,#201f21);padding:32px 32px 24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Booking Confirmed! ✓</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px">Your climb with <strong style="color:#f36f21">Climb Crux</strong> is locked in.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            <p style="margin:0 0 20px;font-size:15px;color:#333">Hi <strong>${booking.name}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;color:#555">Great news — your session has been confirmed! Here's a recap of your booking:</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr><td style="padding:10px 14px;background:#f8f6f2;font-weight:600;color:#383839;font-size:14px;border-radius:6px 6px 0 0" colspan="2">Session Details</td></tr>
              <tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#888;font-size:13px">Type</td><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#333;font-weight:500">${typeLabel || '—'}</td></tr>
              <tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#888;font-size:13px">Date</td><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#333;font-weight:500">${sessionDate}</td></tr>
              <tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#888;font-size:13px">Group size</td><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#333;font-weight:500">${booking.groupSize || '1'}</td></tr>
              <tr><td style="padding:8px 14px;color:#888;font-size:13px">Location</td><td style="padding:8px 14px;color:#333;font-weight:500">Margalla Hills, Islamabad</td></tr>
            </table>

            <div style="background:#fef7ed;border-left:4px solid #f36f21;padding:16px 18px;border-radius:4px;margin-bottom:24px">
              <p style="margin:0;font-size:13px;color:#8c8578">
                🧗 <strong>What to bring:</strong> Comfortable athletic clothing, closed-toe shoes, water, and a sense of adventure! We provide all climbing gear.
              </p>
            </div>

            <p style="margin:0 0 8px;font-size:13px;color:#999;text-align:center">
              Questions? Reply to this email or contact us on
              <a href="https://wa.me/923001234567" style="color:#f36f21;text-decoration:none;font-weight:600">WhatsApp</a>.
            </p>
            <p style="margin:0;font-size:12px;color:#bbb;text-align:center">
              Climb Crux — Islamabad's premium rock climbing experience
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
      to: booking.email,
      subject: `✓ Booking Confirmed — ${typeLabel || 'Climb Crux'} on ${sessionDate}`,
      html,
    })
    console.log(`Booking confirmed email sent to ${booking.email}`)
  } catch (err) {
    console.error('Failed to send booking confirmed email:', err.message)
  }
}

/* ---------- Payment confirmed email (to customer) ---------- */

export async function sendPaymentConfirmedEmail(booking) {
  if (!booking.email) {
    console.warn('No customer email — skipping payment confirmed email')
    return
  }
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping payment confirmed email')
    return
  }

  const typeLabel = (booking.type || '').replace(/-/g, ' ')
  const methodLabel = {
    card: 'Debit / Credit Card',
    bank: 'Bank Transfer',
    easypaisa: 'EasyPaisa / JazzCash',
  }[booking.paymentMethod] || booking.paymentMethod || '—'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 32px 24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Payment Received! 💰</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">Your payment for <strong style="color:#fff">${typeLabel || 'Climb Crux'}</strong> is confirmed.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            <p style="margin:0 0 20px;font-size:15px;color:#333">Hi <strong>${booking.name}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;color:#555">We've received your payment. Your spot is fully secured! 🎉</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr><td style="padding:10px 14px;background:#f8f6f2;font-weight:600;color:#383839;font-size:14px;border-radius:6px 6px 0 0" colspan="2">Payment Summary</td></tr>
              <tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#888;font-size:13px">Session</td><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#333;font-weight:500">${typeLabel || '—'}</td></tr>
              <tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#888;font-size:13px">Amount</td><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#333;font-weight:500">PKR 2,500</td></tr>
              <tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#888;font-size:13px">Payment method</td><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#333;font-weight:500">${methodLabel}</td></tr>
              <tr><td style="padding:8px 14px;color:#888;font-size:13px">Status</td><td style="padding:8px 14px;color:#16a34a;font-weight:600">✓ Paid</td></tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#999;text-align:center">
              See you on the rocks! If you have any questions, reply to this email or
              <a href="https://wa.me/923001234567" style="color:#f36f21;text-decoration:none;font-weight:600">WhatsApp us</a>.
            </p>
            <p style="margin:0;font-size:12px;color:#bbb;text-align:center">
              Climb Crux — Islamabad's premium rock climbing experience
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
      to: booking.email,
      subject: `💰 Payment Confirmed — ${typeLabel || 'Climb Crux'}`,
      html,
    })
    console.log(`Payment confirmed email sent to ${booking.email}`)
  } catch (err) {
    console.error('Failed to send payment confirmed email:', err.message)
  }
}
