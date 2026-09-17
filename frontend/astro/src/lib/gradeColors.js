/**
 * Route difficulty colours — the single source of truth for the badge palette
 * that runs from easy green, through yellow, orange and red, to hard purple.
 *
 * Each grade has an explicit colour. A "+" grade is a slightly darker, more
 * saturated version of its base grade, so it reads as "a bit harder" without
 * jumping to a new hue. Any other grade (or one added to the data later) is
 * interpolated between the nearest defined grades, so the scale never falls
 * back to a wrong colour.
 *
 * `gradeColor()` returns three things:
 *  · `tone`   — the badge background
 *  · `ink`    — the badge text colour, picked for contrast on `tone`
 *  · `accent` — a darkened copy of `tone` that stays visible on a white card,
 *               used for the card's hover arrow
 */

import { gradeRank, parseGrade } from './grades.js'

/* The defined grades: rank → colour. */
const BASE = [
  [400, '#16A34A'], // 4a
  [410, '#22C55E'], // 4b
  [420, '#84CC16'], // 4c
  [500, '#EAB308'], // 5a
  [510, '#FACC15'], // 5b
  [520, '#FFC800'], // 5c
  [600, '#FFA500'], // 6a
  [610, '#FF8C00'], // 6b
  [620, '#FF6B00'], // 6c
  [700, '#FF3B30'], // 7a
  [710, '#E11D48'], // 7b
  [721, '#9333EA'], // 7c+
  [800, '#6D28D9'], // 8a
]

const INK_LIGHT = '#ffffff'
const INK_DARK = '#201f21'
const INK_DARK_LUMINANCE = relativeLuminance(hexToRgb(INK_DARK))

/* Contrast a colour must reach against white to be used as the hover arrow. */
const ACCENT_MIN_CONTRAST = 4.5

/* Brand orange, used for anything unparseable so a bad grade never renders
   without a readable badge. */
const FALLBACK = { tone: '#cf5711', ink: INK_LIGHT, accent: '#cf5711' }

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b]
    .map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0'))
    .join('')}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function rgbToHsl([r, g, b]) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min

  let hue = 0
  let saturation = 0
  if (delta) {
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0)
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
    hue /= 6
  }
  return [hue * 360, saturation * 100, lightness * 100]
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 100) / 100
  const lightness = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lightness - c / 2

  let rgb
  if (hue < 60) rgb = [c, x, 0]
  else if (hue < 120) rgb = [x, c, 0]
  else if (hue < 180) rgb = [0, c, x]
  else if (hue < 240) rgb = [0, x, c]
  else if (hue < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return rgb.map((channel) => (channel + m) * 255)
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

/** Darken a colour until it is legible on a white background. */
function pickAccent(rgb) {
  let [h, s, l] = rgbToHsl(rgb)
  if (contrast(relativeLuminance(rgb), 1) >= ACCENT_MIN_CONTRAST) return rgbToHex(rgb)
  while (l > 2 && contrast(relativeLuminance(hslToRgb(h, s, l)), 1) < ACCENT_MIN_CONTRAST) {
    l -= 3
  }
  return rgbToHex(hslToRgb(h, s, l))
}

/** A "+" grade reads as slightly harder: darker and a little more saturated. */
function shadePlus(rgb) {
  const [h, s, l] = rgbToHsl(rgb)
  return hslToRgb(h, s + 8, l - 6)
}

/** Interpolate (or extrapolate) a colour by grade rank between the base grades. */
function interpolate(rank) {
  let lower = BASE[0]
  let upper = BASE[BASE.length - 1]
  for (let i = 0; i < BASE.length - 1; i += 1) {
    if (rank >= BASE[i][0] && rank <= BASE[i + 1][0]) {
      lower = BASE[i]
      upper = BASE[i + 1]
      break
    }
  }
  if (rank < BASE[0][0]) {
    lower = BASE[0]
    upper = BASE[1]
  } else if (rank > BASE[BASE.length - 1][0]) {
    lower = BASE[BASE.length - 2]
    upper = BASE[BASE.length - 1]
  }

  const t = (rank - lower[0]) / (upper[0] - lower[0])
  const from = hexToRgb(lower[1])
  const to = hexToRgb(upper[1])
  return from.map((channel, i) => channel + (to[i] - channel) * t)
}

/** Resolve a grade to an RGB background colour. */
function toneRgb(grade) {
  const rank = gradeRank(grade)
  if (rank === null) return null

  const exact = BASE.find(([stop]) => stop === rank)
  if (exact) return hexToRgb(exact[1])

  const parsed = parseGrade(grade)
  if (parsed?.plus) {
    const baseRank = rank - 1
    const base = BASE.find(([stop]) => stop === baseRank)
    return shadePlus(base ? hexToRgb(base[1]) : interpolate(baseRank))
  }

  return interpolate(rank)
}

/**
 * The badge colours for a climbing grade. Unknown grades get the fallback.
 */
export function gradeColor(grade) {
  const rgb = toneRgb(grade)
  if (!rgb) return { ...FALLBACK }
  return {
    tone: rgbToHex(rgb),
    ink: pickInk(rgb),
    accent: pickAccent(rgb),
  }
}
