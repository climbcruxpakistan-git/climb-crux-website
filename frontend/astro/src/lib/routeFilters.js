/**
 * Route filtering — shared by the compact explorer on the guide page and the
 * full route library, so both always read the same data, the same grade
 * ordering and the same URL conventions.
 *
 * Filter state is a plain object:
 *
 *   { area, venue, search, minGrade, maxGrade }
 *
 * Filters combine with AND: search AND area AND grade range AND venue. The
 * `'all'` value (or an empty search) means "not filtered".
 *
 * The URL is the bookmarked/shareable form of that state, using the parameter
 * names in ROUTE_PARAMS — guide-page links use `routeLibraryHref()` so the
 * names are only ever written down here.
 */

import { AVAILABLE_GRADES, LEGACY_GRADE_BUCKETS } from '../data/margallaRoutes.js'
import { gradeInRange, gradeRank } from './grades.js'

const ALL = 'all'

/** Query-parameter names for the route library's filter state. */
export const ROUTE_PARAMS = {
  area: 'area',
  venue: 'venue',
  search: 'search',
  minGrade: 'minGrade',
  maxGrade: 'maxGrade',
  /** Legacy coarse bucket (`?bucket=6a-6c`) — read only, never written. */
  bucket: 'bucket',
}

export const DEFAULT_GRADE_MIN = AVAILABLE_GRADES[0]
export const DEFAULT_GRADE_MAX = AVAILABLE_GRADES[AVAILABLE_GRADES.length - 1]

/** The unfiltered state: every documented route. */
export function defaultFilters() {
  return {
    area: ALL,
    venue: ALL,
    search: '',
    minGrade: DEFAULT_GRADE_MIN,
    maxGrade: DEFAULT_GRADE_MAX,
  }
}

function gradeIndex(grade) {
  const index = AVAILABLE_GRADES.indexOf(grade)
  return index === -1 ? null : index
}

/** Closest available grade at or above / below `grade` (used for legacy bounds). */
function nearestGrade(grade, direction) {
  const rank = gradeRank(grade)
  if (rank === null) return null
  if (direction === 'up') {
    return AVAILABLE_GRADES.find((candidate) => gradeRank(candidate) >= rank) ?? DEFAULT_GRADE_MAX
  }
  let found = null
  for (const candidate of AVAILABLE_GRADES) {
    if (gradeRank(candidate) > rank) break
    found = candidate
  }
  return found
}

/** Clamp a requested min/max pair onto grades that exist, ordered low → high. */
export function normalizeGradeRange(min, max) {
  let low = gradeIndex(min) ?? gradeIndex(nearestGrade(min, 'up')) ?? 0
  let high = gradeIndex(max) ?? gradeIndex(nearestGrade(max, 'down')) ?? AVAILABLE_GRADES.length - 1
  if (low > high) [low, high] = [high, low]
  return { minGrade: AVAILABLE_GRADES[low], maxGrade: AVAILABLE_GRADES[high] }
}

/** Read filter state out of a query string; unknown values fall back to defaults. */
export function filtersFromParams(params, areas) {
  const filters = defaultFilters()

  const area = params.get(ROUTE_PARAMS.area)
  if (area && areas.some((candidate) => candidate.id === area)) filters.area = area

  const venue = params.get(ROUTE_PARAMS.venue)
  if (venue) {
    const source = filters.area === ALL ? areas : areas.filter((candidate) => candidate.id === filters.area)
    if (source.some((candidate) => candidate.venues.some((item) => item.id === venue))) filters.venue = venue
  }

  const search = params.get(ROUTE_PARAMS.search)
  if (search) filters.search = search

  const min = params.get(ROUTE_PARAMS.minGrade)
  const max = params.get(ROUTE_PARAMS.maxGrade)
  if (min || max) {
    Object.assign(filters, normalizeGradeRange(min ?? DEFAULT_GRADE_MIN, max ?? DEFAULT_GRADE_MAX))
    return filters
  }

  // Old grade-bucket links keep working.
  const bucket = legacyGradeBucket(params.get(ROUTE_PARAMS.bucket))
  if (bucket) Object.assign(filters, normalizeGradeRange(bucket[0], bucket[1]))

  return filters
}

/**
 * Look up an old `?bucket=` id. Old links were written without escaping, so
 * `?bucket=8a+` reaches us as "8a " (a `+` in a query string decodes to a
 * space) — both spellings need to resolve.
 */
function legacyGradeBucket(value) {
  if (!value) return null
  const candidates = [value, value.trim(), `${value.trim()}+`]
  for (const candidate of candidates) {
    if (LEGACY_GRADE_BUCKETS[candidate]) return LEGACY_GRADE_BUCKETS[candidate]
  }
  return null
}

/** Serialise filter state back to a query string; defaults are omitted. */
export function filtersToParams(filters) {
  const params = new URLSearchParams()
  if (filters.area !== ALL) params.set(ROUTE_PARAMS.area, filters.area)
  if (filters.venue !== ALL) params.set(ROUTE_PARAMS.venue, filters.venue)
  const search = filters.search.trim()
  if (search) params.set(ROUTE_PARAMS.search, search)
  if (filters.minGrade !== DEFAULT_GRADE_MIN) params.set(ROUTE_PARAMS.minGrade, filters.minGrade)
  if (filters.maxGrade !== DEFAULT_GRADE_MAX) params.set(ROUTE_PARAMS.maxGrade, filters.maxGrade)
  return params
}

/** URL for the route library with filters pre-selected (defaults omitted). */
export function routeLibraryHref(overrides = {}) {
  const filters = defaultFilters()
  for (const key of Object.keys(filters)) {
    if (typeof overrides[key] === 'string' && overrides[key] !== '') filters[key] = overrides[key]
  }
  const query = filtersToParams(filters).toString()
  return query ? `/routes?${query}` : '/routes'
}

/**
 * Apply every active filter together and return the matching routes
 * (ordered with `sortRoutesByGrade` by the caller).
 */
export function filterRoutes(routes, filters) {
  const query = filters.search.trim().toLowerCase()
  return routes.filter((route) => {
    if (filters.area !== ALL && route.areaId !== filters.area) return false
    if (filters.venue !== ALL && route.venueId !== filters.venue) return false
    if (!gradeInRange(route.grade, filters.minGrade, filters.maxGrade)) return false
    if (query && !route.name.toLowerCase().includes(query)) return false
    return true
  })
}

/** Venue options for a filter control, scoped to the selected climbing area. */
export function venueOptions(areas, areaId) {
  const source = areaId === ALL ? areas : areas.filter((area) => area.id === areaId)
  const found = new Map()
  for (const area of source) {
    for (const venue of area.venues) {
      if (!found.has(venue.id)) found.set(venue.id, venue.name)
    }
  }
  return Array.from(found, ([id, name]) => ({ id, name }))
}

/** True when the state is narrower than the full library. */
export function hasActiveFilters(filters) {
  return (
    filters.area !== ALL ||
    filters.venue !== ALL ||
    filters.search.trim() !== '' ||
    filters.minGrade !== DEFAULT_GRADE_MIN ||
    filters.maxGrade !== DEFAULT_GRADE_MAX
  )
}
