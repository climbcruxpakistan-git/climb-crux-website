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
import { MEMBERSHIP_PLAN, MEMBERSHIP_FEE, MEMBERSHIP_TERMS, MEMBERSHIP_DECLARATION, BOOKING_TERMS } from '../membershipForm.js'
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY, formatTime12h } from './dateFormat.js'
import { WHATSAPP_DISPLAY } from '../../../shared/contact.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PDF_DIR = path.join(__dirname, '..', '..', 'storage', 'membership-pdfs')
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true })

// Brand assets used by the booking PDF (logo + Poppins, both committed under
// backend/src/assets so they ship with the Render deploy).
const ASSETS_DIR = path.join(__dirname, '..', 'assets')
const BOOKING_LOGO_PATH = path.join(ASSETS_DIR, 'logo.png')
const BOOKING_FONT_DIR = path.join(ASSETS_DIR, 'fonts')

const ORANGE = '#f36f21'
const DARK = '#1c1c1c'
const GRAY = '#666666'

// Booking-PDF palette
const INK = '#1c1c1e'
const RULE = '#e8e4dc'
const CREAM = '#f9f6f0'
const LABEL_GRAY = '#828288'
const GREEN = '#2e9e5b'
const RED = '#d64545'
const AMBER = '#c98a15'

function label(str) {
  return String(str || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function clean(value) {
  return String(value ?? '').trim() || '—'
}

/**
 * Register Poppins (Regular / Medium / Bold) for the booking PDF only.
 * Any file that is missing or unreadable silently falls back to PDFKit's
 * built-in Helvetica so a PDF is never blocked by a broken asset.
 */
function registerBookingFonts(doc) {
  const fonts = { regular: 'Helvetica', medium: 'Helvetica', bold: 'Helvetica-Bold' }
  const families = [
    ['Poppins-Regular', 'Poppins-Regular.ttf', 'regular'],
    ['Poppins-Medium', 'Poppins-Medium.ttf', 'medium'],
    ['Poppins-Bold', 'Poppins-Bold.ttf', 'bold'],
  ]
  for (const [name, file, key] of families) {
    const full = path.join(BOOKING_FONT_DIR, file)
    if (!fs.existsSync(full)) continue
    try {
      doc.registerFont(name, full)
      fonts[key] = name
    } catch (err) {
      console.warn(`[pdf] Could not load ${file} — falling back to Helvetica:`, err.message)
    }
  }
  return fonts
}

/**
 * Booking-PDF terms checkbox: rounded orange square with a white tick when
 * accepted, outlined square when not. Kept separate from the shared
 * drawCheckBox(), which the membership PDF still uses.
 */
function drawBookingCheckBox(doc, x, yPos, accepted) {
  const size = 11
  if (!accepted) {
    doc.roundedRect(x, yPos, size, size, 3).lineWidth(1).strokeColor('#cfc9bf').stroke()
    return
  }
  doc.roundedRect(x, yPos, size, size, 3).fill(ORANGE)
  doc.save()
  doc.moveTo(x + 2.6, yPos + 5.7)
    .lineTo(x + 4.6, yPos + 7.7)
    .lineTo(x + 8.3, yPos + 3.2)
    .lineWidth(1.4)
    .lineCap('round')
    .lineJoin('round')
    .strokeColor('#ffffff')
    .stroke()
  doc.restore()
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
    const bandHeight = 150
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

    // Key information (right side, aligned label/value pairs) — the column is
    // inset from the band's right edge so long values are never clipped or
    // running off the side of the black header.
    const rightX = twoColX + 16
    const rightW = pageWidth / 2 - 34
    let rx = 56
    const heroLabel = (small, big, color = '#ffffff') => {
      doc.fillColor('#b8b8b8').font('Helvetica').fontSize(7.5).text(small, rightX, rx, { width: rightW, align: 'right' })
      doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(big, rightX, rx + 13, { width: rightW, align: 'right' })
    }
    heroLabel('APPLICATION ID', clean(app.application_id))
    rx += 32
    heroLabel('MEMBERSHIP ID', clean(app.membership_id))
    rx += 32
    heroLabel('STATUS', 'APPROVED / ACTIVE', ORANGE)
    rx += 32
    heroLabel('APPROVED', clean(formatDateDDMMYYYY(app.approval_date)))

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
      ['Membership Start Date', formatDateDDMMYYYY(app.membership_start_date || app.office_start_date)],
    ])

    /* ── Member information ── */
    box('MEMBER INFORMATION', [
      ['Full Name', app.full_name],
      ['Date of Birth', formatDateDDMMYYYY(app.date_of_birth)],
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
      ['Submitted On', formatDateDDMMYYYY(app.created_at)],
    ])

    // No per-page footer here — the brand + reference are already shown in the
    // hero band. A footer drawn at page.height - 30 sits below PDFKit's maxY
    // (page height − bottom margin), so every footer write auto-added a blank
    // page containing only the address line. Removing it (as the booking PDF
    // already does) eliminates those stray blank pages.
    doc.end()
  })
}

