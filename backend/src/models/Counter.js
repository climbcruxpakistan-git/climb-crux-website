import mongoose from 'mongoose'

/**
 * Atomic counter used to generate never-repeating sequential reference
 * numbers (e.g. CCM-2026-00011 / CCS-2026-00011).
 *
 * The counter is incremented with a single atomic `$inc`, so two requests can
 * never receive the same number — even when submitted at the exact same
 * moment. Because the number only ever goes forward (and is never derived
 * from how many records currently exist), deleting old bookings/memberships
 * can never cause a number to be reused.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'booking' | 'membership'
  seq: { type: Number, default: 0 },
})

export default mongoose.model('Counter', counterSchema)
