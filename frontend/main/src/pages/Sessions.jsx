import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getSessions, getSessionContent } from '../api.js'
import './Sessions.css'

export default function Sessions() {
  const [upcoming, setUpcoming] = useState([])
  const [included, setIncluded] = useState([])
  const [faqs, setFaqs] = useState([])
  const [sessionsDisabled, setSessionsDisabled] = useState(false)
  const [pageContent, setPageContent] = useState({})
  const defaultFeatures = [
    { text: '2–3 hour guided session' },
    { text: 'Certified instructor & safety briefing' },
    { text: 'Harness, helmet, rope, belay gear & climbing shoes' },
    { text: 'Group of up to 20 climbers' },
  ]

  const [pricing, setPricing] = useState({
    title: 'Public Session',
    price: '2,500',
    unit: '/ person',
    description: '',
    features: defaultFeatures,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSessions(), getSessionContent()])
      .then(([sessions, content]) => {
        setUpcoming(sessions)
        setIncluded(content.includedItems || [])
        setFaqs(content.faqs || [])
        setSessionsDisabled(content.sessionsDisabled || false)
        setPageContent(content)
        setPricing({
          title: content.pricingTitle || 'Public Session',
          price: content.pricingPrice || '2,500',
          unit: content.pricingUnit || '/ person',
          description: content.pricingDescription || '',
          features: content.pricingFeatures?.length ? content.pricingFeatures : defaultFeatures,
        })
      })
      .catch(() => {
        // Fallback defaults if API is unavailable
        setUpcoming([])
        setIncluded([
          { h: 'Certified guidance', p: 'Every session is led by a certified climbing instructor, start to finish.' },
          { h: 'Full safety gear', p: 'Harness, helmet, rope, belay setup, and climbing shoes provided.' },
          { h: 'Beginner-friendly routes', p: 'Routes are set for first-timers, roughly grade 4–6a on the French scale.' },
          { h: 'Small groups', p: 'Group sessions capped at 20 climbers so there\'s plenty of room on the wall.' },
        ])
        setFaqs([
          { q: 'Do I need climbing experience?', a: 'No — public sessions are built for first-timers. Instructors walk you through technique, belay basics, and route reading before anyone leaves the ground.' },
          { q: 'What should I bring?', a: 'Comfortable athletic clothing, closed-toe shoes you can climb in, water, and sun protection. We provide the harness, helmet, rope, and climbing shoes.' },
          { q: 'What is the minimum age?', a: 'Climbers 10 and up are welcome on public sessions. Anyone under 18 needs a parent or guardian\'s consent.' },
          { q: 'What if it rains or a session is cancelled?', a: 'We reschedule affected sessions to the next available date, or move your booking to a private session at no extra cost.' },
          { q: 'Can I pause my membership?', a: 'Yes. Your membership gives you 4 climbing sessions each month, and you can spread them across any of our public session dates that suit you — there\'s no need to book them all at once. If life gets in the way and you need a break, just message us at least 48 hours before your first session and we\'ll pause your membership, carrying any unused sessions over to the next month at no extra cost.' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const c = pageContent
  const m = c.membership || {}
  const defaultMembershipFeatures = ['4 Rock Climbing Sessions', 'Valid for 1 Month', 'Save PKR 2,000', 'Professional Instructors', 'Safety Equipment Included', 'All Skill Levels Welcome']
  const rawMembershipFeatures = m.features?.length ? m.features.filter((f) => typeof f === 'string' && f.trim()) : []
  const membershipFeatures = rawMembershipFeatures.length ? rawMembershipFeatures : defaultMembershipFeatures
  const membershipDesc = m.description || 'Train consistently with our monthly climbing membership. Enjoy four climbing sessions every month at a discounted price while improving your strength, technique, and confidence.'

  return (
    <>
      <PageHeader title={c.sessionsHeaderTitle || 'Climb with the group.'}>
        <p>
          {c.sessionsHeaderDesc || 'Every other Sunday, we set beginner-friendly routes on the limestone of Margalla Hills and open the wall to the public. No gear, no experience, no problem.'}
        </p>
      </PageHeader>

      <section className="section schedule-section">
        <div className="wrap">
          <h2>{c.sessionsSectionTitle || 'Upcoming sessions'}</h2>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading sessions…</p>
          ) : sessionsDisabled || upcoming.length === 0 ? (
            <div className="empty-sessions-card">
              <div className="empty-sessions-icon">📅</div>
              <h3>No public sessions right now</h3>
              <p>
                We don't have any public sessions scheduled at the moment.
                But you can still climb! Check out our private &amp; premium
                sessions designed around your schedule and goals.
              </p>
              <Link to="/private-premium" className="btn btn-primary" style={{ marginTop: 8 }}>
                Explore private sessions
              </Link>
            </div>
          ) : (
            <ul className="schedule-list">
              {upcoming.map((s) => (
                <li key={s.id || s.date}>
                  <span className="schedule-date">{s.date}</span>
                  <span className="schedule-time">{s.time}</span>
                  <span className="schedule-spots">{s.spots}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="form-note">
            Sessions run every other week — check back or contact us if these dates don't line up with you.
          </p>
        </div>
      </section>

      <section className="section pricing-section">
        <div className="wrap">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading pricing…</p>
          ) : (
            <>
              <h2>{c.pricingSectionTitle || 'One flat rate, everything included'}</h2>
              <div className="price-grid">
                <div className="price-card">
                  <h3>{pricing.title}</h3>
                  <div className="price-amount">PKR {pricing.price} <span>{pricing.unit}</span></div>
                  <p className="pricing-desc">{pricing.description || 'Join a guided group session on Margalla Hills — every other Sunday. Full gear and certified instructors included.'}</p>
                  <ul>
                    {pricing.features.map((f, i) => (
                      <li key={i}>{f.text || f}</li>
                    ))}
                  </ul>
                  <Link to="/book-now?type=public" className="btn btn-primary" aria-label="Reserve a spot on a public session">Reserve a spot</Link>
                </div>

                {/* Monthly Membership card */}
                <div className="price-card featured membership-card">
                  <span className="membership-badge">{m.badge || '🔥 Save 20%'}</span>
                  <h3>{m.title || 'Monthly Membership'}</h3>
                  <div className="price-amount">PKR {m.price || '8,000'} <span>{m.unit || '/ Month'}</span></div>
                  <div className="membership-save">
                    <span className="original-price" aria-label={`Original price PKR ${m.originalPrice || '10,000'}`}>PKR {m.originalPrice || '10,000'}</span>
                    <span className="save-tag">Save {m.discount || '20%'}</span>
                  </div>
                  <p className="membership-desc">{membershipDesc}</p>
                  <ul>
                    {membershipFeatures.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                  <Link to="/book-now?type=membership" className="btn btn-primary" aria-label="Get the Monthly Membership">{m.ctaLabel || 'Get Monthly Membership'}</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading…</p>
          ) : (
            <>
              <span className="eyebrow">What's included</span>
              <h2>{c.includedSectionTitle || 'Everything you need, nothing to bring'}</h2>
              <div className="info-grid">
                {included.map((i) => (
                  <div className="info-card" key={i.h}>
                    <h4>{i.h}</h4>
                    <p>{i.p}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section faq-section">
        <div className="wrap">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading…</p>
          ) : (
            <>
              <span className="eyebrow">{c.faqEyebrow || 'Good to know'}</span>
              <h2>{c.faqSectionTitle || 'Frequently asked questions'}</h2>
              <div className="faq">
                {faqs.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
