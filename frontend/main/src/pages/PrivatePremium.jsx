import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import GradeBadge from '../components/GradeBadge.jsx'
import { getPlans } from '../api.js'
import './PrivatePremium.css'

const CUSTOM = [
  { h: 'Route & difficulty', p: 'Pick the grade you want to work — from an easy confidence climb to our toughest premium line.' },
  { h: 'Group size & mix', p: 'Go solo, bring your own group, or fold in a friend or two. You set the roster.' },
  { h: 'Pacing & duration', p: 'Half-day, full-day, or a multi-session block built around a goal you\'re training toward.' },
  { h: 'Coaching focus', p: 'Technique, endurance, fear management, or grade progression — tell us the focus, we build the plan.' },
]

export default function PrivatePremium() {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPlans()
      .then(setTiers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader title="Your route, your pace.">
        <p>
          Private sessions are built around you — solo, with your group, or
          working toward the highest grades we run.
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Plans</span>
          <h2>Pick a plan to start from</h2>
          <p style={{ marginBottom: '32px' }}>
            Every plan below is a starting point, not a fixed package —
            Tell us the goal and we'll design the climb around it.
          </p>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading plans…</p>
          ) : (
            <div className="price-grid">
              {tiers.filter((t) => t.type !== 'elite-premium').map((t) => (
                <div className={`price-card ${t.featured ? 'featured' : ''}`} key={t.id || t.title}>
                  {t.tag && <span className="price-card-tag">{t.tag}</span>}
                  <GradeBadge grade={t.grade} label={t.label} />
                  <h3>{t.title}</h3>
                  <div className="price-amount">PKR {t.price} <span>{t.unit}</span></div>
                  <ul>
                    {t.features?.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link to="/book-now?type=private" className={`btn ${t.featured ? 'btn-primary' : 'btn-outline'}`}>
                    Book this plan
                  </Link>
                </div>
              ))}
              {/* Customizable Session card */}
              <div className="price-card">
                <GradeBadge grade="You decide" label="Fully Custom" />
                <h3>Customizable Session</h3>
                <div className="price-amount">On Request <span>Per Person</span></div>
                <ul>
                  <li>Pick your own date, time &amp; group size</li>
                  <li>Choose the grade and climbing focus</li>
                  <li>Solo, small group, or large private group</li>
                  <li>Full gear &amp; certified instructor included</li>
                </ul>
                <Link to="/book-now?type=custom-group" className="btn btn-outline">
                  Build your session
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--chalk-dim)' }}>
        <div className="wrap">
          <span className="eyebrow">What gets customized</span>
          <h2>Built around your goal, not a template</h2>
          <div className="info-grid">
            {CUSTOM.map((c) => (
              <div className="info-card" key={c.h}>
                <h4>{c.h}</h4>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
