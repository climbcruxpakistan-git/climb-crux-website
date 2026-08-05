/**
 * Email service — sends transactional emails through the Resend API.
 *
 * Only these functions are exposed today:
 *   · sendBookingConfirmation({ booking, sessionType })
 *   · sendBookingApprovedEmail({ booking, sessionType })
 *   · sendBookingDeclinedEmail({ booking, sessionType, reason })
 *   · sendMembershipConfirmation({ application })
 *   · sendMembershipApprovalEmail({ application, pdfBuffer })
 *   · sendMembershipRejectionEmail({ application, reason })
 *   · sendOrderPaymentReceivedEmail({ order, pdfBuffer })
 *   · sendOrderConfirmedEmail({ order, pdfBuffer })
 *   · sendOrderDeclinedEmail({ order, reason, pdfBuffer })
 *   · sendAdminMembershipNotification({ application })
 *   · sendAdminPaymentProofNotification({ booking })
 *   · sendAdminOrderPaymentProofNotification({ order })
 *   · sendManualEmail({ to, subject, html, attachments }) — admin dashboard sender
 *
 * Admin notification emails to NOTIFICATION_EMAIL are sent ONLY when a
 * customer uploads & submits their payment screenshot (booking proof, order
 * proof, or the membership application that includes the screenshot) — they
 * act as a reminder to the Climb Crux team. No other admin notifications are
 * sent (no new-booking, no payment-approved alerts).
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
import { bookingApprovedEmail } from '../templates/bookingApprovedEmail.js'
import { bookingDeclinedEmail } from '../templates/bookingDeclinedEmail.js'
import { membershipConfirmation } from '../templates/membershipConfirmation.js'
import { membershipApprovalEmail } from '../templates/membershipApprovalEmail.js'
import { membershipRejectionEmail } from '../templates/membershipRejectionEmail.js'
import { orderPaymentReceivedEmail } from '../templates/orderPaymentReceivedEmail.js'
import { orderConfirmedEmail } from '../templates/orderConfirmedEmail.js'
import { orderDeclinedEmail } from '../templates/orderDeclinedEmail.js'
import {
  adminMembershipNotification,
  adminPaymentProofNotification,
  adminOrderPaymentProofNotification,
} from '../templates/adminNotifications.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || '"Climb Crux" <bookings@climbcruxpakistan.com>'
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || ''
const CLIMB_CRUX_WHATSAPP = process.env.CLIMB_CRUX_WHATSAPP || '+923132690377'

/** Bare address extracted from EMAIL_FROM (e.g. bookings@climbcruxpakistan.com). */
const EMAIL_ADDRESS = String(EMAIL_FROM).match(/<([^>]+)>/)?.[1] || EMAIL_FROM

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

/** Customer booking approval (admin verified the payment) — includes the confirmed-booking PDF. */
export async function sendBookingApprovedEmail({ booking, sessionType, pdfBuffer }) {
  const { subject, html } = bookingApprovedEmail({ booking, sessionType, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({
    to: booking.customer_email,
    subject,
    html,
    attachments: pdfBuffer
      ? [{ filename: `Climb-Crux-Booking-${booking.booking_number || 'Confirmed'}.pdf`, content: pdfBuffer }]
      : undefined,
  })
}

/** Customer booking decline (payment or personal-information reason) — includes the booking-form PDF. */
export async function sendBookingDeclinedEmail({ booking, sessionType, reason = 'payment', pdfBuffer }) {
  const { subject, html } = bookingDeclinedEmail({ booking, sessionType, reason, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({
    to: booking.customer_email,
    subject,
    html,
    attachments: pdfBuffer
      ? [{ filename: `Climb-Crux-Booking-${booking.booking_number || 'Request'}.pdf`, content: pdfBuffer }]
      : undefined,
  })
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

/** Admin alert — payment screenshot submitted, awaiting verification. */
export async function sendAdminPaymentProofNotification({ booking }) {
  const { subject, html } = adminPaymentProofNotification({ booking })
  return send({ to: NOTIFICATION_EMAIL, subject, html })
}

/** Equipment order: first customer email — payment received, under verification (includes the order PDF). */
export async function sendOrderPaymentReceivedEmail({ order, pdfBuffer }) {
  const { subject, html } = orderPaymentReceivedEmail({ order, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({
    to: order.customer_email,
    subject,
    html,
    attachments: pdfBuffer
      ? [{ filename: `Climb-Crux-Order-${order.order_number || 'Received'}.pdf`, content: pdfBuffer }]
      : undefined,
  })
}

/** Equipment order: confirmation after admin verifies payment — includes the order PDF. */
export async function sendOrderConfirmedEmail({ order, pdfBuffer }) {
  const { subject, html } = orderConfirmedEmail({ order, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({
    to: order.customer_email,
    subject,
    html,
    attachments: pdfBuffer
      ? [{ filename: `Climb-Crux-Order-${order.order_number || 'Confirmed'}.pdf`, content: pdfBuffer }]
      : undefined,
  })
}

/** Equipment order: decline after admin review — includes the order PDF and the reason. */
export async function sendOrderDeclinedEmail({ order, reason = '', pdfBuffer }) {
  const { subject, html } = orderDeclinedEmail({ order, reason, whatsapp: CLIMB_CRUX_WHATSAPP })
  return send({
    to: order.customer_email,
    subject,
    html,
    attachments: pdfBuffer
      ? [{ filename: `Climb-Crux-Order-${order.order_number || 'Declined'}.pdf`, content: pdfBuffer }]
      : undefined,
  })
}

/** Admin alert — equipment order payment proof submitted, awaiting verification. */
export async function sendAdminOrderPaymentProofNotification({ order }) {
  const { subject, html } = adminOrderPaymentProofNotification({ order })
  return send({ to: NOTIFICATION_EMAIL, subject, html })
}

/** Admin alert — new membership application (includes the submitted payment screenshot). */
export async function sendAdminMembershipNotification({ application }) {
  const { subject, html } = adminMembershipNotification({ application })
  return send({ to: NOTIFICATION_EMAIL, subject, html })
}

/**
 * Manual email from the admin dashboard (Manual Email Sender page).
 * Unlike `send`, this THROWS on failure so the caller can surface the exact
 * Resend error to the admin, and returns the Resend message id on success.
 * Always sends from the Climb Crux branded sender (bookings@climbcruxpakistan.com).
 */
export async function sendManualEmail({ to, subject, html, text = '', attachments = [] }) {
  const client = getClient()
  if (!client) {
    throw new Error('Email service is not configured — set RESEND_API_KEY')
  }
  if (!to) throw new Error('Recipient email is required')
  const payload = { from: EMAIL_FROM, to, subject, html, reply_to: EMAIL_ADDRESS }
  // Plain-text alternative: Gmail treats text-rich, conversational mail as
  // person-to-person and is far more likely to route it to the Primary inbox
  // instead of Promotions. HTML is kept minimal for the same reason.
  if (text && String(text).trim()) payload.text = String(text)
  if (attachments.length > 0) payload.attachments = attachments
  const { data, error } = await client.emails.send(payload)
  if (error) {
    console.error(`[email] Manual email to ${to} failed:`, error.name || '', error.message || JSON.stringify(error))
    throw new Error(error.message || 'Failed to send email')
  }
  console.log(`[email] Manual email sent to ${to} (id: ${data?.id || 'n/a'})`)
  return data
}
