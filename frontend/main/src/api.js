/**
 * API client for the Climb Crux frontend.
 * Fetches data from the Express/MongoDB backend.
 */

// In development, requests proxy through Vite to localhost:4000.
// In production (Vercel), we use the Render backend URL directly.
const API = import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api'

async function fetchJson(url) {
  const res = await fetch(`${API}${url}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function postJson(url, body) {
  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

/** Map _id to id for consistency */
function mapId(doc) {
  if (Array.isArray(doc)) return doc.map(mapId)
  if (doc && typeof doc === 'object') {
    const { _id, __v, ...rest } = doc
    return { id: _id, ...rest }
  }
  return doc
}

export async function getSessions() {
  return mapId(await fetchJson('/sessions'))
}

export async function getPlans() {
  return mapId(await fetchJson('/plans'))
}

export async function getTeam() {
  return mapId(await fetchJson('/team'))
}

export async function getGallery() {
  return mapId(await fetchJson('/gallery'))
}

export async function getAbout() {
  return mapId(await fetchJson('/about'))
}

export async function getSessionContent() {
  return await fetchJson('/session-content')
}

export async function getHomeContent() {
  return await fetchJson('/home')
}

export async function createBooking(data) {
  return mapId(await postJson('/bookings', data))
}

export async function updateBooking(id, data) {
  const res = await fetch(`${API}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return mapId(await res.json())
}

export async function createCheckoutSession(bookingId, amount) {
  const res = await fetch(`${API}/payments/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, amount }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Payment gateway error' }))
    throw new Error(err.error || `API error: ${res.status}`)
  }
  return res.json()
}

export async function checkPaymentStatus(bookingId) {
  const res = await fetch(`${API}/payments/check-status/${bookingId}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getUploads() {
  return mapId(await fetchJson('/uploads'))
}
