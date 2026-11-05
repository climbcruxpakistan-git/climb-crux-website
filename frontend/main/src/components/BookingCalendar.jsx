import { useMemo, useState } from 'react'

const WEEK_START = 0 // 0 = Sunday, 1 = Monday
const MAX_DAYS_AHEAD = 30 // bookings open 30 days ahead only
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad = (n) => String(n).padStart(2, '0')
const toStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m: m - 1, d }
}

export const formatDateLabel = (s) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${s}T00:00:00Z`))

export default function BookingCalendar({ value, onChange, bookedDates = [], todayStr }) {
  const today = parse(todayStr)
  const [view, setView] = useState({ y: today.y, m: today.m })
  const booked = useMemo(() => new Set(bookedDates), [bookedDates])

  const max = new Date(Date.UTC(today.y, today.m, today.d + MAX_DAYS_AHEAD))
  const maxStr = toStr(max.getUTCFullYear(), max.getUTCMonth(), max.getUTCDate())
  const maxView = parse(maxStr)

  const idx = (v) => v.y * 12 + v.m
  const canPrev = idx(view) > idx(today)
  const canNext = idx(view) < idx(maxView)
  const shift = (delta) =>
    setView(({ y, m }) => {
      const i = y * 12 + m + delta
      return { y: Math.floor(i / 12), m: i % 12 }
    })

  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(view.y, view.m, 1)))

  const total = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate()
  const offset = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() - WEEK_START + 7) % 7
  const cells = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  const weekdays = [...WEEKDAYS.slice(WEEK_START), ...WEEKDAYS.slice(0, WEEK_START)]

  return (
    <div className="cc-cal">
      <div className="cc-cal-header">
        <button
          type="button"
          className="cc-cal-nav"
          onClick={() => shift(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="cc-cal-title" aria-live="polite">{monthLabel}</span>
        <button
          type="button"
          className="cc-cal-nav"
          onClick={() => shift(1)}
          disabled={!canNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="cc-cal-weekdays" aria-hidden="true">
        {weekdays.map((w) => <span key={w}>{w}</span>)}
      </div>

      <div className="cc-cal-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />
          const str = toStr(view.y, view.m, d)
          const isPast = str < todayStr
          const isBeyond = str > maxStr
          const isDisabled = isPast || isBeyond
          const isBooked = !isDisabled && booked.has(str)
          const isSelected = str === value
          const cls = [
            'cc-day',
            isDisabled ? 'is-past' : isBooked ? 'is-booked' : 'is-free',
            isSelected && 'is-selected',
            str === todayStr && 'is-today',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={str}
              type="button"
              className={cls}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={`${formatDateLabel(str)}, ${isDisabled ? 'not available' : isBooked ? 'booked' : 'available'}`}
              onClick={() => onChange(str)}
            >
              {d}
            </button>
          )
        })}
      </div>

      <div className="cc-cal-legend">
        <span><i className="cc-swatch free" /> Available</span>
        <span><i className="cc-swatch booked" /> Booked</span>
        <span><i className="cc-swatch past" /> Unavailable</span>
      </div>
      <p className="cc-cal-hint">
        Tap on booked days to check with our team on WhatsApp whether we can still fit you in.
      </p>
    </div>
  )
}
