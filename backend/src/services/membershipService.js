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
import { generateMembershipPdf, saveMembershipPdf } from './pdfService.js'
import { sendMembershipApprovalEmail, sendMembershipRejectionEmail } from './emailService.js'

/**
 * @param {import('mongoose').Document} application — a loaded MembershipApplication
 * @returns {Promise<{ application: object, emailSent: boolean }>}
 * @throws when PDF generation fails (approval is aborted).
 */
export async function approveMembership(application) {
  // ── Step 1 · Membership ID + approval date ──
  if (!application.membership_id) {
    // The membership reference is the application's CCM-XXXX ID — one stable
    // reference for the lifetime of the record (no separate CM-YYYY-NNNN
    // number, and no racy database-count lookup). Applications approved with
    // a pre-existing membership_id (historical records) keep it unchanged.
    application.membership_id = application.application_id
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

/**
 * Reject a membership application.
 * @param {import('mongoose').Document} application
 * @param {'payment'|'documentation'} reason — also drives which email variant is sent
 * @returns {Promise<{ application: object, emailSent: boolean }>}
 * The rejection is always persisted; a failed email is logged and reported, never
 * rolled back.
 */
export async function rejectMembership(application, reason = 'payment') {
  application.status = 'rejected'
  if (reason === 'payment') {
    application.payment_status = 'failed'
  }
  await application.save()

  let emailSent = false
  try {
    emailSent = await sendMembershipRejectionEmail({ application, reason })
  } catch (err) {
    console.error(`[membership] Rejection email error for ${application.application_id}:`, err.message)
  }
  if (!emailSent) {
    console.warn(`[membership] Rejection email NOT sent for ${application.application_id} (${application.email}) — rejection kept`)
  }

  return { application, emailSent }
}
