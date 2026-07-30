/**
 * API client for Climb Crux — works both at build time (SSG) and client-side.
 *
 * In production (build time on Vercel), uses the Render backend URL directly.
 * In development (astro dev), uses the proxy via astro.config.mjs.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://climb-crux-backend.onrender.com/api'

async function fetchJson(url) {
  const res = await fetch(`${API_BASE}${url}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function postJson(url, body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

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

export async function getBooking(id) {
  return mapId(await fetchJson(`/bookings/${id}`))
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
  const res = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return mapId(await res.json())
}

export async function getUploads() {
  return mapId(await fetchJson('/uploads'))
}

export async function getBookingByNumber(bookingNumber) {
  const res = await fetch(`${API_BASE}/bookings/by-number/${encodeURIComponent(bookingNumber)}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return mapId(await res.json())
}

export async function createPayment(bookingId, data) {
  return mapId(await postJson(`/bookings/${bookingId}/create-payment`, data))
}

/* ── Cloudinary Image Optimization ── */

export function optimizeImage(url, width) {
  if (!url || !url.includes('cloudinary.com')) return url
  const parts = ['q_auto', 'f_auto']
  if (width) parts.unshift(`w_${width}`)
  return url.replace('/upload/', `/upload/${parts.join(',')}/`)
}

/* ---------- Shop / Products ---------- */

export async function getProducts() {
  return mapId(await fetchJson('/products'))
}

export async function getProduct(id) {
  return mapId(await fetchJson(`/products/${id}`))
}

export async function placeOrder(data) {
  return mapId(await postJson('/products/order', data))
}

export async function getProductReviews(productId) {
  const data = await fetchJson(`/products/${productId}/reviews`)
  if (data.reviews) data.reviews = data.reviews.map((r) => {
    const { _id, __v, ...rest } = r
    return { id: _id, ...rest }
  })
  return data
}

export async function submitProductReview(productId, review) {
  return await postJson(`/products/${productId}/reviews`, review)
}
