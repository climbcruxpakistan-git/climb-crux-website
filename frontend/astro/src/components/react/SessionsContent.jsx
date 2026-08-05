import { useState, useEffect } from 'react'
import { getAvailableSessions, getSessionContent } from '../../lib/api'

/** "2026-08-15" → "Saturday, 01-10-2026" (weekday + DD-MM-YYYY) */
function formatShortDate(iso) {
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return String(iso)
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${weekdays[d.getDay()]}, ${m[3]}-${m[2]}-${m[1]}`
}

const DEFAULT_INCLUDED = [
  { h: 'Certified guidance', p: 'Every session is led by a certified climbing instructor, start to finish.' },
  { h: 'Full safety gear', p: 'Harness, helmet, rope, belay setup, and climbing shoes provided.' },
  { h: 'Beginner-friendly routes', p: 'Routes are set for first-timers, roughly grade 4–6a on the French scale.' },
  { h: 'Small groups', p: "Group sessions capped at 20 climbers so there's plenty of room on the wall." },
]

const DEFAULT_FAQS = [
  { q: 'Do I need climbing experience?', a: 'No — public sessions are built for first-timers. Instructors walk you through technique, belay basics, and route reading before anyone leaves the ground.' },
  { q: 'What should I bring?', a: 'Comfortable athletic clothing, closed-toe shoes you can climb in, water, and sun protection. We provide the harness, helmet, rope, and climbing shoes.' },
  { q: 'What is the minimum age?', a: "Climbers 10 and up are welcome on public sessions. Anyone under 18 needs a parent or guardian's consent." },
  { q: 'What if it rains or a session is cancelled?', a: 'We reschedule affected sessions to the next available date, or move your booking to a private session at no extra cost.' },
  { q: 'Can I pause my membership?', a: "Yes. Your membership gives you 4 climbing sessions each month, and you can spread them across any of our public session dates that suit you — there's no need to book them all at once. If life gets in the way and you need a break, just message us at least 48 hours before your first session and we'll pause your membership, carrying any unused sessions over to the next month at no extra cost." },
]

const DEFAULT_FEATURES = ['2–3 hour guided session', 'Certified instructor & safety briefing', 'Harness, helmet, rope, belay gear & climbing shoes', 'Group of up to 20 climbers']
const DEFAULT_MEMBERSHIP_FEATURES = ['4 Rock Climbing Sessions', 'Valid for 1 Month', 'Save PKR 2,000', 'Professional Instructors', 'Safety Equipment Included', 'All Skill Levels Welcome']

export default function SessionsContent({ initial }) {
  const [data, setData] = useState(initial || { sessions: [], content: {} })

  useEffect(() => {
    let active = true
    Promise.all([getAvailableSessions().catch(() => []), getSessionContent().catch(() => ({}))])
      .then(([sessions, content]) => {
        if (active) setData({ sessions, content })
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const sessions = data.sessions || []
  const c = data.content || {}
  const included = c.includedItems && c.includedItems.length ? c.includedItems : DEFAULT_INCLUDED
  const faqs = c.faqs && c.faqs.length ? c.faqs : DEFAULT_FAQS
  const sessionsDisabled = c.sessionsDisabled || false

  const pricingFeatures = c.pricingFeatures && c.pricingFeatures.length
    ? c.pricingFeatures.map((f) => f.text || f)
    : DEFAULT_FEATURES
  const pricingDesc = c.pricingDescription || 'Join a guided group session on Margalla Hills — every other Sunday. Full gear and certified instructors included.'
  const membership = c.membership || {}
  const rawMembershipFeatures = membership.features && membership.features.length
    ? membership.features.filter((f) => typeof f === 'string' && f.trim())
    : []
  const membershipFeatures = rawMembershipFeatures.length ? rawMembershipFeatures : DEFAULT_MEMBERSHIP_FEATURES
  const membershipDesc = membership.description || 'Train consistently with our monthly climbing membership. Enjoy four climbing sessions every month at a discounted price while improving your strength, technique, and confidence.'

  return (
    <>
      <section className="page-header">
        <div className="page-header-pattern"></div>
        <div className="page-header-accent"></div>
        <div className="wrap page-header-inner">
          <h1>{c.sessionsHeaderTitle || 'Climb with the group.'}</h1>
          <div className="page-header-desc">
            <p>{c.sessionsHeaderDesc || 'Every other Sunday, we set beginner-friendly routes on the limestone of Margalla Hills and open the wall to the public. No gear, no experience, no problem.'}</p>
          </div>
        </div>
      </section>

      <section className="section schedule-section">
        <div className="wrap">
          <h2>{c.sessionsSectionTitle || 'Upcoming sessions'}</h2>
          {sessionsDisabled || sessions.length === 0 ? (
            <div className="empty-sessions-card">
              <div className="empty-sessions-icon">📅</div>
              <h3>No public sessions right now</h3>
              <p>We don't have any public sessions scheduled at the moment. But you can still climb! Check out our private &amp; premium sessions designed around your schedule and goals.</p>
              <a href="/private-premium" className="btn btn-primary" style={{ marginTop: 8 }}>Explore private sessions</a>
            </div>
          ) : (
            <ul className="schedule-list">
              {sessions.map((s, i) => (
                <li key={s.id || i}>
                  <div className="schedule-card">
                    <span className="schedule-name">{s.title || 'Public Session'}</span>
                    <div className="schedule-card-meta">
                      <span className="schedule-date">{formatShortDate(s.date)}</span>
                      <span className="schedule-time">{[s.startTime, s.endTime].filter(Boolean).join(' – ') || '—'}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="form-note">Sessions run every other week — check back or contact us if these dates don't line up with you.</p>
        </div>
      </section>

      <section className="section pricing-section">
        <div className="wrap">
          <h2>{c.pricingSectionTitle || 'One flat rate, everything included'}</h2>
          <div className="price-grid">
            <div className="price-card">
              <h3>{c.pricingTitle || 'Public Session'}</h3>
              <div className="price-amount">PKR {c.pricingPrice || '2,500'} <span>{c.pricingUnit || '/ person'}</span></div>
              <p className="pricing-desc">{pricingDesc}</p>
              <ul>
                {pricingFeatures.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <a href="/book-now?type=public" className="btn btn-primary" aria-label="Reserve a spot on a public session">Reserve a spot</a>
            </div>
            <div className="price-card featured membership-card">
              <span className="membership-badge">{membership.badge || '🔥 Save 20%'}</span>
              <h3>{membership.title || 'Monthly Membership'}</h3>
              <div className="price-amount">PKR {membership.price || '8,000'} <span>{membership.unit || '/ Month'}</span></div>
              <div className="membership-save">
                <span className="original-price" aria-label={`Original price PKR ${membership.originalPrice || '10,000'}`}>PKR {membership.originalPrice || '10,000'}</span>
                <span className="save-tag">Save {membership.discount || '20%'}</span>
              </div>
              <p className="membership-desc">{membershipDesc}</p>
              <ul>
                {membershipFeatures.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <a href="/book-now?type=membership" className="btn btn-primary" aria-label="Get the Monthly Membership">{membership.ctaLabel || 'Get Monthly Membership'}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <span className="eyebrow">What's included</span>
          <h2>{c.includedSectionTitle || "Everything you need, nothing to bring"}</h2>
          <div className="info-grid">
            {included.map((i) => (
              <div className="info-card" key={i.h}>
                <h4>{i.h}</h4>
                <p>{i.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="wrap">
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
        </div>
      </section>
    </>
  )
}
