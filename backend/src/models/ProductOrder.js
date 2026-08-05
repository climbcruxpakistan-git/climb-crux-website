import mongoose from 'mongoose'

const productOrderSchema = new mongoose.Schema({
  // Permanent, never-changed order reference: CCE-XXXXXX (Climb Crux Equipment +
  // random 6-digit code). Legacy orders keep their original ORD-… numbers.
  order_number: { type: String, default: '' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_name: { type: String, default: '' },
  product_price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  total_amount: { type: Number, default: 0 },
  customer_name: { type: String, required: true },
  customer_email: { type: String, default: '' },
  customer_phone: { type: String, default: '' },
  customer_address: { type: String, default: '' },
  // Order lifecycle (manual payment verification — no online gateway):
  //   pending_payment → pending_verification → confirmed → processing →
  //   ready_for_pickup → shipped → delivered   (declined is a dead-end)
  status: {
    type: String,
    default: 'pending_payment',
    enum: [
      'pending_payment',
      'pending_verification',
      'confirmed',
      'declined',
      'processing',
      'ready_for_pickup',
      'shipped',
      'delivered',
      'cancelled', // legacy value kept so historical records remain valid
    ],
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
  // ── Manual payment verification (mirrors the Booking model) ──
  payment_screenshot_url: { type: String, default: '' },
  payment_screenshot_name: { type: String, default: '' },
  payment_submitted_at: { type: String, default: '' },
  verified_by: { type: String, default: '' },
  approval_date: { type: String, default: '' },
  rejected_by: { type: String, default: '' },
  rejection_date: { type: String, default: '' },
  decline_reason: { type: String, default: '' },
  paid_at: { type: Date, default: null },
  // Audit trail (bounded to the last 100 events)
  history: {
    type: [
      {
        type: { type: String, default: '' },
        description: { type: String, default: '' },
        actor: { type: String, default: '' },
        details: { type: mongoose.Schema.Types.Mixed, default: {} },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('ProductOrder', productOrderSchema)
