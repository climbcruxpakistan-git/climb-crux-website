import { useSearchParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

export default function PaymentFailed() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = searchParams.get('booking_id')

  const handleRetry = () => {
    if (bookingId) {
      navigate(`/book-now?retry=${bookingId}`)
    } else {
      navigate('/book-now')
    }
  }

  const handleBankTransfer = () => {
    if (bookingId) {
      navigate(`/book-now?bank=${bookingId}`)
    } else {
      navigate('/book-now')
    }
  }

  return (
    <>
      <PageHeader title="Payment could not be completed">
        <p>Something went wrong during the payment process. Please try again or choose a different payment method.</p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="form-card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
            <div className="payment-failed-content">
              <div className="failed-icon" style={{ color: '#dc2626', marginBottom: 16 }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>

              <h3 style={{ color: '#dc2626', marginBottom: 8 }}>Payment Failed</h3>
              <p style={{ color: 'var(--stone-dark)', maxWidth: '36ch', margin: '0 auto 28px' }}>
                Your payment could not be processed. Your booking is still saved — you can try again or use bank transfer instead.
              </p>

              <div className="failed-actions" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
                <button className="btn btn-primary" onClick={handleRetry} style={{ width: '100%', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Retry Payment
                </button>
                <button className="btn btn-outline" onClick={handleBankTransfer} style={{ width: '100%', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  Choose Bank Transfer
                </button>
              </div>

              <a href="/" className="btn btn-outline" style={{ marginTop: 20 }}>Back to home</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
