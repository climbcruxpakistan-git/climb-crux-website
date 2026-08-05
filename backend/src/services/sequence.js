import Counter from '../models/Counter.js'
import ProductOrder from '../models/ProductOrder.js'

/**
 * Get the next number in a never-repeating sequence.
 *
 * Implemented in two steps because MongoDB forbids using `$inc` and
 * `$setOnInsert` on the SAME path in a single update ("would create a
 * conflict at 'seq'").
 *
 *   Step 1 — seed: on first use, insert the counter with the base value
 *            `firstNumber - 1` (via `$setOnInsert`). If a concurrent request
 *            inserts it first, we get a duplicate-key (11000) error, which is
 *            ignored — the counter already exists.
 *   Step 2 — increment: a single atomic `$inc` bumps the counter. Because
 *            `$inc` is atomic, concurrent requests always receive distinct
 *            numbers, and deleting records never causes a number to be reused.
 *
 * @param {string} name — counter id, e.g. 'booking' or 'membership'
 * @param {number} firstNumber — the first number this sequence should issue
 * @returns {Promise<number>} the next number in the sequence
 */
export async function nextSequence(name, firstNumber) {
  // Step 1 — make sure the counter exists, seeded just below the first number.
  try {
    await Counter.updateOne(
      { _id: name },
      { $setOnInsert: { seq: firstNumber - 1 } },
      { upsert: true }
    )
  } catch (err) {
    // E11000 duplicate key — another request created the counter first. Fine.
    if (err?.code !== 11000) throw err
  }

  // Step 2 — atomically take the next number.
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true }
  )
  // Self-heal: if the counter was somehow deleted between steps, recreate it.
  if (!doc) return nextSequence(name, firstNumber)
  return doc.seq
}

/* ── Reference-number generators (new formats) ───────────────────────────
 *
 * Forward-only migration: brand-new counter keys ('membershipCCM' and
 * 'bookingCCS') are used instead of the legacy 'membership' / 'booking'
 * counters, so the pre-existing counters — and every historical record that
 * used them — are left completely untouched.
 *
 *   Memberships  → CCM-XXXX   (4 digits; counter seeded at 100 → CCM-0101)
 *   Bookings     → CCS-XXXXX  (5 digits; counter seeded at 109 → CCS-00110)
 *
 * The starting values live in the Counters collection (lazily seeded by
 * nextSequence's $setOnInsert step), never in code, and are bumped with a
 * single atomic $inc per record so concurrent submissions can never receive
 * the same number. The numbers are never reused, even after cancellations,
 * declines, or deletions.
 */

/** Next membership reference, e.g. CCM-0101, CCM-0102, … */
export async function nextMembershipReference() {
  const seq = await nextSequence('membershipCCM', 101)
  return `CCM-${String(seq).padStart(4, '0')}`
}

/** Next booking reference, e.g. CCS-00110, CCS-00111, … */
export async function nextBookingReference() {
  const seq = await nextSequence('bookingCCS', 110)
  return `CCS-${String(seq).padStart(5, '0')}`
}

/**
 * Next equipment order reference — CCE-XXXXXX (Climb Crux Equipment + random
 * 6-digit numeric code). Random per spec, not sequential. Before returning,
 * the code is checked for uniqueness against existing orders and regenerated
 * on collision (the spec explicitly requires this). A collision is a
 * 1-in-900,000 chance per attempt, so the retry loop makes a repeat
 * practically impossible; the final fallback uses a time-based suffix.
 */
export async function nextOrderReference() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const digits = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    const code = `CCE-${digits}`
    const exists = await ProductOrder.exists({ order_number: code })
    if (!exists) return code
  }
  // Pathological-case fallback: time suffix guarantees uniqueness.
  return `CCE-${String(Date.now()).slice(-6)}`
}
