import { useState, useEffect, Fragment } from 'react'
import { getHomeContent, getUploads } from '../../lib/api'
import CliffEdge from './CliffEdge.jsx'
import HeroSlider from './HeroSlider.jsx'
import PickAdventure from './PickAdventure.jsx';
import Workshops from './Workshops.jsx';
import LifeOnTheRock from './LifeOnTheRock.jsx';

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

  const heroSlides = [
    { src: heroPhotoUrl, alt: 'Climb Crux group at Saidpur Village', title: 'Group Climbing Session', location: 'Saidpur Village, Islamabad', badge: { text: 'Beginners welcome', color: '#F47321' } },
    { src: 'https://res.cloudinary.com/ivvx77mg/image/upload/v1784561395/climb-crux/l4ld8qkbbs3g3kos659q.jpg', alt: 'Climbing Safety Introduction', title: 'Climbing Safety Introduction', location: 'Saidpur Village, Islamabad', fit: 'contain', badge: { text: 'Safety Workshop', color: '#2F6FDE' } },
    { src: 'https://res.cloudinary.com/ivvx77mg/image/upload/v1789987298/climb-crux/pqxnl4wsbheafspitx9p.jpg', alt: 'German Climber', title: 'German Climber', location: 'Shahdara, Islamabad', fit: 'contain', badge: { text: 'Foreigner Climber', color: '#7B3FE4' } },
    { src: 'https://res.cloudinary.com/ivvx77mg/image/upload/v1784735406/climb-crux/igfybn92vpkaw8aa4wg0.jpg', alt: 'USA Climber', title: 'USA Climber', location: 'Saidpur Village, Islamabad', pos: 'top', badge: { text: 'Foreigner Climber', color: '#7B3FE4' } },
    { src: 'https://res.cloudinary.com/ivvx77mg/image/upload/v1784561415/climb-crux/fzciun575c7nxrpvjrhd.jpg', alt: 'Kids Climbing', title: 'Kids Climbing', location: 'Saidpur Village, Islamabad', fit: 'contain', badge: { text: 'Training Kids', color: '#1E9E6A' } },
    { src: 'https://res.cloudinary.com/ivvx77mg/image/upload/v1789987194/climb-crux/ktlcdvcmx3qve3bihtsm.jpg', alt: 'Lead Climbing Training', title: 'Lead Climbing Training', location: 'Legacy Trail 3, Islamabad', pos: 'top', badge: { text: 'Lead Workshop', color: '#F2B705', textColor: '#1F1F21' } },
    { src: 'https://res.cloudinary.com/ivvx77mg/image/upload/v1793109982/climb-crux/yoiocsv19pmropkpegc1.jpg', alt: 'College Kids Rappelling', title: 'College Kids Rappelling', location: 'Jasmine Corner, Islamabad', fit: 'contain', badge: { text: 'Rappelling Workshop', color: '#D63A6E' } },
  ];

  return (
    <>
      <section className="hero">
        <img
          className="hero-bg"
          src="https://res.cloudinary.com/ivvx77mg/image/upload/w_1600,q_auto,f_auto/v1785872185/climb-crux/eswc8bon6d6ognvow4mj.jpg"
          alt=""
          aria-hidden="true"
        />
        <svg className="hero-topo" viewBox="0 0 1440 720" preserveAspectRatio="none" fill="none" stroke="#F47321" strokeOpacity=".22" strokeWidth="1.3" aria-hidden="true">
          <path d="M-50 640C200 560 330 680 560 600S900 460 1100 520 1400 420 1500 460"/>
          <path d="M-50 600C200 520 330 640 560 560S900 420 1100 480 1400 380 1500 420"/>
          <path d="M-50 560C200 480 330 600 560 520S900 380 1100 440 1400 340 1500 380"/>
          <path d="M-50 520C200 440 330 560 560 480S900 340 1100 400 1400 300 1500 340"/>
          <path d="M-50 480C200 400 330 520 560 440S900 300 1100 360 1400 260 1500 300"/>
          <path d="M-50 440C200 360 330 480 560 400S900 260 1100 320 1400 220 1500 260"/>
          <path d="M-50 400C200 320 330 440 560 360S900 220 1100 280 1400 180 1500 220"/>
        </svg>
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <h1>
              {splitTitleForLines(heroTitle).map((line, i) => {
                if (i === 0 && /rock climbing/i.test(line)) {
                  const parts = line.split(/(Rock Climbing)/i)
                  return (
                    <Fragment key={i}>
                      {parts.map((p, j) => {
                        if (/^rock climbing$/i.test(p)) {
                          return <span key={j} style={{ color: '#f47321' }}>{p}</span>
                        }
                        return <Fragment key={j}>{p}</Fragment>
                      })}
                      <br />
                    </Fragment>
                  )
                }
                return <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
              })}
            </h1>
            <p className="hero-lede">{heroLede}</p>
            <div className="hero-actions">
              <span className="hero-cta-glow">
                <a href="https://www.climbcruxpakistan.com/private-premium/" className="btn btn-primary">Book Your Adventure</a>
              </span>
              <a href="/shop/" className="btn btn-outline">Shop Climbing Equipment</a>
            </div>
          </div>
          <div className="hero-visual">
            <HeroSlider slides={heroSlides} />
          </div>
        </div>
        <svg className="hero-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 60C240 10 480 20 720 50S1200 80 1440 30V90H0Z" fill="var(--chalk)" />
        </svg>
      </section>

      <section className="stats-band home-stats">
        <div className="wrap stats-grid">
          <div className="stat"><span className="stat-value">12+</span><span className="stat-label">Years of guiding experience</span></div>
          <div className="stat"><span className="stat-value">1000+</span><span className="stat-label">First-time climbers introduced</span></div>
          <div className="stat"><span className="stat-value">200+</span><span className="stat-label">Group sessions led on Margalla Hills</span></div>
          <div className="stat"><span className="stat-value">6</span><span className="stat-label">Climbing workshops offered</span></div>
        </div>
      </section>

      <PickAdventure
        publicImage={heroPhotoUrl}
        privateImage="https://res.cloudinary.com/ivvx77mg/image/upload/v1784735793/climb-crux/o5g2kwkbnfqwr4azraze.jpg"
      />
      <Workshops />

      <LifeOnTheRock />
    </>
  )
}
