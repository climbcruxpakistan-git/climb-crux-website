import { useMemo, useState } from 'react'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n) => String(n).padStart(2, '0')
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

export function getTodayKarachi() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
}
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
export function prettyDate(key, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

/**
 * value: 'YYYY-MM-DD' | ''   onChange(key)   bookedDates: string[]
 * Window: today .. today + maxDaysAhead. Booked days stay clickable (the parent shows the WhatsApp notice).
 */
export default function BookingCalendar({ value, onChange, bookedDates = [], maxDaysAhead = 30 }) {
  const today = useMemo(getTodayKarachi, [])
  const last = addDays(today, maxDaysAhead)
  const [ty, tm] = today.split('-').map(Number)
  const [ly, lm] = last.split('-').map(Number)
  const [view, setView] = useState({ y: ty, m: tm - 1 })
  const booked = useMemo(() => new Set(bookedDates), [bookedDates])

  const idx = view.y * 12 + view.m
  const canPrev = idx > ty * 12 + tm - 1
  const canNext = idx < ly * 12 + lm - 1
  const shift = (n) => setView((v) => { const t = v.y * 12 + v.m + n; return { y: Math.floor(t / 12), m: t % 12 } })

  const lead = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay()
  const count = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate()
  const title = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(view.y, view.m, 1)))

  return (
    <div className="bn-cal">
      <div className="bn-cal-head">
        <strong>{title}</strong>
        <div>
          <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => shift(-1)}>‹</button>
          <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => shift(1)}>›</button>
        </div>
      </div>
      <div className="bn-cal-grid bn-cal-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="bn-cal-grid">
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const d = i + 1
          const k = keyOf(view.y, view.m, d)
          const out = k < today || k > last
          const state = out ? 'out' : booked.has(k) ? 'booked' : 'free'
          const tip = state === 'booked' ? 'Already booked' : state === 'out' ? 'Unavailable' : 'Free'
          return (
            <button
              key={k} type="button"
              className={`bn-day is-${state}${value === k ? ' is-selected' : ''}`}
              data-tip={tip}
              aria-disabled={out || undefined}
              aria-pressed={value === k}
              aria-label={`${prettyDate(k)} — ${tip}`}
              onClick={() => { if (!out) onChange(k) }}
            >{d}</button>
          )
        })}
      </div>
      <div className="bn-legend">
        <span><i className="free" />Free</span>
        <span><i className="booked" />Booked</span>
        <span><i className="out" />Unavailable</span>
      </div>
    </div>
  )
}
