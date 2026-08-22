import mongoose from 'mongoose'

/**
 * Session reviews — Public & Private.
 *
 * Review separation is a hard rule: PUBLIC and PRIVATE reviews are stored and
 * fetched completely separately. The `reviewType` value is ALWAYS set by the
 * server (based on the endpoint used), never accepted from the client.
 *
 * Submissions start as PENDING and only APPROVED reviews are ever returned by
 * the public-facing endpoints.
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
      required: true,
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
  },
  { timestamps: true }
)

// Common lookup: one type's approved reviews, newest first (drives the
// public pages and the average-rating calculation).
sessionReviewSchema.index({ reviewType: 1, status: 1, createdAt: -1 })

export default mongoose.model('SessionReview', sessionReviewSchema)