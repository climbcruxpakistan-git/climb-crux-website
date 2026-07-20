import mongoose from 'mongoose'

const planSchema = new mongoose.Schema({
  type: { type: String, required: true },
  grade: { type: String, required: true },
  label: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: String, required: true },
  unit: { type: String, default: '/ person' },
  tag: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  features: [String],
}, { timestamps: true })

export default mongoose.model('Plan', planSchema)
