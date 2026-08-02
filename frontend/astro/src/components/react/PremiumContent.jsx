import { useState, useEffect } from 'react'
import { getPlans, getSessionContent } from '../../lib/api'

const DEFAULT_CUSTOM_ITEMS = [
  { h: 'Route & difficulty', p: 'Pick the grade you want to work — from an easy confidence climb to our toughest premium line.' },
  { h: 'Group size & mix', p: 'Go solo, bring your own group, or fold in a friend or two. You set the roster.' },
  { h: 'Pacing & duration', p: "Half-day, full-day, or a multi-session block built around a goal you're training toward." },
  { h: 'Coaching focus', p: 'Technique, endurance, fear management, or grade progression — tell us the focus, we build the plan.' },
]

const DEFAULT_CUSTOM_FEATURES = ['Pick your own date, time & group size', 'Choose the grade and climbing focus', 'Solo, small group, or large private group', 'Full gear & certified instructor included']

export default function PremiumContent({ initial }) {
  const [data, setData] = useState(initial || { plans: [], content: {} })

  useEffect(() => {
    let active = true
    Promise.all([getPlans().catch(() => []), getSessionContent().catch(() => ({}))])
      .then(([plans, content]) => {
        if (active) setData({ plans, content })
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const plans = data.plans || []
  const c = data.content || {}
  const ppCustomItems = c.ppCustomItems && c.ppCustomItems.length > 0 ? c.ppCustomItems : DEFAULT_CUSTOM_ITEMS
  const ppCustomSession = c.ppCustomSession || {}

  return (
    <>
      <section className="page-header">
        <div className="page-header-pattern"></div>
        <div className="page-header-accent"></div>
        <div className="wrap page-header-inner">
          <h1>{c.ppHeaderTitle || 'Your route, your pace.'}</h1>
          <div className="page-header-desc">
            <p>{c.ppHeaderDesc || 'Private sessions are built around you. Your Choice, just solo, with your group or working toward the highest grades we run.'}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>{c.ppSectionTitle || 'Pick a plan to start from'}</h2>
          <p style={{ marginBottom: 32 }}>{c.ppSectionDesc || "Every plan below is a starting point, not a fixed package. Tell us the goal and we'll design the climb around it."}</p>
          <div className="price-grid">
            {plans.filter((t) => t.type !== 'elite-premium').map((t) => (
              <div className={`price-card ${t.featured ? 'featured' : ''}`} key={t.id || t.title}>
                {t.tag && <span className="price-card-tag">{t.tag}</span>}
                <span className="grade-badge"><span className="grade">{t.grade}</span><span className="label">{t.label}</span></span>
                <h3>{t.title}</h3>
                <div className="price-amount">PKR {t.price} <span>{t.unit}</span></div>
                <ul>
                  {t.features && t.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <a href={`/book-now?type=${t.type || 'private'}`} className={`btn ${t.featured ? 'btn-primary' : 'btn-outline'}`}>
                  Book this plan
                </a>
              </div>
            ))}
            <div className="price-card">
              <span className="grade-badge"><span className="grade">{ppCustomSession.grade || 'You decide'}</span><span className="label">{ppCustomSession.label || 'Fully Custom'}</span></span>
              <h3>{ppCustomSession.title || 'Customizable Session'}</h3>
              <div className="price-amount">{ppCustomSession.price || 'On Request'} <span>{ppCustomSession.unit || 'Per Person'}</span></div>
              <ul>
                {(ppCustomSession.features && ppCustomSession.features.length > 0
                  ? ppCustomSession.features
                  : DEFAULT_CUSTOM_FEATURES
                ).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <a href="/book-now?type=custom-group" className="btn btn-outline">Build your session</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--chalk-dim)' }}>
        <div className="wrap">
          <span className="eyebrow">{c.ppCustomEyebrow || 'What gets customized'}</span>
          <h2>{c.ppCustomSectionTitle || "Built around your goal, not a template"}</h2>
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
