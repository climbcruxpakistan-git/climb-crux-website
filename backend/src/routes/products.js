import { Router } from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Product from '../models/Product.js'
import ProductOrder from '../models/ProductOrder.js'
import cloudinary from '../cloudinary.js'
import { requireAdmin, requireAdminStrict } from '../middleware/auth.js'
import { nextOrderReference } from '../services/sequence.js'
import { generateOrderPdf } from '../services/pdfService.js'
import {
  sendOrderPaymentReceivedEmail,
  sendOrderConfirmedEmail,
  sendOrderDeclinedEmail,
  sendAdminOrderPaymentProofNotification,
} from '../services/emailService.js'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmpDir = path.join(__dirname, '..', 'tmp')

// Ensure tmp directory exists (same temp folder as booking/photo uploads)
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

// ── Multer — payment proof screenshot uploads (equipment orders) ─────
// Spec: image uploads only (JPG, PNG, WebP, GIF) · max 10 MB per file.
const orderStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`),
})

const upload = multer({
  storage: orderStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP, GIF) are allowed'))
    }
  },
})

const uploadPaymentScreenshot = upload.single('payment_screenshot')

/** Append an event to the order's audit history (bounded to the last 100). */
function logOrderEvent(order, entry) {
  const history = Array.isArray(order.history) ? order.history : []
  history.push({
    type: entry.type || '',
    description: entry.description || '',
    actor: entry.actor || '',
    details: entry.details || {},
    timestamp: new Date(),
  })
  order.history = history.slice(-100)
}

/** True when the order is in a state that still allows payment review. */
function isReviewable(status) {
  return !['confirmed', 'declined', 'delivered', 'cancelled'].includes(status)
}

// ── Products (public read, admin write) ─────────────────────────────

// GET /api/products — public, sorted by sortOrder then name
router.get('/', async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ sortOrder: 1, name: 1 })
    res.json(products)
  } catch (err) { next(err) }
})

// ── Static routes (MUST be before /:id) ─────────────────────────────

// GET /api/products/orders — admin only: list all orders
router.get('/orders', requireAdminStrict, async (_req, res, next) => {
  try {
    const orders = await ProductOrder.find().sort({ created_at: -1 })
    res.json(orders)
  } catch (err) { next(err) }
})

// GET /api/products/orders/by-number/:orderNumber — public: find order by number
// (used by the customer payment page after checkout redirects to it).
router.get('/orders/by-number/:orderNumber', async (req, res, next) => {
  try {
    const order = await ProductOrder.findOne({ order_number: req.params.orderNumber })
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(order)
  } catch (err) { next(err) }
})

/* ── POST /api/products/order — public: place an order ────────────────
   Validates, generates the permanent Order ID (CCE-XXXXXX), saves the order
   as Payment Pending, and — per the spec — sends NO email at this stage.
   The customer is redirected to the payment page to upload their proof.   */
router.post('/order', async (req, res, next) => {
  try {
    const {
      product_id, product_name, product_price, quantity,
      customer_name, customer_email, customer_phone, customer_address,
      payment_method, payer_bank, payer_name, payer_phone,
    } = req.body
    if (!product_name || !customer_name) {
      return res.status(400).json({ error: 'Product name and customer name are required' })
    }
    const qty = Math.max(1, parseInt(quantity, 10) || 1)
    const total = (product_price || 0) * qty

    // Permanent, never-changing Order ID — random CCE-XXXXXX, uniqueness-checked.
    const order_number = await nextOrderReference()

    const order = await ProductOrder.create({
      order_number,
      product_id: product_id || null,
      product_name,
      product_price: product_price || 0,
      quantity: qty,
      total_amount: total,
      customer_name,
      customer_email: customer_email || '',
      customer_phone: customer_phone || '',
      customer_address: customer_address || '',
      status: 'pending_payment',
      payment_status: 'pending',
      payment_method: payment_method || '',
      payer_bank: payer_bank || '',
      payer_name: payer_name || '',
      payer_phone: payer_phone || '',
    })

    // Audit trail: order created
    logOrderEvent(order, {
      type: 'order_created',
      description: 'Equipment order placed',
      details: { product: order.product_name, quantity: order.quantity },
    })
    await order.save()

    // No email at this stage (per spec) — the FIRST customer email is sent
    // only after the payment screenshot is uploaded.

    res.status(201).json(order)
  } catch (err) { next(err) }
})

/* ── POST /api/products/orders/:id/payment-proof — public · multipart ─
   Uploads the payment screenshot to Cloudinary, moves the order to
   pending_verification, and sends the FIRST customer email (Payment
   Received – Under Verification) with the order PDF attached.            */
router.post('/orders/:id/payment-proof', (req, res, next) => {
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
    if (!req.file) {
      return res.status(400).json({ error: 'A payment screenshot is required for verification' })
    }

    const order = await ProductOrder.findById(req.params.id)
    if (!order) {
      fs.unlink(req.file.path, () => {})
      return res.status(404).json({ error: 'Order not found' })
    }
    // A screenshot can only be uploaded once, while the payment is pending.
    // This also prevents a duplicate upload overwriting the original proof
    // (and re-sending the Payment Received email) during verification.
    if (order.status !== 'pending_payment') {
      fs.unlink(req.file.path, () => {})
      return res.status(409).json({
        error: order.payment_screenshot_url
          ? 'A payment screenshot has already been submitted for this order'
          : `This order is already ${order.status.replace(/_/g, ' ')}. Its payment can no longer be changed.`,
      })
    }

    // ── Upload screenshot to Cloudinary (clean up the temp file either way) ──
    let screenshot = { url: '', name: '' }
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'climb-crux/orders/payment',
        resource_type: 'image',
      })
      screenshot = { url: result.secure_url, name: req.file.originalname }
    } catch (uploadErr) {
      console.error('[orders] Screenshot upload failed:', uploadErr)
    } finally {
      fs.unlink(req.file.path, () => {})
    }

    if (!screenshot.url) {
      return res.status(500).json({ error: 'Payment screenshot could not be uploaded. Please try again.' })
    }

    // Update order
    order.payment_screenshot_url = screenshot.url
    order.payment_screenshot_name = screenshot.name
    order.payment_submitted_at = new Date().toISOString()
    order.status = 'pending_verification'
    order.payment_status = 'verification_required'

    // Audit trail: payment proof submitted
    logOrderEvent(order, {
      type: 'payment_submitted',
      description: 'Payment screenshot submitted for verification',
      details: { method: order.payment_method, screenshot: screenshot.name },
    })
    await order.save()

    // FIRST customer email — Payment Received, with the order PDF (best-effort).
    let pdfBuffer = null
    try {
      pdfBuffer = await generateOrderPdf(order, { status: 'verification' })
    } catch (pdfErr) {
      console.error('[orders] Payment-received PDF failed:', pdfErr.message)
    }
    const emailSent = await sendOrderPaymentReceivedEmail({ order, pdfBuffer }).catch(() => false)
    // Alert the admin that a payment proof is waiting for verification
    sendAdminOrderPaymentProofNotification({ order }).catch(() => {})

    res.json({
      order,
      emailSent,
      note: emailSent
        ? undefined
        : 'Payment received, but the confirmation email could not be sent. Check the server logs.',
    })
  } catch (err) { next(err) }
})

/* ── POST /api/products/orders/:id/approve — admin ────────────────────
   Verifies the payment: order → confirmed, payment → paid, records who
   verified it and when, then emails the customer the confirmation.       */
router.post('/orders/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const order = await ProductOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (!isReviewable(order.status)) {
      return res.status(409).json({
        error: `This order is already ${order.status.replace(/_/g, ' ')}. Reset its status before approving again.`,
      })
    }

    const adminEmail = req.user?.email || 'Admin'
    order.status = 'confirmed'
    order.payment_status = 'paid'
    order.paid_at = new Date()
    order.verified_by = adminEmail
    order.approval_date = new Date().toISOString().slice(0, 10)
    order.rejected_by = ''
    order.rejection_date = ''
    order.decline_reason = ''

    // Audit trail: approved (admin identity + timestamp)
    logOrderEvent(order, {
      type: 'order_approved',
      description: 'Order confirmed and payment verified',
      actor: adminEmail,
      details: { from: 'pending', to: 'confirmed' },
    })
    await order.save()

    // Generate the confirmed-order PDF (best-effort — never blocks approval)
    let pdfBuffer = null
    try {
      pdfBuffer = await generateOrderPdf(order, { status: 'confirmed' })
    } catch (pdfErr) {
      console.error('[orders] Confirmation PDF failed:', pdfErr.message)
    }
    const emailSent = await sendOrderConfirmedEmail({ order, pdfBuffer }).catch(() => false)
    res.json({
      order,
      emailSent,
      note: emailSent
        ? undefined
        : 'Order confirmed, but the confirmation email could not be sent. Check the server logs.',
    })
  } catch (err) { next(err) }
})

/* ── POST /api/products/orders/:id/decline — admin ────────────────────
   Declines the order: order → declined, payment → failed. The body may
   carry a `reason` from the suggested list (payment_not_received,
   incorrect_amount, invalid_screenshot, other) or a free-text reason.
   The decline email includes the reason + the order PDF.                  */
router.post('/orders/:id/decline', requireAdmin, async (req, res, next) => {
  try {
    const order = await ProductOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (!isReviewable(order.status)) {
      return res.status(409).json({
        error: `This order is already ${order.status.replace(/_/g, ' ')}. Reset its status before declining again.`,
      })
    }

    const reason = String(req.body?.reason || 'payment_not_received').slice(0, 200)
    const adminEmail = req.user?.email || 'Admin'
    order.status = 'declined'
    order.payment_status = 'failed'
    order.rejected_by = adminEmail
    order.rejection_date = new Date().toISOString().slice(0, 10)
    order.decline_reason = reason

    // Audit trail: declined (admin identity + timestamp)
    logOrderEvent(order, {
      type: 'order_declined',
      description: 'Order declined after payment review',
      actor: adminEmail,
      details: { from: 'pending', to: 'declined', reason },
    })
    await order.save()

    // Generate the order PDF (best-effort — never blocks the decline)
    let pdfBuffer = null
    try {
      pdfBuffer = await generateOrderPdf(order, { status: 'declined' })
    } catch (pdfErr) {
      console.error('[orders] Decline PDF failed:', pdfErr.message)
    }
    const emailSent = await sendOrderDeclinedEmail({ order, reason, pdfBuffer }).catch(() => false)
    res.json({
      order,
      emailSent,
      note: emailSent
        ? undefined
        : 'Order declined, but the decline email could not be sent. Check the server logs.',
    })
  } catch (err) { next(err) }
})

// PATCH /api/products/orders/:id/status — admin: update order status
// (the manual fulfilment stages after confirmation: processing,
// ready_for_pickup, shipped, delivered — plus the review states).
router.patch('/orders/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    const valid = [
      'pending_payment', 'pending_verification', 'confirmed', 'declined',
      'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled',
    ]
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` })
    }
    const existing = await ProductOrder.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Order not found' })

    const update = { status }
    // Keep payment status in sync when an order is (re)confirmed or declined.
    if (status === 'confirmed') update.payment_status = 'paid'
    if (status === 'declined') update.payment_status = 'failed'

    const order = await ProductOrder.findByIdAndUpdate(req.params.id, update, { new: true })
    logOrderEvent(order, {
      type: 'status_changed',
      description: `Order status changed to ${status.replace(/_/g, ' ')}`,
      actor: req.user?.email || 'Admin',
      details: { from: existing.status, to: status },
    })
    await order.save()
    res.json(order)
  } catch (err) { next(err) }
})

