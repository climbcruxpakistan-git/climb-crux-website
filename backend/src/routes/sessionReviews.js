import { Router } from 'express'
import SessionReview from '../models/SessionReview.js'
import { requireAdmin, requireAdminStrict } from '../middleware/auth.js'
import { reviewLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// The two public review channels. REVIEW SEPARATION IS ENFORCED HERE: the
// review type is derived from the URL path on the server. A client-supplied
// "type"/"reviewType" field is never read, so a Public form can never create
// a Private review (or vice-versa).

const TYPES = { public: 'PUBLIC', private: 'PRIVATE' }

/* ── Sanitization / validation helpers ────────────────────────────────── */

/** Strip control characters and trim. Keeps unicode letters intact. */
function safeText(value, max) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max)
}

function validateSubmission(body) {
  const name = safeText(body.name, 80)
  if (!name) return { error: 'Please enter your name' }

  const rating = Number(body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be a whole number from 1 to 5' }
  }

  const comment = safeText(body.comment, 500)
  return { values: { name, rating, comment } }
}

/**
 * Public list for one category — returns ONLY APPROVED reviews of that type.
 * PENDING / REJECTED reviews are never exposed through these endpoints.
 */
async function listApproved(type, res, next) {
  try {
    const reviews = await SessionReview.find({ reviewType: type, status: 'APPROVED' })
      .sort({ createdAt: -1 })

    const total = reviews.length
    const avgRating = total > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : 0
    const distribution = [0, 0, 0, 0, 0]
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1] += 1
    })

    res.json({
      reviews: reviews.map((r) => ({
        id: r._id,
        name: r.name,
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.createdAt,
      })),
      total,
      avgRating,
      distribution,
    })
  } catch (err) { next(err) }
}

/* ── Public: create a review (type determined by the URL, server-side) ── */

router.post('/public', reviewLimiter, async (req, res, next) => {
  try {
    const { values, error } = validateSubmission(req.body || {})
    if (error) return res.status(400).json({ error })

    const review = await SessionReview.create({
      reviewType: 'PUBLIC',
      name: values.name,
      rating: values.rating,
      comment: values.comment,
      status: 'PENDING',
      approvedAt: null,
    })
    res.status(201).json({ id: review._id, status: review.status })
  } catch (err) { next(err) }
})

router.post('/private', reviewLimiter, async (req, res, next) => {
  try {
    const { values, error } = validateSubmission(req.body || {})
    if (error) return res.status(400).json({ error })

    const review = await SessionReview.create({
      reviewType: 'PRIVATE',
      name: values.name,
      rating: values.rating,
      comment: values.comment,
      status: 'PENDING',
      approvedAt: null,
    })
    res.status(201).json({ id: review._id, status: review.status })
  } catch (err) { next(err) }
})

/* ── Public: approved reviews per category ─────────────────────────────── */

router.get('/public', async (req, res, next) => listApproved('PUBLIC', res, next))
router.get('/private', async (req, res, next) => listApproved('PRIVATE', res, next))

/* ── Admin: everything (strict auth — this list includes pending/rejected) ── */

router.get('/all', requireAdminStrict, async (req, res, next) => {
  try {
    const filter = {}
    const type = String(req.query.type || '').toUpperCase()
    const status = String(req.query.status || '').toUpperCase()
    if (Object.values(TYPES).includes(type)) filter.reviewType = type
    if (['PENDING', 'APPROVED', 'REJECTED'].includes(status)) filter.status = status

    const reviews = await SessionReview.find(filter).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) { next(err) }
})

/* ── Admin actions ─────────────────────────────────────────────────────── */

router.post('/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const review = await SessionReview.findById(req.params.id)
    if (!review) return res.status(404).json({ error: 'Review not found' })
    review.status = 'APPROVED'
    review.approvedAt = new Date()
    await review.save()
    res.json(review)
  } catch (err) { next(err) }
})

router.post('/:id/reject', requireAdmin, async (req, res, next) => {
  try {
    const review = await SessionReview.findById(req.params.id)
    if (!review) return res.status(404).json({ error: 'Review not found' })
    review.status = 'REJECTED'
    review.approvedAt = null
    await review.save()
    res.json(review)
  } catch (err) { next(err) }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const review = await SessionReview.findByIdAndDelete(req.params.id)
    if (!review) return res.status(404).json({ error: 'Review not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router