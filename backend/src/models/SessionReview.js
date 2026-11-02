import mongoose from 'mongoose'

/**
 * Session reviews — Public & Private.
 *
 * Review separation is a hard rule: PUBLIC and PRIVATE reviews are stored and
 * fetched completely separately. The `reviewType` value is ALWAYS set by the
 * server (based on the endpoint used or the admin form), never accepted from
 * the client.
 *
 * Submissions through public endpoints start as PENDING and only APPROVED
 * reviews are ever returned by the public-facing endpoints. Admin-created/
 * edited reviews (POST /api/session-reviews, PATCH /:id) are APPROVED directly.
 *
 * `rating` is optional (kept 1-5 when present, e.g. legacy documents). The
 * public display shows name, review text and date only — no stars.
 */
const sessionReviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    /** Display date (admin can set it manually; defaults to now). */
    reviewDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Common lookup: one type's approved reviews, newest by reviewDate first
// (drives the public slider). Old documents without reviewDate fall back to
// createdAt in the query layer.
sessionReviewSchema.index({ reviewType: 1, status: 1, reviewDate: -1 })

export default mongoose.model('SessionReview', sessionReviewSchema)