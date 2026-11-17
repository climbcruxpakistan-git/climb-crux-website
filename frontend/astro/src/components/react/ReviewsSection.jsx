import { useEffect, useState } from 'react'
import { getSessionReviews } from '../../lib/api.js'
import ReviewSlider from './ReviewSlider.jsx'

/**
 * Approved session reviews from the API, shown in the shared quote slider
 * (ReviewSlider.jsx) with the newest first (server sorts by reviewDate).
 * Dates appear in the footer, the newest review gets the "Latest" tag and long
 * reviews clamp with a More dialog. Shown on the sessions and private/premium
 * pages.
 */

/** ISO reviewDate → "10 Jan 2026" (the date the review was sent). */
function formatDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ReviewsSection({ type = 'public' }) {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready

  useEffect(() => {
    let alive = true
    getSessionReviews(type)
      .then((data) => {
        if (!alive) return
        setReviews(data.reviews || [])
        setStatus('ready')
      })
      .catch(() => {
        if (!alive) return
        setReviews([])
        setStatus('ready')
      })
    return () => { alive = false }
  }, [type])

  // No approved reviews yet (or still loading) — hide the section.
  if (status !== 'ready' || reviews.length === 0) return null

  return (
    <ReviewSlider
      sectionClassName="rv-section"
      ariaLabel="Session reviews"
      heading="Recent session reviews"
      clamp
      showLatest
      items={reviews.map((r) => ({
        id: r.id,
        quote: r.comment,
        name: r.name,
        date: formatDate(r.reviewDate),
      }))}
    />
  )
}
