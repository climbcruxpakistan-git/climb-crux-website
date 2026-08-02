import { useState, useEffect } from 'react'
import { getBookingByNumber, createPayment } from '../../lib/api'

const WHATSAPP_NUMBER = '+92 313 2690377'

export default function PaymentPage({ bookingNumber }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [flow, setFlow] = useState('select')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [easypaisaSender, setEasypaisaSender] = useState('')
  const [easypaisaPhone, setEasypaisaPhone] = useState('')

  useEffect(() => {
    if (!bookingNumber) return
    getBookingByNumber(bookingNumber)
      .then((b) => {
        setBooking(b)
        if (b.payment_method === 'bank_transfer' || b.payment_method === 'bank') {
          window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/bank-transfer-confirmation`
        } else if (b.payment_method === 'easypaisa') {
          window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/easypaisa-confirmation`
        }
      })
      .catch(() => setError('Booking not found. Please check your booking number and try again.'))
      .finally(() => setLoading(false))
  }, [bookingNumber])

  function handleMethodSelect(method) {
    setPaymentMethod(method)
    if (method === 'bank_transfer') setFlow('bank-form')
    if (method === 'easypaisa') setFlow('easypaisa-form')
  }

  async function handleBankSubmit(e) {
    e.preventDefault(); setError(''); setSending(true)
    try {
      await createPayment(booking.id, { method: 'bank_transfer', payer_name: accountHolder, payer_bank: bankName })
      window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/bank-transfer-confirmation`
    } catch { setError('Failed to process payment. Please try again.') } finally { setSending(false) }
  }

  async function handleEasypaisaSubmit(e) {
    e.preventDefault(); setError(''); setSending(true)
    try {
      await createPayment(booking.id, { method: 'easypaisa', payer_name: easypaisaSender, payer_phone: easypaisaPhone })
      window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/easypaisa-confirmation`
    } catch { setError('Failed to process payment. Please try again.') } finally { setSending(false) }
  }

  function getSessionLabel(sessionId) {
    const map = { public: 'Public Session', private: 'Private Session', membership: 'Monthly Membership', 'custom-group': 'Custom Group Session' }
    return map[sessionId] || sessionId?.replace(/-/g, ' ') || '—'
  }

  if (loading) {
    return (
      <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
        <p style={{ color: 'var(--stone)' }}>Loading booking details…</p>
      </div></section>
    )
  }

  if (error && !booking) {
    return (
      <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h3>Booking not found</h3>
        <p style={{ color: 'var(--stone)', maxWidth: '40ch', margin: '8px auto 24px' }}>{error}</p>
        <a href="/book-now" className="btn btn-primary">Back to booking</a>
      </div></section>
    )
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="form-card" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="booking-summary">
            <h3 className="summary-title">Booking summary</h3>
            <div className="summary-grid">
              <div className="summary-item"><span className="summary-key">Booking #</span><span className="summary-val ref-code">{booking.booking_number || bookingNumber}</span></div>
              <div className="summary-item"><span className="summary-key">Session</span><span className="summary-val">{getSessionLabel(booking.session_id)}</span></div>
              <div className="summary-item"><span className="summary-key">Name</span><span className="summary-val">{booking.customer_name}</span></div>
              <div className="summary-item"><span className="summary-key">People</span><span className="summary-val">{booking.participants}</span></div>
              <div className="summary-item"><span className="summary-key">Date</span><span className="summary-val">{booking.date || 'To be confirmed'}</span></div>
              <div className="summary-item" style={{ gridColumn: '1 / -1' }}><span className="summary-key">Email / Phone</span><span className="summary-val" style={{ fontSize: '0.85rem' }}>{booking.customer_email} · {booking.customer_phone}</span></div>
            </div>
            <div className="summary-total"><span>Total to pay</span><span className="summary-amount">PKR {(booking.amount || 0).toLocaleString()}</span></div>
          </div>

          {error && (
            <div className="form-error-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          {flow === 'select' && (
            <>
              <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16 }}>Choose payment method</h3>
              <div className="payment-method-grid">
                <div className={`payment-method-card ${paymentMethod === 'bank_transfer' ? 'is-selected' : ''}`} onClick={() => handleMethodSelect('bank_transfer')}>
                  <div className="payment-method-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                  <span className="payment-method-label">Bank Transfer</span>
                  <div className="payment-method-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                </div>
                <div className={`payment-method-card ${paymentMethod === 'easypaisa' ? 'is-selected' : ''}`} onClick={() => handleMethodSelect('easypaisa')}>
                  <div className="payment-method-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg></div>
                  <span className="payment-method-label">EasyPaisa</span>
                  <div className="payment-method-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                </div>
                <div className="payment-method-card" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <div className="payment-method-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg></div>
                  <span className="payment-method-label">Credit / Debit Card<span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginTop: 2 }}>Coming soon</span></span>
                </div>
              </div>
              <div className="form-actions">
                <a href="/book-now" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>← Change details</a>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!paymentMethod}
                  onClick={() => { if (paymentMethod === 'bank_transfer') setFlow('bank-form'); if (paymentMethod === 'easypaisa') setFlow('easypaisa-form') }}>Continue</button>
              </div>
            </>
          )}

          {flow === 'bank-form' && (
            <form onSubmit={handleBankSubmit}>
              <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16 }}>Bank Transfer Details</h3>
              <div className="payment-bank-info">
                <div className="bank-info-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                <div>
                  <p className="bank-detail-title">Transfer to our bank account</p>
                  <p className="bank-detail-row"><span className="bank-label">Bank:</span> Bank Al Habib Limited</p>
                  <p className="bank-detail-row"><span className="bank-label">Account name:</span> CLIMB CRUX</p>
                  <p className="bank-detail-row"><span className="bank-label">IBAN:</span> PK93 BAHL 5742 0081 0003 9501</p>
                  <p className="bank-detail-row"><span className="bank-label">Branch Code:</span> 5742</p>
                  <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>Please transfer <strong>PKR {(booking.amount || 0).toLocaleString()}</strong> to the account above.</p>
                  <div style={{ marginTop: 12, padding: 12, background: '#fef7ed', border: '1px solid #fde4c8', borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--stone-dark)', lineHeight: 1.5 }}><strong style={{ color: 'var(--orange-dark)' }}>📤 After sending the payment</strong>, please send the payment proof/screenshot to our WhatsApp at <strong style={{ color: 'var(--orange-dark)' }}>{WHATSAPP_NUMBER}</strong> for verification along with your booking number.</p>
                  </div>
                </div>
              </div>
              <div className="field"><label>Sender bank name</label><input type="text" placeholder="e.g. HBL, Meezan Bank, UBL" required value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
              <div className="field"><label>Account holder name</label><input type="text" placeholder="Name on the account used for payment" required value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} /></div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setFlow('select')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button type="submit" className="btn btn-primary" disabled={sending} style={{ flex: 1, justifyContent: 'center' }}>{sending ? <><span className="btn-spinner" /> Processing…</> : 'Submit & Confirm'}</button>
              </div>
            </form>
          )}

          {flow === 'easypaisa-form' && (
            <form onSubmit={handleEasypaisaSubmit}>
              <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16 }}>EasyPaisa Transfer Details</h3>
              <div className="payment-bank-info">
                <div className="bank-info-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg></div>
                <div>
                  <p className="bank-detail-title">Send payment via EasyPaisa</p>
                  <p className="bank-detail-row"><span className="bank-label">EasyPaisa number:</span> 0313 2690377</p>
                  <p className="bank-detail-row"><span className="bank-label">Account name:</span> Saif Ud Din</p>
                  <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>Please send <strong>PKR {(booking.amount || 0).toLocaleString()}</strong> to the EasyPaisa account above.</p>
                  <div style={{ marginTop: 12, padding: 12, background: '#fef7ed', border: '1px solid #fde4c8', borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--stone-dark)', lineHeight: 1.5 }}><strong style={{ color: 'var(--orange-dark)' }}>📤 After sending the payment</strong>, please send the payment proof/screenshot to our WhatsApp at <strong style={{ color: 'var(--orange-dark)' }}>{WHATSAPP_NUMBER}</strong>.</p>
                  </div>
                </div>
              </div>
              <div className="field"><label>Sender name</label><input type="text" placeholder="Your full name" required value={easypaisaSender} onChange={(e) => setEasypaisaSender(e.target.value)} /></div>
              <div className="field"><label>Phone number</label><input type="tel" placeholder="03XX-XXXXXXX" required value={easypaisaPhone} onChange={(e) => setEasypaisaPhone(e.target.value)} /></div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setFlow('select')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button type="submit" className="btn btn-primary" disabled={sending} style={{ flex: 1, justifyContent: 'center' }}>{sending ? <><span className="btn-spinner" /> Processing…</> : 'Submit & Confirm'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
