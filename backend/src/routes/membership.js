import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cloudinary from '../cloudinary.js'
import MembershipApplication from '../models/MembershipApplication.js'
import { requireAdmin } from '../middleware/auth.js'
import { sendMembershipConfirmation, sendAdminMembershipNotification } from '../email.js'
import { MEMBERSHIP_TERMS } from '../membershipForm.js'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmpDir = path.join(__dirname, '..', 'tmp')

// Ensure tmp directory exists (same temp folder as photo uploads)
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

// ── Multer — application document uploads ────────────────────────────────
// Accepted: PDF, JPG, JPEG, PNG · max 5 MB per file
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, JPEG and PNG files are allowed'))
    }
  },
})

const uploadFields = upload.fields([
  { name: 'cnic_file', maxCount: 1 },
  { name: 'bform_file', maxCount: 1 },
  { name: 'guardian_cnic_file', maxCount: 1 },
  { name: 'payment_screenshot', maxCount: 1 },
])

/** Parse a list field sent via multipart (always arrives as a JSON string). */
function parseList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* fall through to comma split */
    }
    return value.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function isUnder18(dateOfBirth) {
  if (!dateOfBirth) return false
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return false
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1
  return age < 18
}

async function uploadFile(file, folder) {
  const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw'
  const result = await cloudinary.uploader.upload(file.path, { folder, resource_type: resourceType })
  return result
}

// Clean up temp files after Cloudinary upload (or on failure)
function cleanupFiles(fileMap) {
  Object.values(fileMap || {}).forEach((arr) => {
    ;(arr || []).forEach((f) => fs.unlink(f.path, () => {}))
  })
}

// Fail a request and clean up any temp files multer already wrote to disk
function fail(res, files, message, status = 400) {
  cleanupFiles(files)
  return res.status(status).json({ error: message })
}

/* ── POST /api/membership/apply — public · multipart form ─────────────────
   Validates, uploads documents, stores the application, generates the
   application ID, and sends confirmation + admin notification emails.   */
