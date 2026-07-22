import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { checkPaymentStatus, getBooking } from '../api.js'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = searchParams.get('booking_id')
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState('')
  const [dots, setDots] = useState('')

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Poll payment status
  useEffect(() => {
    if (!bookingId) {
      setError('No booking reference found.')
      return
    }

    let cancelled = false
    let retries = 0
    const maxRetries = 20
    const interval = 2000

    async function poll() {
      while (!cancelled && retries < maxRetries) {
        try {
          const result = await checkPaymentStatus(bookingId)
          if (cancelled) return

          if (result.paymentStatus === 'paid') {
            // Payment confirmed — redirect to confirmation page
            const booking = await getBooking(bookingId)
            const bookingNumber = booking.bookingNumber || `CCP-${new Date().getFullYear()}-${(bookingId || '').slice(-5)}`
            navigate(`/booking/confirmed/${encodeURIComponent(bookingNumber)}`, { replace: true })
            return
          }

          if (result.paymentStatus === 'failed') {
            navigate(`/payment/failed?booking_id=${bookingId}`, { replace: true })
            return
          }

          // Still processing — wait and retry
          setStatus('processing')
        } catch {
          // API error — keep retrying
        }
        retries++
        await new Promise((r) => setTimeout(r, interval))
      }

      // Max retries reached — still pending
      if (!cancelled) {
        setStatus('pending')
        setError('Your payment is taking longer than expected. Please wait or contact support.')
      }
    }

    poll()

    return () => { cancelled = true }
  }, [bookingId, navigate])

  return (
    <>
      <PageHeader title="Processing your payment">
        <p>Please wait while we confirm your transaction.</p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="form-card" style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
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
                Processing your payment{dots}
              </h3>

              <p className="processing-desc" style={{ color: 'var(--stone-dark)', maxWidth: '36ch', margin: '12px auto 0' }}>
                Please wait while we verify your payment with SafePay.
                Your booking will be confirmed automatically.
              </p>

              {error && (
                <div className="form-error-banner" style={{ textAlign: 'left', marginTop: 20 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-actions" style={{ justifyContent: 'center', marginTop: 28 }}>
                <a href="/" className="btn btn-outline">Back to home</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
