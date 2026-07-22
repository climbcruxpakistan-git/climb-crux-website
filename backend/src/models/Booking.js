import mongoose from 'mongoose'

const historyEventSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['booking_created', 'status_changed', 'payment_status_changed', 'payment_method_set', 'booking_updated', 'email_sent'] },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false })

const paymentDetailsSchema = new mongoose.Schema({
  yourBank: { type: String, default: '' },
  accountHolder: { type: String, default: '' },
  tracker: { type: String, default: '' },
  amount: { type: Number, default: 0 },
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
  paymentMethod: { type: String, default: '' },
  paymentStatus: { type: String, default: 'pending' },
  paymentDetails: { type: paymentDetailsSchema, default: () => ({}) },
  history: { type: [historyEventSchema], default: [] },
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
