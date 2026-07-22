import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { checkPaymentStatus, getBooking } from '../api.js'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = searchParams.get('booking_id')
  const [pollState, setPollState] = useState('processing') // processing | confirmed | failed | timeout
  const [bookingInfo, setBookingInfo] = useState(null)
  const [dots, setDots] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Poll payment status — re-runs when retryCount changes (for "Check Again")
  useEffect(() => {
    if (!bookingId) {
      setPollState('timeout')
      return
    }

    let cancelled = false
    let retries = 0
    const maxRetries = 30
    const interval = 2000

    async function poll() {
      while (!cancelled && retries < maxRetries) {
        try {
          const result = await checkPaymentStatus(bookingId)
          if (cancelled) return

          // Store booking info as soon as we get it
          if (result.bookingNumber) {
            setBookingInfo((prev) => prev || { bookingNumber: result.bookingNumber, name: result.name })
          }

          if (result.paymentStatus === 'paid') {
            setPollState('confirmed')
            // Fetch full booking and redirect to confirmation page
            try {
              const booking = await getBooking(bookingId)
              const bookingNumber = booking.bookingNumber || result.bookingNumber
              navigate(`/booking/confirmed/${encodeURIComponent(bookingNumber)}`, { replace: true })
            } catch {
              navigate(`/booking/confirmed/${encodeURIComponent(result.bookingNumber || '')}`, { replace: true })
            }
            return
          }

          if (result.paymentStatus === 'failed') {
            setPollState('failed')
            setTimeout(() => navigate(`/payment/failed?booking_id=${bookingId}`, { replace: true }), 1500)
            return
          }

          // Still processing
          setPollState('processing')
        } catch {
          // API error — keep retrying
        }
        retries++
        await new Promise((r) => setTimeout(r, interval))
      }

      // Max retries reached
      if (!cancelled) {
        setPollState('timeout')
        // One final fetch to get booking info
        try {
          const result = await checkPaymentStatus(bookingId)
          if (result.bookingNumber) {
            setBookingInfo({ bookingNumber: result.bookingNumber, name: result.name })
          }
        } catch { /* ignore */ }
      }
    }

    poll()

    return () => { cancelled = true }
  }, [bookingId, navigate, retryCount])

  return (
    <>
      <PageHeader title="Processing your payment">
        <p>Please wait while we confirm your transaction.</p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="form-card" style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
            {pollState !== 'timeout' && pollState !== 'failed' && (
              <div className="processing-payment">
                <div className="processing-spinner">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" stroke="var(--chalk-dim)" strokeWidth="4" />
                    <circle
                      cx="32" cy="32" r="28"
                      stroke="var(--orange)" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="176" strokeDashoffset="50"
                      className="processing-circle"
                    />
                  </svg>
                </div>

                <h3 style={{ marginTop: 24, color: 'var(--charcoal)' }}>
                  Confirming your payment{dots}
                </h3>

                <p className="processing-desc" style={{ color: 'var(--stone-dark)', maxWidth: '36ch', margin: '12px auto 0' }}>
                  Please wait while we verify your payment with SafePay.
                  Your booking will be confirmed automatically.
                </p>

                {/* Show booking number while waiting if available */}
                {bookingInfo?.bookingNumber && (
                  <div style={{ marginTop: 24, padding: '12px 20px', background: '#f8f6f2', borderRadius: 8, display: 'inline-block' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#9c9484', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                      Booking Reference
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                      {bookingInfo.bookingNumber}
                    </span>
                  </div>
                )}

                <div className="form-actions" style={{ justifyContent: 'center', marginTop: 28 }}>
                  <a href="/" className="btn btn-outline">Back to home</a>
                </div>
              </div>
            )}

            {/* Failed state */}
            {pollState === 'failed' && (
              <div className="payment-success">
                <div className="failed-icon" style={{ color: '#dc2626' }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h3 style={{ color: '#dc2626' }}>Payment Failed</h3>
                <p style={{ color: 'var(--stone-dark)' }}>
                  Your payment could not be processed. You will be redirected shortly.
                </p>
              </div>
            )}

            {/* Timeout state - confirmation taking too long */}
            {pollState === 'timeout' && (
              <div className="payment-success">
                <div style={{ color: 'var(--orange)', marginBottom: 12 }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>

                <h3 style={{ color: 'var(--charcoal)' }}>Payment Processing</h3>
                <p style={{ color: 'var(--stone-dark)', maxWidth: '38ch', margin: '8px auto 0' }}>
                  Your payment is being processed but the confirmation is taking longer than usual.
                </p>

                {/* Booking number */}
                {bookingInfo?.bookingNumber ? (
                  <div className="bank-confirm-card" style={{ marginTop: 20 }}>
                    <div className="bank-confirm-label">Booking Number</div>
                    <div className="bank-confirm-number">{bookingInfo.bookingNumber}</div>
                    <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#9c9484' }}>
                      Please save this number for your records.
                    </p>
                  </div>
                ) : (
                  <p style={{ marginTop: 16, fontSize: '0.9rem', color: '#9c9484' }}>
                    Booking reference will appear here once available.
                  </p>
                )}

                <div style={{ background: '#fef7ed', borderLeft: '4px solid #f36f21', padding: '14px 18px', borderRadius: 4, margin: '20px 0', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#8c8578' }}>
                    <strong>Next steps:</strong> Your booking has been saved. If the payment was deducted, please save your booking number and contact us on WhatsApp to confirm.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setPollState('processing'); setRetryCount((c) => c + 1) }}
                    style={{ justifyContent: 'center' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Check Again
                  </button>
                  <a
                    href="https://wa.me/923001234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ justifyContent: 'center' }}
                  >
                    💬 Contact on WhatsApp
                  </a>
                  <a href="/" className="btn btn-outline" style={{ justifyContent: 'center' }}>Back to home</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
