import mongoose from 'mongoose'

/**
 * Atomic counter used to generate never-repeating sequential reference
 * numbers (e.g. CCM-0101 / CCS-00110).
 *
 * The counter is incremented with a single atomic `$inc`, so two requests can
 * never receive the same number — even when submitted at the exact same
 * moment. Because the number only ever goes forward (and is never derived
 * from how many records currently exist), deleting old bookings/memberships
 * can never cause a number to be reused.
 *
 * Active counters:
 *   - 'membershipCCM' → CCM-XXXX  (4 digits; seeded at 100 → first: CCM-0101)
 *   - 'bookingCCS'    → CCS-XXXXX (5 digits; seeded at 109 → first: CCS-00110)
 * Retired (kept untouched so historical records keep their original numbers):
 *   - 'membership' / 'booking' → legacy CCM-YYYY-XXXXX / CCS-YYYY-XXXXX format
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'membershipCCM' | 'bookingCCS'
  seq: { type: Number, default: 0 },
})

export default mongoose.model('Counter', counterSchema)
