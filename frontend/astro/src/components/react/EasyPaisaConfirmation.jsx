import PaymentSubmitted from './PaymentSubmitted'

export default function EasyPaisaConfirmation({ bookingNumber }) {
  return <PaymentSubmitted bookingNumber={bookingNumber} method="easypaisa" />
}
