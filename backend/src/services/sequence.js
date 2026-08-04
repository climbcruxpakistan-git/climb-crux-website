import Counter from '../models/Counter.js'

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