// PATCH /api/products/orders/:id/payment — admin: update payment status
router.patch('/orders/:id/payment', requireAdmin, async (req, res, next) => {
  try {
    const { payment_status, payment_method, payer_bank, payer_name, payer_phone } = req.body
    const valid = ['pending', 'verification_required', 'paid', 'failed', 'refunded']
    if (!valid.includes(payment_status)) {
      return res.status(400).json({ error: `Invalid payment status. Must be one of: ${valid.join(', ')}` })
    }
    const update = { payment_status }
    if (payment_method !== undefined) update.payment_method = payment_method
    if (payer_bank !== undefined) update.payer_bank = payer_bank
    if (payer_name !== undefined) update.payer_name = payer_name
    if (payer_phone !== undefined) update.payer_phone = payer_phone
    if (payment_status === 'paid') update.paid_at = new Date()

    const order = await ProductOrder.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) { next(err) }
})

// DELETE /api/products/orders/:id — admin: delete an order
router.delete('/orders/:id', requireAdmin, async (req, res, next) => {
  try {
    const order = await ProductOrder.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── Parameterized routes (keep after static routes) ─────────────────

// GET /api/products/:id — public, single product (supports both MongoDB _id and slug)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    let product

    // Try finding by slug first (for SEO-friendly URLs)
    product = await Product.findOne({ slug: id })

    // Fall back to MongoDB _id lookup if slug didn't match
    if (!product && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id)
    }

    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) { next(err) }
})

