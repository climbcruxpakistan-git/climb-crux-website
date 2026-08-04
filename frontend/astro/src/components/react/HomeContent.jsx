import { useState, useEffect, Fragment } from 'react'
import { getHomeContent, getUploads } from '../../lib/api'
import CliffEdge from './CliffEdge.jsx'

const DEFAULT_PATHS = [
  { grade: '4 – 6a', label: 'Beginner Friendly', title: 'Public Sessions', copy: 'Drop into a guided group session on Margalla Hills every other week. No experience or gear needed — just a willingness to get chalky hands.', to: '/sessions', cta: 'See schedule & pricing' },
  { grade: 'Up to 7c+', label: 'Custom & Premium', title: 'Private & Premium', copy: 'Book a private slot for your group or go one-on-one with an instructor. Premium plans open the door to the hardest routes we run.', to: '/private-premium', cta: 'Explore plans' },
]

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

export default function HomeContent({ initial }) {
  const [content, setContent] = useState(initial || {})

  useEffect(() => {
    let active = true
    Promise.all([getHomeContent(), getUploads().catch(() => [])])
      .then(([home, uploads]) => {
        if (active) setContent({ ...home, uploads })
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const heroTitle = content.heroTitle || 'Discover Rock Climbing in Islamabad'
  const heroLede = content.heroLede || "Climb Crux is Islamabad's premier rock climbing club, offering professionally guided rock climbing sessions, expert coaching, monthly memberships and a supportive community for beginners and experienced climbers."
  const heroPhotoUrl = content.heroPhotoUrl || 'https://res.cloudinary.com/ivvx77mg/image/upload/v1785872185/climb-crux/eswc8bon6d6ognvow4mj.jpg'
  const paths = content.paths && content.paths.length ? content.paths : DEFAULT_PATHS
  const teasers = content.teasers && content.teasers.length ? content.teasers : [
    { tag: 'Public Session · 4+' },
    { tag: 'Private Coaching · 1-on-1' },
    { tag: 'Premium Ascent · 7c+' },
  ]
  const pathsEyebrow = content.pathsEyebrow || 'Two ways to climb with us'
  const pathsTitle = content.pathsTitle || 'Pick your route'
  const teasersEyebrow = content.teasersEyebrow || 'From the wall'
  const teasersTitle = content.teasersTitle || 'A look at recent sessions'
  const teaserSessionSlug = content.teaserSessionSlug || ''
  const uploads = content.uploads || []

  const sessionPhotos = teaserSessionSlug
    ? uploads.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === teaserSessionSlug.toLowerCase()))
    : []

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <h1>
              {splitTitleForLines(heroTitle).map((line, i) => (
                <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
              ))}
            </h1>
            <p className="hero-lede">{heroLede}</p>
            <div className="hero-actions">
              <a href="/sessions" className="btn btn-primary">Join a Public Session</a>
              <a href="/shop" className="btn btn-outline">Shop Climbing Equipment</a>
            </div>
          </div>
          <div className="hero-visual">
            <figure className="hero-figure">
              {heroPhotoUrl ? (
                <img
                  src={heroPhotoUrl}
                  alt="Rock climbing in Islamabad — Climb Crux climbers on Saidpur Village"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}
                />
              ) : (
                <div className="placeholder-photo" style={{ '--ar': '16 / 9' }}>
                  <span className="tag">Route Topo · Live Session</span>
                </div>
              )}
              <figcaption className="hero-caption">Group Photo From Our Rock Climbing Session on Saidpur Village, Islamabad</figcaption>
            </figure>
          </div>
        </div>
        <CliffEdge fill="var(--chalk)" height={56} />
      </section>

      <section className="section paths">
        <div className="wrap">
          <span className="eyebrow">{pathsEyebrow}</span>
          <h2>{pathsTitle}</h2>
          <div className="paths-grid">
            {paths.map((p) => (
              <div className="path-card" key={p.title}>
                <span className="grade-badge"><span className="grade">{p.grade}</span><span className="label">{p.label}</span></span>
                <h3>{p.title}</h3>
                <p>{p.copy}</p>
                {p.photoUrl && (
                  <img src={p.photoUrl} alt={p.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius)', marginTop: 8 }} />
                )}
                <a href={p.to} className="path-link">{p.cta} <span aria-hidden="true">→</span></a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
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
                    <div key={i} className="placeholder-photo" style={{ '--ar': '4 / 3' }}>
                      <span className="tag">{t.tag}</span>
                    </div>
                  )
                ))}
          </div>
          <a href="/gallery" className="btn btn-outline" style={{ marginTop: 24 }}>View full gallery</a>
        </div>
      </section>
    </>
  )
}
