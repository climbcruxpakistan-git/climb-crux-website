/**
 * Membership service — approval workflow.
 *
 * Steps (in order):
 *   1. Compute Membership ID + approval date.
 *   2. Generate the approved-application PDF.  ← if this fails, the
 *      membership is NOT approved (the route surfaces the error).
 *   3. Persist the approval (status=approved, membership=active, payment=paid).
 *   4. Send the approval email with the PDF attached.  ← if this fails the
 *      approval is kept; the caller is told so the admin sees a clear message.
 */
import MembershipApplication from '../models/MembershipApplication.js'
import { generateMembershipPdf, saveMembershipPdf } from './pdfService.js'
import { sendMembershipApprovalEmail } from './emailService.js'

/**
 * @param {import('mongoose').Document} application — a loaded MembershipApplication
 * @returns {Promise<{ application: object, emailSent: boolean }>}
 * @throws when PDF generation fails (approval is aborted).
 */
export async function approveMembership(application) {
  // ── Step 1 · Membership ID + approval date ──
  if (!application.membership_id) {
    const year = new Date().getFullYear()
    const count = await MembershipApplication.countDocuments({ membership_id: { $ne: '', $exists: true } })
    application.membership_id = `CM-${year}-${String(count + 1).padStart(4, '0')}`
  }
  if (!application.approval_date) {
    application.approval_date = new Date().toISOString().slice(0, 10)
  }
  if (!application.office_start_date) {
    application.office_start_date = application.approval_date
  }

  // ── Step 2 · Generate PDF (throws → approval aborted) ──
  const pdfBuffer = await generateMembershipPdf(application)
  application.pdf_path = await saveMembershipPdf(application, pdfBuffer)

  // ── Step 3 · Persist approval ──
  application.status = 'approved'
  application.membership_status = 'active'
  application.payment_status = 'paid'
  await application.save()

  // ── Step 4 · Approval email (never blocks/rolls back the approval) ──
  let emailSent = false
  try {
    emailSent = await sendMembershipApprovalEmail({ application, pdfBuffer })
  } catch (err) {
    console.error(`[membership] Approval email error for ${application.application_id}:`, err.message)
  }
  if (!emailSent) {
    console.warn(`[membership] Approval email NOT sent for ${application.application_id} (${application.email}) — approval kept`)
  }

  return { application, emailSent }
}
