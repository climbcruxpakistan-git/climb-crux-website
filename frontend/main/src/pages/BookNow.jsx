import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { createBooking, getSessionContent } from '../api.js'

const sessionTypes = [
  { value: 'public', label: 'Public Session', desc: 'Join a guided group session on Margalla Hills — every other Sunday.' },
  { value: 'private', label: 'Private Session', desc: 'One-on-one or private group coaching tailored to your goals.' },
  { value: 'custom-group', label: 'Customize Group Session', desc: 'Build a session for your own group — pick the date, size, and focus.' },
]

export default function BookNow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('type') || ''

  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionType, setSessionType] = useState(
    sessionTypes.some(t => t.value === preselected) ? preselected : ''
  )
  const [participants, setParticipants] = useState(1)
  const [pricing, setPricing] = useState({ publicPrice: 4500 })

  // Fetch pricing info from session content
  useEffect(() => {
    getSessionContent().then((content) => {
      const price = Number(content.pricingPrice) || 4500
      setPricing({ publicPrice: price })
    }).catch(() => {
      setPricing({ publicPrice: 4500 })
    })
  }, [])

  const isCustom = sessionType === 'custom-group'

  const perPersonPrice = (type) => {
    if (type === 'public') return pricing.publicPrice
    if (type === 'private') return 8000
    return 0
  }

  const totalAmount = sessionType && !isCustom ? perPersonPrice(sessionType) * participants : 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (isCustom) return  // custom sessions are booked via email
    setError('')
    setSending(true)

    const form = e.target
    const sessionId = sessionType
    const participantCount = participants

    const data = {
      customer_name: form['customer-name'].value,
      customer_email: form['customer-email'].value,
      customer_phone: form['customer-phone'].value,
      session_id: sessionId,
      date: form['preferred-date'].value,
      participants: participantCount,
      amount: totalAmount,
      booking_status: 'pending_payment',
      payment_status: 'pending',
    }

    try {
      const created = await createBooking(data)
      const bookingNumber = created.booking_number || `CCP-${new Date().getFullYear()}-${(created.id || '').slice(-5)}`
      navigate(`/booking/${encodeURIComponent(bookingNumber)}/payment`)
    } catch (err) {
      setError('Failed to create booking. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHeader title="Book your climb.">
        <p>
          Pick the session that fits — a public group climb, a private
          experience, or a fully customized session for your own group.
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
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
                <select
                  id="session-type"
                  defaultValue={sessionTypes.some(t => t.value === preselected) ? preselected : ''}
                  onChange={(e) => { setSessionType(e.target.value); setParticipants(1) }}
                  required
                >
                  <option value="" disabled>Choose a session type</option>
                  {sessionTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="customer-name">Full name</label>
                  <input id="customer-name" type="text" required />
                </div>
                <div className="field">
                  <label htmlFor="customer-phone">Phone / WhatsApp</label>
                  <input id="customer-phone" type="tel" required />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="customer-email">Email</label>
                  <input id="customer-email" type="email" required />
                </div>
                <div className="field">
                  <label htmlFor="group-size">Number of people</label>
                  <input
                    id="group-size"
                    type="number"
                    min="1"
                    defaultValue="1"
                    onChange={(e) => setParticipants(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="preferred-date">Preferred date</label>
                <input id="preferred-date" type="date" />
              </div>

              {/* ── Custom Session: Contact card ── */}
              {isCustom && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8f4ef, #f0ebe3)',
                  borderRadius: 12,
                  padding: '28px 24px',
                  marginBottom: 20,
                  border: '1px solid var(--sand)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--ink)' }}>
                    Custom sessions are built on request
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: '0 0 16px', lineHeight: 1.6 }}>
                    Tell us your group size, preferred grade, and ideal date — we'll design a session around you.
                    Reach out and we'll respond within 24 hours.
                  </p>
                  <a
                    href="mailto:climbcruxpakistan@gmail.com"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--ink)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 15,
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
                    climbcruxpakistan@gmail.com
                  </a>
                  <p style={{ fontSize: 12, color: 'var(--stone)', margin: '12px 0 0' }}>
                    Or call / WhatsApp: <strong>+92 300 1234567</strong>
                  </p>
                </div>
              )}

              {/* ── Live price summary (not for custom) ── */}
              {sessionType && !isCustom && (
                <div style={{
                  background: 'var(--chalk-dim)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  marginBottom: 20,
                  border: '1px solid var(--sand)',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--stone)', marginBottom: 4 }}>
                        {sessionTypes.find(t => t.value === sessionType)?.label || sessionType}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>
                        PKR {perPersonPrice(sessionType).toLocaleString()}{' '}
                        <span style={{ color: 'var(--stone)' }}>× {participants} {participants === 1 ? 'person' : 'people'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
                        PKR {totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isCustom && (
                <div className="form-actions" style={{ flexDirection: 'column' }}>
                  <button type="submit" className="btn btn-primary" disabled={sending || !sessionType} style={{ width: '100%', justifyContent: 'center' }}>
                    {sending ? (
                      <><span className="btn-spinner" /> Creating booking…</>
                    ) : (
                      'Continue to payment →'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
