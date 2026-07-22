import mongoose from 'mongoose'

const historyEventSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['booking_created', 'status_changed', 'payment_status_changed', 'payment_method_set', 'booking_updated', 'email_sent'] },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false })

const paymentDetailsSchema = new mongoose.Schema({
  // Card payment
  cardHolder: { type: String, default: '' },
  cardLastFour: { type: String, default: '' },
  cardExpiry: { type: String, default: '' },

  // Bank transfer
  yourBank: { type: String, default: '' },
  accountHolder: { type: String, default: '' },
  yourAccountNumber: { type: String, default: '' },

  // EasyPaisa
  phone: { type: String, default: '' },

  // Shared
  transactionId: { type: String, default: '' },
}, { _id: false })

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  type: { type: String, default: '' },
  date: { type: String, default: '' },
  groupSize: { type: String, default: '1' },
  experience: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'cancelled'] },
  paymentMethod: { type: String, default: '', enum: ['', 'card', 'bank', 'easypaisa', 'safepay'] },
  paymentStatus: { type: String, default: 'pending', enum: ['pending', 'awaiting_confirmation', 'paid', 'failed'] },
  paymentDetails: { type: paymentDetailsSchema, default: () => ({}) },
  history: { type: [historyEventSchema], default: [] },
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
