import { useState, useEffect } from 'react'
import { createBooking, getSessionContent, getPlans, getMembershipFormUrl } from '../../lib/api'

function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parsePrice(val) {
  if (!val) return 0
  return Number(String(val).replace(/,/g, '')) || 0
}

// Session booking Terms & Conditions — every box must be ticked to continue.
// Kept in sync with backend/src/membershipForm.js BOOKING_TERMS.
const BOOKING_TERMS = [
  'I agree to follow all instructions given by Climb Crux instructors and staff.',
  'I understand that rock climbing involves inherent risks, including the risk of injury. I voluntarily choose to participate, accept these risks and agree not to hold Climb Crux, its instructors, staff or volunteers responsible for any injury or loss resulting from my participation.',
  'I have read, understood and agree to the Climb Crux Liability Waiver and Terms & Conditions.',
]

/** Read the ?type= query param directly in the browser as a fallback */
function getUrlType() {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('type') || ''
}

export default function BookNow({ preselected = '' }) {
  const effectivePreselected = preselected || getUrlType()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionType, setSessionType] = useState(effectivePreselected || '')
  const [participants, setParticipants] = useState(1)
  const [pricing, setPricing] = useState({ publicPrice: 2500 })
  const [membership, setMembership] = useState({})
  const [planOptions, setPlanOptions] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState([])

  function toggleTerm(term) {
    setAgreedTerms((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term]
    )
  }

  useEffect(() => {
    Promise.all([getSessionContent(), getPlans()])
      .then(([content, plans]) => {
        const publicPrice = parsePrice(content.pricingPrice) || 2500
        setPricing({ publicPrice })
        setMembership(content.membership || {})
        const privatePlans = (plans || [])
          .filter((p) => p.type === 'private-starter' || p.type === 'private-advanced')
          .map((p) => ({
            value: p.type,
            label: p.title,
            price: parsePrice(p.price),
            desc: `${p.title} — PKR ${p.price}/person`,
          }))
        setPlanOptions(privatePlans)
        const allValues = ['public', 'membership', 'custom-group', ...privatePlans.map((p) => p.value)]
        if (effectivePreselected && allValues.includes(effectivePreselected)) {
          setSessionType(effectivePreselected)
        }
        setLoaded(true)
      })
      .catch(() => {
        setPricing({ publicPrice: 2500 })
        setLoaded(true)
      })
  }, [effectivePreselected])

  const membershipPrice = parsePrice(membership.price) || 8000

  const allSessionOptions = (() => {
    const opts = []
    opts.push({ value: 'public', label: 'Public Session', desc: 'Join a guided group session on Margalla Hills — every other Sunday.' })
    opts.push({ value: 'membership', label: membership.title || 'Monthly Membership', desc: `${membership.sessionsIncluded || '4'} sessions / month — PKR ${membership.price || '8,000'} · save ${membership.discount || '20%'}` })
    planOptions.forEach((po) => { opts.push({ value: po.value, label: po.label, desc: po.desc }) })
    opts.push({ value: 'custom-group', label: 'Customize Group Session', desc: 'Build a session for your own group — pick the date, size, and focus.' })
    return opts
  })()

  const isCustom = sessionType === 'custom-group'
  const isMembership = sessionType === 'membership'
  const perPersonPrice = (type) => {
    if (type === 'public') return pricing.publicPrice
    if (type === 'membership') return membershipPrice
    const plan = planOptions.find((p) => p.value === type)
    return plan ? plan.price : 0
  }
  const totalAmount = sessionType && !isCustom ? perPersonPrice(sessionType) * participants : 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (isCustom) return
    if (isMembership) return
    if (agreedTerms.length < BOOKING_TERMS.length) {
      setError('Please tick all three Terms & Conditions to continue')
      return
    }
    setError('')
    setSending(true)
    const form = e.target
    const data = {
      customer_name: form['customer-name'].value,
      customer_email: form['customer-email'].value,
      customer_phone: form['customer-phone'].value,
      emergency_contact_name: form['emergency-contact-name']?.value || '',
      emergency_contact_phone: form['emergency-contact-phone']?.value || '',
      session_id: sessionType,
      date: form['preferred-date'].value,
      participants,
      amount: totalAmount,
      agreed_terms: agreedTerms,
      booking_status: 'pending_payment',
      payment_status: 'pending',
    }
    try {
      const created = await createBooking(data)
      const bookingNumber = created.booking_number || `CCS-${String(created.id || '').slice(-5).padStart(5, '0')}`
      window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/payment`
    } catch (err) {
      setError('Failed to create booking. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="book-now-grid">
          <div className="book-now-main">
            <div className="form-card" style={{ maxWidth: 680, margin: '0 auto' }}>
          {error && (
            <div className="form-error-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="session-type">Session type</label>
              <select id="session-type" value={sessionType} onChange={(e) => { setSessionType(e.target.value); setParticipants(1) }} required>
                <option value="" disabled>Choose a session type</option>
                {allSessionOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {!isCustom && !isMembership && (
              <>
                <div className="form-row">
                  <div className="field"><label htmlFor="customer-name">Full name</label><input id="customer-name" type="text" required /></div>
                  <div className="field"><label htmlFor="customer-phone">Phone / WhatsApp</label><input id="customer-phone" type="tel" required /></div>
                </div>
                <div className="form-row">
                  <div className="field"><label htmlFor="customer-email">Email</label><input id="customer-email" type="email" required /></div>
                  <div className="field"><label htmlFor="group-size">Number of people</label><input id="group-size" type="number" min="1" defaultValue="1" onChange={(e) => setParticipants(Math.max(1, Number(e.target.value)))} /></div>
                </div>
                <div className="field"><label htmlFor="preferred-date">Preferred date</label><input id="preferred-date" type="date" min={getTodayString()} /></div>
                <div className="form-row">
                  <div className="field"><label htmlFor="emergency-contact-name">Emergency contact</label><input id="emergency-contact-name" type="text" placeholder="Name" required /></div>
                  <div className="field"><label htmlFor="emergency-contact-phone">Emergency contact phone</label><input id="emergency-contact-phone" type="tel" placeholder="03XX-XXXXXXX" required /></div>
                </div>
              </>
            )}
            {isMembership && (
              <div className="membership-card" style={{ background: 'linear-gradient(135deg, #f8f4ef, #f0ebe3)', borderRadius: 12, padding: '28px 24px', marginBottom: 20, border: '1px solid var(--chalk-dim)', textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--charcoal)', margin: '0 0 8px' }}>Monthly Membership (4 Sessions)</h3>
                <p style={{ fontSize: '0.94rem', color: 'var(--stone-dark)', lineHeight: 1.6, margin: '0 auto 20px', maxWidth: '46ch' }}>
                  Become a Climb Crux member and enjoy four guided climbing sessions each month.
                </p>
                <a href="/membership/apply" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Apply Membership Online
                </a>
                <div style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--stone)', margin: '18px 0 16px' }}>or</div>
                <a href={getMembershipFormUrl()} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 12"/></svg>
                  Download Membership Form (PDF)
                </a>
                <p style={{ fontSize: '0.82rem', color: 'var(--stone)', lineHeight: 1.55, margin: '8px auto 0', maxWidth: '44ch' }}>
                  Prefer to register in person? Download, print, complete, and submit the membership form at the Climb Crux office.
                </p>
              </div>
            )}
            {isCustom && (
              <div className="custom-session-card" style={{ background: 'linear-gradient(135deg, #f8f4ef, #f0ebe3)', borderRadius: 12, padding: '28px 24px', marginBottom: 20, border: '1px solid var(--chalk-dim)', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--ink)' }}>Custom sessions are built on request</h3>
                <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: '0 0 16px', lineHeight: 1.6 }}>Tell us your group size, preferred grade, and ideal date — we'll design a session around you. Reach out and we'll respond within 24 hours.</p>
                <a href="mailto:climbcruxpakistan@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ink)', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
                  climbcruxpakistan@gmail.com
                </a>
                <p style={{ fontSize: 12, color: 'var(--stone)', margin: '12px 0 0' }}>Or call / WhatsApp: <strong>+92 313 2690377</strong></p>
              </div>
            )}
            {sessionType && !isCustom && !isMembership && (
              <div className="price-summary-card" style={{ background: 'var(--chalk-dim)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid var(--chalk-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--stone)', marginBottom: 4 }}>{allSessionOptions.find(t => t.value === sessionType)?.label || sessionType}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>
                      {sessionType === 'membership' && membership.originalPrice && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--stone)', marginRight: 8 }}>PKR {membership.originalPrice}</span>
                      )}
                      PKR {perPersonPrice(sessionType).toLocaleString()} <span style={{ color: 'var(--stone)' }}>× {participants} {participants === 1 ? 'person' : 'people'}</span>
                      {sessionType === 'membership' && (
                        <span style={{ display: 'block', color: 'var(--orange-dark)', fontWeight: 600, marginTop: 4 }}>🔥 Save {membership.discount || '20%'} — {membership.sessionsIncluded || '4'} sessions, valid {membership.duration || '1 month'}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>PKR {totalAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
            {!isCustom && !isMembership && (
              <div className="terms-card">
                <h3 className="terms-card-title">Terms &amp; Conditions</h3>
                <p className="terms-card-desc">
                  Please read and accept all three statements below to continue to payment.
                </p>
                {BOOKING_TERMS.map((term) => {
                  const checked = agreedTerms.includes(term)
                  return (
                    <label key={term} className={`terms-checkbox ${checked ? 'is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTerm(term)}
                      />
                      <span className="terms-checkbox-mark" aria-hidden="true" />
                      <span className="terms-checkbox-label">{term}</span>
                    </label>
                  )
                })}
                {agreedTerms.length < BOOKING_TERMS.length && (
                  <p className="terms-hint">Tick all three boxes to continue</p>
                )}
              </div>
            )}
            {!isCustom && !isMembership && (
              <div className="form-actions" style={{ flexDirection: 'column' }}>
                <button type="submit" className="btn btn-primary" disabled={sending || !sessionType || !loaded || agreedTerms.length < BOOKING_TERMS.length} style={{ width: '100%', justifyContent: 'center' }}>
                  {sending ? <><span className="btn-spinner" /> Creating booking…</> : 'Continue to payment →'}
                </button>
              </div>
            )}
          </form>
            </div>
          </div>

          <aside className="check-status-card" aria-label="Check your booking or membership status">
            <p className="check-status-desc">
              Check the current status of your session booking or membership request using your unique reference number.
            </p>
            <a className="btn btn-primary check-status-cta" href="/check-status">
              <span className="check-status-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              Check Status
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}
