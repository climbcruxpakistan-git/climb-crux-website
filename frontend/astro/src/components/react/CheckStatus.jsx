import { useState } from 'react'
import { checkStatus } from '../../lib/api.js'

/**
 * Public status checker — lets customers track a booking or membership using
 * only their reference code. The backend never returns personal data; this
 * component renders the generic status + message returned by /api/status/check.
 */
const STATUS_META = {
  // ── Session booking lifecycle ──
  booking_received: {
    emoji: '🟡', label: 'Booking Received', color: 'yellow',
    message: 'We have successfully received your booking request. Please complete your payment to continue with the verification process.',
  },
  payment_pending: {
    emoji: '🟠', label: 'Payment Pending', color: 'orange',
    message: 'We are waiting for your payment proof.',
  },
  under_verification: {
    emoji: '🔵', label: 'Under Verification', color: 'blue',
    message: 'Your payment has been received and is currently being verified by the Climb Crux team.',
  },
  booking_confirmed: {
    emoji: '🟢', label: 'Booking Confirmed', color: 'green',
    message: 'Your booking has been confirmed. Please check your confirmation email for your session details.',
  },
  session_completed: {
    emoji: '⚪', label: 'Session Completed', color: 'gray',
    message: 'Your climbing session has been completed. Thank you for climbing with Climb Crux. We look forward to seeing you again.',
    cta: { label: 'Book Another Session', url: '/book-now' },
  },
  booking_declined: {
    emoji: '🔴', label: 'Booking Declined', color: 'red',
    message: 'Unfortunately, your booking could not be confirmed. Please check your email for more information or contact Climb Crux for assistance.',
  },
  booking_expired: {
    emoji: '⚫', label: 'Booking Expired', color: 'gray',
    message: 'This booking request has expired because payment was not completed within the required time.',
    cta: { label: 'Book New Session', url: '/book-now' },
  },
  // ── Membership lifecycle ──
  membership_received: {
    emoji: '🟡', label: 'Membership Received', color: 'yellow',
    message: 'Your membership request has been received. Please complete your payment to continue with the verification process.',
  },
  membership_active: {
    emoji: '🟢', label: 'Membership Active', color: 'green',
    message: 'Your membership is active.',
  },
  membership_expired: {
    emoji: '⚪', label: 'Membership Expired', color: 'gray',
    message: 'Your membership has expired. Renew your membership to continue enjoying member benefits.',
    cta: { label: 'Renew Membership', url: '/membership/apply' },
  },
  membership_declined: {
    emoji: '🔴', label: 'Membership Declined', color: 'red',
    message: 'Unfortunately, your membership request could not be approved. Please check your email for further information.',
  },
  // ── Equipment order lifecycle ──
  order_received: {
    emoji: '🟡', label: 'Order Received', color: 'yellow',
    message: 'We have received your equipment order. Please complete your payment and upload your payment screenshot to continue.',
  },
  order_confirmed: {
    emoji: '🟢', label: 'Order Confirmed', color: 'green',
    message: 'Your payment has been verified and your order is confirmed. Check your email for your order confirmation.',
  },
  order_processing: {
    emoji: '🟢', label: 'Order Processing', color: 'green',
    message: 'Your order is confirmed and is now being processed by the Climb Crux team.',
  },
  order_ready: {
    emoji: '🟢', label: 'Ready for Pickup', color: 'green',
    message: 'Your order is ready for pickup. Please arrange to collect it.',
  },
  order_shipped: {
    emoji: '🟢', label: 'Shipped', color: 'green',
    message: 'Your order has been shipped. Please watch out for delivery updates.',
  },
  order_delivered: {
    emoji: '⚪', label: 'Delivered', color: 'gray',
    message: 'Your order has been delivered. Thank you for shopping with Climb Crux!',
  },
  order_declined: {
    emoji: '🔴', label: 'Order Declined', color: 'red',
    message: 'Unfortunately, your payment could not be verified, so your order has been declined. Please check your email for more information or contact Climb Crux for assistance.',
  },
  not_found: {
    emoji: '⚪', label: 'No Record Found', color: 'gray',
    message: 'We couldn\u2019t find a booking, membership or order with the reference code you entered. Please check the code and try again.',
  },
}

