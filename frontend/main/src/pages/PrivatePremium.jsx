import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import GradeBadge from '../components/GradeBadge.jsx'
import { getPlans, getSessionContent } from '../api.js'
import './PrivatePremium.css'

export default function PrivatePremium() {
  const [tiers, setTiers] = useState([])
  const [pageContent, setPageContent] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPlans(), getSessionContent()])
      .then(([plans, content]) => {
        setTiers(plans)
        setPageContent(content)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const c = pageContent
  const ppCustomItems = (c.ppCustomItems && c.ppCustomItems.length > 0) ? c.ppCustomItems : [
    { h: 'Route & difficulty', p: 'Pick the grade you want to work — from an easy confidence climb to our toughest premium line.' },
    { h: 'Group size & mix', p: 'Go solo, bring your own group, or fold in a friend or two. You set the roster.' },
    { h: 'Pacing & duration', p: 'Half-day, full-day, or a multi-session block built around a goal you\'re training toward.' },
    { h: 'Coaching focus', p: 'Technique, endurance, fear management, or grade progression — tell us the focus, we build the plan.' },
  ]

  return (
    <>
      <PageHeader title={c.ppHeaderTitle || 'Your route, your pace.'}>
        <p>
          {c.ppHeaderDesc || 'Private sessions are built around you — solo, with your group, or working toward the highest grades we run.'}
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <span className="eyebrow">{c.ppEyebrow || 'Plans'}</span>
          <h2>{c.ppSectionTitle || 'Pick a plan to start from'}</h2>
          <p style={{ marginBottom: '32px' }}>
            {c.ppSectionDesc || 'Every plan below is a starting point, not a fixed package — Tell us the goal and we\'ll design the climb around it.'}
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
                <GradeBadge grade={(c.ppCustomSession && c.ppCustomSession.grade) || 'You decide'} label={(c.ppCustomSession && c.ppCustomSession.label) || 'Fully Custom'} />
                <h3>{(c.ppCustomSession && c.ppCustomSession.title) || 'Customizable Session'}</h3>
                <div className="price-amount">{(c.ppCustomSession && c.ppCustomSession.price) || 'On Request'} <span>{(c.ppCustomSession && c.ppCustomSession.unit) || 'Per Person'}</span></div>
                <ul>
                  {(c.ppCustomSession && c.ppCustomSession.features && c.ppCustomSession.features.length > 0
                    ? c.ppCustomSession.features
                    : ['Pick your own date, time &amp; group size', 'Choose the grade and climbing focus', 'Solo, small group, or large private group', 'Full gear &amp; certified instructor included']
                  ).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
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
          <span className="eyebrow">{c.ppCustomEyebrow || 'What gets customized'}</span>
          <h2>{c.ppCustomSectionTitle || 'Built around your goal, not a template'}</h2>
          <div className="info-grid">
            {ppCustomItems.map((item) => (
              <div className="info-card" key={item.h}>
                <h4>{item.h}</h4>
                <p>{item.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
