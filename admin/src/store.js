/**
 * API-backed data store for the admin dashboard.
 * Connects to the Express/MongoDB backend.
 * Normalises _id → id so admin pages work without change.
 */

const API = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${API}${path}`, opts)
  const raw = await res.text()
  let data
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    throw new Error(`Invalid JSON response from ${path}`)
  }
  if (!res.ok) {
    throw new Error(data?.error || res.statusText || 'Request failed')
  }
  return data
}

/** Map _id to id for arrays and single objects returned from the API */
function mapId(doc) {
  if (Array.isArray(doc)) return doc.map(mapId)
  if (doc && typeof doc === 'object') {
    const { _id, __v, ...rest } = doc
    return { id: _id, ...rest }
  }
  return doc
}

/* ---------- Sessions ---------- */

export async function getSessions() {
  return mapId(await request('GET', '/sessions'))
}

export async function saveSession(session) {
  const body = { ...session }
  delete body.id
  if (session.id) {
    return mapId(await request('PUT', `/sessions/${session.id}`, body))
  }
  return mapId(await request('POST', '/sessions', body))
}

export async function deleteSession(id) {
  return request('DELETE', `/sessions/${id}`)
}

/* ---------- Session Content (Included Items + FAQs) ---------- */

export async function getSessionContent() {
  const data = await request('GET', '/session-content')
  return {
    includedItems: data.includedItems || [],
    faqs: data.faqs || [],
    sessionsDisabled: data.sessionsDisabled || false,
    pricingTitle: data.pricingTitle || 'Public Session',
    pricingPrice: data.pricingPrice || '4,500',
    pricingUnit: data.pricingUnit || '/ person',
    pricingFeatures: data.pricingFeatures?.length
      ? data.pricingFeatures
      : [
          { text: '2–3 hour guided session' },
          { text: 'Certified instructor & safety briefing' },
          { text: 'Harness, helmet, rope, belay gear & climbing shoes' },
          { text: 'Group of up to 20 climbers' },
        ],
  }
}

export async function saveSessionContent({ includedItems, faqs, sessionsDisabled, pricingTitle, pricingPrice, pricingUnit, pricingFeatures }) {
  return await request('PUT', '/session-content', { includedItems, faqs, sessionsDisabled, pricingTitle, pricingPrice, pricingUnit, pricingFeatures })
}

// Re-export for backward compatibility with SessionsManager
export const getIncludedItems = () => getSessionContent().then((c) => c.includedItems)
export const saveIncludedItems = (items) => getSessionContent().then((c) => saveSessionContent({ ...c, includedItems: items }))
export const getFaqs = () => getSessionContent().then((c) => c.faqs)
export const saveFaqs = (faqs) => getSessionContent().then((c) => saveSessionContent({ ...c, faqs }))

/* ---------- Plans ---------- */

export async function getPlans() {
  return mapId(await request('GET', '/plans'))
}

export async function savePlan(plan) {
  const body = { ...plan }
  delete body.id
  if (plan.id) {
    return mapId(await request('PUT', `/plans/${plan.id}`, body))
  }
  return mapId(await request('POST', '/plans', body))
}

export async function deletePlan(id) {
  return request('DELETE', `/plans/${id}`)
}

/* ---------- Team ---------- */

export async function getTeam() {
  return mapId(await request('GET', '/team'))
}

export async function saveTeamMember(member) {
  const body = { ...member }
  delete body.id
  if (member.id) {
    return mapId(await request('PUT', `/team/${member.id}`, body))
  }
  return mapId(await request('POST', '/team', body))
}

export async function deleteTeamMember(id) {
  return request('DELETE', `/team/${id}`)
}

/* ---------- Gallery ---------- */

export async function getGallery() {
  return mapId(await request('GET', '/gallery'))
}

export async function saveGalleryItem(item) {
  const body = { ...item }
  delete body.id
  if (item.id) {
    return mapId(await request('PUT', `/gallery/${item.id}`, body))
  }
  return mapId(await request('POST', '/gallery', body))
}

export async function deleteGalleryItem(id) {
  return request('DELETE', `/gallery/${id}`)
}

/* ---------- Bookings ---------- */

export async function getBookings() {
  return mapId(await request('GET', '/bookings'))
}

export async function saveBooking(booking) {
  const body = { ...booking }
  delete body.id
  if (booking.id) {
    return mapId(await request('PUT', `/bookings/${booking.id}`, body))
  }
  return mapId(await request('POST', '/bookings', body))
}

export async function deleteBooking(id) {
  return request('DELETE', `/bookings/${id}`)
}

/* ---------- About ---------- */

export async function getAbout() {
  return mapId(await request('GET', '/about'))
}

export async function saveAbout(data) {
  return mapId(await request('PUT', '/about', data))
}
