import { useState, useEffect } from 'react'
import { getBookingByNumber } from '../../lib/api'

export default function EasyPaisaConfirmation({ bookingNumber }) {
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
      <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
        <p style={{ color: 'var(--stone)' }}>Loading confirmation…</p>
      </div></section>
    )
  }

  if (!booking) {
    return (
      <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h3>Booking not found</h3>
        <p style={{ color: 'var(--stone)', margin: '8px auto 24px' }}>{error || 'Could not find this booking.'}</p>
        <a href="/book-now" className="btn btn-primary">Back to booking</a>
      </div></section>
    )
  }

  return (
    <section className="section">
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div className="payment-success" style={{ animation: 'fadeSlideIn 0.4s ease' }}>
          <div className="success-icon" style={{ color: '#22c55e', marginBottom: 16, animation: 'successPop 0.5s ease' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>EasyPaisa Transfer Selected</h3>
          <p className="success-desc" style={{ fontSize: '1rem', color: 'var(--stone-dark)', maxWidth: '40ch', marginBottom: 24 }}>
            Thank you! Please complete the EasyPaisa transfer to confirm your booking.
          </p>
        </div>

        <div className="booking-summary" style={{ width: '100%', marginBottom: 20 }}>
          <div className="bank-confirm-card" style={{ background: 'var(--charcoal)', padding: '24px 32px', borderRadius: 8, textAlign: 'center' }}>
            <div className="bank-confirm-label" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--stone)', marginBottom: 6 }}>
              Booking Number
            </div>
            <div className="bank-confirm-number" style={{ fontFamily: "'Courier New', monospace", fontSize: '1.3rem', fontWeight: 700, color: 'var(--orange-light)', letterSpacing: 2 }}>
              {booking.booking_number || bookingNumber}
            </div>
          </div>
        </div>

        <div className="payment-bank-info" style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 16, background: 'var(--chalk)', border: '1px solid var(--chalk-dim)', padding: '18px 22px', marginBottom: 20, borderLeft: '3px solid var(--orange)' }}>
          <div className="bank-info-icon" style={{ flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--charcoal)', color: 'var(--chalk)', borderRadius: 8 }}>
            📱
          </div>
          <div>
            <p className="bank-detail-title" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.06em', color: 'var(--charcoal)', marginBottom: 8 }}>
              EasyPaisa Account Details
            </p>
            <p className="bank-detail-row" style={{ fontSize: '0.85rem', color: 'var(--stone-dark)', marginBottom: 4 }}>
              <span className="bank-label" style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Number:</span> 0313 2690377
            </p>
            <p className="bank-detail-row"><span className="bank-label">Name:</span> Saif Ud Din</p>
            <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
              Amount: <strong>PKR {(booking.amount || 0).toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <div className="bank-whatsapp-section" style={{ width: '100%', marginBottom: 8, textAlign: 'left' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--charcoal)', marginBottom: 18 }}>✅ Submitted for verification</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--orange)', color: 'var(--chalk)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>1</div>
              <div><strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--charcoal)', marginBottom: 3 }}>We review your payment</strong><p style={{ fontSize: '0.85rem', color: 'var(--stone-dark)', margin: 0 }}>Our team checks your EasyPaisa transfer and screenshot against the booking.</p></div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--orange)', color: 'var(--chalk)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>2</div>
              <div><strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--charcoal)', marginBottom: 3 }}>You get an email</strong><p style={{ fontSize: '0.85rem', color: 'var(--stone-dark)', margin: 0 }}>Once verified, we email you your booking confirmation. Check your inbox (including spam).</p></div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--stone)', margin: '16px 0 0', textAlign: 'center', maxWidth: '40ch' }}>
          Your booking is pending until we verify your payment. We'll confirm within 24 hours.
        </p>
      </div>
    </section>
  )
}
