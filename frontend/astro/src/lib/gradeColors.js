/**
 * Route difficulty colours — the single source of truth for the badge palette
 * that runs from easy green, through yellow, amber, orange and red, to hard
 * magenta and purple.
 *
 * Colours are interpolated by climbing-grade rank (see lib/grades.js) between a
 * small set of control points, so every grade in the data — including "+"
 * variants — gets its own position on one continuous, muted spectrum instead of
 * falling into coarse bands. Grades beyond the control points extrapolate, so
 * the scale keeps working if the route data ever grows a new grade.
 *
 * `gradeColor()` returns both the background (`tone`) and the text colour
 * (`ink`) to use on it; the ink is picked from the background's luminance so
 * the grade stays legible on every colour in the spectrum.
 */

import { gradeRank } from './grades.js'

/* Control points: grade → hue, saturation (%), lightness (%). Hue falls
   monotonically from green (138) through red (0) into negative degrees for
   magenta and purple, so interpolation never wraps the wrong way around the
   colour wheel. */
const STOPS = [
  { grade: '4a', h: 138, s: 30, l: 38 },
  { grade: '4c', h: 100, s: 34, l: 41 },
  { grade: '5b', h: 62, s: 42, l: 43 },
  { grade: '6a', h: 42, s: 55, l: 46 },
  { grade: '6b', h: 30, s: 62, l: 46 },
  { grade: '6c', h: 16, s: 58, l: 44 },
  { grade: '7a', h: 4, s: 55, l: 43 },
  { grade: '7b', h: -22, s: 48, l: 43 },
  { grade: '8a', h: -68, s: 42, l: 43 },
].map((stop) => ({ ...stop, rank: gradeRank(stop.grade) }))

const INK_LIGHT = '#ffffff'
const INK_DARK = '#201f21'
const INK_DARK_LUMINANCE = relativeLuminance(hexToRgb(INK_DARK))

/* Brand orange, used for anything unparseable so a bad grade never renders
   without a readable badge. */
const FALLBACK = { tone: '#cf5711', ink: INK_LIGHT }

function lerp(a, b, t) {
  return a + (b - a) * t
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100)
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l / 100 - c / 2

  let rgb
  if (hue < 60) rgb = [c, x, 0]
  else if (hue < 120) rgb = [x, c, 0]
  else if (hue < 180) rgb = [0, c, x]
  else if (hue < 240) rgb = [0, x, c]
  else if (hue < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return rgb.map((channel) => Math.round((channel + m) * 255))
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function relativeLuminance([r, g, b]) {
  const channel = (value) => {
    const v = value / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a, b) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** The ink (white or charcoal) with the better contrast against `rgb`. */
function pickInk(rgb) {
  const luminance = relativeLuminance(rgb)
  return contrast(luminance, 1) >= contrast(luminance, INK_DARK_LUMINANCE)
    ? INK_LIGHT
    : INK_DARK
}

/**
 * The badge colours for a climbing grade: `{ tone, ink }`. Tone is a muted hex
 * background, ink is a readable text colour. Unknown grades get the fallback.
 */
export function gradeColor(grade) {
  const rank = gradeRank(grade)
  if (rank === null) return { ...FALLBACK }

  let lower = STOPS[0]
  let upper = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    if (rank >= STOPS[i].rank && rank <= STOPS[i + 1].rank) {
      lower = STOPS[i]
      upper = STOPS[i + 1]
      break
    }
  }
  if (rank < STOPS[0].rank) {
    lower = STOPS[0]
    upper = STOPS[1]
  } else if (rank > STOPS[STOPS.length - 1].rank) {
    lower = STOPS[STOPS.length - 2]
    upper = STOPS[STOPS.length - 1]
  }

  const span = upper.rank - lower.rank
  const t = span ? (rank - lower.rank) / span : 0
  const rgb = hslToRgb(lerp(lower.h, upper.h, t), lerp(lower.s, upper.s, t), lerp(lower.l, upper.l, t))
  return { tone: rgbToHex(rgb), ink: pickInk(rgb) }
}
