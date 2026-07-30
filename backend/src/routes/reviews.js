import { Router } from 'express'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import ProductOrder from '../models/ProductOrder.js'

const router = Router({ mergeParams: true })

// GET /api/products/:productId/reviews — public
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 })
    const total = reviews.length
    const avgRating = total > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : 0
    const distribution = [0, 0, 0, 0, 0]
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++ })
    res.json({ reviews, total, avgRating, distribution })
  } catch (err) { next(err) }
})

// POST /api/products/:productId/reviews — public, submit a review
router.post('/', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const { customer_name, rating, title, comment, photos } = req.body
    if (!customer_name || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Name and rating (1-5) are required' })
    }

    const review = await Review.create({
      product: req.params.productId,
      customer_name,
      rating,
      title: title || '',
      comment: comment || '',
      photos: photos || [],
      verified_purchase: false,
    })
    res.status(201).json(review)
  } catch (err) { next(err) }
})

export default router
