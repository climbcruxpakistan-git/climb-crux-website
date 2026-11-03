import { useEffect, useRef, useState } from 'react'
import { getSessionReviews } from '../../lib/api.js'

/**
 * One-card-at-a-time review slider with peeking neighbours, shown on the
 * sessions and private/premium pages. Newest first (server sorts by
 * reviewDate).
 *
 * Position model: every card carries data-pos relative to the active review,
 * wrap-around style — 0 = active, -1 = previous, +1 = next, ±2+ = hidden.
 * data-dir (left/right) tells CSS which way an offscreen card leaves/enters.
 * All cards stack in one grid cell, so the slider is as tall as the tallest
 * card and never jumps while sliding.
 *
 * No DOM nodes are duplicated for looping — with exactly 2 reviews, the only
 * other review has to peek on BOTH sides, so it is rendered a second time as
 * an aria-hidden twin (keyed by index so it re-mounts instead of sliding
 * across the front).
 *
 * Reviews longer than the card clamp end in a "More" button that opens the
 * full review in a larger dialog (RvModal).
 */

/** ISO reviewDate → "10 Jan 2026" (the date the review was sent). */
function formatDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** The clamped review text. Reports via state whether the CSS line-clamp is
    actually cutting content, so the "More" button only appears when needed. */
function RvText({ comment, onMore }) {
  const ref = useRef(null)
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    check()
    // Late-loading fonts / resizes change wrapping — recheck.
    document.fonts?.ready?.then(check).catch(() => {})
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [comment])

  return (
    <>
      <p className="rv-text" ref={ref}>
        <span className="rv-qm">“</span>
        {comment}
        <span className="rv-qm">”</span>
      </p>
      {clamped && (
        <button
          type="button"
          className="rv-more"
          onClick={(e) => {
            e.stopPropagation() // peek cards advance on card click; this shouldn't
            onMore()
          }}
        >
          More…
        </button>
      )}
    </>
  )
}

/** Full-review dialog: same dark card look, larger, no text clamp. */
function RvModal({ review, onClose }) {
  return (
    <div className="rv-modal-backdrop" onClick={onClose}>
      <article
        className="rv-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Review by ${review.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="rv-modal-close" onClick={onClose} aria-label="Close review">
          ✕
        </button>
        <p className="rv-modal-text">
          <span className="rv-qm">“</span>
          {review.comment}
          <span className="rv-qm">”</span>
        </p>
        <div className="rv-footer">
          <span className="rv-date">{formatDate(review.reviewDate)}</span>
          <strong className="rv-name">{review.name}</strong>
        </div>
      </article>
    </div>
  )
}

export default function ReviewsSection({ type = 'public' }) {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(null) // review shown in RvModal
  const touchStartX = useRef(null)

  useEffect(() => {
    let alive = true
    getSessionReviews(type)
      .then((data) => {
        if (!alive) return
        setReviews(data.reviews || [])
        setStatus('ready')
      })
      .catch(() => {
        if (!alive) return
        setReviews([])
        setStatus('ready')
      })
    return () => { alive = false }
  }, [type])

  // Modal side-effects: Escape closes, page scroll locks while open.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(null) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [expanded])

  // No approved reviews yet (or still loading) — hide the section.
  if (status !== 'ready' || reviews.length === 0) return null

  const count = reviews.length

  const go = (delta) => setIndex((i) => (i + delta + count) % count)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  /**
   * Position of review i relative to the active one, wrapped to the shortest
   * path around the loop: -1 (previous), 0 (active), +1 (next), ±2+ (hidden).
   * This is what fills the peeks at both ends of the list without clones.
   */
  const relativePos = (i) => {
    let d = (i - index) % count
    if (d > count / 2) d -= count
    if (d < -count / 2) d += count
    return d
  }

  const renderCard = (r, { key, pos, isLatest }) => (
    <article
      key={key}
      className="rv-card"
      data-pos={pos}
      data-dir={pos < 0 ? 'left' : 'right'}
      aria-hidden={pos !== 0}
      onClick={pos !== 0 ? () => setIndex(reviews.indexOf(r)) : undefined}
    >
      {isLatest && <span className="rv-latest-tag">Latest</span>}

      <RvText comment={r.comment} onMore={() => setExpanded(r)} />

      <div className="rv-footer">
        <span className="rv-date">{formatDate(r.reviewDate)}</span>
        <strong className="rv-name">{r.name}</strong>
      </div>
    </article>
  )

  return (
    <section className="rv-section">
      <div className="wrap">
        <h2 className="rv-heading">What climbers say</h2>

        <div className="rv-slider" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {count > 1 && (
            <button
              className="rv-arrow rv-prev"
              onClick={() => go(-1)}
              aria-label="Previous review"
            >
              ‹
            </button>
          )}

          <div className="rv-window">
            <div className="rv-cards">
              {reviews.map((r, i) =>
                renderCard(r, { key: r.id, pos: relativePos(i), isLatest: i === 0 })
              )}
              {count === 2 &&
                renderCard(reviews[(index + 1) % count], {
                  key: `twin-${index}`,
                  pos: -relativePos((index + 1) % count),
                  isLatest: (index + 1) % count === 0,
                })}
            </div>
          </div>

          {count > 1 && (
            <button
              className="rv-arrow rv-next"
              onClick={() => go(1)}
              aria-label="Next review"
            >
              ›
            </button>
          )}
        </div>

        {count > 1 && (
          <div className="rv-dots" role="tablist">
            {reviews.map((r, i) => (
              <button
                key={r.id}
                className={`rv-dot ${i === index ? 'rv-dot-active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to review ${i + 1} of ${count}`}
              />
            ))}
          </div>
        )}
      </div>

      {expanded && <RvModal review={expanded} onClose={() => setExpanded(null)} />}
    </section>
  )
}
