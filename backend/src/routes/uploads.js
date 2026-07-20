import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Photo from '../models/Photo.js'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmpDir = path.join(__dirname, '..', 'tmp')

// Ensure tmp directory exists
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer disk storage to temp folder
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only jpg, png, gif, webp, and avif files are allowed'))
    }
  },
})

// POST /api/uploads — upload up to 20 images
router.post('/', upload.array('photos', 20), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const results = []

    for (const file of req.files) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'climb-crux',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })

        // Parse tags — sent as comma-separated from the form
        const tags = req.body.tags
          ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : []

        // Save to MongoDB
        const photo = await Photo.create({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          title: req.body.title || '',
          tags,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })

        results.push(photo)
      } finally {
        // Clean up temp file
        fs.unlink(file.path, () => {})
      }
    }

    res.status(201).json(results)
  } catch (err) {
    next(err)
  }
})

// GET /api/uploads — list all uploaded photos
router.get('/', async (_req, res, next) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 })
    res.json(photos)
  } catch (err) {
    next(err)
  }
})

// PUT /api/uploads/:id — update photo metadata (title, tags)
router.put('/:id', async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id)
    if (!photo) return res.status(404).json({ error: 'Not found' })

    if (req.body.title !== undefined) photo.title = req.body.title
    if (req.body.tags !== undefined) {
      photo.tags = Array.isArray(req.body.tags)
        ? req.body.tags.filter(Boolean)
        : req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
    }

    await photo.save()
    res.json(photo)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/uploads/:id — delete a photo from Cloudinary and DB
router.delete('/:id', async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id)
    if (!photo) return res.status(404).json({ error: 'Not found' })

    await cloudinary.uploader.destroy(photo.publicId)
    await Photo.findByIdAndDelete(req.params.id)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
