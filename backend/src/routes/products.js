import { Router } from 'express'
import Product from '../models/Product.js'
import ProductOrder from '../models/ProductOrder.js'
import { requireAdmin, requireAdminStrict } from '../middleware/auth.js'

const router = Router()

// ── Products (public read, admin write) ─────────────────────────────

// GET /api/products — public, sorted by sortOrder then name
router.get('/', async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ sortOrder: 1, name: 1 })
    res.json(products)
  } catch (err) { next(err) }
})

// GET /api/products/featured — public, only featured products
router.get('/featured', async (_req, res, next) => {
  try {
    const products = await Product.find({ featured: true, inStock: true }).sort({ sortOrder: 1 })
    res.json(products)
  } catch (err) { next(err) }
})

// GET /api/products/:id — public, single product
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
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
      brand: req.body.brand || '',
      category: req.body.category || 'Uncategorized',
      originalPrice: req.body.originalPrice || null,
      imageUrl: req.body.imageUrl || '',
      images: req.body.images || [],
      description: req.body.description || '',
      features: req.body.features || [],
      inStock: req.body.inStock !== false,
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
    const fields = ['name', 'brand', 'price', 'category', 'originalPrice', 'imageUrl', 'images', 'description', 'features', 'inStock', 'featured', 'sortOrder']
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

// ── Orders ──────────────────────────────────────────────────────────

// POST /api/products/order — public: place an order
router.post('/order', async (req, res, next) => {
  try {
    const { product_id, product_name, product_price, quantity, customer_name, customer_email, customer_phone, customer_address, payment_method, payer_bank, payer_name, payer_phone } = req.body
    if (!product_name || !customer_name) {
      return res.status(400).json({ error: 'Product name and customer name are required' })
    }
    const qty = Math.max(1, parseInt(quantity, 10) || 1)
    const total = (product_price || 0) * qty

    const order = await ProductOrder.create({
      order_number: `ORD-${Date.now().toString(36).toUpperCase()}`,
      product_id: product_id || null,
      product_name,
      product_price: product_price || 0,
      quantity: qty,
      total_amount: total,
      customer_name,
      customer_email: customer_email || '',
      customer_phone: customer_phone || '',
      customer_address: customer_address || '',
      payment_method: payment_method || '',
      payer_bank: payer_bank || '',
      payer_name: payer_name || '',
      payer_phone: payer_phone || '',
    })
    res.status(201).json(order)
  } catch (err) { next(err) }
})

// GET /api/products/orders — admin only: list all orders
router.get('/orders', requireAdminStrict, async (_req, res, next) => {
  try {
    const orders = await ProductOrder.find().sort({ created_at: -1 })
    res.json(orders)
  } catch (err) { next(err) }
})

// PATCH /api/products/orders/:id/status — admin: update order status
router.patch('/orders/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    const valid = ['pending_payment', 'pending_verification', 'confirmed', 'shipped', 'cancelled']
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` })
    }
    const order = await ProductOrder.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!order) return res.status(404).json({ error: 'Order not found' })
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

export default router
