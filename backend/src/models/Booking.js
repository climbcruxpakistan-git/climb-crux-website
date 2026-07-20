import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  type: { type: String, default: '' },
  date: { type: String, default: '' },
  groupSize: { type: String, default: '1' },
  experience: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'cancelled'] },
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