// POST /api/products — admin create
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, price } = req.body
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' })
    }
    const product = await Product.create({
      name,
      price,
      slug: req.body.slug || '',
      sku: req.body.sku || '',
      category: req.body.category || 'Uncategorized',
      compareAtPrice: req.body.compareAtPrice || null,
      originalPrice: req.body.originalPrice || null,
      description: req.body.description || '',
      imageUrl: req.body.imageUrl || '',
      images: req.body.images || [],
      stockQuantity: req.body.stockQuantity ?? 0,
      lowStockThreshold: req.body.lowStockThreshold ?? 5,
      stockStatus: req.body.stockStatus || 'in_stock',
      inStock: req.body.inStock !== false,
      variants: req.body.variants || [],
      specifications: req.body.specifications || [],
      features: req.body.features || [],
      featureIcons: req.body.featureIcons || [],
      faqs: req.body.faqs || [],
      shipping: req.body.shipping || { deliveryTime: '', freeShipping: false },
      warranty: req.body.warranty || { period: '', details: '' },
      returns: req.body.returns || { window: '', policy: '' },
      seo: req.body.seo || { title: '', metaDescription: '', canonicalUrl: '' },
      status: req.body.status || 'published',
      featured: req.body.featured || false,
      sortOrder: req.body.sortOrder || 0,
    })
    res.status(201).json(product)
  } catch (err) { next(err) }
})

// PUT /api/products/:id — admin update
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const update = {}
    const fields = [
      'name', 'slug', 'sku', 'category',
      'price', 'compareAtPrice', 'originalPrice',
      'description',
      'imageUrl', 'images',
      'stockQuantity', 'lowStockThreshold', 'stockStatus', 'inStock',
      'variants', 'specifications', 'features', 'featureIcons', 'faqs',
      'shipping', 'warranty', 'returns',
      'seo',
      'status',
      'featured', 'sortOrder',
    ]
    for (const f of fields) {
      if (req.body[f] !== undefined) update[f] = req.body[f]
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!product) return res.status(404).json({ error: 'Not found' })
    res.json(product)
  } catch (err) { next(err) }
})

// DELETE /api/products/:id — admin delete
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
