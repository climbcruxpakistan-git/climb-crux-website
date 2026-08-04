import Counter from '../models/Counter.js'

/**
 * Get the next number in a never-repeating sequence.
 *
 * A single atomic upsert both seeds the counter on first use and increments it:
 * - On insert, `$setOnInsert` sets the base value to `firstNumber - 1` and the
 *   `$inc` immediately bumps it, so the very first number issued is exactly
 *   `firstNumber`.
 * - On every later call, only `$inc` runs, so concurrent requests always get
 *   distinct numbers and deleted records never cause a number to be reused.
 *
 * @param {string} name — counter id, e.g. 'booking' or 'membership'
 * @param {number} firstNumber — the first number this sequence should issue
 * @returns {Promise<number>} the next number in the sequence
 */
export async function nextSequence(name, firstNumber) {
  // Retry once if a concurrent request happens to race the very first insert.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const doc = await Counter.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 }, $setOnInsert: { seq: firstNumber - 1 } },
        { new: true, upsert: true }
      )
      return doc.seq
    } catch (err) {
      if (err?.code !== 11000 || attempt === 2) throw err
    }
  }
  return firstNumber // unreachable — keeps the linter happy
}
