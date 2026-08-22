import { useState, useEffect } from 'react'
import { getSessionReviews, approveSessionReview, rejectSessionReview, deleteSessionReview } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'
import { formatDate } from '../formatDate.js'

/**
 * Session review moderation — Public & Private reviews live in one admin
 * list but are always labelled by type and can be filtered separately.
 */

const FILTERS = ['All', 'Public', 'Private', 'Pending', 'Approved', 'Rejected']

/** Map a filter chip to server-side query params. */
function filterToQuery(filter) {
  switch (filter) {
    case 'Public': return { type: 'PUBLIC' }
    case 'Private': return { type: 'PRIVATE' }
    case 'Pending': return { status: 'PENDING' }
    case 'Approved': return { status: 'APPROVED' }
    case 'Rejected': return { status: 'REJECTED' }
    default: return {}
  }
}

const STATUS_BADGE = {
  PENDING: 'badge-yellow',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
}

const STATUS_LABEL = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const TYPE_LABEL = {
  PUBLIC: 'Public Session',
  PRIVATE: 'Private Session',
}

function Stars({ rating }) {
  return (
    <span className="rv-admin-stars" title={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: rating >= i ? '#f36f21' : '#d8d0bc' }}>★</span>
      ))}
    </span>
  )
}

export default function ReviewsManager() {
  const { addToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [acting, setActing] = useState(false)
  const [deleting, setDeleting] = useState(null)

  async function load(currentFilter = filter) {
    setLoading(true)
    try {
      const data = await getSessionReviews(filterToQuery(currentFilter))
      setReviews(data)
    } catch (err) {
      addToast(`Failed to load reviews: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleFilterChange(next) {
    setFilter(next)
    await load(next)
  }

  async function handleApprove(review) {
    if (!confirm(`Approve this ${TYPE_LABEL[review.reviewType]} review from ${review.name}?\n\nIt will become publicly visible on the website.`)) return
    setActing(true)
    try {
      await approveSessionReview(review.id)
      await load()
      addToast('Review approved and published', 'success')
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  async function handleReject(review) {
    if (!confirm(`Reject this review from ${review.name}?\n\nIt will be hidden from the website.`)) return
    setActing(true)
    try {
      await rejectSessionReview(review.id)
      await load()
      addToast('Review rejected', 'success')
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setActing(true)
    try {
      await deleteSessionReview(deleting.id)
      setDeleting(null)
      await load()
      addToast('Review deleted permanently', 'success')
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  const typeBadge = (t) => (
    <span className={`badge ${t === 'PUBLIC' ? 'badge-blue' : 'badge-orange'}`}>
      {TYPE_LABEL[t] || t}
    </span>
  )

  return (
    <>
      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Session Reviews ({reviews.length})</h2>
        </div>

        <div className="card-admin-header" style={{ justifyContent: 'flex-start', gap: 18 }}>
          <h2>Filter</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`btn-admin btn-admin-sm ${filter === f ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                onClick={() => handleFilterChange(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h3>Loading reviews…</h3>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">★</div>
            <h3>No reviews found</h3>
            <p>No session reviews match the current filter.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Type</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ width: 170 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.name}</strong></td>
                      <td><Stars rating={r.rating} /></td>
                      <td>{typeBadge(r.reviewType)}</td>
                      <td className="cell-truncate" title={r.comment || ''}>
                        {r.comment || <span className="cell-muted">— no comment —</span>}
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          {r.status !== 'APPROVED' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => handleApprove(r)}
                              disabled={acting}
                              title="Approve & publish this review"
                            >
                              ✓ Approve
                            </button>
                          )}
                          {r.status !== 'REJECTED' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => handleReject(r)}
                              disabled={acting}
                              title="Reject & hide this review"
                            >
                              ✕ Reject
                            </button>
                          )}
                          <button
                            className="btn-admin-icon danger"
                            onClick={() => setDeleting(r)}
                            disabled={acting}
                            title="Delete permanently"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirmation (destructive action) ── */}
      {deleting && (
        <Modal title={`Delete review — ${deleting.name}`} onClose={() => setDeleting(null)}>
          <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Permanently delete this {TYPE_LABEL[deleting.reviewType]} review from{' '}
            <strong>{deleting.name}</strong>? This cannot be undone.
          </p>
          {deleting.comment && (
            <div className="payment-detail-card" style={{ marginBottom: 16 }}>
              <Stars rating={deleting.rating} />
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#444' }}>{deleting.comment}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn-admin btn-admin-sm btn-admin-danger"
              onClick={handleDelete}
              disabled={acting}
            >
              🗑 Delete permanently
            </button>
            <button className="btn-admin btn-admin-outline" onClick={() => setDeleting(null)} disabled={acting}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
