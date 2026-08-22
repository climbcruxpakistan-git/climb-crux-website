import { useState, useEffect } from 'react'
import { getSessionReviews, submitSessionReview } from '../../lib/api'

/**
 * Reviews & Ratings section — shared by the Public Sessions page
 * (type="public") and the Private Sessions page (type="private").
 *
 * The two categories are fetched from separate backend endpoints, so an
 * approved Public review can never appear on the Private page and vice-versa.
 * The review type itself is decided server-side from the endpoint used —
 * the visitor never picks one.
 */

/** "2026-08-22T10:00:00Z" → "August 2026" */
function formatMonthYear(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Read-only star display (1–5). */
function Stars({ rating, size = 16 }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={`rv-star${rating >= i ? ' rv-star-full' : ''}`}
        style={{ fontSize: size }}
        aria-hidden="true"
      >
        ★
      </span>
    )
  }
  return (
    <span className="rv-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {stars}
    </span>
  )
}

/** Interactive 1–5 star picker. Submission is blocked until a value is set. */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="rv-picker" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Select a rating from 1 to 5 stars">
      <div className="rv-picker-stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            className={`rv-pick-star${shown >= i ? ' is-active' : ''}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
            aria-pressed={value === i}
          >
            ★
          </button>
        ))}
      </div>
      <span className={`rv-picker-hint${shown ? ' is-set' : ''}`} aria-live="polite">
        {shown ? `${shown} / 5` : 'Tap a star to rate *'}
      </span>
    </div>
  )
}

export default function ReviewsSection({ type = 'public' }) {
  const [data, setData] = useState({ reviews: [], total: 0, avgRating: 0 })
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getSessionReviews(type)
      .then((fresh) => {
        if (!active) return
        setData({
          reviews: fresh.reviews || [],
          total: fresh.total || 0,
          avgRating: fresh.avgRating || 0,
        })
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [type])

  async function handleSubmit(e) {
    e.preventDefault()
    // Frontend validation mirrors the server rules — the server re-validates.
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating (1–5)')
      return
    }
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await submitSessionReview(type, { rating, name: name.trim(), comment: comment.trim() })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Failed to submit your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reviews = data.reviews || []
  const total = data.total || 0

  return (
    <section className="section rv-section" id="reviews" aria-label="Reviews and ratings">
      <div className="wrap">
        <span className="eyebrow">Reviews &amp; Ratings</span>
        <h2>How was your climbing experience?</h2>

        {loading ? (
          <div className="btn-spinner" style={{ margin: '24px auto' }} aria-label="Loading reviews" />
        ) : total > 0 ? (
          <div className="rv-summary">
            <div className="rv-summary-score">{data.avgRating}</div>
            <div className="rv-summary-meta">
              <Stars rating={data.avgRating} size={22} />
              <p className="rv-summary-count">
                Based on {total} approved review{total > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="rv-empty">
            <h3>No reviews yet</h3>
            <p>Be the first to share your climbing experience.</p>
          </div>
        )}

        <div className="rv-form-card">
          <h3>Leave a review</h3>
          {submitted ? (
            <div className="rv-success" role="status">
              <span className="rv-success-icon" aria-hidden="true">✓</span>
              <div>
                <strong>Thank you for your review!</strong>
                <p>Your review has been submitted and is awaiting approval.</p>
              </div>
            </div>
          ) : (
            <form className="rv-form" onSubmit={handleSubmit} noValidate>
              <div className="rv-field">
                <label>Your Rating *</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div className="rv-field">
                <label htmlFor={`rv-name-${type}`}>Your Name *</label>
                <input id={`rv-name-${type}`} value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name" maxLength={80} required />
              </div>
              <div className="rv-field">
                <label htmlFor={`rv-comment-${type}`}>Your Review (optional)</label>
                <textarea id={`rv-comment-${type}`} rows={3} value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience…" maxLength={500} />
              </div>
              {error && <div className="form-error-banner" role="alert">{error}</div>}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {!loading && total > 0 && (
          <div className="rv-list">
            {reviews.map((r) => (
              <article key={r.id} className="rv-review-card">
                <Stars rating={r.rating} size={15} />
                <div className="rv-review-name">{r.name}</div>
                {r.comment && <p className="rv-review-comment">&ldquo;{r.comment}&rdquo;</p>}
                <div className="rv-review-date">{formatMonthYear(r.createdAt)}</div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}