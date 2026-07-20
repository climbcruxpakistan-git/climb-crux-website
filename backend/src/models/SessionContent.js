import mongoose from 'mongoose'

const includedItemSchema = new mongoose.Schema({
  h: { type: String, required: true },
  p: { type: String, required: true },
}, { _id: false })

const faqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
}, { _id: false })

const pricingFeatureSchema = new mongoose.Schema({
  text: { type: String, required: true },
}, { _id: false })

const sessionContentSchema = new mongoose.Schema({
  includedItems: [includedItemSchema],
  faqs: [faqSchema],
  sessionsDisabled: { type: Boolean, default: false },
  pricingTitle: { type: String, default: 'Public Session' },
  pricingPrice: { type: String, default: '4,500' },
  pricingUnit: { type: String, default: '/ person' },
  pricingFeatures: [pricingFeatureSchema],
}, { timestamps: true })

export default mongoose.model('SessionContent', sessionContentSchema)
