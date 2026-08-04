import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cloudinary from '../cloudinary.js'
import Booking from '../models/Booking.js'
import Payment from '../models/Payment.js'
import Session from '../models/Session.js'
import { BOOKING_TERMS } from '../membershipForm.js'
import { requireAdmin } from '../middleware/auth.js'
import { generateBookingPdf } from '../services/pdfService.js'
import { nextSequence } from '../services/sequence.js'
import {
  sendBookingConfirmation,
  sendBookingApprovedEmail,
  sendBookingDeclinedEmail,
  sendAdminBookingNotification,
  sendAdminPaymentProofNotification,
} from '../services/emailService.js'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmpDir = path.join(__dirname, '..', 'tmp')

// Ensure tmp directory exists (same temp folder as membership/photo uploads)
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

// ── Multer — payment proof screenshot uploads ──────────────────────────
// Accepted: PDF, JPG, JPEG, PNG · max 10 MB per file
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, JPEG and PNG files are allowed'))
    }
  },
})

const uploadPaymentScreenshot = upload.single('payment_screenshot')

/** Classify a booking as Public or Private based on its session_id. */
function bookingTypeLabel(sessionId) {
  return String(sessionId || '').toLowerCase() === 'public' ? 'Public Session' : 'Private Session'
}

/** Append an event to the booking's audit history (bounded to the last 100). */
function logEvent(booking, entry) {
  const history = Array.isArray(booking.history) ? booking.history : []
  history.push({
    type: entry.type || '',
    description: entry.description || '',
    actor: entry.actor || '',
    details: entry.details || {},
    timestamp: new Date(),
  })
  booking.history = history.slice(-100)
}

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.booking_status ? { booking_status: req.query.booking_status } : {}
    const bookings = await Booking.find(filter).sort({ created_at: -1 })
    res.json(bookings)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { customer_name, customer_email } = req.body
    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'customer_name and customer_email are required' })
    }
    // Emergency contact is required for every session booking
    if (!req.body.emergency_contact_name || !req.body.emergency_contact_phone) {
      return res.status(400).json({ error: 'Emergency contact name and phone are required' })
    }

    // Every Terms & Conditions box must be ticked before booking
    const agreedTerms = Array.isArray(req.body.agreed_terms) ? req.body.agreed_terms : []
    const missingTerms = BOOKING_TERMS.filter((t) => !agreedTerms.includes(t))
    if (missingTerms.length > 0) {
      return res.status(400).json({ error: 'All Terms & Conditions must be accepted before you can continue to payment' })
    }

    // Auto-generate booking number: CCS-YYYY-XXXXX (sequential)
    // Never-repeating atomic counter — two bookings can never receive the
    // same number (even booked simultaneously, or after older bookings are
    // deleted). The sequence starts at 18 (the highest existing booking
    // number in production is 17, so 18 is the first safe unused number).
    const year = new Date().getFullYear()
    const seq = await nextSequence('booking', 18)
    const booking_number = `CCS-${year}-${String(seq).padStart(5, '0')}`

    const booking = await Booking.create({
      booking_number,
      customer_name,
      customer_email,
      customer_phone: req.body.customer_phone || '',
      emergency_contact_name: req.body.emergency_contact_name || '',
      emergency_contact_phone: req.body.emergency_contact_phone || '',
      agreed_terms: agreedTerms,
      session_id: req.body.session_id || '',
      date: req.body.date || '',
      participants: req.body.participants || 1,
      amount: req.body.amount || 0,
      booking_status: req.body.booking_status || 'pending_payment',
      payment_method: req.body.payment_method || '',
      payment_status: req.body.payment_status || 'pending',
    })

    // Audit trail: booking created
    logEvent(booking, {
      type: 'booking_created',
      description: 'Booking request created',
      details: { session: booking.session_id, date: booking.date },
    })
    await booking.save()

    // Emails fire after the booking is saved. Never block the response on failure.
    const sessionType = bookingTypeLabel(booking.session_id)
    sendBookingConfirmation({ booking, sessionType }).catch(() => {})
    sendAdminBookingNotification({ booking, sessionType }).catch(() => {})

    res.status(201).json(booking)
  } catch (err) { next(err) }
})

