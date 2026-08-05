/**
 * API client for the Climb Crux frontend.
 * Fetches data from the Express/MongoDB backend.
 */

// In development, requests proxy through Vite to localhost:4000.
// In production (Vercel), we use the Render backend URL directly.
const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api')

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
  const res = await fetch(`${API}/bookings/${id}`, {
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
  const res = await fetch(`${API}/bookings/by-number/${encodeURIComponent(bookingNumber)}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return mapId(await res.json())
}

export async function createPayment(bookingId, data) {
  // Multipart (with payment screenshot) — send as FormData without a Content-Type header.
  if (data instanceof FormData) {
    const res = await fetch(`${API}/bookings/${bookingId}/create-payment`, {
      method: 'POST',
      body: data,
    })
    if (!res.ok) {
      let message = 'Failed to submit payment proof'
      try {
        const d = await res.json()
        message = d.error || message
      } catch { /* ignore */ }
      throw new Error(message)
    }
    return mapId(await res.json())
  }
  return mapId(await postJson(`/bookings/${bookingId}/create-payment`, data))
}

/* ── Cloudinary Image Optimization ── */

/**
 * Optimizes a Cloudinary image URL with auto-format, auto-quality, and optional width.
 * Falls back to the original URL for non-Cloudinary images.
 */
export function optimizeImage(url, width) {
  if (!url || !url.includes('cloudinary.com')) return url
  const parts = ['q_auto', 'f_auto']
  if (width) parts.unshift(`w_${width}`)
  return url.replace('/upload/', `/upload/${parts.join(',')}/`)
}

/* ---------- Membership ---------- */

/**
 * Submit a membership application (multipart: fields + documents).
 * Files must be PDF/JPG/JPEG/PNG and ≤ 5 MB each.
 */
export async function submitMembershipApplication(formData) {
  const res = await fetch(`${API}/membership/apply`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    let message = 'Application could not be submitted'
    try {
      const data = await res.json()
      message = data.error || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return mapId(await res.json())
}

/** URL for the printable Membership Form PDF (downloads in a new tab). */
export function getMembershipFormUrl() {
  return `${API}/membership/form`
}

/* ---------- Public Status Checker ---------- */

/**
 * Check the status of a booking or membership by its reference code.
 * Returns ONLY `{ found, code, status }` — never personal data.
 */
export async function checkStatus(code) {
  return await postJson('/status/check', { code })
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

/** Look up an equipment order by its Order ID (CCE-XXXXXX) — for the payment page. */
export async function getOrderByNumber(orderNumber) {
  const res = await fetch(`${API}/products/orders/by-number/${encodeURIComponent(orderNumber)}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return mapId(await res.json())
}

/** Upload the payment screenshot for an order — moves it to Verification Pending. */
export async function submitOrderPaymentProof(orderId, formData) {
  const res = await fetch(`${API}/products/orders/${orderId}/payment-proof`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    let message = 'Failed to submit payment proof'
    try {
      const d = await res.json()
      message = d.error || message
    } catch { /* ignore */ }
    throw new Error(message)
  }
  return mapId(await res.json())
}

export async function getProductReviews(productId) {
  const data = await fetchJson(`/products/${productId}/reviews`)
  // Map _id to id inside reviews array
  if (data.reviews) data.reviews = data.reviews.map((r) => {
    const { _id, __v, ...rest } = r
    return { id: _id, ...rest }
  })
  return data
}

export async function submitProductReview(productId, review) {
  return await postJson(`/products/${productId}/reviews`, review)
}