/* ═══════════════════════ Booking PDFs ═══════════════════════ */

/** Map a booking's payment status to a friendly label. */
function bookingPaymentStatusLabel(status) {
  const map = {
    pending: 'Pending',
    verification_required: 'Pending Verification',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  }
  return map[status] || clean(status)
}

/** Map a booking's payment method to a friendly label. */
function bookingMethodLabel(method) {
  if (method === 'bank_transfer' || method === 'bank') return 'Bank Transfer'
  if (method === 'easypaisa') return 'EasyPaisa'
  return clean(method)
}

/**
 * Build a branded booking PDF — attached to the customer's confirmation and
 * decline emails, and rendered for the pending review too.
 *
 * Layout (page 1): full-bleed dark header band with the logo, title and status
 * column; three-column key-details strip; booking/payment sections on the left
 * and customer/verification sections on the right; the liability-waiver box;
 * and a full-bleed footer on the last page. Every section is measured before
 * it is drawn, so a field or a term is never split across a page break.
 *
 * @param {object} booking — Booking document
 * @param {{ status?: 'pending'|'confirmed'|'declined', sessionType?: string, time?: string }} [opts]
 * @returns {Promise<Buffer>}
 */
export function generateBookingPdf(booking, { status = 'pending', sessionType = '', time = '' } = {}) {
  return new Promise((resolve, reject) => {
    // Margins are 0 so the header/footer bands can bleed to the page edges;
    // content padding is applied manually with PAD below.
    const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 0, left: 0, right: 0 } })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const fonts = registerBookingFonts(doc)
    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const PAD = 48
    const contentWidth = pageWidth - PAD * 2
    const COL_GAP = 30
    const columnW = (contentWidth - COL_GAP) / 2
    const rightColumnX = PAD + columnW + COL_GAP
    const FOOTER_HEIGHT = 85
    const CONTENT_BOTTOM = pageHeight - FOOTER_HEIGHT - 14
    const PAGE_TOP = doc.page.margins.top

    const isPrivateTimeType =
      booking.session_id === 'private-starter' || booking.session_id === 'private-advanced'
    const snapshotTime = [booking.session_start_time, booking.session_end_time].filter(Boolean).join(' – ')
    const displayTime = isPrivateTimeType ? formatTime12h(booking.time) : time || snapshotTime
    const hasSessionSnapshot = Boolean(booking.session_title || booking.session_date)
    const sessionDate = formatDateDDMMYYYY(
      hasSessionSnapshot ? booking.session_date || booking.date : booking.date
    )
    const participants = String(booking.participants || 1)

    const statusTitle = status === 'confirmed'
      ? 'Booking Confirmed'
      : status === 'declined'
        ? 'Booking Declined'
        : 'Booking Request'
    const statusLabel = status === 'confirmed'
      ? 'CONFIRMED'
      : status === 'declined'
        ? 'DECLINED'
        : 'PENDING PAYMENT VERIFICATION'
    const statusColor = status === 'confirmed' ? ORANGE : status === 'declined' ? RED : AMBER

    /* ── 1. Header band ── */
    const bandHeight = 130
    doc.rect(0, 0, pageWidth, bandHeight).fill(INK)
    doc.rect(0, bandHeight, pageWidth, 5).fill(ORANGE)

    const logoHeight = 86
    const logoX = 34
    let logoWidth = 0
    if (fs.existsSync(BOOKING_LOGO_PATH)) {
      try {
        const logo = doc.openImage(BOOKING_LOGO_PATH)
        logoWidth = (logoHeight * logo.width) / logo.height
        doc.image(BOOKING_LOGO_PATH, logoX, (bandHeight - logoHeight) / 2, { height: logoHeight })
      } catch (err) {
        logoWidth = 0
        console.warn('[pdf] Booking logo could not be loaded:', err.message)
      }
    }

    const headerTextX = logoX + (logoWidth ? logoWidth + 16 : 0)
    const dividerX = pageWidth - 200
    const headerTextWidth = dividerX - 16 - headerTextX
    doc.fillColor('#ffffff').font(fonts.bold).fontSize(24)
      .text(statusTitle, headerTextX, 38, { width: headerTextWidth })
    doc.fillColor('#b4b4ba').font(fonts.regular).fontSize(11.5)
      .text('Islamabad\u2019s Premier Rock Climbing Club', headerTextX, 72, { width: headerTextWidth })

    // Right-hand status column (divider + STATUS / BOOKED ON)
    doc.moveTo(dividerX, 30).lineTo(dividerX, 100).lineWidth(1).strokeColor('#484848').stroke()
    const statusX = dividerX + 18
    const statusWidth = pageWidth - 34 - statusX
    let headerY = 34
    doc.fillColor('#8b8b91').font(fonts.medium).fontSize(7.5)
      .text('STATUS', statusX, headerY, { width: statusWidth, characterSpacing: 1 })
    headerY += 11
    const statusSize = doc.font(fonts.bold).fontSize(13).widthOfString(statusLabel) + 16 <= statusWidth ? 13 : 10
    doc.font(fonts.bold).fontSize(statusSize)
    const statusTextHeight = doc.heightOfString(statusLabel, { width: statusWidth - 16 })
    doc.circle(statusX + 3.5, headerY + statusSize * 0.55, 3.5).fill(statusColor)
    doc.fillColor(statusColor).font(fonts.bold).fontSize(statusSize)
      .text(statusLabel, statusX + 16, headerY, { width: statusWidth - 16 })
    headerY += statusTextHeight + 12
    doc.fillColor('#8b8b91').font(fonts.medium).fontSize(7.5)
      .text('BOOKED ON', statusX, headerY, { width: statusWidth, characterSpacing: 1 })
    headerY += 12
    doc.fillColor('#ffffff').font(fonts.bold).fontSize(13)
      .text(
        formatDateDDMMYYYY(booking.created_at) || formatDateDDMMYYYY(booking.approval_date) || '—',
        statusX,
        headerY,
        { width: statusWidth }
      )

    /* ── 2. Key details strip ── */
    const stripTop = bandHeight + 5
    const stripLabelY = stripTop + 24
    const stripValueY = stripLabelY + 13
    const stripSubY = stripValueY + 27
    const stripBottom = stripSubY + 22
    const columnThird = contentWidth / 3
    const col1X = PAD
    const col2X = PAD + columnThird
    const col3X = PAD + columnThird * 2
    const innerPad = 16

    const stripLabel = (text, x) => {
      doc.fillColor(LABEL_GRAY).font(fonts.medium).fontSize(7.5)
        .text(text, x, stripLabelY, { width: columnThird - innerPad, characterSpacing: 0.8 })
    }
    doc.moveTo(col2X, stripLabelY - 4).lineTo(col2X, stripSubY + 14).lineWidth(1).strokeColor(RULE).stroke()
    doc.moveTo(col3X, stripLabelY - 4).lineTo(col3X, stripSubY + 14).lineWidth(1).strokeColor(RULE).stroke()

    stripLabel('BOOKING ID', col1X)
    doc.fillColor(ORANGE).font(fonts.bold).fontSize(21)
      .text(clean(booking.booking_number), col1X, stripValueY, { width: columnThird - innerPad })

    stripLabel('SESSION DATE', col2X + innerPad)
    doc.fillColor(INK).font(fonts.bold).fontSize(16)
      .text(sessionDate || '—', col2X + innerPad, stripValueY, { width: columnThird - innerPad })
    doc.fillColor('#6f6f75').font(fonts.regular).fontSize(10.5)
      .text(clean(displayTime), col2X + innerPad, stripSubY, { width: columnThird - innerPad })

    stripLabel('TOTAL PRICE', col3X + innerPad)
    doc.fillColor(INK).font(fonts.bold).fontSize(16)
      .text(`PKR ${(booking.amount || 0).toLocaleString()}`, col3X + innerPad, stripValueY, { width: columnThird - innerPad })
    doc.fillColor('#6f6f75').font(fonts.regular).fontSize(10.5)
      .text(`${participants} participant${participants === '1' ? '' : 's'}`, col3X + innerPad, stripSubY, { width: columnThird - innerPad })

    doc.moveTo(PAD, stripBottom).lineTo(pageWidth - PAD, stripBottom).lineWidth(0.8).strokeColor(RULE).stroke()

    /* ── 3. Detail sections ── */
    const bookingFields = [
      { label: 'Booking Date', value: formatDateDDMMYYYY(booking.created_at) || '—' },
      { label: 'Session', value: clean(booking.session_title || sessionType || booking.session_id) },
      { label: isPrivateTimeType ? 'Preferred Time' : 'Time', value: clean(displayTime) },
      { label: 'Participants', value: participants },
    ]
    if (hasSessionSnapshot) {
      bookingFields.push({ label: 'Climbing Location', value: clean(booking.session_location) })
      if (booking.session_maps_url) bookingFields.push({ label: 'View Map', value: booking.session_maps_url })
      if (status === 'confirmed') {
        // Confirmed bookings also include the meeting point (falls back to the
        // climbing location when the admin didn't provide one).
        bookingFields.push({ label: 'Meeting Point', value: clean(booking.session_meeting_point || booking.session_location) })
        bookingFields.push({ label: 'Meeting Point Map', value: clean(booking.session_meeting_point_maps_url || booking.session_maps_url) })
        bookingFields.push({ label: 'Meeting Time', value: clean(booking.session_meeting_time || booking.session_start_time) })
      }
    }

    const customerFields = [
      { label: 'Full Name', value: clean(booking.customer_name) },
      { label: 'Email', value: clean(booking.customer_email) },
      { label: 'Phone', value: clean(booking.customer_phone) },
      {
        label: 'Emergency Contact',
        value: clean(booking.emergency_contact_name
          ? `${booking.emergency_contact_name}${booking.emergency_contact_phone ? ` (${booking.emergency_contact_phone})` : ''}`
          : ''),
      },
    ]

    const paymentStatusText = status === 'confirmed'
      ? 'Paid'
      : status === 'declined'
        ? 'Failed'
        : bookingPaymentStatusLabel(booking.payment_status)
    const paymentStatusColor = status === 'confirmed' ? GREEN : status === 'declined' ? RED : AMBER
    const paymentFields = [
      { label: 'Payment Method', value: bookingMethodLabel(booking.payment_method) },
      { label: 'Payment Status', pill: paymentStatusText, color: paymentStatusColor },
    ]

    const verificationSource = status === 'confirmed'
      ? booking.approval_date
      : status === 'declined'
        ? booking.rejection_date
        : ''
    const verificationLabel = status === 'confirmed' ? 'Verified On' : 'Reviewed On'
    let verificationSection = null
    if ((status === 'confirmed' || status === 'declined') && verificationSource) {
      const full = formatDateTimeDDMMYYYY(verificationSource)
      const split = String(full).match(/^(.*?)\s*\((Pakistan Standard Time)\)$/)
      verificationSection = {
        title: status === 'confirmed' ? 'VERIFICATION' : 'REVIEW',
        fields: split
          ? [{ label: verificationLabel, value: split[1] }, { label: 'Time Zone', value: split[2] }]
          : [{ label: verificationLabel, value: full }],
      }
    }

    const fieldHeight = (field, width) => {
      if (field.pill) return 28
      doc.font(fonts.medium).fontSize(12.5)
      return 10 + doc.heightOfString(field.value, { width })
    }

    const drawField = (x, yTop, width, field) => {
      doc.fillColor(LABEL_GRAY).font(fonts.medium).fontSize(7.5)
        .text(field.label.toUpperCase(), x, yTop, { width, characterSpacing: 0.7 })
      if (field.pill) {
        doc.font(fonts.bold).fontSize(8.5)
        const pillWidth = doc.widthOfString(field.pill) + 22
        const pillHeight = 18
        const pillTop = yTop + 10
        doc.roundedRect(x, pillTop, pillWidth, pillHeight, 9).fill(field.color)
        const pillTextTop = pillTop + (pillHeight - doc.currentLineHeight()) / 2
        doc.fillColor('#ffffff').font(fonts.bold).fontSize(8.5)
          .text(field.pill, x, pillTextTop, { width: pillWidth, align: 'center' })
      } else {
        doc.fillColor(INK).font(fonts.medium).fontSize(12.5)
          .text(field.value, x, yTop + 10, { width })
      }
    }

    const sectionHeight = (section, width) => {
      let height = 27 // title + rule + first-field offset
      section.fields.forEach((field, index) => {
        height += fieldHeight(field, width)
        if (index < section.fields.length - 1) height += 11
      })
      return height
    }

    const drawSection = (x, yTop, width, section) => {
      doc.rect(x, yTop + 3, 5, 10).fill(ORANGE)
      doc.fillColor(INK).font(fonts.bold).fontSize(10)
        .text(section.title, x + 12, yTop, { width: width - 12, characterSpacing: 0.3 })
      const ruleY = yTop + 18
      doc.moveTo(x, ruleY).lineTo(x + width, ruleY).lineWidth(0.8).strokeColor(RULE).stroke()
      let fieldY = yTop + 27
      section.fields.forEach((field, index) => {
        drawField(x, fieldY, width, field)
        fieldY += fieldHeight(field, width)
        if (index < section.fields.length - 1) fieldY += 11
      })
      return fieldY
    }

    const leftSections = [
      { title: 'BOOKING DETAILS', fields: bookingFields },
      { title: 'PAYMENT DETAILS', fields: paymentFields },
    ]
    const rightSections = [{ title: 'CUSTOMER DETAILS', fields: customerFields }]
    if (verificationSection) rightSections.push(verificationSection)

    // Draw the two columns row by row: each row advances past the taller of the
    // two sections, so neither column clips the other and no field is split.
    let y = stripBottom + 30
    const rowCount = Math.max(leftSections.length, rightSections.length)
    for (let i = 0; i < rowCount; i++) {
      const left = leftSections[i]
      const right = rightSections[i]
      const leftHeight = left ? sectionHeight(left, columnW) : 0
      const rightHeight = right ? sectionHeight(right, columnW) : 0
      const rowHeight = Math.max(leftHeight, rightHeight)
      if (y + rowHeight > CONTENT_BOTTOM) {
        doc.addPage()
        y = PAGE_TOP
      }
      if (left) drawSection(PAD, y, columnW, left)
      if (right) drawSection(rightColumnX, y, columnW, right)
      y += rowHeight + 24
    }

    /* ── 4. Terms & conditions ── */
    const TERMS_PAD = 20
    const TERMS_CHECK = 11
    const TERMS_GAP = 10
    const termsTextWidth = contentWidth - TERMS_PAD * 2 - TERMS_CHECK - TERMS_GAP
    doc.font(fonts.regular).fontSize(9)
    const termHeights = BOOKING_TERMS.map((term) => doc.heightOfString(term, { width: termsTextWidth }))
    const termsHeight = termHeights.reduce((total, height, index) => total + height + (index > 0 ? 10 : 0), 0)
    const termsBoxHeight = 18 + 12 + 12 + termsHeight + 16

    y += 4
    if (y + termsBoxHeight > CONTENT_BOTTOM) {
      doc.addPage()
      y = PAGE_TOP
    }

    doc.roundedRect(PAD, y, contentWidth, termsBoxHeight, 10).fill(CREAM)
    doc.fillColor(INK).font(fonts.bold).fontSize(9.5)
      .text('TERMS & CONDITIONS (LIABILITY WAIVER)', PAD + TERMS_PAD, y + 18, { width: contentWidth - TERMS_PAD * 2 })

    let termY = y + 42
    BOOKING_TERMS.forEach((term, index) => {
      const accepted = (booking.agreed_terms || []).includes(term)
      drawBookingCheckBox(doc, PAD + TERMS_PAD, termY + 1, accepted)
      doc.fillColor('#46464b').font(fonts.regular).fontSize(9)
        .text(term, PAD + TERMS_PAD + TERMS_CHECK + TERMS_GAP, termY, { width: termsTextWidth })
      termY += termHeights[index] + 10
    })

    /* ── 5. Footer (last page only) ── */
    const footerTop = pageHeight - FOOTER_HEIGHT
    const footerTitle = status === 'confirmed'
      ? 'Thank you for climbing with us. See you on the rocks!'
      : 'Questions? Contact Team Climb Crux.'
    const footerContact = `climbcruxpakistan.com \u2022 climbcruxpakistan@gmail.com \u2022 ${WHATSAPP_DISPLAY}`
    doc.rect(0, footerTop, pageWidth, FOOTER_HEIGHT).fill(INK)
    doc.rect(0, footerTop, pageWidth, 3).fill(ORANGE)
    doc.fillColor('#ffffff').font(fonts.bold).fontSize(12)
      .text(footerTitle, 0, footerTop + 30, { width: pageWidth, align: 'center' })
    doc.fillColor('#bebec4').font(fonts.regular).fontSize(9.5)
      .text(footerContact, 0, footerTop + 52, { width: pageWidth, align: 'center' })

    doc.end()
  })
}

