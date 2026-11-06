import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import Booking from './models/Booking.js'
import {
  deliverBookingConfirmationEmail,
  retryPendingConfirmationEmails,
} from './services/bookingConfirmationEmail.js'

if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()))
}

const reference = process.argv[2]

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/climb-crux')

if (!reference) {
  const result = await retryPendingConfirmationEmails()
  console.log(`Retried ${result.retried} pending confirmation email(s); sent ${result.sent}.`)
  await mongoose.disconnect()
  process.exit(0)
}

const booking = await Booking.findOne({ booking_number: reference })
if (!booking) {
  console.error(`Booking ${reference} not found.`)
  await mongoose.disconnect()
  process.exit(1)
}
if (booking.booking_status !== 'confirmed') {
  console.error(`Booking ${reference} is ${booking.booking_status}, not confirmed — refusing to send.`)
  await mongoose.disconnect()
  process.exit(1)
}

booking.confirmation_email_status = 'pending'
booking.confirmation_email_attempts = 0
booking.confirmation_email_last_error = ''
await booking.save()

const sent = await deliverBookingConfirmationEmail(booking)
if (sent) {
  console.log(`Confirmation email sent to ${booking.customer_email} (${reference}).`)
} else {
  console.error(`Failed to send ${reference} — it stays queued and will be retried automatically.`)
}

await mongoose.disconnect()
process.exit(sent ? 0 : 1)
