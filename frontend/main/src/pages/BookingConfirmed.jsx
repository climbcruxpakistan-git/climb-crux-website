import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getBookingByNumber } from '../api.js'

export default function BookingConfirmed() {
  const { bookingNumber } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingNumber) {
      setError('No booking number provided.')
      setLoading(false)
      return
    }

    getBookingByNumber(bookingNumber)
      .then(setBooking)
      .catch(() => setError('Could not load booking details.'))
      .finally(() => setLoading(false))
  }, [bookingNumber])

  if (loading) {
    return (
      <>
        <PageHeader title="Loading...">
          <p>Fetching your booking confirmation.</p>
        </PageHeader>
        <section className="section">
          <div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p>Loading...</p>
          </div>
        </section>
      </>
    )
  }

  if (error || !booking) {
    return (
      <>
        <PageHeader title="Booking not found">
          <p>We couldn't find a booking with that number.</p>
        </PageHeader>
        <section className="section">
          <div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--stone-dark)', marginBottom: 24 }}>{error || 'Please check your booking number and try again.'}</p>
            <a href="/" className="btn btn-primary">Back to home</a>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Payment Successful!">
        <p>Your booking has been confirmed. A confirmation email has been sent to your email address.</p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="form-card" style={{ maxWidth: 580, margin: '0 auto' }}>
            <div className="payment-success">
              <div className="success-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <h3 style={{ color: 'var(--charcoal)' }}>Booking Confirmed!</h3>

              <div className="bank-confirm-card" style={{ marginTop: 20 }}>
                <div className="bank-confirm-label">Booking Number</div>
                <div className="bank-confirm-number">{booking.bookingNumber || bookingNumber}</div>
              </div>

              <div className="success-details">
                <div className="success-detail-row">
                  <span>Name</span>
                  <span><strong>{booking.name}</strong></span>
                </div>
                <div className="success-detail-row">
                  <span>Session</span>
                  <span>{booking.type?.replace(/-/g, ' ') || '—'}</span>
                </div>
                <div className="success-detail-row">
                  <span>Amount</span>
                  <span><strong>PKR 2,500</strong></span>
                </div>
                <div className="success-detail-row">
                  <span>Payment method</span>
                  <span>Credit / Debit Card (SafePay)</span>
                </div>
                <div className="success-detail-row">
                  <span>Status</span>
                  <span className="status-paid">✓ Paid & Confirmed</span>
                </div>
                {booking.gatewayTransactionId && (
                  <div className="success-detail-row">
                    <span>Transaction ID</span>
                    <span className="ref-code" style={{ fontSize: '0.78rem' }}>{booking.gatewayTransactionId}</span>
                  </div>
                )}
              </div>

              <p className="success-note" style={{ textAlign: 'center' }}>
                A confirmation email has been sent to <strong>{booking.email}</strong>.
                We look forward to seeing you on the rocks! 🧗
              </p>

              <a href="/" className="btn btn-primary" style={{ marginTop: 8 }}>
                Back to home
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
