import { useState, useMemo } from 'react'
import { gradeBucket, GRADE_BUCKETS, formatGrade } from '../../data/margallaRoutes'

const VALID_BUCKETS = new Set(GRADE_BUCKETS.map((b) => b.id))

function readParams() {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function initialGrade() {
  const bucket = readParams().get('bucket')
  return bucket && VALID_BUCKETS.has(bucket) ? bucket : 'all'
}

function initialArea(areas) {
  const id = readParams().get('area')
  return id && areas.some((a) => a.id === id) ? id : 'all'
}

function initialVenue(areas, areaId) {
  const id = readParams().get('venue')
  if (!id) return 'all'
  const source = areaId === 'all' ? areas : areas.filter((a) => a.id === areaId)
  return source.some((a) => a.venues.some((v) => v.id === id)) ? id : 'all'
}

export default function RouteExplorer({ routes, areas }) {
  const [grade, setGrade] = useState(initialGrade)
  const [areaId, setAreaId] = useState(() => initialArea(areas))
  const [venue, setVenue] = useState(() => initialVenue(areas, areaId))
  const [search, setSearch] = useState(() => readParams().get('search') || '')

  const areaOptions = useMemo(() => {
    const set = new Map(areas.map((a) => [a.id, a.name]))
    return [{ id: 'all', name: 'All Areas' }, ...Array.from(set.entries()).map(([id, name]) => ({ id, name }))]
  }, [areas])

  const venueOptions = useMemo(() => {
    const source = areaId === 'all' ? areas : areas.filter((a) => a.id === areaId)
    const names = new Map()
    for (const area of source) {
      for (const v of area.venues) {
        if (!names.has(v.id)) names.set(v.id, v.name)
      }
    }
    return [{ id: 'all', name: 'All Venues' }, ...Array.from(names.entries()).map(([id, name]) => ({ id, name }))]
  }, [areas, areaId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return routes.filter((r) => {
      if (grade !== 'all' && gradeBucket(r.grade) !== grade) return false
      if (areaId !== 'all' && r.areaId !== areaId) return false
      if (venue !== 'all' && r.venueId !== venue) return false
      if (q && !r.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [routes, grade, areaId, venue, search])

  const hasFilters = grade !== 'all' || areaId !== 'all' || venue !== 'all' || search.trim() !== ''

  const reset = () => {
    setGrade('all')
    setAreaId('all')
    setVenue('all')
    setSearch('')
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <div className="explorer-wrap">
      <div className="explorer-filters" role="search" aria-label="Filter routes">
        <div className="explorer-search-row">
          <input
            type="search"
            className="explorer-search"
            placeholder="Search routes by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search routes by name"
          />
        </div>
        <fieldset>
          <legend className="visually-hidden">Grade</legend>
          <div className="filter-row">
            {GRADE_BUCKETS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={grade === b.id ? 'filter-btn active' : 'filter-btn'}
                aria-pressed={grade === b.id}
                onClick={() => setGrade(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="visually-hidden">Area</legend>
          <div className="filter-row">
            {areaOptions.map((a) => (
              <button
                key={a.id}
                type="button"
                className={areaId === a.id ? 'filter-btn active' : 'filter-btn'}
                aria-pressed={areaId === a.id}
                onClick={() => {
                  setAreaId(a.id)
                  setVenue('all')
                }}
              >
                {a.name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="visually-hidden">Venue</legend>
          <div className="filter-row">
            {venueOptions.map((v) => (
              <button
                key={v.id}
                type="button"
                className={venue === v.id ? 'filter-btn active' : 'filter-btn'}
                aria-pressed={venue === v.id}
                onClick={() => setVenue(v.id)}
              >
                {v.name}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <p className="explorer-count" aria-live="polite">
        <strong>{filtered.length}</strong> {filtered.length === 1 ? 'route' : 'routes'} found
        {hasFilters && (
          <button type="button" className="explorer-reset" onClick={reset}>
            Reset filters
          </button>
        )}
      </p>
      {filtered.length === 0 && (
        <div className="explorer-empty">
          <p>No routes match the selected filters.</p>
          <button type="button" className="explorer-reset" onClick={reset}>
            Clear filters
          </button>
        </div>
      )}
      <ul className="explorer-list" role="list">
        {filtered.map((r) => (
          <li key={`${r.venueId}-${r.name}`} className="explorer-card">
            <div className="explorer-card-head">
              <span className="explorer-card-name">{r.name}</span>
              <span className="explorer-card-meta">
                {formatGrade(r)}
                {r.length ? <> · {r.length}m</> : null}
                <span className="explorer-card-venue">{r.venue}</span>
              </span>
            </div>
            <p className="explorer-card-desc">{r.description}</p>
            {r.pitches && (
              <ul className="explorer-pitches" role="list">
                {r.pitches.map((p) => (
                  <li key={p.label} className="explorer-pitch">
                    <span className="explorer-pitch-label">{p.label}</span>
                    <span className="explorer-pitch-grade">{p.grade}</span>
                    {p.length ? <span className="explorer-pitch-len">{p.length}m</span> : null}
                    <span className="explorer-pitch-desc">{p.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
