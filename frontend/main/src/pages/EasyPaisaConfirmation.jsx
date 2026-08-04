import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getBookingByNumber } from '../api.js'

export default function EasyPaisaConfirmation() {
  const { bookingNumber } = useParams()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingNumber) return
    getBookingByNumber(bookingNumber)
      .then(setBooking)
      .catch(() => setError('Booking not found'))
      .finally(() => setLoading(false))
  }, [bookingNumber])

  if (loading) {
    return (
      <section className="section">
        <div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
          <p style={{ color: 'var(--stone)' }}>Loading…</p>
        </div>
      </section>
    )
  }

  const b = booking || {}
  const name = b.customer_name || ''

  return (
    <>
      <PageHeader title="Payment Submitted for Verification" />
      <section className="section">
        <div className="wrap">
          <div className="form-card" style={{ maxWidth: 580, margin: '0 auto' }}>
            <div className="payment-success">
              <div className="success-icon" style={{ color: 'var(--orange)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 style={{ color: 'var(--orange)' }}>EasyPaisa Transfer Submitted</h3>
              {name && <p className="success-desc">Thank you, <strong>{name}</strong>! Your payment proof has been submitted for verification.</p>}

              {/* Booking Number */}
              <div className="bank-confirm-card">
                <div className="bank-confirm-label">Booking Number</div>
                <div className="bank-confirm-number">{b.booking_number || bookingNumber}</div>
              </div>

              {/* Success Details */}
              <div className="success-details">
                <div className="success-detail-row">
                  <span>Amount</span>
                  <span><strong>PKR {(b.amount || 0).toLocaleString()}</strong></span>
                </div>
                <div className="success-detail-row">
                  <span>Payment method</span>
                  <span>EasyPaisa</span>
                </div>
                <div className="success-detail-row">
                  <span>Status</span>
                  <span className="status-pending">Awaiting Verification</span>
                </div>
              </div>

              {/* Our EasyPaisa reference */}
              <div className="payment-bank-info" style={{ marginBottom: 24, textAlign: 'left' }}>
                <div className="bank-info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <div>
                  <p className="bank-detail-title">You sent your payment to</p>
                  <p className="bank-detail-row"><span className="bank-label">Account:</span> Saif Ud Din</p>
                  <p className="bank-detail-row"><span className="bank-label">EasyPaisa number:</span> 0313 2690377</p>
                </div>
              </div>

              {/* What happens next */}
              <div className="bank-whatsapp-section">
                <div className="bank-whatsapp-number">
                  <span className="bank-whatsapp-label">Status</span>
                  <span className="status-pending">Awaiting Verification</span>
                </div>
                <p className="success-note" style={{ textAlign: 'center', maxWidth: '44ch' }}>
                  Our team will verify your payment and <strong>email you</strong> once your booking is confirmed.
                  Please check your inbox (including spam) for updates.
                </p>
              </div>

              <Link to="/" className="btn btn-outline" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
