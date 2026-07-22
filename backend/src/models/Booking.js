import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  booking_number: { type: String, default: '' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  session_id: { type: String, default: '' },
  customer_name: { type: String, required: true },
  customer_email: { type: String, default: '' },
  customer_phone: { type: String, default: '' },
  participants: { type: Number, default: 1 },
  amount: { type: Number, default: 0 },
  date: { type: String, default: '' },
  booking_status: {
    type: String,
    default: 'pending_payment',
    enum: ['pending_payment', 'pending_verification', 'confirmed', 'cancelled'],
  },
  payment_status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'verification_required', 'paid', 'failed', 'refunded'],
  },
  payment_method: { type: String, default: '' },
  payer_bank: { type: String, default: '' },
  payer_name: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('Booking', bookingSchema)
