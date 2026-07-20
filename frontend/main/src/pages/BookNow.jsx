import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { createBooking } from '../api.js'

export default function BookNow() {
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('type') || ''
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const sessionTypes = [
    { value: 'public', label: 'Public Session', desc: 'Join a guided group session on Margalla Hills — every other Sunday.' },
    { value: 'private', label: 'Private Session', desc: 'One-on-one or private group coaching tailored to your goals.' },
    { value: 'custom-group', label: 'Customize Group Session', desc: 'Build a session for your own group — pick the date, size, and focus.' },
  ]
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)

    const form = e.target
    const data = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      type: form['session-type'].value,
      date: form['preferred-date'].value,
      groupSize: form['group-size'].value,
      experience: form.experience.value,
      message: form.message.value,
      status: 'pending',
    }

    try {
      await createBooking(data)
      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit. Please try again.')
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
          We'll confirm your spot over WhatsApp or email.
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="form-card" style={{ maxWidth: 720, margin: '0 auto' }}>
            {submitted ? (
              <p className="form-success">
                Thanks — your request is in. We'll confirm your spot over WhatsApp or email shortly.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="form-success" style={{ background: '#dc2626', marginBottom: 20, fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

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
                    <label htmlFor="name">Full name</label>
                    <input id="name" type="text" required />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone / WhatsApp</label>
                    <input id="phone" type="tel" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" required />
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

                <div className="field">
                  <label htmlFor="experience">Experience level</label>
                  <select id="experience" defaultValue="">
                    <option value="" disabled>Select your experience</option>
                    <option value="beginner">First time — never climbed before</option>
                    <option value="some">A few times — know the basics</option>
                    <option value="intermediate">Regular climber — working on grades</option>
                    <option value="advanced">Experienced — training for harder routes</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="message">Anything we should know?</label>
                  <textarea id="message" rows="3" placeholder="Goals, injuries, group preferences, or questions…"></textarea>
                </div>

                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Submitting…' : 'Submit booking request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
