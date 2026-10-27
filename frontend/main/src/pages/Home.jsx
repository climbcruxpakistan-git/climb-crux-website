import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
import heroImg from '../assets/group-photo.jpg'
import CliffEdge from '../components/CliffEdge.jsx'
import { getHomeContent } from '../api.js'

export default function Home() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHomeContent()
      .then(setContent)
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  const heroPhotoUrl = content?.heroPhotoUrl || heroImg

  return (
    <>
      <section className="hero">
        <img`n          className="hero-bg"`n          src="https://res.cloudinary.com/ivvx77mg/image/upload/w_1600,q_auto,f_auto/v1785872185/climb-crux/eswc8bon6d6ognvow4mj.jpg"`n          alt=""`n          aria-hidden="true"`n        />
        
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <h1>
                Discover Rock Climbing
                <br />
                in Islamabad
              </h1>
              <p className="hero-lede">
                Climb Crux is Islamabad&apos;s premier rock climbing club, offering professionally guided rock climbing sessions and a supportive community for beginners and experienced climbers.
              </p>
              <div className="hero-actions">
                <span className="hero-cta-glow">
                  <Link to="/sessions" className="btn btn-primary">Join a Public Session</Link>
                </span>
                <Link to="/shop" className="btn btn-outline">Shop Climbing Equipment</Link>
              </div>
            </div>
            <div className="hero-visual">
              <figure className="hero-figure">
                <img
                  src={heroPhotoUrl}
                  alt="Rock climbing in Islamabad — Climb Crux climbers on Saidpur Village"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}
                />
                <figcaption className="hero-caption">Group Photo From Our Rock Climbing Session on Saidpur Village, Islamabad</figcaption>
              </figure>
            </div>
          </div>
        </div>`n        <CliffEdge className="cliff-edge" fill="var(--chalk)" height={56} />
      </section>

      <section className="stats-band">
        <div className="wrap stats-grid">
          <div className="stat"><span className="stat-value">12+</span><span className="stat-label">Years of guiding experience</span></div>
          <div className="stat"><span className="stat-value">500+</span><span className="stat-label">First-time climbers introduced</span></div>
          <div className="stat"><span className="stat-value">200+</span><span className="stat-label">Group sessions led on Margalla Hills</span></div>
          <div className="stat"><span className="stat-value">4 – 7c+</span><span className="stat-label">Grade range — first top-rope to elite</span></div>
        </div>
      </section>

      <section className="section paths">
        <div className="wrap">
          <span className="eyebrow">Two ways to climb with us</span>
          <h2>Pick your route</h2>
          <div className="paths-grid">
            <div className="path-card">
              <div className="grade-badge">
                <span className="grade">4 – 6a</span>
                <span className="label">Beginner Friendly</span>
              </div>
              <h3>Public Sessions</h3>
              <p>Drop into a guided group session on Margalla Hills every other week. No experience or gear needed — just a willingness to get chalky hands.</p>
              <Link to="/sessions" className="path-link">
                See schedule & pricing <span aria-hidden="true">?</span>
              </Link>
            </div>
            <div className="path-card">
              <div className="grade-badge">
                <span className="grade">Up to 7c+</span>
                <span className="label">Custom & Premium</span>
              </div>
              <h3>Private & Premium</h3>
              <p>Book a private slot for your group or go one-on-one with an instructor. Premium plans open the door to the hardest routes we run.</p>
              <Link to="/private-premium" className="path-link">
                Explore plans <span aria-hidden="true">?</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