// ── Static sub-routes (MUST be before /:id) ────────────────────────

// GET /api/bookings/search?number=CCS-2026-00001 — admin-only exact search.
// Server-side lookup by booking number so the dashboard never loads the full
// collection just to find one record.
router.get('/search', requireAdmin, async (req, res, next) => {
  try {
    const code = String(req.query.number || '').trim().toUpperCase()
    if (!code) return res.json({ found: false })
    const booking = await Booking.findOne({ booking_number: code })
    if (!booking) return res.json({ found: false })
    res.json({ found: true, booking })
  } catch (err) { next(err) }
})

// GET /api/bookings/by-number/:bookingNumber — public: find booking by number
router.get('/by-number/:bookingNumber', async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ booking_number: req.params.bookingNumber })
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

// ── Parameterized routes ───────────────────────────────────────────

// GET /api/bookings/:id — public: single booking
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (err) { next(err) }
})

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const {
      customer_name, customer_email, customer_phone,
      session_id, date, participants, amount,
      booking_status, payment_method, payment_status,
      payer_bank, payer_name, payer_phone,
    } = req.body

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        customer_name, customer_email, customer_phone,
        emergency_contact_name: req.body.emergency_contact_name,
        emergency_contact_phone: req.body.emergency_contact_phone,
        session_id, date, participants, amount,
        booking_status, payment_method, payment_status,
        payer_bank, payer_name, payer_phone,
      },
      { new: true, runValidators: true }
    )
    if (!booking) return res.status(404).json({ error: 'Not found' })
    // Audit trail: booking updated by an admin
    logEvent(booking, {
      type: 'status_changed',
      description: 'Booking details updated',
      actor: req.user?.email || 'Admin',
    })
    await booking.save()
    res.json(booking)
  } catch (err) { next(err) }
})

router.patch('/:id/booking-status', requireAdmin, async (req, res, next) => {
  try {
    const { booking_status } = req.body
    if (!['pending_payment', 'pending_verification', 'confirmed', 'cancelled'].includes(booking_status)) {
      return res.status(400).json({
        error: 'booking_status must be pending_payment, pending_verification, confirmed, or cancelled',
      })
    }
    const existing = await Booking.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { booking_status },
      { new: true, runValidators: true }
    )
    // Audit trail: booking status changed by an admin
    logEvent(booking, {
      type: 'status_changed',
      description: `Booking status changed to ${booking_status.replace(/_/g, ' ')}`,
      actor: req.user?.email || 'Admin',
      details: { from: existing.booking_status, to: booking_status },
    })
    await booking.save()
    res.json(booking)
  } catch (err) { next(err) }
})

router.patch('/:id/payment-status', requireAdmin, async (req, res, next) => {
  try {
    const { payment_status } = req.body
    if (!['pending', 'verification_required', 'paid', 'failed', 'refunded'].includes(payment_status)) {
      return res.status(400).json({
        error: 'payment_status must be pending, verification_required, paid, failed, or refunded',
      })
    }
    const existing = await Booking.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { payment_status },
      { new: true, runValidators: true }
    )
    // Audit trail: payment status changed by an admin
    logEvent(booking, {
      type: 'status_changed',
      description: `Payment status changed to ${payment_status.replace(/_/g, ' ')}`,
      actor: req.user?.email || 'Admin',
      details: { from: existing.payment_status, to: payment_status },
    })
    await booking.save()
    res.json(booking)
  } catch (err) { next(err) }
})

/* ── POST /api/bookings/:id/create-payment — public · multipart ─────────
   Records the customer's payment method + payer details, uploads the
   payment-proof screenshot to Cloudinary, and moves the booking to
   pending_verification so the admin can review it in the dashboard.      */
