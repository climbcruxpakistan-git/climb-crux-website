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
  payer_phone: { type: String, default: '' },
  // ── Emergency contact (from the booking form) ──
  emergency_contact_name: { type: String, default: '' },
  emergency_contact_phone: { type: String, default: '' },
  // ── Payment proof (uploaded screenshot, Cloudinary URL) ──
  payment_screenshot_url: { type: String, default: '' },
  payment_screenshot_name: { type: String, default: '' },
  payment_submitted_at: { type: String, default: '' }, // when the customer uploaded the screenshot
  // ── Office use only (filled in when admin approves/rejects) ──
  verified_by: { type: String, default: '' },
  remarks: { type: String, default: '' },
  approval_date: { type: String, default: '' }, // set when the booking is confirmed
  rejected_by: { type: String, default: '' },
  rejection_date: { type: String, default: '' }, // set when the booking is declined
  // ── Audit log (every admin action + key customer events) ──
  history: {
    type: [
      {
        type: { type: String, default: '' }, // booking_created | payment_submitted | booking_approved | booking_rejected | status_changed
        description: { type: String, default: '' },
        actor: { type: String, default: '' }, // admin email for admin actions
        details: { type: mongoose.Schema.Types.Mixed, default: {} },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('Booking', bookingSchema)
