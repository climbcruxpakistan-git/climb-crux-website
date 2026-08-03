/**
 * Membership confirmation email — sent to the applicant after a monthly
 * membership application is successfully created and saved.
 */
import {
  renderEmailLayout,
  summaryTable,
  referenceBox,
  statusChip,
  whatsappBlock,
  closingBlock,
  escapeHtml,
} from './emailLayout.js'
import { MEMBERSHIP_PLAN, MEMBERSHIP_FEE } from '../membershipForm.js'

const STATUS = 'Pending Payment Verification'

/**
 * Build the membership confirmation email.
 * @param {{ application: object, whatsapp: string }} props
 * @returns {{ subject: string, html: string }}
 */
export function membershipConfirmation({ application, whatsapp = '' }) {
  const reference = application.application_id || '—'
  const plan = application.membership_plan || MEMBERSHIP_PLAN

  const rows = [
    ['Member', application.full_name || '—'],
    ['Membership Plan', plan],
    ['Status', STATUS],
    ['Membership Start', application.membership_start_date || '—'],
    ['Fee', MEMBERSHIP_FEE],
    ['Payment Method', application.payment_method === 'bank_transfer' ? 'Bank Transfer' : application.payment_method === 'easypaisa' ? 'EasyPaisa' : '—'],
  ]

  const html = renderEmailLayout({
    headerTitle: 'Membership Request Received',
    headerSubtitle: 'Welcome to the Climb Crux family',
    greeting: `Hi ${escapeHtml((application.full_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Thank you for applying for the Climb Crux Monthly Membership. Your
        application has been received and is now <strong>pending payment
        verification</strong>.
      </p>
      ${referenceBox('Membership ID', reference)}
      ${statusChip(STATUS)}
      <div style="margin:18px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Membership summary</div>
      ${summaryTable(rows)}
      ${whatsappBlock({
        number: whatsapp,
        items: ['Your Membership ID: ' + escapeHtml(reference), 'Payment screenshot or transaction receipt'],
        confirmText: 'Once your payment has been verified, your membership will be confirmed via WhatsApp.',
      })}
      ${closingBlock('If you have any questions, reply to this email or message us on WhatsApp. We can\u2019t wait to climb with you! 🧗')}
    `,
  })

  return {
    subject: 'Monthly Membership Request Received – Climb Crux',
    html,
  }
}
