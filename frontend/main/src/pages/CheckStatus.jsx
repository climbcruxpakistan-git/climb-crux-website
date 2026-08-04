import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { checkStatus } from '../api.js'
import './CheckStatus.css'

/**
 * Public status checker — lets customers track a booking or membership using
 * only their reference code. The backend never returns personal data; this
 * page renders the generic status + message returned by /api/status/check.
 */
const STATUS_META = {
  booking_received: {
    emoji: '🟡', label: 'Booking Received', color: 'yellow',
    message: 'We have successfully received your booking request. Please complete your payment and upload your payment proof if you haven\u2019t already.',
  },
  payment_pending: {
    emoji: '🟠', label: 'Payment Pending', color: 'orange',
    message: 'We are waiting for your payment proof to be uploaded.',
  },
  under_verification: {
    emoji: '🔵', label: 'Under Verification', color: 'blue',
    message: 'Your payment proof has been received and is currently being reviewed by the Climb Crux team. We will notify you once verification is complete.',
  },
  booking_confirmed: {
    emoji: '🟢', label: 'Booking Confirmed', color: 'green',
    message: 'Your booking has been confirmed. A confirmation email has been sent with all the necessary details. We look forward to climbing with you!',
  },
  booking_declined: {
    emoji: '🔴', label: 'Booking Declined', color: 'red',
    message: 'Unfortunately, your booking could not be confirmed. Please check your email for more information or contact Climb Crux if you need assistance.',
  },
  membership_pending: {
    emoji: '🟠', label: 'Membership Pending Verification', color: 'orange',
    message: 'Your membership request has been received and is awaiting payment verification.',
  },
  membership_active: {
    emoji: '🟢', label: 'Membership Active', color: 'green',
    message: 'Your membership has been approved successfully. Please check your email for your confirmation and membership details.',
  },
  membership_declined: {
    emoji: '🔴', label: 'Membership Declined', color: 'red',
    message: 'Your membership request could not be approved. Please check your email for the reason or contact Climb Crux for assistance.',
  },
  not_found: {
    emoji: '⚪', label: 'No Record Found', color: 'gray',
    message: 'We couldn\u2019t find a booking or membership with the reference code you entered. Please check the code and try again.',
  },
}

const BOOKING_STEPS = ['Booking Received', 'Payment Uploaded', 'Under Verification', 'Booking Confirmed']
const MEMBERSHIP_STEPS = ['Application Received', 'Payment & Review', 'Membership Active']

/** Simple progress tracker — shows where a request is in its flow. */
function progressSteps(result) {
  if (result.status === 'booking_received') {
    return BOOKING_STEPS.map((label, i) => ({ label, state: i === 0 ? 'done' : 'todo' }))
  }
  if (result.status === 'payment_pending') {
    return BOOKING_STEPS.map((label, i) => ({ label, state: i === 0 ? 'done' : i === 1 ? 'current' : 'todo' }))
  }
  if (result.status === 'under_verification') {
    return BOOKING_STEPS.map((label, i) => ({ label, state: i <= 1 ? 'done' : i === 2 ? 'current' : 'todo' }))
  }
  if (result.status === 'booking_confirmed') {
    return BOOKING_STEPS.map((label) => ({ label, state: 'done' }))
  }
  if (result.status === 'membership_pending') {
    return MEMBERSHIP_STEPS.map((label, i) => ({ label, state: i === 0 ? 'done' : i === 1 ? 'current' : 'todo' }))
  }
  if (result.status === 'membership_active') {
    return MEMBERSHIP_STEPS.map((label) => ({ label, state: 'done' }))
  }
  return []
}

function ResultCard({ result }) {
  const meta = STATUS_META[result.status] || STATUS_META.not_found
  const steps = result.found ? progressSteps(result) : []

  return (
    <div className={`cs-result cs-result--${meta.color}`} role="status">
      <div className="cs-badge">
        <span className="cs-badge-emoji" aria-hidden="true">{meta.emoji}</span>
        <span className="cs-badge-label">{meta.label}</span>
      </div>
      {result.found && (
        <p className="cs-code">Reference: <strong>{result.code}</strong></p>
      )}
      <p className="cs-message">{meta.message}</p>
      {steps.length > 0 && (
        <div className="cs-steps" aria-label="Progress">
          {steps.map((s, i) => (
            <div key={i} className={`cs-step ${s.state === 'done' ? 'is-done' : ''} ${s.state === 'current' ? 'is-current' : ''}`}>
              <span className="cs-step-dot" aria-hidden="true">
                {s.state === 'done' ? '✓' : s.state === 'current' ? '●' : '○'}
              </span>
              <span className="cs-step-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CheckStatus() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const code = input.trim()
    if (!code) {
      setError('Please enter your Booking ID or Membership ID.')
      setResult(null)
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await checkStatus(code)
      setResult(data)
    } catch (err) {
      setError('Something went wrong. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Track your request" title="Check Your Booking or Membership Status">
        <p>Enter your Booking ID or Membership ID to view the current status of your request.</p>
      </PageHeader>

      <section className="cs-section">
        <div className="cs-wrap">
          <div className="form-card cs-search-card">
            <form className="cs-form" onSubmit={handleSubmit} role="search">
              <input
                className="cs-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter Booking ID or Membership ID"
                aria-label="Booking ID or Membership ID"
                autoComplete="off"
                spellCheck="false"
              />
              <button type="submit" className="btn btn-primary cs-submit" disabled={loading}>
                {loading ? 'Checking…' : 'Check Status'}
              </button>
            </form>
            <p className="cs-hint">
              Examples: <code>CCS-2026-00001</code> or <code>CCM-2026-00001</code>
            </p>
          </div>

          {error && <div className="cs-error">{error}</div>}

          {loading && (
            <div className="cs-loading" aria-live="polite">
              <span className="cs-spinner" aria-hidden="true" />
              <span>Looking up your status…</span>
            </div>
          )}

          {result && !loading && <ResultCard result={result} />}

          <p className="cs-privacy-note">
            🔒 Only your current status is shown. We never display personal or payment details on this page.
          </p>
        </div>
      </section>
    </>
  )
}
