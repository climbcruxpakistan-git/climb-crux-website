import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
import CliffEdge from '../components/CliffEdge.jsx'
import GradeBadge from '../components/GradeBadge.jsx'
import PlaceholderPhoto from '../components/PlaceholderPhoto.jsx'
import { getHomeContent, getUploads } from '../api.js'

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
  const heroTitle = content?.heroTitle || 'Find your next hold.'
  const heroLede = content?.heroLede || "Guided rock climbing and adventure sessions on the cliffs of Margalla Hills. For the first foothold you ever take, or the hardest grade you've chased yet."
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
            <h1>{heroTitle}</h1>
            <p className="hero-lede">{heroLede}</p>
            <div className="hero-actions">
              <Link to="/sessions" className="btn btn-primary">Join a Public Session</Link>
              <Link to="/private-premium" className="btn btn-outline">Build a Private Plan</Link>
            </div>
          </div>
          <div className="hero-visual">
            {heroPhotoUrl ? (
              <img src={heroPhotoUrl} alt="Climb Crux" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius)', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)' }} />
            ) : (
              <PlaceholderPhoto tag="Route Topo · Live Session" ratio="4 / 3" />
            )}
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
      </section>

      <section className="section">
        <div className="wrap">
          <span className="eyebrow">{teasersEyebrow}</span>
          <h2>{teasersTitle}</h2>
          <div className="teaser-grid">
            {sessionPhotos.length > 0
              ? sessionPhotos.map((p, i) => (
                  <img key={p.id || i} src={p.url} alt={p.title || teaserSessionSlug} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                ))
              : teasers.map((t, i) => (
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
      </section>
    </>
  )
}
