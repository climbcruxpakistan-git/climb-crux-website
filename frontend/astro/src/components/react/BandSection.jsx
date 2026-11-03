/**
 * Shared "band" section used by the Sessions page ("What's included") and the
 * Private & Premium page ("What gets customized"): a contour-line backdrop, a
 * headline row (title left, short intro right) and a 4-across ruled text-
 * column row. Styling lives in src/styles/Band.css — section-scoped, so the
 * shared .info-grid / .info-card rules used by other pages stay untouched.
 *
 * `items` is an array of { h, p, extra? }; `extra` is optional JSX rendered
 * below the paragraph (the French grade scale / climber cap on Sessions).
 * The copy still comes from /api/session-content via the callers. Item headings
 * render as <h3 class="band-item-title"> — h2 → h3 with nothing skipped, and
 * their look is driven entirely by the class, never by the tag or the global
 * h1-h4 rules in index.css.
 */

const CONTOUR_PATHS = [
  'M0 60 C 240 120, 480 0, 720 60 S 1200 120, 1440 60',
  'M0 120 C 240 180, 480 60, 720 120 S 1200 180, 1440 120',
  'M0 180 C 240 240, 480 120, 720 180 S 1200 240, 1440 180',
  'M0 240 C 240 300, 480 180, 720 240 S 1200 300, 1440 240',
  'M0 300 C 240 360, 480 240, 720 300 S 1200 360, 1440 300',
]

/**
 * CMS titles arrive as one string ("Everything you need, nothing to bring").
 * Split at the first comma or full stop: the part before renders in charcoal,
 * the remainder drops to a second line in orange. A title with no comma or
 * full stop (or an empty remainder after the stop) stays charcoal throughout.
 */
export function splitBandTitle(title) {
  const s = String(title ?? '')
  const m = s.match(/^(.*?)(,|\.)([\s\S]+)$/)
  if (!m || !m[3].trim()) return { head: s, accent: null }
  return { head: m[1], accent: m[3].trim() }
}

export default function BandSection({ title, lede, items = [] }) {
  const { head, accent } = splitBandTitle(title)

  return (
    <section className="band">
      <svg
        className="band-contours"
        viewBox="0 0 1440 360"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {CONTOUR_PATHS.map((d) => (
          <path key={d} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <div className="wrap">
        <div className="band-head">
          <h2 className="band-title">
            {head}
            {accent && (
              <>
                <br />
                <span className="band-title-accent">{accent}</span>
              </>
            )}
          </h2>
          {lede && <p className="band-lede">{lede}</p>}
        </div>

        <div className="band-grid">
          {items.map((item, i) => (
            <div className="band-item" key={item.h || `item-${i}`}>
              <h3 className="band-item-title">{item.h}</h3>
              <p>{item.p}</p>
              {item.extra || null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