router.post('/:id/create-payment', (req, res, next) => {
  uploadPaymentScreenshot(req, res, (err) => {
    if (err) {
      // Multer file limit error
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Payment screenshot must be 10 MB or smaller' })
      }
      // fileFilter rejection or anything else
      return res.status(400).json({ error: err.message || 'Upload failed' })
    }
    next()
  })
}, async (req, res, next) => {
  try {
    const { method, payer_name, payer_bank, payer_phone } = req.body
    if (!method) {
      if (req.file) fs.unlink(req.file.path, () => {})
      return res.status(400).json({ error: 'Payment method is required' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'A payment screenshot is required for verification' })
    }

    const booking = await Booking.findById(req.params.id)
    if (!booking) {
      fs.unlink(req.file.path, () => {})
      return res.status(404).json({ error: 'Booking not found' })
    }

    // ── Upload screenshot to Cloudinary (clean up the temp file either way) ──
    let screenshot = { url: '', name: '' }
    try {
      const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'climb-crux/bookings/payment',
        resource_type: resourceType,
      })
      screenshot = { url: result.secure_url, name: req.file.originalname }
    } catch (uploadErr) {
      console.error('[bookings] Screenshot upload failed:', uploadErr)
    } finally {
      fs.unlink(req.file.path, () => {})
    }

    if (!screenshot.url) {
      return res.status(500).json({ error: 'Payment screenshot could not be uploaded. Please try again.' })
    }

    // Create Payment record
    const payment = await Payment.create({
      booking_id: booking._id,
      method,
      status: 'verification_required',
      payer_name: payer_name || '',
      payer_bank: payer_bank || '',
      metadata: { payer_phone: payer_phone || '' },
    })

    // Update booking
    booking.payment_method = method
    booking.payment_status = 'verification_required'
    booking.booking_status = 'pending_verification'
    booking.payment_screenshot_url = screenshot.url
    booking.payment_screenshot_name = screenshot.name
    booking.payment_submitted_at = new Date().toISOString()
    if (payer_name) booking.payer_name = payer_name
    if (payer_bank) booking.payer_bank = payer_bank
    if (payer_phone) booking.payer_phone = payer_phone

    // Audit trail: payment proof submitted
    logEvent(booking, {
      type: 'payment_submitted',
      description: 'Payment screenshot submitted for verification',
      details: { method, screenshot: screenshot.name },
    })
    await booking.save()

    // Alert the admin that a payment proof is waiting for verification
    sendAdminPaymentProofNotification({ booking }).catch(() => {})

    res.json({
      booking,
      payment: {
        id: payment._id,
        method: payment.method,
        status: payment.status,
      },
    })
  } catch (err) { next(err) }
})

/* ── POST /api/bookings/:id/approve — admin ─────────────────────────────
   Verifies the payment: booking → confirmed, payment → paid, records who
   verified it and when, then emails the customer their confirmation.      */
