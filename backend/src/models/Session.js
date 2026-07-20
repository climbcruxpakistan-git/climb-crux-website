import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  spots: { type: String, default: 'Open' },
}, { timestamps: true })

export default mongoose.model('Session', sessionSchema)
