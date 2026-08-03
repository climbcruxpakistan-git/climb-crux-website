/**
 * Membership approval email — sent to the applicant after an administrator
 * approves their application. Includes their Membership ID, plan, and status,
 * and announces that a PDF copy of the approved application is attached.
 */
import { renderEmailLayout, referenceBox, escapeHtml, summaryTable } from './emailLayout.js'
import { MEMBERSHIP_FEE } from '../membershipForm.js'

const STATUS = 'Active'

/**
 * @param {{ application: object }} props
 * @returns {{ subject: string, html: string }}
 */
export function membershipApprovalEmail({ application }) {
  const reference = application.membership_id || application.application_id || '—'
  const plan = application.membership_plan || 'Monthly Membership (4 Sessions)'

  const html = renderEmailLayout({
    headerTitle: 'Membership Approved',
    headerSubtitle: 'Welcome to the Climb Crux family 🧗',
    greeting: `Hi ${escapeHtml((application.full_name || 'there').split(' ')[0])},`,
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:15px;color:#1c1c1c;font-weight:700">Congratulations! 🎉</p>
      <p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.7">
        Your <strong>${escapeHtml(plan)}</strong> has been <strong>approved and
        activated</strong>. Your membership is now active, and you can begin
        booking your monthly climbing sessions.
      </p>
      ${referenceBox('Membership ID', reference)}
      <div style="margin:16px 0 4px;font-size:12px;font-weight:800;color:#1c1c1c;text-transform:uppercase;letter-spacing:0.06em">Membership summary</div>
      ${summaryTable([
        ['Member', application.full_name || '—'],
        ['Membership Plan', plan],
        ['Fee', MEMBERSHIP_FEE],
        ['Status', STATUS],
      ])}
      <p style="margin:18px 0 0;font-size:14px;color:#444;line-height:1.7">
        A PDF copy of your approved membership application has been attached to
        this email for your records.
      </p>
      <p style="margin:14px 0 0;font-size:14px;color:#444;line-height:1.7">
        Thank you for joining Climb Crux — we can't wait to climb with you!
      </p>
    `,
  })

  return {
    subject: 'Your Climb Crux Membership Has Been Approved',
    html,
  }
}
