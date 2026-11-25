/**
 * Display title for a product: brand + product type.
 *
 * Used for the page <title>, the Product JSON-LD `name`, breadcrumbs and shop
 * cards, so Google sees the same title everywhere a listing is described. The
 * catalogue `name` stays the plain product type in the admin; dimensions,
 * colour and condition are deliberately kept out of the title.
 */

// Brands are stored in uppercase in the catalogue; titles read better with the
// manufacturers' own casing.
const BRAND_DISPLAY = {
  PETZL: 'Petzl',
  BEAL: 'Beal',
  SIMOND: 'Simond',
  XINDA: 'Xinda',
  MILLET: 'Millet',
  SALEWA: 'Salewa',
  INFINITY: 'Infinity',
  BLUNOA: 'Blunoa',
  CAMNAL: 'Camnal',
  CAMP: 'CAMP',
  'OMEGA PACIFIC USA': 'Omega Pacific USA',
  'G-VIEW': 'G-VIEW',
  'G-View': 'G-View',
  STEEL: 'Steel',
  'MIXED BRANDS': '', // placeholder, not a manufacturer
}

function titleCase(value) {
  return value.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

export function displayBrand(brand) {
  const raw = String(brand || '').trim()
  if (!raw) return ''
  if (BRAND_DISPLAY[raw] !== undefined) return BRAND_DISPLAY[raw]
  // Unknown all-caps brands get title case; anything else is left as stored
  // ("Black Diamond").
  return /^[A-Z0-9 &.'-]+$/.test(raw) ? titleCase(raw) : raw
}

export function productTitle(product) {
  const name = String(product?.name || '').trim()
  const brand = displayBrand(product?.brand)
  if (!name) return brand
  if (!brand) return name

  const lowerName = name.toLowerCase()
  const lowerBrand = brand.toLowerCase()
  if (lowerName === lowerBrand) return brand
  // Some names already start with the brand ("SALEWA Rock Climbing Helmet") —
  // reuse that prefix instead of repeating it, normalising its casing.
  if (lowerName.startsWith(`${lowerBrand} `)) return `${brand}${name.slice(brand.length)}`
  if (lowerName.includes(lowerBrand)) return name
  return `${brand} ${name}`
}
