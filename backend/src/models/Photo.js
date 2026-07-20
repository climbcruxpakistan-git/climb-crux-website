import mongoose from 'mongoose'

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  originalName: { type: String, default: '' },
  title: { type: String, default: '' },
  tags: [String],
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  bytes: { type: Number },
}, { timestamps: true })

export default mongoose.model('Photo', photoSchema)
