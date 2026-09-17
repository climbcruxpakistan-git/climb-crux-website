import { useEffect, useMemo, useState } from 'react'
import { AVAILABLE_GRADES, formatGrade, sortRoutesByGrade } from '../../data/margallaRoutes'
import {
  defaultFilters,
  filterRoutes,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  venueOptions,
} from '../../lib/routeFilters'

/**
 * The route explorer, used in two modes so both stay on one implementation:
 *
 *  · `compact` — the guide page's "Explore Routes by Grade" block: a grade
 *    range bar plus a small set of matching routes and a link to the library.
 *  · `full` — the route library at /routes: search + climbing area + grade
 *    range + venue, with the filter state kept in the URL so filtered views can
 *    be bookmarked or shared.
 *
 * Filtering, grade ordering and the URL conventions all come from
 * `lib/routeFilters` and `lib/grades`.
 */

const ALL = 'all'

/** How many routes the compact (guide page) explorer shows at most. */
const COMPACT_LIMIT = 6

const LAST_GRADE_INDEX = AVAILABLE_GRADES.length - 1

function gradeAt(index) {
  return AVAILABLE_GRADES[Math.min(Math.max(index, 0), LAST_GRADE_INDEX)]
}

function gradePercent(index) {
  return LAST_GRADE_INDEX === 0 ? 0 : (index / LAST_GRADE_INDEX) * 100
}

/** Two-handle grade range on one bar, ordered by climbing progression. */
function GradeRange({ idPrefix, minGrade, maxGrade, onChange }) {
  const minIndex = Math.max(0, AVAILABLE_GRADES.indexOf(minGrade))
  const maxIndex = Math.max(0, AVAILABLE_GRADES.indexOf(maxGrade))
  const labelId = `${idPrefix}-grade-range-label`

  // The handles push each other rather than crossing.
  const changeMin = (event) => {
    const index = Number(event.target.value)
    onChange(gradeAt(index), index > maxIndex ? gradeAt(index) : maxGrade)
  }

  const changeMax = (event) => {
    const index = Number(event.target.value)
    onChange(index < minIndex ? gradeAt(index) : minGrade, gradeAt(index))
  }

  const sliderProps = {
    type: 'range',
    min: 0,
    max: LAST_GRADE_INDEX,
    step: 1,
  }

  return (
    <div className="grade-range" role="group" aria-labelledby={labelId}>
      <div className="grade-range-head">
        <span className="grade-range-label" id={labelId}>
          Grade range
        </span>
        {/* Repeated visually only — each slider announces its own grade. */}
        <span className="grade-range-readout" aria-hidden="true">
          <b>{minGrade}</b>
          <span className="grade-range-dash">to</span>
          <b>{maxGrade}</b>
        </span>
      </div>

      <div className="grade-slider">
        <div className="grade-slider-track" aria-hidden="true">
          <span
            className="grade-slider-fill"
            style={{ left: `${gradePercent(minIndex)}%`, right: `${100 - gradePercent(maxIndex)}%` }}
          />
        </div>
        <input
          {...sliderProps}
          id={`${idPrefix}-grade-min`}
          className="grade-slider-input grade-slider-min"
          value={minIndex}
          onChange={changeMin}
          aria-label="Minimum grade"
          aria-valuetext={minGrade}
          // When both handles sit together, the lower one stays grabbable.
          style={{ zIndex: minIndex === maxIndex && minIndex > LAST_GRADE_INDEX / 2 ? 4 : 2 }}
        />
        <input
          {...sliderProps}
          id={`${idPrefix}-grade-max`}
          className="grade-slider-input grade-slider-max"
          value={maxIndex}
          onChange={changeMax}
          aria-label="Maximum grade"
          aria-valuetext={maxGrade}
          style={{ zIndex: 3 }}
        />
      </div>

      <div className="grade-slider-scale" aria-hidden="true">
        <span>{AVAILABLE_GRADES[0]}</span>
        <span>{AVAILABLE_GRADES[LAST_GRADE_INDEX]}</span>
      </div>
    </div>
  )
}

