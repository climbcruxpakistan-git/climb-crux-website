import { useEffect, useState } from 'react'
import { getBookingByNumber } from '../../lib/api'
import { WHATSAPP_WA_ME } from '../../../../../shared/contact.js'
import PaymentSteps from './PaymentSteps'
import { CopyButton, formatPayDate, getSessionLabel } from './paymentUtils'
import {
  IconChat,
  IconCheck,
  IconError,
  IconHome,
  IconMail,
  IconMountain,
} from './PaymentIcons'
import './payment.css'

export default function PaymentSubmitted({ bookingNumber, method = 'bank_transfer' }) {
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
      <section className="pay pay-submitted">
        <PaymentSteps step={3} />
        <div className="pay-state">
          <div className="pay-state-spinner" />
          <p>Loading confirmation…</p>
        </div>
      </section>
    )
  }

  if (!booking) {
    return (
      <section className="pay pay-submitted">
        <PaymentSteps step={3} />
        <div className="pay-state">
          <div className="pay-state-icon">
            <IconError size={28} />
          </div>
          <h1 className="pay-h1">Booking not found</h1>
          <p>{error || 'Could not find this booking.'}</p>
          <a href="/book-now/" className="pay-btn pay-btn-go">
            Back to booking
          </a>
        </div>
      </section>
    )
  }

  const isBank = method === 'bank_transfer'
  const methodLabel = isBank ? 'Bank transfer' : 'Easypaisa'
  const proofLabel = isBank ? 'bank transfer screenshot' : 'Easypaisa screenshot'
  const reference = booking.booking_number || bookingNumber
  const sessionLabel = getSessionLabel(booking)
  const date = formatPayDate(booking.session_date || booking.date)
  const people = Number(booking.participants) || 1
  const amount = Number(booking.amount) || 0
  const amountText = `PKR ${amount.toLocaleString()}`

  return (
    <section className="pay pay-submitted">
      <PaymentSteps step={3} />

      <div className="pay-hero">
        <div className="pay-badge">
          <div className="pay-badge-inner">
            <IconCheck size={28} />
          </div>
        </div>
        <h1 className="pay-h1">Payment proof received</h1>
        <p className="pay-lead">
          Thank you! Our team is checking your {proofLabel} against this booking. Your spot is held
          while we verify.
        </p>
        <div className="pay-stat">
          <i />
          Pending verification · up to 24 hours
        </div>
      </div>

      <div className="pay-subwrap">
        <div className="pay-ticket">
          <div>
            <div className="pay-ticket-label">Booking reference</div>
            <div className="pay-ticket-code">
              <b>{reference}</b>
              <CopyButton value={reference} dark />
            </div>
          </div>
          <div className="pay-ticket-right">
            <strong>{sessionLabel}</strong>
            <span>{date || 'Date to be confirmed'}</span>
          </div>
        </div>

        <div className="pay-card">
          <h3 className="pay-card-title">What happens next</h3>
          <div className="pay-timeline">
            <div className="pay-tl-item is-done">
              <span className="pay-tl-dot">
                <IconCheck size={15} />
              </span>
              <div>
                <strong>
                  Payment proof submitted
                  <span className="pay-tl-tag">Done</span>
                </strong>
                <p>We received your {methodLabel.toLowerCase()} screenshot.</p>
              </div>
            </div>

            <div className="pay-tl-item is-active">
              <span className="pay-tl-dot">2</span>
              <div>
                <strong>
                  We review your payment
                  <span className="pay-tl-tag">In progress</span>
                </strong>
                <p>Our team matches your transfer and screenshot to this booking.</p>
              </div>
            </div>

            <div className="pay-tl-item">
              <span className="pay-tl-dot">3</span>
              <div>
                <strong>You get your confirmation email</strong>
                <p>
                  Once verified, we email your booking confirmation. This usually takes up to 24
                  hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pay-card">
          <h3 className="pay-card-title">Booking details</h3>
          <div className="pay-dl">
            <div className="pay-dl-row">
              <span>Name</span>
              <span>{booking.customer_name || '—'}</span>
            </div>
            <div className="pay-dl-row">
              <span>People</span>
              <span>{people}</span>
            </div>
            <div className="pay-dl-row">
              <span>Email</span>
              <span>{booking.customer_email || '—'}</span>
            </div>
            <div className="pay-dl-row">
              <span>Phone</span>
              <span>{booking.customer_phone || '—'}</span>
            </div>
            <div className="pay-dl-row">
              <span>Payment method</span>
              <span>{methodLabel}</span>
            </div>
            <div className="pay-dl-row">
              <span>Amount sent</span>
              <span>{amountText}</span>
            </div>
            <div className="pay-dl-row is-total">
              <span>Total</span>
              <span>{amountText}</span>
            </div>
          </div>
        </div>

        <div className="pay-spam">
          <IconMail size={18} />
          <span>
            Keep an eye on your inbox{booking.customer_email ? ` at ${booking.customer_email}` : ''}.
            If you don&apos;t see our email, check your spam folder.
          </span>
        </div>

        <div className="pay-act">
          <a href="/" className="pay-btn pay-btn-primary">
            <IconHome size={17} />
            Back to home
          </a>
          <a href="/sessions/" className="pay-btn pay-btn-secondary">
            <IconMountain size={17} />
            View sessions
          </a>
          <a
            href={WHATSAPP_WA_ME}
            target="_blank"
            rel="noreferrer"
            className="pay-btn pay-btn-wa"
          >
            <IconChat size={17} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
