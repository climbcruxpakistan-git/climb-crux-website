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

/* ---------- Comprehensive booking & payment confirmation email (to customer) ---------- */

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
  const bookingNumber = booking.bookingNumber || ''
  const isPaid = booking.paymentStatus === 'paid'

  // Payment info (may be missing if booking confirmed before payment)
  const methodLabel = {
    safepay: 'Credit / Debit Card (SafePay)',
    bank: 'Bank Transfer',
    easypaisa: 'EasyPaisa / JazzCash',
    card: 'Debit / Credit Card',
  }[booking.paymentMethod] || booking.paymentMethod || '—'

  const paymentStatusLabel = isPaid
    ? '<span style="color:#16a34a;font-weight:600">✓ Paid</span>'
    : '<span style="color:#d97706;font-weight:600">⏳ Pending</span>'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#383839,#201f21);padding:32px 32px 24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">Booking Confirmed! ✓</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px">Your climb with <strong style="color:#f36f21">Climb Crux</strong> is locked in.</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            <!-- Booking number badge -->
            ${bookingNumber ? `
            <div style="text-align:center;margin-bottom:24px">
              <div style="display:inline-block;background:#f8f6f2;border:2px dashed #d4cfc7;padding:10px 28px;border-radius:8px">
                <span style="display:block;font-size:11px;color:#9c9484;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Booking Number</span>
                <span style="display:block;font-size:20px;font-weight:700;color:#383839;letter-spacing:0.5px">${bookingNumber}</span>
              </div>
            </div>` : ''}

            <!-- Greeting -->
            <p style="margin:0 0 8px;font-size:15px;color:#333">Hi <strong>${booking.name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#555">
              ${isPaid
                ? 'Great news — your payment has been received and your spot is fully secured! Here\'s everything you need to know:'
                : 'Your booking has been created successfully. Here\'s a recap of your session:'
              }
            </p>

            <!-- Two-column layout for Session + Payment -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <!-- Session Details -->
              <tr>
                <td style="padding:0;width:50%;vertical-align:top">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:10px 14px;background:#f8f6f2;font-weight:600;color:#383839;font-size:13px;border-radius:6px 6px 0 0">🧗 Session Details</td></tr>
                    <tr><td style="padding:8px 14px;border-bottom:1px solid #eee"><span style="color:#888;font-size:12px;display:block">Type</span><span style="color:#333;font-weight:500;font-size:14px">${typeLabel || '—'}</span></td></tr>
                    <tr><td style="padding:8px 14px;border-bottom:1px solid #eee"><span style="color:#888;font-size:12px;display:block">Date</span><span style="color:#333;font-weight:500;font-size:14px">${sessionDate}</span></td></tr>
                    <tr><td style="padding:8px 14px;border-bottom:1px solid #eee"><span style="color:#888;font-size:12px;display:block">Group size</span><span style="color:#333;font-weight:500;font-size:14px">${booking.groupSize || '1'} person${booking.groupSize > 1 ? 's' : ''}</span></td></tr>
                    <tr><td style="padding:8px 14px"><span style="color:#888;font-size:12px;display:block">Location</span><span style="color:#333;font-weight:500;font-size:14px">Margalla Hills, Islamabad</span></td></tr>
                  </table>
                </td>
                <td style="padding:0;width:20px"></td>
                <!-- Payment Summary -->
                <td style="padding:0;width:50%;vertical-align:top">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:10px 14px;background:#f8f6f2;font-weight:600;color:#383839;font-size:13px;border-radius:6px 6px 0 0">💰 Payment Summary</td></tr>
                    <tr><td style="padding:8px 14px;border-bottom:1px solid #eee"><span style="color:#888;font-size:12px;display:block">Amount</span><span style="color:#333;font-weight:600;font-size:14px">PKR 2,500</span></td></tr>
                    <tr><td style="padding:8px 14px;border-bottom:1px solid #eee"><span style="color:#888;font-size:12px;display:block">Method</span><span style="color:#333;font-weight:500;font-size:14px">${methodLabel}</span></td></tr>
                    <tr><td style="padding:8px 14px;border-bottom:1px solid #eee"><span style="color:#888;font-size:12px;display:block">Status</span><span style="font-size:14px">${paymentStatusLabel}</span></td></tr>
                    ${booking.gatewayTransactionId ? `
                    <tr><td style="padding:8px 14px"><span style="color:#888;font-size:12px;display:block">Transaction ID</span><span style="color:#555;font-size:12px;word-break:break-all">${booking.gatewayTransactionId}</span></td></tr>
                    ` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- What to bring tip -->
            <div style="background:#fef7ed;border-left:4px solid #f36f21;padding:16px 18px;border-radius:4px;margin-bottom:24px">
              <p style="margin:0;font-size:13px;color:#8c8578">
                🧗 <strong>What to bring:</strong> Comfortable athletic clothing, closed-toe shoes, water, and a sense of adventure! We provide all climbing gear — just show up ready to climb.
              </p>
            </div>

            <!-- Footer -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
              <tr>
                <td style="text-align:center;padding-top:8px;border-top:1px solid #eee">
                  <p style="margin:0 0 12px;font-size:13px;color:#999">
                    Questions? Reply to this email or reach us on WhatsApp:
                  </p>
                  <a href="https://wa.me/923001234567" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600;font-size:13px">
                    💬 Chat on WhatsApp
                  </a>
                  <p style="margin:16px 0 0;font-size:12px;color:#bbb">
                    Climb Crux — Islamabad's premium rock climbing experience
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const paymentEmoji = isPaid ? '💰' : '✓'
  const subjectPrefix = isPaid ? '✓ Booking Confirmed & Paid' : '✓ Booking Confirmed'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.email,
      subject: `${subjectPrefix} — ${typeLabel || 'Climb Crux'} on ${sessionDate}`,
      html,
    })
    console.log(`Comprehensive confirmation email sent to ${booking.email}`)
  } catch (err) {
    console.error('Failed to send booking confirmed email:', err.message)
  }
}


