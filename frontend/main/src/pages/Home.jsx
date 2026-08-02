import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
import CliffEdge from '../components/CliffEdge.jsx'
import GradeBadge from '../components/GradeBadge.jsx'
import PlaceholderPhoto from '../components/PlaceholderPhoto.jsx'
import { getHomeContent, getUploads } from '../api.js'

// Split the hero title into two balanced lines so the break always looks intentional,
// no matter what title text comes back from the CMS.
function splitTitleForLines(title) {
  const words = String(title || '').trim().split(/\s+/).filter(Boolean)
  const total = words.join(' ').length
  // Keep short titles on one line so small headings aren't force-broken awkwardly
  if (words.length < 3 || total < 22) return [words.join(' ') || title]
  const half = total / 2
  let best = 1
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const line1Length = words.slice(0, i).join(' ').length
    const diff = Math.abs(line1Length - half)
    // Prefer the later split on ties so the closing phrase (e.g. "in Islamabad") stays short
    if (diff <= bestDiff) {
      bestDiff = diff
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

export default function Home() {
  const [content, setContent] = useState(null)
  const [uploadPhotos, setUploadPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getHomeContent(),
      getUploads().catch(() => []),
    ])
      .then(([homeContent, uploads]) => {
        setContent(homeContent)
        setUploadPhotos(uploads)
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  // Use content from API, fallback to hardcoded defaults
  const heroTitle = content?.heroTitle || 'Discover the Thrill of Rock Climbing'
  const heroLede = content?.heroLede || "Climb Crux is Islamabad's premier rock climbing club, offering professionally guided rock climbing sessions, expert coaching, monthly memberships and a supportive community for beginners and experienced climbers."
  const heroPhotoUrl = content?.heroPhotoUrl || ''
  const paths = content?.paths || [
    { grade: '4 – 6a', label: 'Beginner Friendly', title: 'Public Sessions', copy: 'Drop into a guided group session on Margalla Hills every other week. No experience or gear needed — just a willingness to get chalky hands.', to: '/sessions', cta: 'See schedule & pricing' },
    { grade: 'Up to 7c+', label: 'Custom & Premium', title: 'Private & Premium', copy: 'Book a private slot for your group or go one-on-one with an instructor. Premium plans open the door to the hardest routes we run.', to: '/private-premium', cta: 'Explore plans' },
  ]
  const teasers = content?.teasers || [
    { tag: 'Public Session · 4+' },
    { tag: 'Private Coaching · 1-on-1' },
    { tag: 'Premium Ascent · 7c+' },
  ]
  const pathsEyebrow = content?.pathsEyebrow || 'Two ways to climb with us'
  const pathsTitle = content?.pathsTitle || 'Pick your route'
  const teasersEyebrow = content?.teasersEyebrow || 'From the wall'
  const teasersTitle = content?.teasersTitle || 'A look at recent sessions'
  const teaserSessionSlug = content?.teaserSessionSlug || ''

  // Compute session photos from the selected slug
  const sessionPhotos = teaserSessionSlug
    ? uploadPhotos.filter((p) =>
        (p.tags || []).some((t) => t.toLowerCase() === teaserSessionSlug.toLowerCase())
      )
    : []

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            {loading ? (
              <div className="hero-skeleton" aria-hidden="true">
                <span className="skeleton skeleton-title" />
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line short" />
              </div>
            ) : (
              <div className="page-fade-in">
                <h1>
                  {splitTitleForLines(heroTitle).map((line, i) => (
                    <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
                  ))}
                </h1>
                <p className="hero-lede">{heroLede}</p>
              </div>
            )}
            <div className="hero-actions">
              <Link to="/sessions" className="btn btn-primary">Join a Public Session</Link>
              <Link to="/shop" className="btn btn-outline">Shop Climbing Equipment</Link>
            </div>
          </div>
          <div className="hero-visual">
            <figure className="hero-figure">
              {heroPhotoUrl ? (
                <img src={heroPhotoUrl} alt="Climb Crux" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius)', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)' }} />
              ) : (
                <PlaceholderPhoto tag="Route Topo · Live Session" ratio="4 / 3" />
              )}
              <figcaption className="hero-caption">Group Photo From Our Successful Rock Climbing Session</figcaption>
            </figure>
          </div>
        </div>
        <CliffEdge fill="var(--chalk)" height={56} />
      </section>

      <section className="section paths">
        <div className="wrap">
          {loading ? (
            <div className="skeleton-on-light" aria-hidden="true">
              <span className="skeleton skeleton-eyebrow" />
              <div className="skeleton skeleton-h2" />
              <div className="paths-grid">
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
              </div>
            </div>
          ) : (
            <div className="page-fade-in">
              <span className="eyebrow">{pathsEyebrow}</span>
              <h2>{pathsTitle}</h2>
              <div className="paths-grid">
                {paths.map((p) => (
                  <div className="path-card" key={p.title}>
                    <GradeBadge grade={p.grade} label={p.label} />
                    <h3>{p.title}</h3>
                    <p>{p.copy}</p>
                    {p.photoUrl && (
                      <img src={p.photoUrl} alt={p.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius)', marginTop: 8 }} />
                    )}
                    <Link to={p.to} className="path-link">
                      {p.cta} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {loading ? (
            <div className="skeleton-on-light" aria-hidden="true">
              <span className="skeleton skeleton-eyebrow" />
              <div className="skeleton skeleton-h2" />
              <div className="teaser-grid">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton skeleton-tile" />
                ))}
              </div>
            </div>
          ) : (
            <div className="page-fade-in">
              <span className="eyebrow">{teasersEyebrow}</span>
              <h2>{teasersTitle}</h2>
              <div className="teaser-grid">
                {sessionPhotos.length > 0
                  ? sessionPhotos.slice(0, 6).map((p, i) => (
                      <img key={p.id || i} src={p.url} alt={p.title || teaserSessionSlug} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                    ))
                  : teasers.slice(0, 6).map((t, i) => (
                      t.photoUrl ? (
                        <img key={i} src={t.photoUrl} alt={t.tag} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                      ) : (
                        <PlaceholderPhoto key={i} tag={t.tag} ratio="4 / 3" />
                      )
                    ))
                }
              </div>
              <Link to="/gallery" className="btn btn-outline teaser-cta">View full gallery</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
