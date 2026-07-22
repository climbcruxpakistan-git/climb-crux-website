import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  method: { type: String, default: '' },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'verification_required', 'paid', 'failed', 'refunded'],
  },
  gateway: { type: String, default: '' },
  transaction_id: { type: String, default: '' },
  payer_name: { type: String, default: '' },
  payer_bank: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  paid_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('Payment', paymentSchema)
