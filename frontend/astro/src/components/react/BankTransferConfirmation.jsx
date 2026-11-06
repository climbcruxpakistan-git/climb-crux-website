import PaymentConfirmation from './PaymentConfirmation'

export default function BankTransferConfirmation({ bookingNumber }) {
  return <PaymentConfirmation bookingNumber={bookingNumber} />
}
