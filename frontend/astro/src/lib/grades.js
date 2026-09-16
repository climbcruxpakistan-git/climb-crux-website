/**
 * Climbing-grade ordering — the single source of truth for "which grade is
 * harder than which".
 *
 * Grades must never be compared alphabetically: as strings "10a" sorts before
 * "6a", and "5c+" sorts before "5c" even though it sits just above it. A grade
 * is therefore parsed as (number, letter, plus) — 6b+ → { number: 6, letter: 1,
 * plus: 1 } — and ranked as number * 100 + letter * 10 + plus. That keeps 5c+
 * (521) between 5c (520) and 6a (600).
 *
 * Every grade-aware feature (the guide-page explorer, the route-library filter,
 * route sorting) goes through these helpers so the ordering can never drift
 * between components.
 */

const LETTER_INDEX = { a: 0, b: 1, c: 2 }

const GRADE_PATTERN = /^(\d+)([a-c])(\+)?$/i

/** Parse a French sport grade ("6b+") into its sortable parts; null if unknown. */
export function parseGrade(grade) {
  const match = GRADE_PATTERN.exec(String(grade ?? '').trim())
  if (!match) return null
  return {
    number: Number(match[1]),
    letter: LETTER_INDEX[match[2].toLowerCase()],
    plus: match[3] ? 1 : 0,
  }
}

/** Rank a grade in climbing progression ("4a" → 400, "6b+" → 611). null if unknown. */
export function gradeRank(grade) {
  const parsed = parseGrade(grade)
  if (!parsed) return null
  return parsed.number * 100 + parsed.letter * 10 + parsed.plus
}

/** Comparator for grades (or anything grade-like); unknown grades sort last. */
export function compareGrades(a, b) {
  const rankA = gradeRank(a)
  const rankB = gradeRank(b)
  if (rankA === null) return rankB === null ? 0 : 1
  if (rankB === null) return -1
  return rankA - rankB
}

/** Order a list of grades by climbing progression. */
export function sortGrades(grades) {
  return [...grades].sort(compareGrades)
}

/**
 * True when `grade` sits inside the [min, max] range in climbing-grade order.
 * An unparseable bound is treated as "no bound"; an unparseable grade never
 * matches.
 */
export function gradeInRange(grade, min, max) {
  const rank = gradeRank(grade)
  if (rank === null) return false
  const low = gradeRank(min)
  const high = gradeRank(max)
  if (low !== null && rank < low) return false
  if (high !== null && rank > high) return false
  return true
}
