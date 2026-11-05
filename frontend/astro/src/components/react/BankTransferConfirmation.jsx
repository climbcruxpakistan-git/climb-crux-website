import PaymentSubmitted from './PaymentSubmitted'

export default function BankTransferConfirmation({ bookingNumber }) {
  return <PaymentSubmitted bookingNumber={bookingNumber} method="bank_transfer" />
}
