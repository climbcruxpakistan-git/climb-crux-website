import mongoose from 'mongoose'

const safetyItemSchema = new mongoose.Schema({
  h: { type: String, required: true },
  p: { type: String, required: true },
}, { _id: false })

const aboutSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  safetyItems: [safetyItemSchema],
}, { timestamps: true })

export default mongoose.model('About', aboutSchema)
