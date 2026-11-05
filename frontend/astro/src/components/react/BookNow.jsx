import { useEffect, useMemo, useRef, useState } from 'react'
import BookingCalendar, { prettyDate } from './BookingCalendar.jsx'
import {
  createBooking,
  getAvailableSessions,
  getBookedDates,
  getMembershipFormUrl,
  getPlans,
  getSessionContent,
} from '../../lib/api'
import { WHATSAPP_WA_ME } from '../../../../../shared/contact.js'
import './booknow.css'

const CUSTOM_GROUP_EMAIL = 'climbcruxpakistan@gmail.com'
const PRIVATE_MAX_PEOPLE = 20
const TIME_SLOTS = [['06:30', '6:30 AM'], ['08:00', '8:00 AM'], ['10:00', '10:00 AM'], ['12:00', '12:00 PM'], ['15:00', '3:00 PM'], ['16:30', '4:30 PM']]

// Keep identical to the existing BOOKING_TERMS (also in backend/src/membershipForm.js).
const BOOKING_TERMS = [
  'I agree to follow all instructions given by Climb Crux instructors and staff.',
  'I understand that rock climbing involves inherent risks, including the risk of injury. I voluntarily choose to participate, accept these risks and agree not to hold Climb Crux, its instructors, staff or volunteers responsible for any injury or loss resulting from my participation.',
  'I have read, understood and agree to the Climb Crux Liability Waiver and Terms & Conditions.',
]
const ERRORS = {
  DATE_BOOKED: 'That day was just booked. Pick another day or confirm with us on WhatsApp.',
  PAST_DATE: 'That date has passed. Please pick a date from today onwards.',
  DATE_TOO_FAR: 'Private sessions can be booked up to 30 days ahead.',
  INVALID_DATE: 'That date isn’t valid. Please pick it again from the calendar.',
}

/** Prices come from the CMS as display strings ("8,000"). */
const parsePrice = (val) => (val ? Number(String(val).replace(/,/g, '')) || 0 : 0)
const fmt = (n) => `PKR ${Number(n).toLocaleString('en-PK')}`
const isPrivate = (t) => t === 'private-starter' || t === 'private-advanced'
const waLink = (text) => `${WHATSAPP_WA_ME}?text=${encodeURIComponent(text)}`

