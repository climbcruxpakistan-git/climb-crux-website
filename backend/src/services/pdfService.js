/**
 * PDF service — generates the approved membership application PDF.
 *
 * The PDF mirrors the printed Climb Crux membership form layout and contains
 * every field submitted by the applicant, the membership details, uploaded
 * document references, the declaration, the liability waiver (terms), the
 * digital signature, the Membership ID and the approval date.
 *
 * Generated PDFs are stored under backend/storage/membership-pdfs/ so they can
 * be re-served or re-attached later. Note: on Render the filesystem is
 * ephemeral — PDFs are regenerated on demand if the stored file is missing.
 */
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MEMBERSHIP_PLAN, MEMBERSHIP_FEE, MEMBERSHIP_TERMS, MEMBERSHIP_DECLARATION } from '../membershipForm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PDF_DIR = path.join(__dirname, '..', '..', 'storage', 'membership-pdfs')
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true })

const ORANGE = '#f36f21'
const DARK = '#1c1c1c'
const GRAY = '#666666'
const LIGHT = '#f5f5f5'

function label(str) {
  return String(str || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function clean(value) {
  return String(value ?? '').trim() || '—'
}

function ageFromDob(dob) {
  if (!dob) return ''
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return `${age} years`
}

/**
 * Build the approved membership application PDF.
 * @param {object} app — MembershipApplication document
 * @returns {Promise<Buffer>}
 */
export function generateMembershipPdf(app) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 48, left: 50, right: 50 }, bufferPages: true })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const twoColX = doc.page.margins.left + pageWidth / 2

    /* ── Header ── */
    doc.rect(doc.page.margins.left, 40, pageWidth, 96).fill(DARK)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20)
      .text('CLIMB CRUX', doc.page.margins.left + 20, 56, { width: pageWidth - 40 })
    doc.font('Helvetica').fontSize(11)
      .text('Islamabad\u2019s Premier Rock Climbing Club', doc.page.margins.left + 20, 84, { width: pageWidth - 40 })
    doc.font('Helvetica-Bold').fontSize(13).fillColor(ORANGE)
      .text('Approved Membership Application', doc.page.margins.left + 20, 108, { width: pageWidth - 40 })

    doc.fillColor(DARK).fontSize(10)
      .text(`Application ID: ${clean(app.application_id)}`, twoColX + 10, 56, { width: pageWidth / 2 - 10, align: 'right' })
      .text(`Membership ID: ${clean(app.membership_id)}`, twoColX + 10, 72, { width: pageWidth / 2 - 10, align: 'right' })
    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10)
      .text('Status: APPROVED / ACTIVE', twoColX + 10, 88, { width: pageWidth / 2 - 10, align: 'right' })
    doc.fillColor(DARK).font('Helvetica').fontSize(10)
      .text(`Approved: ${clean(app.approval_date)}`, twoColX + 10, 104, { width: pageWidth / 2 - 10, align: 'right' })

    let y = 176

    function sectionTitle(title) {
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11).text(title, doc.page.margins.left, y)
      y += 6
      doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageWidth, y).lineWidth(1).strokeColor(ORANGE).stroke()
      y += 10
    }

    function row(labelText, value) {
      const valueText = clean(value)
      doc.font('Helvetica').fontSize(9.5).fillColor(GRAY).text(labelText, doc.page.margins.left, y, { width: twoColX - doc.page.margins.left - 10 })
      doc.fillColor(DARK).text(valueText, twoColX + 10, y, { width: pageWidth / 2 - 10 })
      y = Math.max(y + 16, doc.y + 4)
    }

    function box(title, rows) {
      sectionTitle(title)
      for (const [k, v] of rows) row(k, v)
      y += 4
    }

    /* ── Membership details ── */
    box('MEMBERSHIP DETAILS', [
      ['Membership Plan', app.membership_plan || MEMBERSHIP_PLAN],
      ['Membership Fee', MEMBERSHIP_FEE],
      ['Membership Start Date', app.membership_start_date || app.office_start_date],
    ])

    /* ── Member information ── */
    box('MEMBER INFORMATION', [
      ['Full Name', app.full_name],
      ['Date of Birth', app.date_of_birth],
      ['Age', ageFromDob(app.date_of_birth)],
      ['Gender', app.gender ? label(app.gender) : ''],
      ['CNIC', app.cnic],
      ['Phone', app.phone],
      ['Email', app.email],
      ['City', app.city],
    ])

    /* ── Emergency contact ── */
    box('EMERGENCY CONTACT', [
      ['Contact Name', app.emergency_contact_name],
      ['Relationship', app.emergency_contact_relationship],
      ['Phone', app.emergency_contact_phone],
    ])

    /* ── Climbing experience ── */
    box('CLIMBING EXPERIENCE', [
      ['Experience Level', app.climbing_experience ? label(app.climbing_experience) : ''],
      ['Climbed Outdoors Before', app.climbed_outdoors_before ? label(app.climbed_outdoors_before) : ''],
      ['Preferred Climbing Days', (app.preferred_days || []).map(label).join(', ')],
    ])

    /* ── Medical information ── */
    box('MEDICAL INFORMATION', [
      ['Conditions / Allergies / Injuries', app.medical_conditions],
    ])

    /* ── Payment information ── */
    box('PAYMENT INFORMATION', [
      ['Payment Method', app.payment_method === 'bank_transfer' ? 'Bank Transfer' : app.payment_method === 'easypaisa' ? 'EasyPaisa' : app.payment_method],
      ['Member Account Name', app.member_account_name],
      ['Payment Status', 'Paid'],
    ])

    /* ── Uploaded documents ── */
    box('UPLOADED DOCUMENTS', [
      ['Participant CNIC', app.cnic_file_name || (app.cnic_file_url ? 'Attached' : '')],
      ['B-Form (under 18)', app.bform_file_name || (app.bform_file_url ? 'Attached' : '')],
      ['Parent / Guardian CNIC', app.guardian_cnic_file_name || (app.guardian_cnic_file_url ? 'Attached' : '')],
      ['Payment Screenshot', app.payment_screenshot_name || (app.payment_screenshot_url ? 'Attached' : '')],
    ])

    /* ── Terms & conditions (liability waiver) ── */
    sectionTitle('TERMS & CONDITIONS (LIABILITY WAIVER)')
    MEMBERSHIP_TERMS.forEach((term, i) => {
      const accepted = (app.agreed_terms || []).includes(term)
      doc.font('Helvetica').fontSize(9).fillColor(DARK)
        .text(`${accepted ? '☑' : '☐'}  ${term}`, doc.page.margins.left, y, { width: pageWidth })
      y = doc.y + 6
    })
    y += 6

    /* ── Declaration ── */
    box('MEMBER DECLARATION', [
      ['Declaration', MEMBERSHIP_DECLARATION],
      ['Accepted', (app.declaration_accepted === true || app.declaration_accepted === 'true') ? 'Yes' : 'No'],
    ])

    /* ── Digital signature ── */
    box('DIGITAL SIGNATURE', [
      ['Signed By (Full Name)', app.signature_name],
      ['Electronic Signature Confirmed', (app.signature_confirmed === true || app.signature_confirmed === 'true') ? 'Yes' : 'No'],
      ['Signature Date', app.signature_date],
      ['Submitted On', app.created_at ? new Date(app.created_at).toISOString().slice(0, 10) : ''],
    ])

    /* ── Footer on each page ── */
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc.fillColor(GRAY).font('Helvetica').fontSize(8)
        .text(
          'Climb Crux Pakistan · Margalla Hills, Islamabad · climbcruxpakistan.com',
          doc.page.margins.left,
          doc.page.height - 30,
          { width: pageWidth, align: 'center' },
        )
    }

    doc.end()
  })
}

/**
 * Persist a generated PDF to the server storage folder.
 * @param {object} app
 * @param {Buffer} buffer
 * @returns {Promise<string>} stored file name
 */
export async function saveMembershipPdf(app, buffer) {
  const filename = `${clean(app.application_id || app.membership_id || 'application')}-approved.pdf`
  const full = path.join(PDF_DIR, filename)
  await fs.promises.writeFile(full, buffer)
  return filename
}

/** Absolute path for a stored PDF (or null when the file is missing). */
export function membershipPdfFullPath(filename) {
  if (!filename) return null
  const full = path.join(PDF_DIR, filename)
  return fs.existsSync(full) ? full : null
}
