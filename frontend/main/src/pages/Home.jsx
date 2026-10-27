import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
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
  const heroTitle = content?.heroTitle || 'CLIMB CRUX - ISLAMABAD'
  const heroLede = content?.heroLede || "Climb Crux is Islamabad's premier rock climbing club, offering professionally guided rock climbing sessions, expert coaching, monthly memberships and a supportive community for beginners and experienced climbers."
  const heroPhotoUrl = content?.heroPhotoUrl || 'https://res.cloudinary.com/ivvx77mg/image/upload/v1785872185/climb-crux/eswc8bon6d6ognvow4mj.jpg'

  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${heroPhotoUrl})` }} aria-hidden="true"></div>
        <div className="hero-gradient" aria-hidden="true"></div>
        <svg className="hero-topo" aria-hidden="true" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#F47321" strokeWidth="1">
            <path d="M0 300 Q200 250 400 300 T800 300 T1200 300" opacity="0.15"/>
            <path d="M0 320 Q150 280 350 320 T750 320 T1200 320" opacity="0.12"/>
            <path d="M0 280 Q250 230 500 280 T1000 280 T1200 280" opacity="0.1"/>
            <path d="M100 200 Q300 170 500 200 T900 200" opacity="0.08"/>
          </g>
        </svg>
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <div className="hero-label">ROCK CLIMBING · ISLAMABAD</div>
            <h1 className="hero-headline">
              ROCK CLIMBING<br />
              <span className="hero-headline-orange">IN ISLAMABAD</span>
            </h1>
            <p className="hero-lede">{heroLede}</p>
            <div className="hero-actions">
              <span className="hero-cta-glow">
                <Link to="/sessions" className="btn btn-primary hero-btn-primary">Join a public session →</Link>
              </span>
              <Link to="/shop" className="btn btn-outline hero-btn-outline">Shop climbing equipment</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-frame">
              <div className="hero-photo-outline" aria-hidden="true"></div>
              <figure className="hero-figure">
                <img src={heroPhotoUrl} alt="Climb Crux group climbing on Margalla Hills, Saidpur Village, Islamabad" />
                <figcaption className="hero-chip">Saidpur Village, Islamabad</figcaption>
                <div className="hero-badge">Beginners welcome</div>
              </figure>
            </div>
          </div>
        </div>
        <svg className="hero-wave" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="#F7F3EC"></path>
        </svg>
      </section>

      <section className="stats-section">
        <div className="wrap">
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-value">Bi-weekly</div>
              <div className="stat-label">Public sessions</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">Margalla Hills</div>
              <div className="stat-label">Local crags</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">Pro-led</div>
              <div className="stat-label">Professional instructors</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">Beginner → Elite</div>
              <div className="stat-label">All levels welcome</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section adventure-section">
        <div className="wrap">
          <div className="adventure-header">
            <div className="adventure-label">TWO WAYS TO CLIMB WITH US</div>
            <h2 className="adventure-title">Pick your adventure</h2>
          </div>
          <div className="adventure-grid">
            <Link to="/sessions" className="adventure-card adventure-card-light">
              <div className="adventure-number">01</div>
              <h3 className="adventure-card-title">Public Sessions</h3>
              <p className="adventure-card-text">Drop into a guided group session on Margalla Hills every other week. No experience or gear needed — just a willingness to get chalky hands.</p>
              <div className="adventure-card-cta">See schedule & pricing →</div>
            </Link>
            <Link to="/private-premium" className="adventure-card adventure-card-dark">
              <div className="adventure-number">02</div>
              <h3 className="adventure-card-title">Private & Premium</h3>
              <p className="adventure-card-text">Book a private slot for your group or go one-on-one with an instructor. Premium plans open the door to the hardest routes we run.</p>
              <div className="adventure-card-cta">Explore plans →</div>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
