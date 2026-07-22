import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getBookingByNumber } from '../api.js'

export default function BankTransferConfirmation() {
  const { bookingNumber } = useParams()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const WHATSAPP_NUMBER = '+92 313 2690377'
  const WHATSAPP_NUMBER_CLEAN = '923132690377'

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
      <PageHeader title="Payment Verification Required" />
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
              <h3 style={{ color: 'var(--orange)' }}>Bank Transfer Submitted</h3>
              {name && <p className="success-desc">Thank you, <strong>{name}</strong>! Your booking is awaiting payment verification.</p>}

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
                  <span>Bank Transfer</span>
                </div>
                <div className="success-detail-row">
                  <span>Status</span>
                  <span className="status-pending">Awaiting Confirmation</span>
                </div>
              </div>

              {/* Instructions */}
              <p className="success-note" style={{ textAlign: 'center', maxWidth: '44ch' }}>
                Please send the payment screenshot on WhatsApp along with your booking number for verification.
                Your booking will be confirmed after payment verification.
              </p>

              {/* WhatsApp Section */}
              <div className="bank-whatsapp-section">
                <div className="bank-whatsapp-number">
                  <span className="bank-whatsapp-label">WhatsApp Number</span>
                  <span className="bank-whatsapp-value">{WHATSAPP_NUMBER}</span>
                </div>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER_CLEAN}?text=${encodeURIComponent(
                    `Hello Climb Crux,\n\nI have made the payment for my booking.\n\nBooking Number: ${b.booking_number || bookingNumber}\nName: ${name}\n\nPlease find my payment screenshot attached for verification.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ gap: 10, fontSize: '1rem', padding: '1em 2em', width: '100%', justifyContent: 'center' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Send Payment Proof on WhatsApp
                </a>
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
