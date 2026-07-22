import mongoose from 'mongoose'

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
  paymentStatus: { type: String, default: 'pending', enum: ['pending', 'paid', 'failed'] },
  paymentDetails: { type: paymentDetailsSchema, default: () => ({}) },
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
