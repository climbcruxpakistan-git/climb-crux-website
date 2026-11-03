import { useEffect, useRef, useState } from 'react'
import { getSessionReviews } from '../../lib/api.js'

/**
 * One-card-at-a-time review slider, shown on the sessions and
 * private/premium pages. Newest first (server sorts by reviewDate).
 */
export default function ReviewsSection({ type = 'public' }) {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready
  const [index, setIndex] = useState(0)
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

  /** Card's own date, shown as "Month YYYY". */
  const monthYearFor = (fetchedAt, createdAt) =>
    new Date(fetchedAt || createdAt || Date.now()).toLocaleDateString(
      'en-US',
      { month: 'long', year: 'numeric' }
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
            <div
              className="rv-track"
              style={{ transform: `translateX(-${index * 100}%)`, transition: 'transform 0.55s ease' }}
            >
              {reviews.map((r, i) => (
                <article className="rv-card" key={r.id}>
                  <div className="rv-quote" aria-hidden="true">“</div>
                  <p className="rv-text">{r.comment}</p>
                  {i === 0 && <span className="rv-latest-tag">Latest</span>}
                  <div className="rv-meta">
                    <strong className="rv-name">{r.name}</strong>
                    <span className="rv-date">{monthYearFor(r.reviewDate, r.createdAt)}</span>
                  </div>
                </article>
              ))}
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
    </section>
  )
}