/* ── Small pieces ───────────────────────────────────────────────────────── */
function Select({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [])
  const cur = options.find((o) => o.value === value)
  const pick = (v) => { onChange(v); setOpen(false) }
  return (
    <div className="bn-select" ref={ref} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button type="button" id="session-type" className={`bn-select-btn${open ? ' is-open' : ''}`}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="bn-opt">
          {cur ? (<><b>{cur.label}</b><small>{cur.desc}</small></>) : <b className="bn-placeholder">Choose a session type</b>}
        </span>
        {cur?.price != null && <span className="bn-price">{fmt(cur.price)}</span>}
        <svg className="bn-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <ul className="bn-menu" role="listbox">
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value} tabIndex={0}
              className={o.value === value ? 'is-on' : ''} onClick={() => pick(o.value)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(o.value))}>
              <span className="bn-opt"><b>{o.label}</b><small>{o.desc}</small></span>
              {o.price != null && <span className="bn-price">{fmt(o.price)}</span>}
              {o.value === value && <svg width="18" height="18" viewBox="0 0 14 14"><path d="M2 7.5l3.3 3.2L12 3.5" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const Field = ({ label, id, children }) => (
  <div className="bn-field"><label htmlFor={id}>{label}</label>{children}</div>
)

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function BookNow({ preselected = '' }) {
  const [plans, setPlans] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionsDisabled, setSessionsDisabled] = useState(false)
  const [bookedDates, setBookedDates] = useState([])
  const [membershipTitle, setMembershipTitle] = useState('Monthly Membership')
  const [publicPrice, setPublicPrice] = useState(2500)
  const [loaded, setLoaded] = useState(false)

  const [type, setType] = useState('')
  const [f, setF] = useState({ name: '', phone: '', email: '', ecName: '', ecPhone: '' })
  const [people, setPeople] = useState(1)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [otherTime, setOtherTime] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [agreed, setAgreed] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [tried, setTried] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      getSessionContent(),
      getPlans(),
      getAvailableSessions(),
      getBookedDates(),
    ]).then(([c, p, s, b]) => {
      if (c.status === 'fulfilled' && c.value) {
        setPublicPrice(parsePrice(c.value.pricingPrice) || 2500)
        setMembershipTitle(c.value.membership?.title || 'Monthly Membership')
        setSessionsDisabled(Boolean(c.value.sessionsDisabled))
      }
      if (p.status === 'fulfilled') setPlans(Array.isArray(p.value) ? p.value : [])
      if (s.status === 'fulfilled') setSessions(Array.isArray(s.value) ? s.value : [])
      if (b.status === 'fulfilled') setBookedDates(Array.isArray(b.value) ? b.value : [])
      setLoaded(true)
    })
  }, [])

  // Plans are keyed by `type`, which is also the value sent as `session_id`.
  const starter = plans.find((p) => p.type === 'private-starter')
  const advanced = plans.find((p) => p.type === 'private-advanced')
  const priceOf = (p) => (p ? parsePrice(p.price) : null)

  const options = useMemo(() => [
    { value: 'public', label: 'Public Session', desc: 'Beginner-friendly climb with a small group' },
    { value: 'membership', label: membershipTitle, desc: 'Discounted climbing all month long' },
    ...(starter ? [{ value: 'private-starter', label: 'Starter Private', desc: 'Your own route, pace and instructor', price: priceOf(starter) }] : []),
    ...(advanced ? [{ value: 'private-advanced', label: 'Advanced Private', desc: 'Higher grades, tailored coaching', price: priceOf(advanced) }] : []),
    { value: 'custom-group', label: 'Customize Group Session', desc: 'A group session built around your team' },
  ], [starter, advanced, membershipTitle])

  // Honour ?type= only if it matches a real option.
  useEffect(() => { if (loaded && !type && options.some((o) => o.value === preselected)) setType(preselected) }, [loaded]) // eslint-disable-line

  const publicSessions = sessionsDisabled ? [] : sessions
  const session = publicSessions.find((s) => String(s.id ?? s._id) === sessionId)
  const plan = type === 'private-starter' ? starter : type === 'private-advanced' ? advanced : null
  const maxPeople = type === 'public'
    ? Math.max(1, Math.min(PRIVATE_MAX_PEOPLE, Number(session?.remaining ?? PRIVATE_MAX_PEOPLE)))
    : PRIVATE_MAX_PEOPLE
  const perPerson = type === 'public' ? publicPrice : priceOf(plan) ?? 0
  const total = perPerson * people
  const isBooked = isPrivate(type) && bookedDates.includes(date)

  const setField = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const choose = (v) => { setType(v); setPeople(1); setDate(''); setTime(''); setOtherTime(false); setSessionId(''); setError(''); setTried(false) }
  const clamp = (n) => setPeople(Math.min(maxPeople, Math.max(1, n || 1)))
  const toggleTerm = (i) => setAgreed((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]))
  const allTerms = agreed.length === BOOKING_TERMS.length
  const toggleAll = () => setAgreed(allTerms ? [] : BOOKING_TERMS.map((_, i) => i))

  const missing = (isPrivate(type) && !date) ? 'date' : (isPrivate(type) && !time) ? 'time' : (type === 'public' && !sessionId) ? 'session' : ''
  const disabled = sending || !loaded || !type || !allTerms || isBooked || (type === 'public' && !sessionId)

  async function submit(e) {
    e.preventDefault()
    setTried(true); setError('')
    if (missing) {
      setError(missing === 'session' ? 'Choose a public session to continue.' : `Choose a ${missing} to continue.`)
      return
    }
    setSending(true)
    try {
      const body = {
        customer_name: f.name.trim(), customer_email: f.email.trim(), customer_phone: f.phone.trim(),
        emergency_contact_name: f.ecName.trim(), emergency_contact_phone: f.ecPhone.trim(),
        session_id: type,
        date: type === 'public' ? (session?.date || '') : date,
        time: type === 'public' ? '' : time,
        ...(type === 'public' && session ? {
          public_session_id: session.id ?? session._id,
          session_title: session.title || '',
          session_date: session.date || '',
          session_start_time: session.startTime || '',
          session_end_time: session.endTime || '',
          session_location: session.locationName || '',
          session_maps_url: session.mapsUrl || '',
          session_meeting_point: session.meetingPoint || '',
          session_meeting_point_maps_url: session.meetingPointMapsUrl || '',
          session_meeting_time: session.meetingTime || '',
        } : {}),
        participants: people,
        amount: total,
        agreed_terms: agreed.map((i) => BOOKING_TERMS[i]),
        booking_status: 'pending_payment',
        payment_status: 'pending',
      }
      const created = await createBooking(body)
      const num = created.booking_number || `CCS-${String(created.id || '').slice(-5).padStart(5, '0')}`
      window.location.href = `/booking/${encodeURIComponent(num)}/payment/`
    } catch (err) {
      setError(ERRORS[err.code] || 'We couldn’t create your booking. Please try again, or message us on WhatsApp.')
      if (err.code === 'DATE_BOOKED') getBookedDates().then(setBookedDates).catch(() => {})
    } finally {
      setSending(false)
    }
  }

  let n = 0
  return (
    <section className="bn">
      <div className="bn-wrap">
        <form className="bn-main" onSubmit={submit}>
          <div className="bn-card">
            <h2><span>{++n}</span>Choose your session</h2>
            <Field label="Session type" id="session-type"><Select value={type} options={options} onChange={choose} /></Field>
          </div>

          {type === 'membership' && (
            <div className="bn-card bn-note-card">
              <h3>Apply for {membershipTitle}</h3>
              <p>Memberships are set up with our team. Apply online, or download the form and send it back to us.</p>
              <div className="bn-actions">
                <a className="bn-btn" href="/membership/apply/">Apply membership online</a>
                <a className="bn-btn bn-btn-ghost" href={getMembershipFormUrl()} target="_blank" rel="noreferrer">Download PDF form</a>
              </div>
            </div>
          )}

          {type === 'custom-group' && (
            <div className="bn-card bn-note-card">
              <h3>Tell us about your group</h3>
              <p>Custom sessions are planned one by one. Email us your group size, preferred dates and what you want to focus on.</p>
              <div className="bn-actions">
                <a className="bn-btn" href={`mailto:${CUSTOM_GROUP_EMAIL}?subject=Custom%20group%20session`}>Email {CUSTOM_GROUP_EMAIL}</a>
              </div>
            </div>
          )}

          {type !== 'membership' && type !== 'custom-group' && (
            <>
              <div className="bn-card">
                <h2><span>{++n}</span>Your details</h2>
                <div className="bn-grid2">
                  <Field label="Full name" id="customer-name"><input id="customer-name" required autoComplete="name" value={f.name} onChange={setField('name')} /></Field>
                  <Field label="Phone / WhatsApp" id="customer-phone"><input id="customer-phone" type="tel" required autoComplete="tel" value={f.phone} onChange={setField('phone')} /></Field>
                  <Field label="Email" id="customer-email"><input id="customer-email" type="email" required autoComplete="email" value={f.email} onChange={setField('email')} /></Field>
                  <Field label="Number of people" id="group-size">
                    <div className="bn-stepper">
                      <button type="button" aria-label="Fewer people" disabled={people <= 1} onClick={() => clamp(people - 1)}>−</button>
                      <input id="group-size" inputMode="numeric" value={people} onChange={(e) => clamp(parseInt(e.target.value, 10))} />
                      <button type="button" aria-label="More people" disabled={people >= maxPeople} onClick={() => clamp(people + 1)}>+</button>
                    </div>
                  </Field>
                </div>
              </div>

              {isPrivate(type) && (
                <div className="bn-card">
                  <h2><span>{++n}</span>Pick a date and time</h2>
                  <div className="bn-when">
                    <div>
                      <BookingCalendar value={date} onChange={setDate} bookedDates={bookedDates} />
                      {tried && !date && <p className="bn-err">Choose a date to continue.</p>}
                      {isBooked && (
                        <p className="bn-notice" role="status">
                          {prettyDate(date)} is already booked. <a href={waLink(`Hi Climb Crux, is ${prettyDate(date)} still possible for a private session?`)} target="_blank" rel="noreferrer">Confirm on WhatsApp</a>
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="bn-label">Preferred time</span>
                      <div className="bn-slots">
                        {TIME_SLOTS.map(([v, l]) => (
                          <button key={v} type="button" className={!otherTime && time === v ? 'is-on' : ''} onClick={() => { setOtherTime(false); setTime(v) }}>{l}</button>
                        ))}
                      </div>
                      <button type="button" className={`bn-other${otherTime ? ' is-on' : ''}`} onClick={() => { setOtherTime(true); setTime('') }}>Other time</button>
                      {otherTime && <input id="preferred-time" className="bn-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />}
                      {tried && !time && <p className="bn-err">Choose a time to continue.</p>}
                    </div>
                  </div>
                </div>
              )}

              {type === 'public' && (
                <div className="bn-card">
                  <h2><span>{++n}</span>Pick a session</h2>
                  {publicSessions.length === 0 ? (
                    <p className="bn-empty">No public sessions are announced yet. Check back soon, or book a private session instead.</p>
                  ) : (
                    <>
                      <Field label="Available public session" id="preferred-date">
                        <select id="preferred-date" required value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                          <option value="" disabled>Choose a session</option>
                          {publicSessions.map((s) => <option key={s.id ?? s._id} value={s.id ?? s._id}>{s.title} · {s.date}</option>)}
                        </select>
                      </Field>
                      {session && (
                        <dl className="bn-details">
                          <div><dt>Date</dt><dd>{session.date}</dd></div>
                          <div><dt>Time</dt><dd>{session.startTime}{session.endTime ? ` – ${session.endTime}` : ''}</dd></div>
                          <div><dt>Location</dt><dd>{session.locationName}</dd></div>
                          {session.remaining != null && <div><dt>Spots left</dt><dd>{session.remaining}</dd></div>}
                          {session.mapsUrl && <div><dt>Map</dt><dd><a href={session.mapsUrl} target="_blank" rel="noreferrer">Open in Maps</a></dd></div>}
                        </dl>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="bn-card">
                <h2><span>{++n}</span>Emergency contact</h2>
                <div className="bn-grid2">
                  <Field label="Contact name" id="emergency-contact-name"><input id="emergency-contact-name" required placeholder="Name" value={f.ecName} onChange={setField('ecName')} /></Field>
                  <Field label="Contact phone" id="emergency-contact-phone"><input id="emergency-contact-phone" type="tel" required placeholder="03XX-XXXXXXX" value={f.ecPhone} onChange={setField('ecPhone')} /></Field>
                </div>
              </div>

              <div className="bn-card">
                <h2><span>{++n}</span>Terms and conditions</h2>
                <p className="bn-sub">Accept all three statements to continue to payment.</p>
                {BOOKING_TERMS.map((t, i) => (
                  <label className="bn-check" key={i}>
                    <input type="checkbox" checked={agreed.includes(i)} onChange={() => toggleTerm(i)} /><span className="bn-box" /><span>{t}</span>
                  </label>
                ))}
                <button type="button" className="bn-link" onClick={toggleAll}>{allTerms ? 'Clear all' : 'Accept all'}</button>

                {total > 0 && <p className="bn-total"><span>Total</span><b>{fmt(total)}</b><small>{people} {people === 1 ? 'person' : 'people'}</small></p>}
                {error && <p className="bn-err bn-banner" role="alert">{error}</p>}
                <button className="bn-btn bn-submit" type="submit" disabled={disabled}>{sending ? 'Creating booking…' : 'Continue to payment'}</button>
                {!allTerms && <p className="bn-hint">Accept all three statements to continue.</p>}
              </div>
            </>
          )}
        </form>

        <aside className="bn-status">
          <h3>Already booked?</h3>
          <p>Check the current status of your booking, membership request or order.</p>
          <a className="bn-btn bn-btn-dark" href="/check-status/">Check status</a>
        </aside>
      </div>
    </section>
  )
}
