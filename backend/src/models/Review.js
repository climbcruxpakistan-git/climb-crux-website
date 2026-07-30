import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  customer_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  comment: { type: String, default: '' },
  photos: [{ type: String }], // Cloudinary URLs
  verified_purchase: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Review', reviewSchema)
