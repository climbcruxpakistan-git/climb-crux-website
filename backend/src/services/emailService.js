/**
 * Email service — sends transactional emails through the Resend API.
 *
 * Only these functions are exposed today:
 *   · sendBookingConfirmation({ booking, sessionType })
 *   · sendMembershipConfirmation({ application })
 *   · sendAdminBookingNotification({ booking, sessionType })
 *   · sendAdminMembershipNotification({ application })
 *   · sendAdminPaymentNotification({ booking })
 *
 * Modular by design: each template lives in ../templates and produces
 * { subject, html }; adding a new email type later means adding one template
 * and one small send function here — no changes to existing logic.
 *
 * Errors never throw to the caller: if an email fails we log it clearly and
 * return false, so booking/membership creation is never blocked or cancelled.
 */
import { Resend } from 'resend'
import { bookingConfirmation } from '../templates/bookingConfirmation.js'
import { membershipConfirmation } from '../templates/membershipConfirmation.js'
import { membershipApprovalEmail } from '../templates/membershipApprovalEmail.js'
import { membershipRejectionEmail } from '../templates/membershipRejectionEmail.js'
import {
  adminBookingNotification,
  adminMembershipNotification,
  adminPaymentNotification,
} from '../templates/adminNotifications.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || '"Climb Crux" <bookings@climbcruxpakistan.com>'
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || ''
const CLIMB_CRUX_WHATSAPP = process.env.CLIMB_CRUX_WHATSAPP || '+923132690377'

let _resend = null
function getClient() {
  if (!_resend) {
    if (!RESEND_API_KEY) return null
    _resend = new Resend(RESEND_API_KEY)
  }
  return _resend
}

/** Core send helper — never throws, always logs clearly. */
async function send({ to, subject, html, attachments }) {
  const client = getClient()
  if (!client) {
    console.warn(`[email] Resend not configured (set RESEND_API_KEY) — skipping "${subject}"`)
    return false
  }
  if (!to) {
    console.warn(`[email] No recipient for "${subject}" — skipping`)
    return false
  }
  try {
    const payload = { from: EMAIL_FROM, to, subject, html }
    if (attachments && attachments.length > 0) payload.attachments = attachments
    const { data, error } = await client.emails.send(payload)
    if (error) {
      console.error(`[email] Failed to send "${subject}" to ${to}:`, error.name || '', error.message || JSON.stringify(error))
      return false
    }
    console.log(`[email] Sent "${subject}" to ${to} (id: ${data?.id || 'n/a'})`)
    return true
  } catch (err) {
    console.error(`[email] Error sending "${subject}" to ${to}:`, err.code || '', err.message)
    return false
  }
}

/** Customer booking confirmation (Public or Private session). */
export async function sendBookingConfirmation({ booking, sessionType }) {
  const { subject, html } = bookingConfirmation({ booking, sessionType, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({ to: booking.customer_email, subject, html })
}

/** Customer membership confirmation. */
export async function sendMembershipConfirmation({ application }) {
  const { subject, html } = membershipConfirmation({ application, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({ to: application.email, subject, html })
}

/** Membership approval — includes the approved-application PDF as an attachment. */
export async function sendMembershipApprovalEmail({ application, pdfBuffer }) {
  const { subject, html } = membershipApprovalEmail({ application })
  const reference = application.membership_id || application.application_id || 'application'
  return send({
    to: application.email,
    subject,
    html,
    attachments: pdfBuffer
      ? [{ filename: `Climb-Crux-Approved-Membership-${reference}.pdf`, content: pdfBuffer }]
      : undefined,
  })
}

/** Membership rejection — reason picks the payment-failed or documentation variant. */
export async function sendMembershipRejectionEmail({ application, reason = 'payment' }) {
  const { subject, html } = membershipRejectionEmail({ application, reason, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({ to: application.email, subject, html })
}

/** Admin alert — new booking created. */
export async function sendAdminBookingNotification({ booking, sessionType }) {
  const { subject, html } = adminBookingNotification({ booking, sessionType })
  return send({ to: NOTIFICATION_EMAIL, subject, html })
}

/** Admin alert — new membership application. */
export async function sendAdminMembershipNotification({ application }) {
  const { subject, html } = adminMembershipNotification({ application })
  return send({ to: NOTIFICATION_EMAIL, subject, html })
}

/** Admin alert — payment approved / booking confirmed. */
export async function sendAdminPaymentNotification({ booking }) {
  const { subject, html } = adminPaymentNotification({ booking })
  return send({ to: NOTIFICATION_EMAIL, subject, html })
}
