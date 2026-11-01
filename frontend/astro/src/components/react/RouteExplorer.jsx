import { useEffect, useMemo, useState } from 'react'
import { AVAILABLE_GRADES, sortRoutesByGrade } from '../../data/margallaRoutes'
import { slugify } from '../../lib/slug'
import {
  defaultFilters,
  filterRoutes,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  routeDetailHref,
  venueOptions,
} from '../../lib/routeFilters'
import RouteRow from './RouteRow.jsx'
import RoutePreview from './RoutePreview.jsx'
import './route-explorer-redesign.css'

/**
 * The route explorer. Both modes now share ONE layout (filter panel, one route per
 * row, sticky preview panel) so the guide page and the route library look and
 * behave the same.
 *
 *  · `compact` — guide page: same UI, but only the first COMPACT_LIMIT matches are
 *    listed, with a button that opens the library with the current filters.
 *  · `full` — the route library: every match is listed.
 *
 * Filtering, grade ordering and URL conventions come from `lib/routeFilters` and
 * `lib/grades`. Individual route pages do not use this component.
 */

const ALL = 'all'
const LAST_GRADE_INDEX = AVAILABLE_GRADES.length - 1
/** All matching routes render on the guide page (the library page is gone). */
const COMPACT_LIMIT = Infinity

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

  const sliderProps = { type: 'range', min: 0, max: LAST_GRADE_INDEX, step: 1 }

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

/** Route search input. Matches route name, venue and area. */
function RouteSearch({ idPrefix, value, onChange, onClear }) {
  return (
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
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {value.trim() !== '' && (
          <button type="button" className="explorer-clear" onClick={onClear} aria-label="Clear the route search">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default function RouteExplorer({ routes, areas, mode = 'full' }) {
  const isCompact = mode === 'compact'

  // URL sync is on in both modes: the hero chart drives the list through
  // ?minGrade=X&maxGrade=X and the library button carries the filters over.
  const syncUrl = true

  const [filters, setFilters] = useState(defaultFilters)
  // Hydration guard: the URL is read after mount so the server-rendered markup
  // and the first client render stay identical.
  const [urlReady, setUrlReady] = useState(false)
  const idPrefix = isCompact ? 'guide' : 'library'

  useEffect(() => {
    const applyFromUrl = () =>
      setFilters(filtersFromParams(new URLSearchParams(window.location.search), areas))
    applyFromUrl()
    setUrlReady(true)
    // Back/forward (and the hero chart's synthetic popstate) restores the filters.
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
  const shown = isCompact ? matched.slice(0, COMPACT_LIMIT) : matched
  const active = hasActiveFilters(filters)

  // The preview is tracked by route name. A route picked from the preview's
  // "related" lists stays selected even if it isn't in the current list.
  const [selectedName, setSelectedName] = useState(null)

  // When the filtered list changes: keep the selection if it is still listed;
  // otherwise, on desktop, select the first match so the preview is never empty.
  // On phones nothing opens automatically (the preview is a bottom sheet).
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 981px)').matches
    setSelectedName((current) => {
      if (current && matched.some((r) => r.name === current)) return current
      return desktop && matched.length > 0 ? matched[0].name : null
    })
  }, [matched])

  const selected = selectedName
    ? matched.find((r) => r.name === selectedName) || routes.find((r) => r.name === selectedName)
    : null

  const update = (patch) => setFilters((current) => ({ ...current, ...patch }))
  const reset = () => setFilters(defaultFilters())
  const searchActive = filters.search.trim() !== ''

  return (
    <div className="explorer-wrap">
      <div className="explorer-filters" role="search" aria-label="Filter routes">
        <div className="explorer-fields">
          <RouteSearch
            idPrefix={idPrefix}
            value={filters.search}
            onChange={(search) => update({ search })}
            onClear={() => update({ search: '' })}
          />

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
              <option value={ALL}>{filters.area === ALL ? 'All venues' : 'All venues in this area'}</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <GradeRange
          idPrefix={idPrefix}
          minGrade={filters.minGrade}
          maxGrade={filters.maxGrade}
          onChange={(minGrade, maxGrade) => update({ minGrade, maxGrade })}
        />
      </div>

      {/* One count line (replaces the old "59 ROUTES FOUND" heading + count row). */}
      <p className="explorer-count" id="route-results" role="status">
        <span>
          <strong>{matched.length}</strong> {matched.length === 1 ? 'route' : 'routes'} found
        </span>
        {active && (
          <button type="button" className="explorer-reset" onClick={reset}>
            Clear all filters
          </button>
        )}
      </p>

      {matched.length === 0 && (
        <div className="explorer-empty">
          <p>{searchActive ? 'No routes match your search.' : 'No routes match the selected filters.'}</p>
          <button type="button" className="explorer-reset" onClick={reset}>
            Clear all filters
          </button>
        </div>
      )}

      {matched.length > 0 && (
        <div className="rx-lay">
          <ul className="rx-list" role="list">
            {shown.map((route) => (
              <RouteRow
                key={`${route.venueId}-${route.name}`}
                route={route}
                selected={selected?.name === route.name}
                onSelect={(r) => setSelectedName(r.name)}
                href={routeDetailHref(slugify(route.name))}
              />
            ))}
          </ul>
          <aside className={`rx-aside${selected ? ' is-open' : ''}`}>
            <RoutePreview
              route={selected}
              allRoutes={routes}
              grades={AVAILABLE_GRADES}
              href={routeDetailHref(slugify(selected?.name || ''))}
              onClose={() => setSelectedName(null)}
              onSelect={(name) => setSelectedName(name)}
            />
          </aside>
        </div>
      )}

      {isCompact && (
        <div className="explorer-actions">
          <p className="explorer-note">
            Multi-pitch lines are graded by their hardest pitch, so Teamwork is listed under 6c+ even though its
            first pitch is 4a.
          </p>
        </div>
      )}
    </div>
  )
}
