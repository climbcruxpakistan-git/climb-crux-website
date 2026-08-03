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
 * Draw a small checkbox square with an orange tick when checked.
 * (The ☑/☐ unicode glyphs are not in PDFKit's built-in Helvetica, so they
 * render as garbage — drawing them as vector shapes is reliable everywhere.)
 */
function drawCheckBox(doc, x, yPos, checked) {
  doc.save()
  doc.rect(x, yPos, 9, 9).lineWidth(0.8).strokeColor('#999999').stroke()
  if (checked) {
    doc.moveTo(x + 1.6, yPos + 4.6)
      .lineTo(x + 3.8, yPos + 6.8)
      .lineTo(x + 7.4, yPos + 2.8)
      .lineWidth(1.4)
      .strokeColor(ORANGE)
      .stroke()
  }
  doc.restore()
}

/**
 * Build the approved membership application PDF.
 * @param {object} app — MembershipApplication document
 * @param {{ compress?: boolean }} [opts] — pass compress:false to keep content
 * streams readable (useful for debugging / smoke tests)
 * @returns {Promise<Buffer>}
 */
export function generateMembershipPdf(app, { compress = true } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', compress, margins: { top: 48, bottom: 48, left: 50, right: 50 }, bufferPages: true })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const twoColX = doc.page.margins.left + pageWidth / 2

    /* ── Header (hero band) ── */
    const bandTop = 40
    const bandHeight = 124
    doc.rect(doc.page.margins.left, bandTop, pageWidth, bandHeight).fill(DARK)

    // Brand (left side)
    const leftX = doc.page.margins.left + 22
    const leftW = pageWidth / 2 - 34
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(21)
      .text('CLIMB CRUX', leftX, 58, { width: leftW })
    doc.font('Helvetica').fontSize(10).fillColor('#b8b8b8')
      .text('Islamabad\u2019s Premier Rock Climbing Club', leftX, 88, { width: leftW })
    doc.font('Helvetica-Bold').fontSize(13).fillColor(ORANGE)
      .text('Approved Membership Application', leftX, 116, { width: leftW })

    // Key information (right side, aligned label/value pairs)
    const rightX = twoColX + 16
    const rightW = pageWidth / 2 - 16
    const heroLabel = (small, big, color = '#ffffff') => {
      doc.fillColor('#b8b8b8').font('Helvetica').fontSize(7.5).text(small, rightX, rx, { width: rightW, align: 'right' })
      doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(big, rightX, rx + 12, { width: rightW, align: 'right' })
    }
    let rx = 54
    heroLabel('APPLICATION ID', clean(app.application_id))
    rx += 30
    heroLabel('MEMBERSHIP ID', clean(app.membership_id))
    rx += 30
    heroLabel('STATUS', 'APPROVED / ACTIVE', ORANGE)
    rx += 30
    heroLabel('APPROVED', clean(app.approval_date))

    // Orange accent bar across the bottom of the band
    doc.rect(doc.page.margins.left, bandTop + bandHeight - 4, pageWidth, 4).fill(ORANGE)

    let y = bandTop + bandHeight + 22

    function ensureSpace(needed) {
      if (y + needed > doc.page.height - 60) {
        doc.addPage()
        y = doc.page.margins.top
      }
    }

    function sectionTitle(title) {
      ensureSpace(30)
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11).text(title, doc.page.margins.left, y, { width: pageWidth })
      y = doc.y + 8 // use the real text bottom so the divider always sits right below the title
      doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageWidth, y).lineWidth(1).strokeColor(ORANGE).stroke()
      y += 10
    }

    function row(labelText, value) {
      ensureSpace(18)
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

    /* ── Terms & conditions (liability waiver) — each with a drawn checkbox ── */
    sectionTitle('TERMS & CONDITIONS (LIABILITY WAIVER)')
    const TERM_INDENT = 16
    doc.font('Helvetica').fontSize(9)
    MEMBERSHIP_TERMS.forEach((term) => {
      const accepted = (app.agreed_terms || []).includes(term)
      const termWidth = pageWidth - TERM_INDENT
      const termHeight = doc.heightOfString(term, { width: termWidth })
      ensureSpace(termHeight + 10)
      drawCheckBox(doc, doc.page.margins.left, y + 1, accepted)
      doc.fillColor(DARK).text(term, doc.page.margins.left + TERM_INDENT, y, { width: termWidth })
      y = doc.y + 8
    })
    y += 4

    /* ── Declaration ── */
    box('MEMBER DECLARATION', [
      ['Declaration', MEMBERSHIP_DECLARATION],
      ['Accepted', (app.declaration_accepted === true || app.declaration_accepted === 'true') ? 'Yes' : 'No'],
    ])

    /* ── Digital signature ── */
    box('DIGITAL SIGNATURE', [
      ['Signed By (Full Name)', app.signature_name],
      ['Electronic Signature Confirmed', (app.signature_confirmed === true || app.signature_confirmed === 'true') ? 'Yes' : 'No'],
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