/* ═══════════════════════════════════════════════════════════════
   Equipment Order PDFs (Sales module)
   ═══════════════════════════════════════════════════════════════ */

/** Map an order's payment status to a friendly label. */
function orderPaymentStatusLabel(status) {
  const map = {
    pending: 'Pending',
    verification_required: 'Pending Verification',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  }
  return map[status] || clean(status)
}

/** Map an order's payment method to a friendly label. */
function orderMethodLabel(method) {
  if (method === 'bank_transfer' || method === 'bank') return 'Bank Transfer'
  if (method === 'easypaisa') return 'EasyPaisa'
  return clean(method)
}

/**
 * Build a branded equipment-order PDF — attached to the customer's payment-
 * received, order-confirmed and order-declined emails.
 *
 * Layout deliberately mirrors the booking PDF (which is proven not to clip
 * the header band or emit stray blank pages): a dark hero band with the
 * Climb Crux brand + order reference, followed by order details, customer
 * details and payment details. Like the booking PDF, there is NO per-page
 * footer — writing at page.height − bottom margin auto-added blank pages in
 * older versions, so it is omitted entirely.
 *
 * @param {object} order — ProductOrder document
 * @param {{ status?: 'pending'|'verification'|'confirmed'|'declined', compress?: boolean }} [opts]
 *   pass compress:false to keep content streams readable (debugging / smoke tests)
 * @returns {Promise<Buffer>}
 */
