import { useEffect, useRef, useState } from 'react'
import { getBookingByNumber, createPayment } from '../../lib/api'
import { WHATSAPP_WA_ME } from '../../../../../shared/contact.js'
import PaymentSteps from './PaymentSteps'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBank,
  IconCalendar,
  IconCard,
  IconCheck,
  IconClock,
  IconError,
  IconFile,
  IconMail,
  IconPhone,
  IconPhoneSmall,
  IconPin,
  IconTag,
  IconUpload,
  IconUser,
} from './PaymentIcons'
import { CopyButton, ErrorBanner, formatPayDate, getSessionKind, getSessionLabel } from './paymentUtils'
import './payment.css'

function formatFileSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ScreenshotField({
  screenshot,
  screenshotName,
  fileError,
  isDragging,
  inputRef,
  onInput,
  onOpen,
  onDrop,
  onDragOver,
  onDragLeave,
  onRemove,
}) {
  return (
    <div>
      {screenshot ? (
        <div className="pay-file">
          <span className="pay-file-thumb">
            <IconFile size={22} />
          </span>
          <span className="pay-file-info">
            <strong>{screenshotName}</strong>
            <span>{formatFileSize(screenshot.size)} · Ready to submit</span>
          </span>
          <button type="button" className="pay-file-remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      ) : (
        <div
          className={`pay-drop ${isDragging ? 'is-drag' : ''} ${fileError ? 'has-error' : ''}`}
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onOpen()
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <span className="pay-drop-icon">
            <IconUpload size={22} />
          </span>
          <div>
            <strong>Drop your payment screenshot here</strong>
            <p>or choose a file from your device</p>
          </div>
          <button
            type="button"
            className="pay-drop-btn"
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
          >
            Choose file
          </button>
          <small>JPG, PNG or PDF · max 10 MB</small>
        </div>
      )}
      <input
        ref={inputRef}
        id="payment-screenshot"
        className="pay-file-input"
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={onInput}
        tabIndex={-1}
        aria-hidden="true"
      />
      {fileError && (
        <p className="pay-file-error" role="alert">
          {fileError}
        </p>
      )}
    </div>
  )
}

function BookingSummary({ booking, bookingNumber }) {
  const amount = Number(booking.amount) || 0
  const people = Number(booking.participants) || 1
  const sessionLabel = getSessionLabel(booking)
  const date = formatPayDate(booking.session_date || booking.date)
  const time = [booking.session_start_time, booking.session_end_time].filter(Boolean).join(' – ')

  return (
    <aside className="pay-side">
      <div className="pay-sum">
        <div className="pay-sum-head">
          <span className="pay-sum-label">Booking summary</span>
          <span className="pay-ref">{booking.booking_number || bookingNumber}</span>
        </div>

        <div className="pay-sess">
          <i>
            <IconTag size={19} />
          </i>
          <div>
            <strong>{sessionLabel}</strong>
            <span>
              {getSessionKind(booking)} · {people} {people === 1 ? 'person' : 'people'}
            </span>
          </div>
        </div>

        <div className="pay-det">
          <IconCalendar size={16} />
          <span>{date || 'To be confirmed'}</span>
        </div>
        {time && (
          <div className="pay-det">
            <IconClock size={16} />
            <span>{time}</span>
          </div>
        )}
        {booking.session_location && (
          <div className="pay-det">
            <IconPin size={16} />
            <span>{booking.session_location}</span>
          </div>
        )}
        <div className="pay-det">
          <IconUser size={16} />
          <span>
            <b>{booking.customer_name || '—'}</b>
          </span>
        </div>
        {booking.customer_email && (
          <div className="pay-det">
            <IconMail size={16} />
            <span>{booking.customer_email}</span>
          </div>
        )}
        {booking.customer_phone && (
          <div className="pay-det">
            <IconPhoneSmall size={16} />
            <span>{booking.customer_phone}</span>
          </div>
        )}

        <div className="pay-sum-line">
          <span>
            {sessionLabel} × {people}
          </span>
          <span>PKR {amount.toLocaleString()}</span>
        </div>
        <div className="pay-total">
          <span>Total to pay</span>
          <b>PKR {amount.toLocaleString()}</b>
        </div>
      </div>
    </aside>
  )
}

