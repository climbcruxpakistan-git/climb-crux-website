import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { createBooking, updateBooking, createCheckoutSession, checkPaymentStatus, getBooking } from '../api.js'

function BankTransferForm() {
  return (
    <div className="payment-form-fields">
      <div className="payment-bank-info">
        <div className="bank-info-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="7" y1="15" x2="7.01" y2="15" />
            <line x1="11" y1="15" x2="13" y2="15" />
          </svg>
        </div>
        <div>
          <p className="bank-detail-title">Our bank details</p>
          <p className="bank-detail-row"><span className="bank-label">Bank:</span> Habib Bank Limited (HBL)</p>
          <p className="bank-detail-row"><span className="bank-label">Account title:</span> Climb Crux Pakistan</p>
          <p className="bank-detail-row"><span className="bank-label">Account #:</span> 1234 5678 9012 3456</p>
          <p className="bank-detail-row"><span className="bank-label">IBAN:</span> PK36 HABB 1234 5678 9012 3456</p>
        </div>
      </div>
      <div className="field">
        <label htmlFor="bank-name">Your bank name</label>
        <input id="bank-name" type="text" placeholder="e.g. Meezan Bank" required />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="account-holder">Account holder name</label>
          <input id="account-holder" type="text" placeholder="e.g. Muhammad Ali" required />
        </div>
        <div className="field">
          <label htmlFor="account-number">Your account number</label>
          <input id="account-number" type="text" inputMode="numeric" placeholder="e.g. 1234 5678 9012" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="transfer-id">Transaction / Reference ID</label>
        <input id="transfer-id" type="text" placeholder="Paste the transaction ID from your bank app" required />
      </div>
    </div>
  )
}

function EasyPaisaForm() {
  return (
    <div className="payment-form-fields">
      <div className="payment-easypaisa-info">
        <div className="easypaisa-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div>
          <p className="bank-detail-title">Pay via EasyPaisa</p>
          <p className="bank-detail-row">Send payment to our EasyPaisa account:</p>
          <p className="bank-detail-row phone-number"><span className="bank-label">Phone:</span> 0300 1234567</p>
          <p className="bank-detail-row"><span className="bank-label">Account:</span> Climb Crux Pakistan</p>
        </div>
      </div>
      <div className="field">
        <label htmlFor="easypaisa-phone">Your EasyPaisa / JazzCash number</label>
        <input id="easypaisa-phone" type="tel" inputMode="numeric" placeholder="03XX XXXXXXX" required />
      </div>
      <div className="field">
        <label htmlFor="easypaisa-txn">Transaction ID</label>
        <input id="easypaisa-txn" type="text" placeholder="e.g. TXN123456789" required />
      </div>
    </div>
  )
}

