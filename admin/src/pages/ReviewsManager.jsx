import { useState, useEffect } from 'react'
import { getSessionReviews, approveSessionReview, rejectSessionReview, deleteSessionReview, createSessionReview, updateSessionReview } from '../store.js'
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

export default function ReviewsManager() {
  const { addToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [acting, setActing] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [editing, setEditing] = useState(null)
  // 'new' opens a blank form ({ reviewType: 'PUBLIC', name: '', comment: '', reviewDate: today })
  const [formOpen, setFormOpen] = useState(false) // true = form visible

  const blankForm = () => ({
    reviewType: 'PUBLIC',
    name: '',
    comment: '',
    reviewDate: new Date().toISOString().slice(0, 10),
  })
  const [form, setForm] = useState(blankForm())

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

  function openAdd() {
    setEditing(null)
    setForm(blankForm())
    setFormOpen(true)
  }

  function openEdit(review) {
    setEditing(review)
    setForm({
      reviewType: review.reviewType || 'PUBLIC',
      name: review.name || '',
      comment: review.comment || '',
      reviewDate: review.reviewDate || review.createdAt || '',
    })
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setActing(true)
    try {
      const body = {
        reviewType: form.reviewType,
        name: form.name.trim(),
        comment: form.comment.trim(),
      }
      if (form.reviewDate) body.reviewDate = new Date(form.reviewDate).toISOString()
      if (editing) {
        await updateSessionReview(editing.id, body)
        addToast('Review updated', 'success')
      } else {
        await createSessionReview(body)
        addToast('Review added and published', 'success')
      }
      setFormOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  const canSubmit = form.name.trim().length > 0 && form.comment.trim().length > 0

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

        <div className="card-admin-header" style={{ justifyContent: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
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
          <button
            className="btn-admin btn-admin-sm btn-admin-primary"
            style={{ marginLeft: 'auto' }}
            onClick={openAdd}
            title="Add a new review manually (published immediately)"
          >
            + Add review
          </button>
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
                      <td>{typeBadge(r.reviewType)}</td>
                      <td className="cell-truncate" title={r.comment || ''}>
                        {r.comment || <span className="cell-muted">— no comment —</span>}
                      </td>
                      <td>{formatDate(r.reviewDate || r.createdAt)}</td>
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
                            className="btn-admin btn-admin-sm"
                            style={{ background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                            onClick={() => openEdit(r)}
                            disabled={acting}
                            title="Edit name, comment, page or date"
                          >
                            ✎ Edit
                          </button>
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
          {editing && (
            <div className="payment-detail-card" style={{ marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#444' }}>{editing.comment}</p>
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

      {/* ── Add / Edit review form (modal) ── */}
      {formOpen && (
        <Modal
          title={editing ? `Edit review — ${editing.name}` : 'Add review'}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        >
          <form onSubmit={handleSubmit}>
            <label style={formLabel}>Page</label>
            <select
              value={form.reviewType}
              onChange={(e) => setForm({ ...form, reviewType: e.target.value })}
              style={formInput}
              disabled={acting}
            >
              <option value="PUBLIC">Public sessions</option>
              <option value="PRIVATE">Private premium</option>
            </select>

            <label style={formLabel}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={80}
              required
              style={formInput}
              disabled={acting}
              placeholder="Reviewer name"
            />

            <label style={formLabel}>Review text</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              maxLength={500}
              required
              rows={4}
              style={{ ...formInput, resize: 'vertical' }}
              disabled={acting}
              placeholder="What did they say?"
            />

            <label style={formLabel}>Date</label>
            <input
              type="date"
              value={form.reviewDate}
              onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
              style={formInput}
              disabled={acting}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn-admin btn-admin-sm btn-admin-primary"
                disabled={acting || !canSubmit}
              >
                {editing ? 'Save changes' : 'Add review'}
              </button>
              <button
                type="button"
                className="btn-admin btn-admin-outline"
                onClick={() => { setFormOpen(false); setEditing(null) }}
                disabled={acting}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

const formLabel = {
  display: 'block',
  margin: '12px 0 4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#666',
}

const formInput = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '0.85rem',
  border: '1px solid #d6cfbc',
  borderRadius: 4,
  boxSizing: 'border-box',
  background: '#fff',
}