export function generateOrderPdf(order, { status = 'pending', compress = true } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', compress, margins: { top: 48, bottom: 48, left: 50, right: 50 } })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const twoColX = doc.page.margins.left + pageWidth / 2

    const statusTitle = status === 'confirmed'
      ? 'Order Confirmed'
      : status === 'declined'
        ? 'Order Declined'
        : status === 'verification'
          ? 'Payment Received – Under Verification'
          : 'Equipment Order'
    const statusLabel = status === 'confirmed'
      ? 'CONFIRMED'
      : status === 'declined'
        ? 'DECLINED'
        : status === 'verification'
          ? 'PENDING VERIFICATION'
          : 'PAYMENT PENDING'

    /* ── Header (hero band) ── */
    const bandTop = 40
    const bandHeight = 150
    doc.rect(doc.page.margins.left, bandTop, pageWidth, bandHeight).fill(DARK)

    // Brand (left side)
    const leftX = doc.page.margins.left + 22
    const leftW = pageWidth / 2 - 34
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(21)
      .text('CLIMB CRUX', leftX, 58, { width: leftW })
    doc.font('Helvetica').fontSize(10).fillColor('#b8b8b8')
      .text('Islamabad\u2019s Premier Rock Climbing Club', leftX, 88, { width: leftW })
    doc.font('Helvetica-Bold').fontSize(13).fillColor(ORANGE)
      .text(statusTitle, leftX, 116, { width: leftW })

    // Key information (right side, aligned label/value pairs) — the column is
    // inset from the band's right edge so long values are never clipped or
    // running off the side of the black header.
    const rightX = twoColX + 16
    const rightW = pageWidth / 2 - 34
    let rx = 56
    const heroLabel = (small, big, color = '#ffffff') => {
      doc.fillColor('#b8b8b8').font('Helvetica').fontSize(7.5).text(small, rightX, rx, { width: rightW, align: 'right' })
      doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(big, rightX, rx + 13, { width: rightW, align: 'right' })
    }
    heroLabel('ORDER ID', clean(order.order_number))
    rx += 32
    heroLabel('STATUS', statusLabel, ORANGE)
    rx += 32
    heroLabel('ORDERED', clean(formatDateDDMMYYYY(order.created_at) || formatDateDDMMYYYY(order.approval_date)))

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
      y = doc.y + 8
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

    /* ── Order details ── */
    box('ORDER DETAILS', [
      ['Order ID', order.order_number],
      ['Order Date', formatDateDDMMYYYY(order.created_at)],
      ['Product', order.product_name],
      ['Quantity', String(order.quantity || 1)],
      ['Unit Price', `PKR ${(order.product_price || 0).toLocaleString()}`],
      ['Total Amount', `PKR ${(order.total_amount || 0).toLocaleString()}`],
    ])

    /* ── Customer details ── */
    box('CUSTOMER DETAILS', [
      ['Full Name', order.customer_name],
      ['Email', order.customer_email],
      ['Phone', order.customer_phone],
      ['Shipping Address', order.customer_address],
    ])

    /* ── Payment details ── */
    box('PAYMENT DETAILS', [
      ['Payment Method', orderMethodLabel(order.payment_method)],
      ['Payment Status', status === 'confirmed'
        ? 'Paid'
        : status === 'declined'
          ? 'Failed'
          : orderPaymentStatusLabel(order.payment_status)],
    ])

    if (status === 'confirmed' && order.approval_date) {
      box('VERIFICATION', [
        ['Verified On', formatDateDDMMYYYY(order.approval_date)],
      ])
    }
    if (status === 'declined') {
      box('REVIEW', [
        ['Reviewed On', formatDateDDMMYYYY(order.rejection_date)],
        ['Reason', order.decline_reason],
      ])
    }

    // No per-page footer here — the status is already shown in the hero band
    // (a footer below the bottom margin previously produced blank pages).
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
