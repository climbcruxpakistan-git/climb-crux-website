import mongoose from 'mongoose'

const productOrderSchema = new mongoose.Schema({
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
  status: {
    type: String,
    default: 'pending_payment',
    enum: ['pending_payment', 'pending_verification', 'confirmed', 'shipped', 'cancelled'],
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
  paid_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export default mongoose.model('ProductOrder', productOrderSchema)