export default function PaymentPage({ bookingNumber }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fileError, setFileError] = useState('')
  const [sending, setSending] = useState(false)
  const [flow, setFlow] = useState('select')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [easypaisaSender, setEasypaisaSender] = useState('')
  const [easypaisaPhone, setEasypaisaPhone] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotName, setScreenshotName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!bookingNumber) return
    getBookingByNumber(bookingNumber)
      .then((b) => {
        setBooking(b)
        if (b.payment_method === 'bank_transfer' || b.payment_method === 'bank') {
          window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/bank-transfer-confirmation/`
        } else if (b.payment_method === 'easypaisa') {
          window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/easypaisa-confirmation/`
        }
      })
      .catch(() => setError('Booking not found. Please check your booking number and try again.'))
      .finally(() => setLoading(false))
  }, [bookingNumber])

  function handleMethodSelect(method) {
    setPaymentMethod(method)
    setError('')
  }

  function continueToForm() {
    if (!paymentMethod) return
    setError('')
    setFlow(paymentMethod === 'bank_transfer' ? 'bank-form' : 'easypaisa-form')
  }

  function changeMethod() {
    setError('')
    setFileError('')
    setFlow('select')
  }

  function applyFile(file) {
    if (!file) {
      setScreenshot(null)
      setScreenshotName('')
      return
    }
    const okType =
      /\.(jpe?g|png|pdf)$/i.test(file.name) ||
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'application/pdf'
    if (!okType) {
      setScreenshot(null)
      setScreenshotName('')
      setFileError('Please upload a JPG, PNG or PDF payment screenshot')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setScreenshot(null)
      setScreenshotName('')
      setFileError('Payment screenshot must be 10 MB or smaller')
      return
    }
    setError('')
    setFileError('')
    setScreenshot(file)
    setScreenshotName(file.name)
  }

  function handleScreenshotChange(event) {
    applyFile(event.target.files?.[0] || null)
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    applyFile(event.dataTransfer.files?.[0] || null)
  }

  function handleDragOver(event) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragging(false)
  }

  function removeFile() {
    setScreenshot(null)
    setScreenshotName('')
    setFileError('')
    setError('')
  }

  async function submitPayment(method, extra) {
    if (!screenshot) {
      setError('Please attach your payment screenshot before submitting for verification')
      return
    }
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('method', method)
      Object.entries(extra).forEach(([key, value]) => {
        if (value) fd.append(key, value)
      })
      fd.append('payment_screenshot', screenshot)
      await createPayment(booking.id, fd)
      const route =
        method === 'bank_transfer' ? 'bank-transfer-confirmation' : 'easypaisa-confirmation'
      window.location.href = `/booking/${encodeURIComponent(bookingNumber)}/${route}/`
    } catch (err) {
      setError(err.message || 'Failed to process payment. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleBankSubmit(event) {
    event.preventDefault()
    setError('')
    if (!bankName.trim() || !accountHolder.trim()) {
      setError('Please add your sender bank name and account holder name.')
      return
    }
    submitPayment('bank_transfer', { payer_name: accountHolder, payer_bank: bankName })
  }

  function handleEasypaisaSubmit(event) {
    event.preventDefault()
    setError('')
    if (!easypaisaSender.trim() || !easypaisaPhone.trim()) {
      setError('Please add your sender name and phone number.')
      return
    }
    submitPayment('easypaisa', { payer_name: easypaisaSender, payer_phone: easypaisaPhone })
  }

  if (loading) {
    return (
      <section className="pay">
        <PaymentSteps step={2} />
        <div className="pay-state">
          <div className="pay-state-spinner" />
          <p>Loading booking details…</p>
        </div>
      </section>
    )
  }

  if (error && !booking) {
    return (
      <section className="pay">
        <PaymentSteps step={2} />
        <div className="pay-state">
          <div className="pay-state-icon">
            <IconError size={28} />
          </div>
          <h1 className="pay-h1">Booking not found</h1>
          <p>{error}</p>
          <a href="/book-now/" className="pay-btn pay-btn-go">
            Back to booking
          </a>
        </div>
      </section>
    )
  }

  const reference = booking.booking_number || bookingNumber
  const amount = Number(booking.amount) || 0
  const amountText = `PKR ${amount.toLocaleString()}`
  const formReady =
    flow === 'bank-form'
      ? Boolean(bankName.trim() && accountHolder.trim() && screenshot)
      : flow === 'easypaisa-form'
        ? Boolean(easypaisaSender.trim() && easypaisaPhone.trim() && screenshot)
        : false

  const screenshotField = (
    <ScreenshotField
      screenshot={screenshot}
      screenshotName={screenshotName}
      fileError={fileError}
      isDragging={isDragging}
      inputRef={fileInputRef}
      onInput={handleScreenshotChange}
      onOpen={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onRemove={removeFile}
    />
  )

  return (
    <section className="pay">
      <PaymentSteps step={2} />
      <div className="pay-wrap">
        <div className="pay-main">
          <div className="pay-eyebrow">Step 2 of 3</div>

          {flow === 'select' && (
            <>
              <h1 className="pay-h1">Choose how to pay</h1>
              <p className="pay-sub">
                Pick a payment method and we will show you exactly where to send your payment.
              </p>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <div className="pay-card">
                <h3 className="pay-card-title">
                  <b>1</b>Payment method
                </h3>
                <div className="pay-methods">
                  <button
                    type="button"
                    className={`pay-m ${paymentMethod === 'bank_transfer' ? 'is-selected' : ''}`}
                    onClick={() => handleMethodSelect('bank_transfer')}
                    aria-pressed={paymentMethod === 'bank_transfer'}
                  >
                    <span className="pay-radio">
                      {paymentMethod === 'bank_transfer' && <IconCheck size={13} />}
                    </span>
                    <span className="pay-m-icon">
                      <IconBank size={22} />
                    </span>
                    <span>
                      <strong>Bank transfer</strong>
                      <small>Direct transfer from your bank app.</small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`pay-m ${paymentMethod === 'easypaisa' ? 'is-selected' : ''}`}
                    onClick={() => handleMethodSelect('easypaisa')}
                    aria-pressed={paymentMethod === 'easypaisa'}
                  >
                    <span className="pay-radio">
                      {paymentMethod === 'easypaisa' && <IconCheck size={13} />}
                    </span>
                    <span className="pay-m-icon">
                      <IconPhone size={22} />
                    </span>
                    <span>
                      <strong>Easypaisa</strong>
                      <small>Send from your Easypaisa wallet.</small>
                    </span>
                  </button>

                  <div className="pay-m is-disabled" aria-disabled="true">
                    <span className="pay-soon">Coming soon</span>
                    <span className="pay-m-icon">
                      <IconCard size={22} />
                    </span>
                    <span>
                      <strong>Credit / debit card</strong>
                      <small>Pay with Visa or Mastercard.</small>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pay-actions">
                <a href="/book-now/" className="pay-btn pay-btn-back">
                  <IconArrowLeft size={18} />
                  Change details
                </a>
                <button
                  type="button"
                  className="pay-btn pay-btn-go"
                  disabled={!paymentMethod}
                  onClick={continueToForm}
                >
                  Continue
                  <IconArrowRight size={18} />
                </button>
              </div>
            </>
          )}

          {flow === 'bank-form' && (
            <>
              <h1 className="pay-h1">Bank transfer</h1>
              <p className="pay-sub">
                Send the amount below, then upload your payment screenshot so we can verify it.
              </p>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <form onSubmit={handleBankSubmit}>
                <div className="pay-chip">
                  <b>
                    <IconBank size={18} />
                    Bank transfer
                  </b>
                  <button type="button" onClick={changeMethod}>
                    Change method
                  </button>
                </div>

                <div className="pay-card">
                  <h3 className="pay-card-title">
                    <b>1</b>Transfer to our bank account
                  </h3>

                  <div className="pay-row">
                    <span>Amount to send</span>
                    <b className="pay-amount">{amountText}</b>
                  </div>
                  <div className="pay-row">
                    <span>Bank</span>
                    <b>Bank Al Habib Limited</b>
                  </div>
                  <div className="pay-row">
                    <span>Account name</span>
                    <b>CLIMB CRUX</b>
                  </div>
                  <div className="pay-row">
                    <span>IBAN</span>
                    <span className="pay-row-val">
                      <b className="pay-mono">PK93 BAHL 5742 0081 0003 9501</b>
                      <CopyButton value="PK93 BAHL 5742 0081 0003 9501" />
                    </span>
                  </div>
                  <div className="pay-row">
                    <span>Branch code</span>
                    <span className="pay-row-val">
                      <b className="pay-mono">5742</b>
                      <CopyButton value="5742" />
                    </span>
                  </div>
                  <div className="pay-row">
                    <span>Payment reference</span>
                    <span className="pay-row-val">
                      <b className="pay-mono">{reference}</b>
                      <CopyButton value={reference} />
                    </span>
                  </div>

                  <div className="pay-note">
                    If you face any issues with your booking or payment, please contact us on{' '}
                    <a href={WHATSAPP_WA_ME} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>{' '}
                    for assistance.
                  </div>
                </div>

                <div className="pay-card">
                  <h3 className="pay-card-title">
                    <b>2</b>Your payment details
                  </h3>
                  <div className="pay-grid2">
                    <div className="pay-field">
                      <label htmlFor="pay-bank-name">Sender bank name</label>
                      <input
                        id="pay-bank-name"
                        className="pay-input"
                        type="text"
                        placeholder="e.g. HBL, Meezan Bank, UBL"
                        required
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                      />
                    </div>
                    <div className="pay-field">
                      <label htmlFor="pay-account-holder">Account holder name</label>
                      <input
                        id="pay-account-holder"
                        className="pay-input"
                        type="text"
                        placeholder="Name on the account used for payment"
                        required
                        value={accountHolder}
                        onChange={(event) => setAccountHolder(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pay-card">
                  <h3 className="pay-card-title">
                    <b>3</b>Payment screenshot
                  </h3>
                  {screenshotField}
                </div>

                <div className="pay-actions">
                  <button type="button" className="pay-btn pay-btn-back" onClick={changeMethod}>
                    <IconArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="pay-btn pay-btn-go"
                    disabled={!formReady || sending}
                  >
                    {sending ? (
                      <>
                        <span className="pay-spinner" />
                        Processing…
                      </>
                    ) : (
                      <>
                        Submit for verification
                        <IconArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {flow === 'easypaisa-form' && (
            <>
              <h1 className="pay-h1">Easypaisa</h1>
              <p className="pay-sub">
                Send the amount below, then upload your payment screenshot so we can verify it.
              </p>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <form onSubmit={handleEasypaisaSubmit}>
                <div className="pay-chip">
                  <b>
                    <IconPhone size={18} />
                    Easypaisa
                  </b>
                  <button type="button" onClick={changeMethod}>
                    Change method
                  </button>
                </div>

                <div className="pay-card">
                  <h3 className="pay-card-title">
                    <b>1</b>Send to our Easypaisa account
                  </h3>

                  <div className="pay-row">
                    <span>Amount to send</span>
                    <b className="pay-amount">{amountText}</b>
                  </div>
                  <div className="pay-row">
                    <span>Easypaisa number</span>
                    <span className="pay-row-val">
                      <b className="pay-mono">0313 2690377</b>
                      <CopyButton value="0313 2690377" />
                    </span>
                  </div>
                  <div className="pay-row">
                    <span>Account name</span>
                    <b>Saif Ud Din</b>
                  </div>
                  <div className="pay-row">
                    <span>Payment reference</span>
                    <span className="pay-row-val">
                      <b className="pay-mono">{reference}</b>
                      <CopyButton value={reference} />
                    </span>
                  </div>

                  <div className="pay-note">
                    If you face any issues with your booking or payment, please contact us on{' '}
                    <a href={WHATSAPP_WA_ME} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>{' '}
                    for assistance.
                  </div>
                </div>

                <div className="pay-card">
                  <h3 className="pay-card-title">
                    <b>2</b>Your payment details
                  </h3>
                  <div className="pay-grid2">
                    <div className="pay-field">
                      <label htmlFor="pay-easypaisa-sender">Sender name</label>
                      <input
                        id="pay-easypaisa-sender"
                        className="pay-input"
                        type="text"
                        placeholder="Your full name"
                        required
                        value={easypaisaSender}
                        onChange={(event) => setEasypaisaSender(event.target.value)}
                      />
                    </div>
                    <div className="pay-field">
                      <label htmlFor="pay-easypaisa-phone">Phone number</label>
                      <input
                        id="pay-easypaisa-phone"
                        className="pay-input"
                        type="tel"
                        placeholder="03XX-XXXXXXX"
                        required
                        value={easypaisaPhone}
                        onChange={(event) => setEasypaisaPhone(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pay-card">
                  <h3 className="pay-card-title">
                    <b>3</b>Payment screenshot
                  </h3>
                  {screenshotField}
                </div>

                <div className="pay-actions">
                  <button type="button" className="pay-btn pay-btn-back" onClick={changeMethod}>
                    <IconArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="pay-btn pay-btn-go"
                    disabled={!formReady || sending}
                  >
                    {sending ? (
                      <>
                        <span className="pay-spinner" />
                        Processing…
                      </>
                    ) : (
                      <>
                        Submit for verification
                        <IconArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <BookingSummary booking={booking} bookingNumber={reference} />
      </div>
    </section>
  )
}
