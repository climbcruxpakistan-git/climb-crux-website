import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { createBooking, getSessionContent } from '../api.js'

export default function BookNow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('type') || ''

  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
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

  const sessionTypes = [
    { value: 'public', label: 'Public Session', desc: 'Join a guided group session on Margalla Hills — every other Sunday.' },
    { value: 'private', label: 'Private Session', desc: 'One-on-one or private group coaching tailored to your goals.' },
    { value: 'custom-group', label: 'Customize Group Session', desc: 'Build a session for your own group — pick the date, size, and focus.' },
  ]

  function calcAmount(type, participants) {
    if (type === 'public') return pricing.publicPrice * participants
    if (type === 'private') return 8000 * participants
    return 6000 * participants
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)

    const form = e.target
    const sessionType = form['session-type'].value
    const participants = Number(form['group-size'].value) || 1
    const amount = calcAmount(sessionType, participants)

    const data = {
      customer_name: form['customer-name'].value,
      customer_email: form['customer-email'].value,
      customer_phone: form['customer-phone'].value,
      session_id: sessionType,
      date: form['preferred-date'].value,
      participants,
      amount,
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
                <select id="session-type" defaultValue={sessionTypes.some(t => t.value === preselected) ? preselected : ''} required>
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
                  <input id="group-size" type="number" min="1" defaultValue="1" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="preferred-date">Preferred date</label>
                <input id="preferred-date" type="date" />
              </div>

              <div className="form-actions" style={{ flexDirection: 'column' }}>
                <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
                  {sending ? (
                    <><span className="btn-spinner" /> Creating booking…</>
                  ) : (
                    'Continue to payment →'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
