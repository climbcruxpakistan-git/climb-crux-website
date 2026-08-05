import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import EmailLog from '../models/EmailLog.js'
import { requireAdminStrict } from '../middleware/auth.js'
import { sendManualEmail } from '../services/emailService.js'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmpDir = path.join(__dirname, '..', 'tmp')

// Ensure tmp directory exists (same temp folder as other uploads)
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

// ── Allowed attachment types: PDF, JPG, JPEG, PNG, DOCX ─────────────────
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per file
const MAX_FILES = 5

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`),
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    const mime = file.mimetype.toLowerCase()
    const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '')
    const allowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'docx']
    if (ALLOWED_TYPES[mime] || allowedExt.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, JPEG, PNG and DOCX files are allowed'))
    }
  },
})

const uploadAttachments = upload.array('attachments', MAX_FILES)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Clean up uploaded temp files whether the send succeeded or failed. */
function cleanupFiles(files) {
  ;(files || []).forEach((f) => fs.unlink(f.path, () => {}))
}

/* ── GET /api/emails — recent manually-sent emails (admin) ─────────────── */
router.get('/', async (_req, res, next) => {
  try {
    const logs = await EmailLog.find().sort({ created_at: -1 }).limit(50)
    res.json(logs)
  } catch (err) { next(err) }
})

/* ── POST /api/emails/send — admin · multipart form ──────────────────────
   Sends a manual email via Resend from the Climb Crux branded sender and
   records it in EmailLog. On failure the Resend error is returned so the
   admin can edit the form and resend.                                     */
router.post('/send', (req, res, next) => {
  uploadAttachments(req, res, (err) => {
    if (err) {
      // Multer file-limit error
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Each attachment must be 10 MB or smaller' })
      }
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'You can attach up to 5 files' })
      }
      // fileFilter rejection or anything else
      return res.status(400).json({ error: err.message || 'Attachment upload failed' })
    }
    next()
  })
}, async (req, res, next) => {
  const { to, subject, message } = req.body || {}
  const files = req.files || []

  try {
    // ── Validation ──
    if (!to || !String(to).trim()) {
      cleanupFiles(files)
      return res.status(400).json({ error: 'Recipient email is required' })
    }
    if (!EMAIL_RE.test(String(to).trim())) {
      cleanupFiles(files)
      return res.status(400).json({ error: 'Enter a valid recipient email address' })
    }
    if (!subject || !String(subject).trim()) {
      cleanupFiles(files)
      return res.status(400).json({ error: 'Subject is required' })
    }
    if (!message || !String(message).trim()) {
      cleanupFiles(files)
      return res.status(400).json({ error: 'Message body is required' })
    }

    // ── Build Resend attachments (read the temp files, then always clean up) ──
    const attachments = files.map((f) => ({
      filename: f.originalname,
      content: fs.readFileSync(f.path),
    }))
    const attachmentRefs = files.map((f) => ({
      name: f.originalname,
      type: f.mimetype,
      size: f.size,
    }))

    // Message body: escape HTML, then convert newlines to <br> for email display.
    const html = String(message)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\r?\n/g, '<br />')

    let result
    try {
      result = await sendManualEmail({
        to: String(to).trim(),
        subject: String(subject).trim(),
        html,
        attachments,
      })
    } catch (sendErr) {
      // Failure — log it and return the Resend error; do NOT clear the form.
      await EmailLog.create({
        recipient: String(to).trim(),
        subject: String(subject).trim(),
        message: String(message),
        attachments: attachmentRefs,
        delivery_status: 'failed',
        error: sendErr.message || 'Failed to send email',
        sent_by: req.user?.email || 'Admin',
      }).catch(() => {})
      cleanupFiles(files)
      return res.status(500).json({ error: sendErr.message || 'Failed to send email' })
    }

    // ── Success — record + respond ──
    await EmailLog.create({
      recipient: String(to).trim(),
      subject: String(subject).trim(),
      message: String(message),
      attachments: attachmentRefs,
      resend_message_id: result?.id || '',
      delivery_status: 'sent',
      sent_by: req.user?.email || 'Admin',
    }).catch((logErr) => console.error('[emails] Failed to log sent email:', logErr.message))
    cleanupFiles(files)

    res.json({ success: true, id: result?.id || null })
  } catch (err) {
    cleanupFiles(files)
    next(err)
  }
})

export default router
