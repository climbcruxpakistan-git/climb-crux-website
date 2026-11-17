import { useEffect, useRef, useState } from 'react'

/**
 * Shared one-card-at-a-time quote slider with peeking neighbours. Used by:
 *   - ReviewsSection.jsx — approved session reviews from the API (dates, the
 *     "Latest" tag on the newest review, and a More dialog for long reviews)
 *   - Testimonials.jsx — the three fixed climber testimonials (name + country,
 *     full quote always visible)
 *
 * items: [{ id, quote, name, date?, meta? }]
 *   date → shown bottom-left (review date)
 *   meta → shown after the name in parentheses (e.g. a country)
 *
 * Position model: every card carries data-pos relative to the active quote,
 * wrap-around style — 0 = active, -1 = previous, +1 = next, ±2+ = hidden.
 * data-dir (left/right) tells CSS which way an offscreen card leaves/enters.
 * All cards stack in one grid cell, so the slider is as tall as the tallest
 * card and never jumps while sliding.
 *
 * No DOM nodes are duplicated for looping — with exactly 2 items, the only
 * other quote has to peek on BOTH sides, so it is rendered a second time as an
 * aria-hidden twin (keyed by index so it re-mounts instead of sliding across
 * the front).
 *
 * With clamp set, quotes longer than the card end in a "More" button that
 * opens the full quote in a larger dialog (RvModal).
 */

/** The clamped quote text. Reports via state whether the CSS line-clamp is
    actually cutting content, so the "More" button only appears when needed. */
function RvText({ quote, onMore }) {
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
  }, [quote])

  return (
    <>
      <p className="rv-text" ref={ref}>
        <span className="rv-qm" aria-hidden="true">“</span>
        {quote}
        <span className="rv-qm" aria-hidden="true">”</span>
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

/** Full-quote dialog: same dark card look, larger, no text clamp. */
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
          {review.quote}
          <span className="rv-qm">”</span>
        </p>
        <div className="rv-footer">
          {review.date && <span className="rv-date">{review.date}</span>}
          <strong className="rv-name">{review.name}</strong>
        </div>
      </article>
    </div>
  )
}

export default function ReviewSlider({
  items,
  heading,
  lede,
  sectionClassName = 'rv-section',
  ariaLabel,
  clamp = false,
  showLatest = false,
  metaClassName,
}) {
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(null) // review shown in RvModal
  const touchStartX = useRef(null)

  const count = items.length

  // A shorter list (e.g. a different review type) can't keep the old index.
  useEffect(() => {
    setIndex((i) => (i < items.length ? i : 0))
  }, [items.length])

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

  if (count === 0) return null

  const go = (delta) => setIndex((i) => (i + delta + count) % count)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  /**
   * Position of item i relative to the active one, wrapped to the shortest
   * path around the loop: -1 (previous), 0 (active), +1 (next), ±2+ (hidden).
   * This is what fills the peeks at both ends of the list without clones.
   */
  const relativePos = (i) => {
    let d = (i - index) % count
    if (d > count / 2) d -= count
    if (d < -count / 2) d += count
    return d
  }

  const renderCard = (review, i, { key, pos }) => (
    <article
      key={key}
      className="rv-card"
      data-pos={pos}
      data-dir={pos < 0 ? 'left' : 'right'}
      aria-hidden={pos !== 0}
      onClick={pos !== 0 ? () => setIndex(i) : undefined}
    >
      {showLatest && i === 0 && <span className="rv-latest-tag">Latest</span>}

      {clamp ? (
        <RvText quote={review.quote} onMore={() => setExpanded(review)} />
      ) : (
        <p className="rv-text">
          <span className="rv-qm" aria-hidden="true">“</span>
          {review.quote}
          <span className="rv-qm" aria-hidden="true">”</span>
        </p>
      )}

      <div className="rv-footer">
        {review.date && <span className="rv-date">{review.date}</span>}
        <strong className="rv-name">
          {review.name}
          {review.meta && (
            <> <span className={metaClassName}>({review.meta})</span></>
          )}
        </strong>
      </div>
    </article>
  )

  return (
    <section className={sectionClassName} aria-label={ariaLabel}>
      <div className="wrap">
        {heading && <h2 className="rv-heading">{heading}</h2>}
        {lede && <p className="rv-lede">{lede}</p>}

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
              {items.map((r, i) =>
                renderCard(r, i, { key: r.id, pos: relativePos(i) })
              )}
              {count === 2 &&
                renderCard(items[(index + 1) % count], (index + 1) % count, {
                  key: `twin-${index}`,
                  pos: -relativePos((index + 1) % count),
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
            {items.map((r, i) => (
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
