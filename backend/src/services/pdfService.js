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
import { formatDateDDMMYYYY, formatLongDate } from './dateFormat.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PDF_DIR = path.join(__dirname, '..', '..', 'storage', 'membership-pdfs')
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true })

const ORANGE = '#f36f21'
const DARK = '#1c1c1c'
const GRAY = '#666666'

function label(str) {
  return String(str || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function clean(value) {
  return String(value ?? '').trim() || '—'
}

/**
 * Truncate a value to fit one line in the PDF hero band. The band positions
 * each label at absolute offsets (no wrapping), so long Session Names must be
 * shortened or they would overlap the STATUS / BOOKED labels below them.
 */
function truncateToFit(value, max = 28) {
  const s = String(value || '').trim()
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
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
 * decline emails. Layout mirrors the membership PDF: a dark hero band with the
 * Climb Crux brand + booking reference, followed by booking details, customer
 * details and payment details, with a status footer.
 *
 * @param {object} booking — Booking document
 * @param {{ status?: 'pending'|'confirmed'|'declined', sessionType?: string, time?: string }} [opts]
 * @returns {Promise<Buffer>}
 */
export function generateBookingPdf(booking, { status = 'pending', sessionType = '', time = '' } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 48, left: 50, right: 50 } })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const twoColX = doc.page.margins.left + pageWidth / 2

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
    // The Session Name is the primary identifier on the PDF — the generic
    // "Public Session" type label only appears for private/legacy bookings.
    // Truncated so a long name never wraps over the STATUS / BOOKED labels.
    const heroSession = truncateToFit(booking.session_title || sessionType || (String(booking.session_id || '').toLowerCase() === 'public' ? 'Public Session' : 'Private Session'))
    heroLabel('SESSION', clean(heroSession))
    rx += 32
    heroLabel('STATUS', statusLabel, ORANGE)
    rx += 32
    heroLabel('BOOKED', clean(formatDateDDMMYYYY(booking.created_at) || formatDateDDMMYYYY(booking.approval_date)))

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

    /* ── Booking details (public sessions include the announced-session snapshot) ── */
    const hasSessionSnapshot = Boolean(booking.session_title || booking.session_date)
    const sessionRows = [
      ['Booking ID', booking.booking_number],
      ['Booking Date', formatDateDDMMYYYY(booking.created_at)],
      // Public bookings list the Session Name directly — never the generic label.
      // Falls back to the type label only when the snapshot has no title.
      ['Session', clean(booking.session_title || sessionType || booking.session_id)],
    ]
    sessionRows.push(['Date', hasSessionSnapshot
      ? (formatLongDate(booking.session_date || booking.date) || booking.session_date || booking.date)
      : formatDateDDMMYYYY(booking.date)])
    const snapshotTime = [booking.session_start_time, booking.session_end_time].filter(Boolean).join(' – ')
    sessionRows.push(['Time', time || snapshotTime])
    if (hasSessionSnapshot) {
      sessionRows.push(['Climbing Location', booking.session_location])
      if (booking.session_maps_url) sessionRows.push(['View Map', booking.session_maps_url])
      if (status === 'confirmed') {
        // Confirmed bookings also include the meeting point (falls back to the
        // climbing location when the admin didn't provide one).
        sessionRows.push(['Meeting Point', booking.session_meeting_point || booking.session_location])
        sessionRows.push(['Meeting Point Map', booking.session_meeting_point_maps_url || booking.session_maps_url])
        sessionRows.push(['Meeting Time', booking.session_meeting_time || booking.session_start_time])
      }
    }
    sessionRows.push(['Participants', String(booking.participants || 1)])
    sessionRows.push(['Price', `PKR ${(booking.amount || 0).toLocaleString()}`])
    box('BOOKING DETAILS', sessionRows)

    /* ── Customer details ── */
    box('CUSTOMER DETAILS', [
      ['Full Name', booking.customer_name],
      ['Email', booking.customer_email],
      ['Phone', booking.customer_phone],
      ['Emergency Contact', booking.emergency_contact_name
        ? `${booking.emergency_contact_name}${booking.emergency_contact_phone ? ` (${booking.emergency_contact_phone})` : ''}`
        : ''],
    ])

    /* ── Payment details ── */
    box('PAYMENT DETAILS', [
      ['Payment Method', bookingMethodLabel(booking.payment_method)],
      ['Payment Status', status === 'confirmed'
        ? 'Paid'
        : status === 'declined'
          ? 'Failed'
          : bookingPaymentStatusLabel(booking.payment_status)],
    ])

    /* ── Terms & conditions (liability waiver) — each with a drawn checkbox ── */
    sectionTitle('TERMS & CONDITIONS (LIABILITY WAIVER)')
    const TERM_INDENT = 16
    doc.font('Helvetica').fontSize(9)
    BOOKING_TERMS.forEach((term) => {
      const accepted = (booking.agreed_terms || []).includes(term)
      const termWidth = pageWidth - TERM_INDENT
      const termHeight = doc.heightOfString(term, { width: termWidth })
      ensureSpace(termHeight + 10)
      drawCheckBox(doc, doc.page.margins.left, y + 1, accepted)
      doc.fillColor(DARK).text(term, doc.page.margins.left + TERM_INDENT, y, { width: termWidth })
      y = doc.y + 8
    })
    y += 4

    if (status === 'confirmed' && booking.approval_date) {
      box('VERIFICATION', [
        ['Verified On', formatDateDDMMYYYY(booking.approval_date)],
      ])
    }
    if (status === 'declined' && booking.rejection_date) {
      box('REVIEW', [
        ['Reviewed On', formatDateDDMMYYYY(booking.rejection_date)],
      ])
    }

    // No per-page footer here — the status is already shown in the hero band,
    // and the address line added no value (it previously produced a redundant
    // status banner on every page and an address-only final page).
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