/** Full route card — the library presentation (description, pitches, tags). */
function RouteCard({ route }) {
  return (
    <li className="explorer-card">
      <div className="explorer-card-head">
        <span className="explorer-card-name">{route.name}</span>
        <span className="explorer-card-meta">
          {formatGrade(route)}
          {route.length ? <> · {route.length}m</> : null}
          <span className="explorer-card-venue">
            {route.area} · {route.venue}
          </span>
        </span>
      </div>
      <p className="explorer-card-desc">{route.description}</p>
      {route.pitches && (
        <ul className="explorer-pitches" role="list">
          {route.pitches.map((pitch) => (
            <li key={pitch.label} className="explorer-pitch">
              <span className="explorer-pitch-label">{pitch.label}</span>
              <span className="explorer-pitch-grade">{pitch.grade}</span>
              {pitch.length ? <span className="explorer-pitch-len">{pitch.length}m</span> : null}
              <span className="explorer-pitch-desc">{pitch.description}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/** Compact result row — name, grade, area · venue. */
function RouteHit({ route }) {
  return (
    <li className="explorer-hit">
      <span className="explorer-hit-name">{route.name}</span>
      <span className="explorer-hit-grade">{formatGrade(route)}</span>
      <span className="explorer-hit-where">
        {route.area} · {route.venue}
      </span>
    </li>
  )
}

export default function RouteExplorer({ routes, areas, mode = 'full' }) {
  const isCompact = mode === 'compact'
  // Only the route library owns its URL state; the guide page stays clean.
  const syncUrl = !isCompact

  const [filters, setFilters] = useState(defaultFilters)
  // Hydration guard: the URL is read after mount so the server-rendered markup
  // and the first client render stay identical.
  const [urlReady, setUrlReady] = useState(!syncUrl)
  const idPrefix = isCompact ? 'guide' : 'library'

  useEffect(() => {
    if (!syncUrl) return undefined
    const applyFromUrl = () =>
      setFilters(filtersFromParams(new URLSearchParams(window.location.search), areas))
    applyFromUrl()
    setUrlReady(true)
    // Back/forward (and returning to a shared link) restores the filters.
    window.addEventListener('popstate', applyFromUrl)
    return () => window.removeEventListener('popstate', applyFromUrl)
  }, [areas, syncUrl])

  // Keep the URL in step with the filters so views can be shared or bookmarked.
  useEffect(() => {
    if (!syncUrl || !urlReady) return undefined
    const timer = setTimeout(() => {
      const query = filtersToParams(filters).toString()
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
    }, 250)
    return () => clearTimeout(timer)
  }, [filters, syncUrl, urlReady])

  const venues = useMemo(() => venueOptions(areas, filters.area), [areas, filters.area])

  const matched = useMemo(() => sortRoutesByGrade(filterRoutes(routes, filters)), [routes, filters])

  // The guide page shows a compact set, never the whole database.
  const visible = isCompact ? matched.slice(0, COMPACT_LIMIT) : matched
  const active = hasActiveFilters(filters)

  const update = (patch) => setFilters((current) => ({ ...current, ...patch }))
  const reset = () => setFilters(defaultFilters())

  const count = (
    <p className="explorer-count" role="status">
      {isCompact ? (
        matched.length === 0 ? (
          <>No routes found for this grade range.</>
        ) : visible.length < matched.length ? (
          <>
            Showing <strong>{visible.length}</strong> of {matched.length} routes
          </>
        ) : (
          <>
            Showing <strong>{matched.length}</strong> {matched.length === 1 ? 'route' : 'routes'}
          </>
        )
      ) : (
        <>
          <strong>{matched.length}</strong> {matched.length === 1 ? 'route' : 'routes'} found
        </>
      )}
      {!isCompact && active && (
        <button type="button" className="explorer-reset" onClick={reset}>
          Clear all filters
        </button>
      )}
    </p>
  )

  return (
    <div className="explorer-wrap">
      <div
        className="explorer-filters"
        role={isCompact ? undefined : 'search'}
        aria-label={isCompact ? undefined : 'Filter routes'}
      >
        {!isCompact && (
          <div className="explorer-fields">
            <div className="explorer-field explorer-field-search">
              <label className="explorer-label" htmlFor={`${idPrefix}-search`}>
                Route search
              </label>
              <div className="explorer-search-row">
                <input
                  id={`${idPrefix}-search`}
                  type="search"
                  className="explorer-search"
                  placeholder="Search by route name, venue or area..."
                  value={filters.search}
                  onChange={(event) => update({ search: event.target.value })}
                />
                {filters.search.trim() !== '' && (
                  <button
                    type="button"
                    className="explorer-clear"
                    onClick={() => update({ search: '' })}
                    aria-label="Clear the route search"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="explorer-field">
              <label className="explorer-label" htmlFor={`${idPrefix}-area`}>
                Climbing area
              </label>
              <select
                id={`${idPrefix}-area`}
                className="explorer-select"
                value={filters.area}
                onChange={(event) => setFilters((current) => ({ ...current, area: event.target.value, venue: ALL }))}
              >
                <option value={ALL}>All climbing areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="explorer-field">
              <label className="explorer-label" htmlFor={`${idPrefix}-venue`}>
                Venue
              </label>
              <select
                id={`${idPrefix}-venue`}
                className="explorer-select"
                value={filters.venue}
                onChange={(event) => update({ venue: event.target.value })}
              >
                <option value={ALL}>
                  {filters.area === ALL ? 'All venues' : 'All venues in this area'}
                </option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <GradeRange
          idPrefix={idPrefix}
          minGrade={filters.minGrade}
          maxGrade={filters.maxGrade}
          onChange={(minGrade, maxGrade) => update({ minGrade, maxGrade })}
        />
      </div>

      {count}

      {matched.length === 0 && !isCompact && (
        <div className="explorer-empty">
          <p>No routes match the selected filters.</p>
          <button type="button" className="explorer-reset" onClick={reset}>
            Clear all filters
          </button>
        </div>
      )}

      {visible.length > 0 && (
        <ul className={isCompact ? 'explorer-hits' : 'explorer-list'} role="list">
          {visible.map((route) =>
            isCompact ? (
              <RouteHit key={`${route.venueId}-${route.name}`} route={route} />
            ) : (
              <RouteCard key={`${route.venueId}-${route.name}`} route={route} />
            )
          )}
        </ul>
      )}

      {isCompact && (
        <div className="explorer-actions">
          <p className="explorer-note">
            Multi-pitch lines are graded by their hardest pitch, so Teamwork is listed under 6c+ even
            though its first pitch is 4a.
          </p>
          {matched.length === 0 && (
            <button type="button" className="explorer-reset" onClick={reset}>
              Reset grade range
            </button>
          )}
          <a className="btn btn-primary" href="/routes">
            View All Routes →
          </a>
        </div>
      )}
    </div>
  )
}