router.post('/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    // Double-action guard: a booking can only be approved while it is awaiting
    // payment/verification. Confirmed or declined bookings need an explicit
    // status reset (via the status patch endpoint) before they can be
    // re-approved.
    if (['confirmed', 'cancelled'].includes(booking.booking_status)) {
      return res.status(409).json({
        error: `This booking is already ${booking.booking_status}. Reset its status before approving again.`,
      })
    }

    const adminEmail = req.user?.email || 'Admin'
    booking.booking_status = 'confirmed'
    booking.payment_status = 'paid'
    booking.verified_by = adminEmail
    booking.approval_date = new Date().toISOString().slice(0, 10)
    booking.rejected_by = ''
    booking.rejection_date = ''

    // Audit trail: approved (admin identity + timestamp)
    logEvent(booking, {
      type: 'booking_approved',
      description: 'Booking approved and payment verified',
      actor: adminEmail,
      details: { from: 'pending', to: 'confirmed' },
    })
    await booking.save()

    // Mark any outstanding Payment record(s) as paid
    await Payment.updateMany(
      { booking_id: booking._id, status: 'verification_required' },
      { status: 'paid', paid_at: new Date() }
    )

    const sessionType = bookingTypeLabel(booking.session_id)
    // Best-effort session time (from the sessions list) for the PDF
    let sessionTime = ''
    try {
      const s = booking.date ? await Session.findOne({ date: booking.date }) : null
      sessionTime = s?.time || ''
    } catch { /* ignore */ }
    // Generate the confirmed-booking PDF (best-effort — never blocks approval)
    let pdfBuffer = null
    try {
      pdfBuffer = await generateBookingPdf(booking, { status: 'confirmed', sessionType, time: sessionTime })
    } catch (pdfErr) {
      console.error('[bookings] Confirmation PDF failed:', pdfErr.message)
    }
    const emailSent = await sendBookingApprovedEmail({ booking, sessionType, pdfBuffer }).catch(() => false)
    res.json({
      booking,
      emailSent,
      note: emailSent
        ? undefined
        : 'Booking confirmed, but the confirmation email could not be sent. Check the server logs.',
    })
  } catch (err) { next(err) }
})

/* ── POST /api/bookings/:id/reject — admin ──────────────────────────────
   Declines the booking: booking → cancelled, payment → failed. The body may
   carry a `reason`: 'payment' (payment could not be verified) or
   'information' (personal information was incorrect/incomplete). The email
   variant follows the reason.                                              */
router.post('/:id/reject', requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    // Double-action guard: a booking can only be declined while it is awaiting
    // payment/verification. Confirmed or declined bookings need an explicit
    // status reset before they can be re-declined.
    if (['confirmed', 'cancelled'].includes(booking.booking_status)) {
      return res.status(409).json({
        error: `This booking is already ${booking.booking_status}. Reset its status before declining again.`,
      })
    }

    const reason = req.body?.reason === 'information' ? 'information' : 'payment'
    const adminEmail = req.user?.email || 'Admin'
    booking.booking_status = 'cancelled'
    booking.payment_status = 'failed'
    booking.rejected_by = adminEmail
    booking.rejection_date = new Date().toISOString().slice(0, 10)

    // Audit trail: declined (admin identity + timestamp)
    logEvent(booking, {
      type: 'booking_rejected',
      description: `Booking declined (${reason === 'information' ? 'incorrect personal information' : 'payment could not be verified'})`,
      actor: adminEmail,
      details: { from: 'pending', to: 'cancelled', reason },
    })
    await booking.save()

    // Mark any outstanding Payment record(s) as failed
    await Payment.updateMany(
      { booking_id: booking._id, status: { $in: ['verification_required', 'pending'] } },
      { status: 'failed' }
    )

    const sessionType = bookingTypeLabel(booking.session_id)
    // Best-effort session time (from the sessions list) for the PDF
    let sessionTime = ''
    try {
      const s = booking.date ? await Session.findOne({ date: booking.date }) : null
      sessionTime = s?.time || ''
    } catch { /* ignore */ }
    // Generate the booking-form PDF (best-effort — never blocks the decline)
    let pdfBuffer = null
    try {
      pdfBuffer = await generateBookingPdf(booking, { status: 'declined', sessionType, time: sessionTime })
    } catch (pdfErr) {
      console.error('[bookings] Decline PDF failed:', pdfErr.message)
    }
    const emailSent = await sendBookingDeclinedEmail({ booking, sessionType, reason, pdfBuffer }).catch(() => false)
    res.json({
      booking,
      emailSent,
      note: emailSent
        ? undefined
        : 'Booking declined, but the decline email could not be sent. Check the server logs.',
    })
  } catch (err) { next(err) }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Not found' })
    // Also delete any associated payment records
    await Payment.deleteMany({ booking_id: req.params.id })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