/** "2026-08-15" → "Saturday, 01-10-2026" (weekday + DD-MM-YYYY) */
function formatStatusDate(iso) {
  if (!iso) return ''
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return String(iso)
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${weekdays[d.getDay()]}, ${m[3]}-${m[2]}-${m[1]}`
}

/** Simple progress tracker — shows where a request is in its flow. */
function progressSteps(result) {
  if (result.type === 'order') {
    const steps = ['Order Received', 'Payment', 'Under Verification', 'Confirmed', 'Delivered']
    const byStatus = {
      order_received: ['done', 'todo', 'todo', 'todo', 'todo'],
      payment_pending: ['done', 'current', 'todo', 'todo', 'todo'],
      under_verification: ['done', 'done', 'current', 'todo', 'todo'],
      order_confirmed: ['done', 'done', 'done', 'current', 'todo'],
      order_processing: ['done', 'done', 'done', 'current', 'todo'],
      order_ready: ['done', 'done', 'done', 'current', 'todo'],
      order_shipped: ['done', 'done', 'done', 'current', 'todo'],
      order_delivered: ['done', 'done', 'done', 'done', 'done'],
    }
    const states = byStatus[result.status] || []
    return states.map((state, i) => ({ label: steps[i], state }))
  }
  if (result.type === 'membership') {
    const steps = ['Application Received', 'Payment & Review', 'Membership Active']
    switch (result.status) {
      case 'membership_received':
        return steps.map((label, i) => ({ label, state: i === 0 ? 'done' : 'todo' }))
      case 'payment_pending':
        return steps.map((label, i) => ({ label, state: i === 0 ? 'done' : i === 1 ? 'current' : 'todo' }))
      case 'under_verification':
        return steps.map((label, i) => ({ label, state: i <= 1 ? 'done' : i === 2 ? 'current' : 'todo' }))
      case 'membership_active':
        return steps.map((label) => ({ label, state: 'done' }))
      case 'membership_expired':
        return steps.map((label, i) => ({ label, state: i < 2 ? 'done' : 'todo' }))
      default:
        return []
    }
  }
  const steps = ['Booking Received', 'Payment Pending', 'Under Verification', 'Booking Confirmed']
  switch (result.status) {
    case 'booking_received':
      return steps.map((label, i) => ({ label, state: i === 0 ? 'done' : 'todo' }))
    case 'payment_pending':
      return steps.map((label, i) => ({ label, state: i === 0 ? 'done' : i === 1 ? 'current' : 'todo' }))
    case 'under_verification':
      return steps.map((label, i) => ({ label, state: i <= 1 ? 'done' : i === 2 ? 'current' : 'todo' }))
    case 'booking_confirmed':
    case 'session_completed':
      return steps.map((label) => ({ label, state: 'done' }))
    case 'booking_expired':
      return steps.map((label, i) => ({ label, state: i === 0 ? 'done' : 'todo' }))
    default:
      return []
  }
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
      {(result.startDate || result.expiryDate) && (
        <p className="cs-dates">
          {result.startDate ? <span>Valid from <strong>{result.startDate}</strong></span> : null}
          {result.startDate && result.expiryDate ? ' · ' : null}
          {result.expiryDate ? <span>Expires <strong>{result.expiryDate}</strong></span> : null}
        </p>
      )}
      {result.session && (
        <div className="cs-session">
          {result.session.title ? <div className="cs-session-title">{result.session.title}</div> : null}
          <div className="cs-session-row">📅 {formatStatusDate(result.session.date)}</div>
          {(result.session.startTime || result.session.endTime) ? (
            <div className="cs-session-row">🕘 {[result.session.startTime, result.session.endTime].filter(Boolean).join(' – ')}</div>
          ) : null}
          {result.session.location ? <div className="cs-session-row">📍 {result.session.location}</div> : null}
          {(result.status === 'booking_confirmed' || result.status === 'session_completed') && (
            <>
              <div className="cs-session-row">🤝 Meeting point: {result.session.meetingPoint || result.session.location}</div>
              {result.session.meetingTime ? <div className="cs-session-row">🕖 Meeting time: {result.session.meetingTime}</div> : null}
            </>
          )}
          {result.session.mapsUrl ? (
            <a className="cs-session-map" href={result.session.mapsUrl} target="_blank" rel="noreferrer">View Location →</a>
          ) : null}
        </div>
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
      {meta.cta && (
        <a className="btn btn-primary cs-cta" href={meta.cta.url}>
          {meta.cta.label} →
        </a>
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
      setError('Please enter your Booking ID, Membership ID or Order ID.')
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
    <section className="cs-section">
      <div className="cs-wrap">
        <div className="form-card cs-search-card">
          <form className="cs-form" onSubmit={handleSubmit} role="search">
            <input
              className="cs-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Booking ID, Membership ID or Order ID"
              aria-label="Booking ID, Membership ID or Order ID"
              autoComplete="off"
              spellCheck="false"
            />
            <button type="submit" className="btn btn-primary cs-submit" disabled={loading}>
              {loading ? 'Checking…' : 'Check Status'}
            </button>
          </form>
          <p className="cs-hint">
            Examples: <code>CCS-XXXXX</code>, <code>CCM-XXXX</code> or <code>CCE-XXXXXX</code>
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
  )
}