router.post('/apply', (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      // Multer file limit error
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Each file must be 5 MB or smaller' })
      }
      // fileFilter rejection or anything else
      return res.status(400).json({ error: err.message || 'Upload failed' })
    }
    next()
  })
}, async (req, res, next) => {
  const b = req.body || {}
  const files = req.files || {}
  const under18 = isUnder18(b.date_of_birth)

  // Multer turns repeated fields into arrays, so a client that accidentally
  // sends a boolean field twice arrives as ['true','true']. Take the last
  // value so the checks below behave the same either way.
  const signatureConfirmed = Array.isArray(b.signature_confirmed)
    ? b.signature_confirmed[b.signature_confirmed.length - 1]
    : b.signature_confirmed
  const declarationAccepted = Array.isArray(b.declaration_accepted)
    ? b.declaration_accepted[b.declaration_accepted.length - 1]
    : b.declaration_accepted

  try {
    // ── Validation (fail() cleans up temp files on rejection) ──
    if (!b.full_name || !String(b.full_name).trim()) {
      return fail(res, files, 'Full name is required')
    }
    if (!b.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) {
      return fail(res, files, 'A valid email address is required')
    }
    if (!b.date_of_birth) {
      return fail(res, files, 'Date of birth is required')
    }
    if (!files.cnic_file || files.cnic_file.length === 0) {
      return fail(res, files, 'A copy of the participant CNIC is required')
    }
    if (under18) {
      if (!files.bform_file || files.bform_file.length === 0) {
        return fail(res, files, 'A copy of the B-Form is required for participants under 18')
      }
      if (!files.guardian_cnic_file || files.guardian_cnic_file.length === 0) {
        return fail(res, files, 'A copy of the parent/guardian CNIC is required for participants under 18')
      }
    }
    if (b.payment_method && !files.payment_screenshot) {
      return fail(res, files, 'A payment screenshot is required when a payment method is selected')
    }

    // Terms — every box must be ticked (exact wording from the form)
    const agreedTerms = parseList(b.agreed_terms)
    const missingTerms = MEMBERSHIP_TERMS.filter((t) => !agreedTerms.includes(t))
    if (missingTerms.length > 0) {
      return fail(res, files, 'All membership terms and conditions must be accepted')
    }

    if (!b.signature_name || !String(b.signature_name).trim()) {
      return fail(res, files, 'A digital signature (typed full name) is required')
    }
    if (signatureConfirmed !== 'true' && signatureConfirmed !== true) {
      return fail(res, files, 'Tick the box to confirm your typed name is your electronic signature')
    }
    if (declarationAccepted !== 'true' && declarationAccepted !== true) {
      return fail(res, files, 'You must accept the member declaration')
    }

    // ── Upload documents to Cloudinary ──
    const uploaded = {}
    try {
      for (const [field, folder] of [
        ['cnic_file', 'climb-crux/membership/cnic'],
        ['bform_file', 'climb-crux/membership/bform'],
        ['guardian_cnic_file', 'climb-crux/membership/guardian'],
        ['payment_screenshot', 'climb-crux/membership/payment'],
      ]) {
        const arr = files[field]
        if (arr && arr.length > 0) {
          const result = await uploadFile(arr[0], folder)
          uploaded[field] = { url: result.secure_url, name: arr[0].originalname }
        }
      }
    } catch (uploadErr) {
      cleanupFiles(files)
      throw uploadErr
    }

    // ── Generate application ID (sequential): CCM-YYYY-XXXXX ──
    const year = new Date().getFullYear()
    const count = await MembershipApplication.countDocuments()
    const application_id = `CCM-${year}-${String(count + 1).padStart(5, '0')}`

    const application = await MembershipApplication.create({
      application_id,
      membership_start_date: b.membership_start_date || '',
      full_name: String(b.full_name).trim(),
      date_of_birth: b.date_of_birth || '',
      gender: b.gender || '',
      cnic: b.cnic || '',
      phone: b.phone || '',
      email: String(b.email).trim(),
      city: b.city || '',
      emergency_contact_name: b.emergency_contact_name || '',
      emergency_contact_relationship: b.emergency_contact_relationship || '',
      emergency_contact_phone: b.emergency_contact_phone || '',
      climbing_experience: b.climbing_experience || '',
      climbed_outdoors_before: b.climbed_outdoors_before || '',
      medical_conditions: b.medical_conditions || '',
      preferred_days: parseList(b.preferred_days),
      payment_method: b.payment_method || '',
      member_account_name: b.member_account_name || '',
      cnic_file_url: uploaded.cnic_file?.url || '',
      cnic_file_name: uploaded.cnic_file?.name || '',
      bform_file_url: uploaded.bform_file?.url || '',
      bform_file_name: uploaded.bform_file?.name || '',
      guardian_cnic_file_url: uploaded.guardian_cnic_file?.url || '',
      guardian_cnic_file_name: uploaded.guardian_cnic_file?.name || '',
      payment_screenshot_url: uploaded.payment_screenshot?.url || '',
      payment_screenshot_name: uploaded.payment_screenshot?.name || '',
      agreed_terms: agreedTerms,
      declaration_accepted: declarationAccepted === 'true' || declarationAccepted === true,
      signature_name: String(b.signature_name).trim(),
      signature_confirmed: signatureConfirmed === 'true' || signatureConfirmed === true,
      signature_date: b.signature_date || new Date().toISOString().slice(0, 10),
      status: 'pending_review',
      payment_status: 'pending',
      membership_status: 'pending',
    })

    cleanupFiles(files)

    // ── Emails (never block the response) ──
    sendMembershipConfirmation({ to: application.email, application }).catch(() => {})
    sendAdminMembershipNotification({ application }).catch(() => {})

    res.status(201).json(application)
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/membership/form — public · downloads the printable form PDF ── */
router.get('/form', (_req, res) => {
  const pdfPath = path.join(__dirname, '..', '..', 'public', 'membership-form.pdf')
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'Membership form is not available right now' })
  }
  res.download(pdfPath, 'Climb-Crux-Membership-Form.pdf')
})

/* ── Admin endpoints ───────────────────────────────────────────────────── */

// GET /api/membership/applications — list all applications
router.get('/applications', requireAdmin, async (req, res, next) => {
  try {
    const applications = await MembershipApplication.find().sort({ created_at: -1 })
    res.json(applications)
  } catch (err) { next(err) }
})

// PATCH /api/membership/applications/:id — update review / office fields
router.patch('/applications/:id', requireAdmin, async (req, res, next) => {
  try {
    const existing = await MembershipApplication.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Application not found' })

    const allowed = [
      'status', 'payment_status', 'membership_status',
      'membership_id', 'verified_by', 'remarks', 'office_start_date', 'office_expiry_date',
    ]
    for (const key of allowed) {
      if (req.body[key] !== undefined) existing[key] = req.body[key]
    }
    await existing.save()
    res.json(existing)
  } catch (err) { next(err) }
})

// DELETE /api/membership/applications/:id
router.delete('/applications/:id', requireAdmin, async (req, res, next) => {
  try {
    const app = await MembershipApplication.findByIdAndDelete(req.params.id)
    if (!app) return res.status(404).json({ error: 'Application not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