export default function BookNow() {
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('type') || ''
  const [step, setStep] = useState(1)              // 1 = details, 2 = checkout, 3 = success
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [bookingId, setBookingId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('safepay')
  const [safepayRedirecting, setSafepayRedirecting] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  const sessionTypes = [
    { value: 'public', label: 'Public Session', desc: 'Join a guided group session on Margalla Hills — every other Sunday.' },
    { value: 'private', label: 'Private Session', desc: 'One-on-one or private group coaching tailored to your goals.' },
    { value: 'custom-group', label: 'Customize Group Session', desc: 'Build a session for your own group — pick the date, size, and focus.' },
  ]

  async function handleDetailsSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)

    const form = e.target
    const data = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      type: form['session-type'].value,
      date: form['preferred-date'].value,
      groupSize: form['group-size'].value,
      experience: form.experience.value,
      message: form.message.value,
      status: 'pending',
    }

    try {
      const created = await createBooking(data)
      setBookingData(data)
      setBookingId(created.id)
      setStep(2)
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)

    if (paymentMethod === 'safepay') {
      // SafePay online payment — redirect to hosted checkout
      try {
        setSafepayRedirecting(true)
        const { checkoutUrl } = await createCheckoutSession(bookingId, 2500)
        window.location.href = checkoutUrl
      } catch (err) {
        setError('Failed to initiate payment. Please try again.')
        setSafepayRedirecting(false)
        setSending(false)
      }
      return
    }

    // Manual payment methods (bank transfer, easypaisa)
    const form = e.target
    const paymentDetails = {}

    if (paymentMethod === 'bank') {
      paymentDetails.yourBank = form['bank-name']?.value || ''
      paymentDetails.accountHolder = form['account-holder']?.value || ''
      paymentDetails.yourAccountNumber = form['account-number']?.value || ''
      paymentDetails.transactionId = form['transfer-id']?.value || ''
    } else if (paymentMethod === 'easypaisa') {
      paymentDetails.phone = form['easypaisa-phone']?.value || ''
      paymentDetails.transactionId = form['easypaisa-txn']?.value || ''
    }

    try {
      await updateBooking(bookingId, {
        paymentMethod,
        paymentStatus: 'pending',
        paymentDetails,
      })
      setBookingData((prev) => ({ ...prev, payment: { method: paymentMethod, ...paymentDetails } }))
      setSending(false)
      setStep(3)
    } catch (err) {
      setError('Failed to process payment. Please try again.')
      setSending(false)
    }
  }

  // Check for SafePay redirect back params with polling
  const paymentParam = searchParams.get('payment')
  const returnBookingId = searchParams.get('booking_id')

  if (paymentParam && returnBookingId && bookingId === null && !confirmingPayment) {
    // Restore booking context from the redirect
    setBookingId(returnBookingId)
    setConfirmingPayment(true)

    // Helper to poll payment status while webhook arrives
    async function pollPaymentStatus(id, maxRetries = 8, interval = 1500) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const status = await checkPaymentStatus(id)
          if (status.paymentStatus === 'paid') return { ...status, resolved: true }
          if (status.paymentStatus === 'failed') return { ...status, resolved: true }
        } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, interval))
      }
      return { paymentStatus: 'pending', resolved: false }
    }

    // Helper to fetch full booking details for the success screen
    async function fetchFullBooking(id) {
      try {
        const booking = await getBooking(id)
        return {
          name: booking.name || '',
          email: booking.email || '',
          phone: booking.phone || '',
          type: booking.type || '',
          date: booking.date || '',
          groupSize: booking.groupSize || '1',
          payment: { method: 'safepay' },
        }
      } catch {
        return {
          name: '', email: '', phone: '', type: '', date: '', groupSize: '1',
          payment: { method: 'safepay' },
        }
      }
    }

    if (paymentParam === 'success') {
      // Start polling and fetch booking data in parallel
      Promise.all([
        pollPaymentStatus(returnBookingId),
        fetchFullBooking(returnBookingId),
      ]).then(([status, data]) => {
        setBookingData(data)
        setConfirmingPayment(false)
        if (status.paymentStatus === 'paid') {
          setStep(3)
        } else {
          setStep(3)
          setError('Payment received. Your booking is being confirmed — you will receive a confirmation email shortly.')
        }
      })
    } else {
      // Payment cancelled or failed
      fetchFullBooking(returnBookingId).then((data) => {
        setBookingData(data)
        setConfirmingPayment(false)
        setStep(2)
        if (paymentParam === 'cancelled') {
          setError('Payment was cancelled. You can try again or choose a different payment method.')
        } else {
          setError('Payment could not be processed. Please try again.')
        }
      })
    }
  }

  function getSessionTypeLabel(value) {
    const found = sessionTypes.find((t) => t.value === value)
    return found ? found.label : value
  }

  const paymentMethods = [
    {
      value: 'safepay',
      label: 'Pay Online (Card)',
      desc: 'Secure payment via SafePay — debit/credit cards accepted',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      value: 'bank',
      label: 'Bank Transfer',
      desc: 'Manual transfer to our HBL account',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      value: 'easypaisa',
      label: 'EasyPaisa / JazzCash',
      desc: 'Manual transfer to our EasyPaisa account',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Book your climb.">
        <p>
          Pick the session that fits — a public group climb, a private
          experience, or a fully customized session for your own group.
          Complete your booking with a secure payment.
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          {/* ---- Step progress ---- */}
          <div className="checkout-steps">
            <div className={`checkout-step ${step >= 1 ? 'is-active' : ''} ${step > 1 ? 'is-done' : ''}`}>
              <span className="step-number">{step > 1 ? '✓' : '1'}</span>
              <span className="step-label">Details</span>
            </div>
            <div className="step-connector">
              <div className="step-connector-fill" style={{ width: step >= 2 ? '100%' : '0%' }} />
            </div>
            <div className={`checkout-step ${step >= 2 ? 'is-active' : ''} ${step > 2 ? 'is-done' : ''}`}>
              <span className="step-number">{step > 2 ? '✓' : '2'}</span>
              <span className="step-label">Payment</span>
            </div>
            <div className="step-connector">
              <div className="step-connector-fill" style={{ width: step >= 3 ? '100%' : '0%' }} />
            </div>
            <div className={`checkout-step ${step >= 3 ? 'is-active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Confirm</span>
            </div>
          </div>

          {/* ---- Confirming Payment Spinner ---- */}
          {confirmingPayment && (
            <div className="form-card confirming-payment" style={{ maxWidth: 780, margin: '0 auto' }}>
              <div className="confirming-spinner">
                <div className="spinner-ring">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                    <circle cx="28" cy="28" r="24" stroke="var(--chalk-dim)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" strokeDasharray="150" strokeDashoffset="40" />
                  </svg>
                </div>
                <h3>Confirming your payment…</h3>
                <p>Please wait while we verify your transaction with SafePay.</p>
                <div className="confirming-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {!confirmingPayment && (
          <div className="form-card" style={{ maxWidth: 780, margin: '0 auto' }}>
            {error && (
              <div className="form-error-banner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            {/* ---- STEP 1: Booking details ---- */}
            {step === 1 && (
              <form onSubmit={handleDetailsSubmit}>
                <div className="field">
                  <label htmlFor="session-type">Session type</label>
                  <select id="session-type" defaultValue={sessionTypes.some(t => t.value === preselected) ? preselected : ''} required>
                    <option value="" disabled>Choose a session type</option>
                    {sessionTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="name">Full name</label>
                    <input id="name" type="text" required />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone / WhatsApp</label>
                    <input id="phone" type="tel" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" required />
                  </div>
                  <div className="field">
                    <label htmlFor="group-size">Number of people</label>
                    <input id="group-size" type="number" min="1" defaultValue="1" />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="preferred-date">Preferred date</label>
                  <input id="preferred-date" type="date" />
                </div>

                <div className="field">
                  <label htmlFor="experience">Experience level</label>
                  <select id="experience" defaultValue="">
                    <option value="" disabled>Select your experience</option>
                    <option value="beginner">First time — never climbed before</option>
                    <option value="some">A few times — know the basics</option>
                    <option value="intermediate">Regular climber — working on grades</option>
                    <option value="advanced">Experienced — training for harder routes</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="message">Anything we should know?</label>
                  <textarea id="message" rows="3" placeholder="Goals, injuries, group preferences, or questions…"></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? 'Saving…' : 'Continue to payment →'}
                  </button>
                </div>
              </form>
            )}

            {/* ---- STEP 2: Checkout / Payment ---- */}
            {step === 2 && (
              <div className="checkout-container">
                {/* Booking summary */}
                <div className="booking-summary">
                  <h3 className="summary-title">Booking summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-key">Session</span>
                      <span className="summary-val">{getSessionTypeLabel(bookingData?.type)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-key">Name</span>
                      <span className="summary-val">{bookingData?.name}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-key">Email</span>
                      <span className="summary-val">{bookingData?.email}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-key">Phone</span>
                      <span className="summary-val">{bookingData?.phone}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-key">People</span>
                      <span className="summary-val">{bookingData?.groupSize}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-key">Date</span>
                      <span className="summary-val">{bookingData?.date || 'To be confirmed'}</span>
                    </div>
                  </div>
                  <div className="summary-total">
                    <span>Total to pay</span>
                    <span className="summary-amount">PKR 2,500</span>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="payment-form">
                  <h3 className="summary-title">Choose payment method</h3>

                  {/* Payment method selector */}
                  <div className="payment-method-grid">
                    {paymentMethods.map((pm) => (
                      <label
                        key={pm.value}
                        className={`payment-method-card ${paymentMethod === pm.value ? 'is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={pm.value}
                          checked={paymentMethod === pm.value}
                          onChange={() => setPaymentMethod(pm.value)}
                        />
                        <span className="payment-method-icon">{pm.icon}</span>
                        <span className="payment-method-label">{pm.label}</span>
                        <span className="payment-method-check">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Dynamic payment fields */}
                  <div className="payment-form-section">
                    {paymentMethod === 'safepay' && (
                      <div className="payment-form-fields">
                        <div className="payment-safepay-info">
                          <div className="safepay-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>
                          <div>
                            <p className="bank-detail-title">Secure online payment</p>
                            <p className="bank-detail-row">
                              You'll be redirected to SafePay's secure checkout page to complete your payment.
                              We accept all major debit and credit cards.
                            </p>
                          </div>
                        </div>
                        <div className="safepay-badges">
                          <span className="safepay-badge">🔒 Secured by SafePay</span>
                          <span className="safepay-badge">💳 Visa / Mastercard</span>
                          <span className="safepay-badge">⚡ Instant confirmation</span>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'bank' && <BankTransferForm />}
                    {paymentMethod === 'easypaisa' && <EasyPaisaForm />}
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                      ← Back
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={sending || safepayRedirecting}>
                      {safepayRedirecting ? (
                        <><span className="btn-spinner" /> Redirecting to SafePay…</>
                      ) : sending ? (
                        <><span className="btn-spinner" /> Processing…</>
                      ) : paymentMethod === 'safepay' ? (
                        'Pay Online with SafePay →'
                      ) : (
                        'Confirm & pay'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ---- STEP 3: Success ---- */}
            {step === 3 && (
              <div className="payment-success">
                <div className="success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3>Booking confirmed!</h3>
                <p className="success-desc">
                  Thank you, <strong>{bookingData?.name}</strong>! Your {getSessionTypeLabel(bookingData?.type).toLowerCase()} session has been received.
                </p>
                <div className="success-details">
                  <div className="success-detail-row">
                    <span>Payment method</span>
                    <span>
                      {bookingData?.payment?.method === 'safepay' && 'Pay Online (SafePay)'}
                      {bookingData?.payment?.method === 'bank' && 'Bank Transfer'}
                      {bookingData?.payment?.method === 'easypaisa' && 'EasyPaisa / JazzCash'}
                    </span>
                  </div>
                  <div className="success-detail-row">
                    <span>Booking reference</span>
                    <span className="ref-code">
                      CRX-{bookingId ? bookingId.toString().slice(-6).toUpperCase() : Date.now().toString(36).toUpperCase()}
                    </span>
                  </div>
                  <div className="success-detail-row">
                    <span>Status</span>
                    {bookingData?.payment?.method === 'safepay' ? (
                      <span className="status-paid">✓ Paid & Confirmed</span>
                    ) : (
                      <span className="status-pending">Pending verification</span>
                    )}
                  </div>
                </div>
                {bookingData?.payment?.method === 'safepay' ? (
                  <p className="success-note">
                    Your payment has been processed successfully and your spot is confirmed!
                    We've sent a confirmation to your email. See you on the rocks! 🧗
                  </p>
                ) : (
                  <p className="success-note">
                    We'll verify your payment and confirm your spot over WhatsApp or email within 24 hours.
                    If you have any questions, reach out to us at <strong>info@climbcrux.com</strong>.
                  </p>
                )}
                <a href="/" className="btn btn-outline">Back to home</a>
              </div>
            )}
          </div>
          )}
        </div>
      </section>
    </>
  )
}
