/**
 * Membership rejection email — sent to the applicant when an administrator
 * rejects their application. Two variants, selected by the admin:
 *   · reason = 'payment'        → payment could not be verified
 *   · reason = 'documentation'  → submitted documents incomplete/unclear
 * Both share the same branded layout; only the message changes.
 */
import { renderEmailLayout, referenceBox, summaryTable, escapeHtml, formatWhatsApp } from './emailLayout.js'
import { MEMBERSHIP_FEE } from '../membershipForm.js'

const STATUS = 'Rejected'
const CONTACT_EMAIL = 'bookings@climbcruxpakistan.com'

const REASON_CONTENT = {
  payment: {
    subject: 'Your Climb Crux Membership Application — Payment Not Verified',
    eyebrow: 'Payment verification unsuccessful',
    message:
      'Thank you for applying for the Climb Crux Monthly Membership. Unfortunately, we were unable to verify your payment, so your application could not be approved.',
    detail:
      'If you believe this is a mistake, or if you would like us to review a corrected payment receipt, please reach out to us and we will be happy to help.',
  },
  documentation: {
    subject: 'Your Climb Crux Membership Application — Documents Incomplete',
    eyebrow: 'Supporting documents required',
    message:
      'Thank you for applying for the Climb Crux Monthly Membership. Unfortunately, the supporting documents submitted with your application were incomplete or unclear, so your application could not be approved.',
    detail:
      'Please re-submit your application with clear copies of the required documents — your CNIC (or B-Form and guardian CNIC for participants under 18) — and we will be happy to review it again.',
  },
}

/**
 * @param {{ application: object, reason?: 'payment'|'documentation', whatsapp?: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function membershipRejectionEmail({ application, reason = 'payment', whatsapp = '' }) {
  const content = REASON_CONTENT[reason] || REASON_CONTENT.payment
  const reference = application.application_id || application.membership_id || '—'
  const plan = application.membership_plan || 'Monthly Membership (4 Sessions)'

  const html = renderEmailLayout({
    headerTitle: 'Membership Application Update',
    headerSubtitle: content.eyebrow,
    greeting: `Hi ${escapeHtml((application.full_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:14px;color:#444;line-height:1.7">${escapeHtml(content.message)}</p>
      ${referenceBox('Application ID', reference)}
      <div style="margin:16px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Application summary</div>
      ${summaryTable([
        ['Member', application.full_name || '—'],
        ['Membership Plan', plan],
        ['Fee', MEMBERSHIP_FEE],
        ['Application ID', application.application_id || '—'],
        ['Status', STATUS],
      ])}
      <p style="margin:16px 0 0;font-size:14px;color:#444;line-height:1.7">${escapeHtml(content.detail)}</p>
      <p style="margin:12px 0 0;font-size:14px;color:#444;line-height:1.7">
        If you have any questions, reach out to us on WhatsApp at <strong>${formatWhatsApp(whatsapp)}</strong>
        or email <a href="mailto:${CONTACT_EMAIL}" style="color:#f36f21;text-decoration:none">${CONTACT_EMAIL}</a>.
      </p>
      <p style="margin:12px 0 0;font-size:14px;color:#444;line-height:1.7">Thank you for your interest in Climb Crux.</p>
    `,
  })

  return { subject: content.subject, html }
}
