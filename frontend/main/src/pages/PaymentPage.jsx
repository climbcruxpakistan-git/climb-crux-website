import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getBookingByNumber, updateBooking } from '../api.js'

export default function PaymentPage() {
  const { bookingNumber } = useParams()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  // Payment flow state: 'select' | 'bank' | 'confirm'
  const [flow, setFlow] = useState('select')
  const [paymentMethod, setPaymentMethod] = useState('')

  // Bank transfer details
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  // Confirmation display
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  useEffect(() => {
    if (!bookingNumber) return
    getBookingByNumber(bookingNumber)
      .then((b) => {
        setBooking(b)
        // If already has payment method, go straight to confirmed
        if (b.payment_method === 'bank') {
          setFlow('confirm')
          setConfirmedBooking(b)
        }
      })
      .catch(() => setError('Booking not found. Please check your booking number and try again.'))
      .finally(() => setLoading(false))
  }, [bookingNumber])

  function handleMethodSelect(method) {
    setPaymentMethod(method)
    if (method === 'bank') setFlow('bank')
  }

  async function handleBankSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)

    try {
      const updated = await updateBooking(booking.id, {
        payment_method: 'bank',
        payment_status: 'verification_required',
        booking_status: 'pending_verification',
        payer_bank: bankName,
        payer_name: accountHolder,
      })
      setConfirmedBooking(updated)
      setFlow('confirm')
    } catch (err) {
      setError('Failed to process payment. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function getSessionLabel(sessionId) {
    const map = {
      public: 'Public Session',
      private: 'Private Session',
      'custom-group': 'Custom Group Session',
    }
    return map[sessionId] || sessionId?.replace(/-/g, ' ') || '—'
  }

  if (loading) {
    return (
      <section className="section">
        <div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
          <p style={{ color: 'var(--stone)' }}>Loading booking details…</p>
        </div>
      </section>
    )
  }

  if (error && !booking) {
    return (
      <>
        <PageHeader title="Payment" />
        <section className="section">
          <div className="wrap" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3>Booking not found</h3>
            <p style={{ color: 'var(--stone)', maxWidth: '40ch', margin: '8px auto 24px' }}>
              {error}
            </p>
            <Link to="/book-now" className="btn btn-primary">Back to booking</Link>
          </div>
        </section>
      </>
    )
  }

  // ── Confirmation screen (after bank transfer submitted) ──
  if (flow === 'confirm') {
    const b = confirmedBooking || booking
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
                <h3 style={{ color: 'var(--orange)' }}>Booking Created!</h3>
                <p className="success-desc">
                  Your booking has been created successfully, <strong>{b.customer_name}</strong>!
                </p>

                <div className="bank-confirm-card">
                  <div className="bank-confirm-label">Booking Number</div>
                  <div className="bank-confirm-number">{b.booking_number || bookingNumber}</div>
                </div>

                <div className="success-details">
                  <div className="success-detail-row">
                    <span>Session</span>
                    <span>{getSessionLabel(b.session_id)}</span>
                  </div>
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

                <p className="success-note" style={{ textAlign: 'center', maxWidth: '44ch' }}>
                  Please send the payment screenshot on WhatsApp along with your booking number for verification.
                  Your booking will be confirmed after payment verification.
                </p>

                <div className="bank-whatsapp-section">
                  <div className="bank-whatsapp-number">
                    <span className="bank-whatsapp-label">WhatsApp Number</span>
                    <span className="bank-whatsapp-value">+92 300 1234567</span>
                  </div>
                  <a
                    href={`https://wa.me/923001234567?text=Hello%20Climb%20Crux%2C%0A%0AI%20have%20made%20the%20payment%20for%20my%20booking.%0A%0ABooking%20Number%3A%20${encodeURIComponent(b.booking_number || bookingNumber)}%0AName%3A%20${encodeURIComponent(b.customer_name || '')}%0A%0APlease%20find%20my%20payment%20screenshot%20attached%20for%20verification.`}
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

  // ── Payment method selection / Bank transfer form ──
  return (
    <>
      <PageHeader title="Complete your payment.">
        <p>
          Review your booking details and choose how you'd like to pay.
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="form-card" style={{ maxWidth: 680, margin: '0 auto' }}>
            {/* Booking Summary */}
            <div className="booking-summary">
              <h3 className="summary-title">Booking summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-key">Session</span>
                  <span className="summary-val">{getSessionLabel(booking.session_id)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-key">Name</span>
                  <span className="summary-val">{booking.customer_name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-key">Email</span>
                  <span className="summary-val">{booking.customer_email}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-key">Phone</span>
                  <span className="summary-val">{booking.customer_phone}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-key">People</span>
                  <span className="summary-val">{booking.participants}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-key">Date</span>
                  <span className="summary-val">{booking.date || 'To be confirmed'}</span>
                </div>
              </div>
              <div className="summary-total">
                <span>Total to pay</span>
                <span className="summary-amount">PKR {(booking.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="form-error-banner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            {flow === 'select' && (
              <>
                <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16 }}>
                  Choose payment method
                </h3>

                <div className="payment-method-grid">
                  {/* Bank Transfer */}
                  <div
                    className={`payment-method-card ${paymentMethod === 'bank' ? 'is-selected' : ''}`}
                    onClick={() => handleMethodSelect('bank')}
                  >
                    <div className="payment-method-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <span className="payment-method-label">Bank Transfer</span>
                    <div className="payment-method-check">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <Link to="/book-now" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                    ← Change details
                  </Link>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    disabled={!paymentMethod}
                    onClick={() => paymentMethod === 'bank' && setFlow('bank')}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {flow === 'bank' && (
              <form onSubmit={handleBankSubmit}>
                <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16 }}>
                  Bank Transfer Details
                </h3>

                {/* Bank Account Details */}
                <div className="payment-bank-info">
                  <div className="bank-info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <p className="bank-detail-title">Transfer to our bank account</p>
                    <p className="bank-detail-row"><span className="bank-label">Bank:</span> Habib Bank Limited (HBL)</p>
                    <p className="bank-detail-row"><span className="bank-label">Account title:</span> Climb Crux Pakistan</p>
                    <p className="bank-detail-row"><span className="bank-label">Account # / IBAN:</span> PK36 HABB 1234 5678 9012 3456</p>
                    <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
                      Please transfer the full booking amount of <strong>PKR {(booking.amount || 0).toLocaleString()}</strong> to the account above.
                    </p>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="bank-name">Sender bank name</label>
                  <input
                    id="bank-name"
                    type="text"
                    placeholder="e.g. HBL, Meezan Bank, UBL"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="account-holder">Account holder name</label>
                  <input
                    id="account-holder"
                    type="text"
                    placeholder="Name on the account used for payment"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                  />
                </div>

                <div className="bank-booking-ref">
                  <span className="bank-ref-label">Your booking number</span>
                  <span className="bank-ref-value">{booking.booking_number || bookingNumber}</span>
                  <p className="bank-ref-note">Use this number when sending your payment proof on WhatsApp.</p>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setFlow('select')} style={{ flex: 1, justifyContent: 'center' }}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={sending} style={{ flex: 1, justifyContent: 'center' }}>
                    {sending ? <><span className="btn-spinner" /> Processing…</> : 'Submit & Get Booking Number'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
