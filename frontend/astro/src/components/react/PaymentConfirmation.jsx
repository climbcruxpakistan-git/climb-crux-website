import { useEffect, useState } from 'react'
import { getBookingByNumber } from '../../lib/api'
import PaymentSteps from './PaymentSteps'
import { IconError } from './PaymentIcons'
import { formatPayDate, getSessionLabel } from './paymentUtils'
// payment.css styles the loading / not-found states below; payment-submitted.css is
// imported here as well because Astro only collects island CSS for modules that render
// during SSR — the page body renders after the booking fetch, so on its own that
// stylesheet is dropped from the production bundle.
import './payment.css'
import './payment-submitted.css'
import PaymentSubmitted from './PaymentSubmitted'

/**
 * Data loading + loading/not-found states for the two "payment submitted" routes.
 * Kept in one place so BankTransferConfirmation and EasyPaisaConfirmation stay
 * identical to how they behaved before the page was restyled; the page body
 * itself is rendered by PaymentSubmitted.
 */
export default function PaymentConfirmation({ bookingNumber }) {
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

  // getSessionLabel falls back to a generic 'Session' label; leave the prop empty
  // instead so PaymentSubmitted can drop the row when there is no session at all.
  const sessionName =
    booking.session_id || booking.session_title ? getSessionLabel(booking) : ''

  return (
    <PaymentSubmitted
      bookingNumber={booking.booking_number || bookingNumber}
      sessionName={sessionName}
      dateLabel={formatPayDate(booking.session_date || booking.date)}
    />
  )
}
