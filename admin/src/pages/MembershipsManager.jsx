import { useState, useEffect, useRef } from 'react'
import {
  getMembershipApplications,
  deleteMembershipApplication,
  approveMembershipApplication,
  rejectMembershipApplication,
  searchMemberships,
  API_URL,
} from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const DEFAULT_PLAN = 'Monthly Membership (4 Sessions)'
const DEFAULT_FEE = 'PKR 8,000 / Month'
const REVIEW_STATUSES = ['All', 'pending_review', 'pending_payment', 'approved', 'rejected']

function label(str) {
  return String(str || '—').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function badge(status) {
  const map = {
    pending_review: 'badge-orange',
    approved: 'badge-green',
    rejected: 'badge-red',
    pending: 'badge-yellow',
    paid: 'badge-green',
    failed: 'badge-red',
    active: 'badge-green',
    expired: 'badge-gray',
    cancelled: 'badge-red',
  }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{label(status)}</span>
}

function methodLabel(method) {
  if (method === 'bank_transfer') return '🏦 Bank Transfer'
  if (method === 'easypaisa') return '📱 EasyPaisa'
  return '—'
}

/** Cloudinary URL that forces a download instead of preview. */
function downloadUrl(url) {
  if (!url) return ''
  return url.replace('/upload/', '/upload/fl_attachment/')
}

function isImage(url) {
  return /\.(jpe?g|png)(\?|$)/i.test(url || '')
}

function DetailRow({ k, v, mono }) {
  if (v === undefined || v === null || v === '') return null
  return (
    <div className="detail-row">
      <span className="detail-key">{k}</span>
      <span className={`detail-val${mono ? ' ref-code' : ''}`}>{v}</span>
    </div>
  )
}

/** A file link with view + download actions (used for documents & screenshots). */
function FileLink({ label, url, name }) {
  if (!url) return null
  return (
    <div className="payment-detail-row" style={{ padding: '6px 0', borderBottom: '1px solid #f0ece2' }}>
      <span className="detail-key">{label}</span>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={url} target="_blank" rel="noreferrer" className="detail-val" style={{ color: '#f36f21', fontWeight: 600 }}>
          {name || 'View'} ↗
        </a>
        <a
          href={downloadUrl(url)}
          target="_blank"
          rel="noreferrer"
          className="btn-admin btn-admin-sm"
          style={{ padding: '1px 8px', fontSize: '0.6rem' }}
          title="Download file"
        >
          ⬇ Download
        </a>
      </span>
    </div>
  )
}

/** Small thumbnail for a payment screenshot (image preview / PDF badge). */
function ScreenshotCell({ url, name }) {
  if (!url) return <span className="cell-muted">—</span>
  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" title={name || 'Payment screenshot'}>
        <img
          src={url}
          alt="Payment screenshot"
          style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee', display: 'block' }}
        />
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" title={name || 'Payment screenshot'}>
      <span className="badge badge-gray">📄 PDF</span>
    </a>
  )
}

function computeAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age
}

function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MembershipsManager() {
  const { addToast } = useToast()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewFilter, setReviewFilter] = useState('All')
  // ── Admin search by Membership ID (server-side exact match) ──
  const [searchInput, setSearchInput] = useState('')
  const [searchState, setSearchState] = useState({ active: false, application: null, miss: false })
  const [searching, setSearching] = useState(false)
  const lastSearch = useRef('')
  const searchRequestId = useRef(0)
  const [viewing, setViewing] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    getMembershipApplications()
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function refresh() {
    setApps(await getMembershipApplications())
  }

  /** Exact-match server-side search by Membership ID. `force` re-runs for an
   *  already-searched value (used after approve/reject refresh the record). */
  async function runSearch(code, force = false) {
    const value = (code ?? searchInput).trim()
    if (!value) {
      clearSearch()
      return
    }
    if (!force && value === lastSearch.current) return
    lastSearch.current = value
    // Latest-request guard: ignore results from superseded searches so a slow
    // earlier response can't overwrite a newer one.
    const requestId = ++searchRequestId.current
    setSearching(true)
    try {
      const res = await searchMemberships(value)
      if (requestId !== searchRequestId.current) return
      setSearchState(
        res.found
          ? { active: true, application: res.application, miss: false }
          : { active: true, application: null, miss: true }
      )
    } catch (err) {
      if (requestId !== searchRequestId.current) return
      addToast(`Search failed: ${err.message}`, 'error')
      setSearchState((s) => ({ ...s, active: false }))
    } finally {
      if (requestId === searchRequestId.current) setSearching(false)
    }
  }

  function clearSearch() {
    searchRequestId.current += 1 // invalidate any in-flight request
    lastSearch.current = ''
    setSearchInput('')
    setSearchState({ active: false, application: null, miss: false })
  }

  // Debounced live search while the admin types (400 ms) + Enter to run now.
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim()) runSearch(searchInput)
      else clearSearch()
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  async function handleApprove(a) {
    if (!confirm(`Approve ${a.full_name}'s membership?\n\nThis will:\n• Mark the membership Active & payment Paid\n• Generate the approved-application PDF\n• Email it to ${a.email}`)) return
    setActing(true)
    try {
      const res = await approveMembershipApplication(a.id)
      await refresh()
      if (searchState.active) await runSearch(searchInput, true)
      setViewing((v) => (v && (v.id === a.id) ? { ...v, ...(res.application || {}) } : v))
      if (res.emailSent === false) {
        addToast('Membership approved, but the confirmation email could not be sent', 'error')
      } else {
        addToast('Membership approved — confirmation email sent with PDF', 'success')
      }
    } catch (err) {
      addToast(`Approval failed: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  async function handleReject(a, reason) {
    setActing(true)
    try {
      const res = await rejectMembershipApplication(a.id, reason)
      await refresh()
      if (searchState.active) await runSearch(searchInput, true)
      setViewing((v) => (v && (v.id === a.id) ? { ...v, ...(res.application || {}) } : v))
      if (res.emailSent === false) {
        addToast('Application rejected, but the rejection email could not be sent', 'error')
      } else {
        addToast('Application rejected — email sent to applicant', 'success')
      }
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error')
    } finally {
      setActing(false)
      setRejecting(null)
    }
  }

  async function handleDelete(a) {
    if (!confirm('Delete this membership application?')) return
    try {
      await deleteMembershipApplication(a.id)
      await refresh()
      if (searchState.active) await runSearch(searchInput, true)
      addToast('Application deleted', 'success')
    } catch (err) {
      addToast(`Failed to delete: ${err.message}`, 'error')
    }
  }

  async function openApprovedPdf(a) {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API_URL}/membership/applications/${a.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'PDF unavailable')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      addToast(`PDF: ${err.message}`, 'error')
    }
  }

  let shown = apps
  // An active search overrides the review/payment filters.
  if (searchState.active) {
    shown = searchState.application ? [searchState.application] : []
  } else if (reviewFilter === 'pending_payment') {
    shown = shown.filter((a) => (a.payment_status || 'pending') === 'pending')
  } else if (reviewFilter !== 'All') {
    shown = shown.filter((a) => (a.status || 'pending_review') === reviewFilter)
  }

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => (a.status || 'pending_review') === 'pending_review').length,
    paid: apps.filter((a) => a.payment_status === 'paid').length,
    active: apps.filter((a) => a.membership_status === 'active').length,
  }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading memberships…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Memberships</h1>
          <p className="page-header-admin-desc">
            Review monthly membership applications, verify payments &amp; documents, and approve memberships.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-card-icon">📋</div>
          <span className="stat-card-value">{stats.total}</span>
          <span className="stat-card-label">Total Applications</span>
          <span className="stat-card-change up">{apps.length} received</span>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-icon">⏳</div>
          <span className="stat-card-value">{stats.pending}</span>
          <span className="stat-card-label">Pending Review</span>
          <span className="stat-card-change down">awaiting approval</span>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon">💰</div>
          <span className="stat-card-value">{stats.paid}</span>
          <span className="stat-card-label">Payments Confirmed</span>
          <span className="stat-card-change up">{apps.filter((a) => a.payment_status === 'failed').length} failed</span>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-icon">🧗</div>
          <span className="stat-card-value">{stats.active}</span>
          <span className="stat-card-label">Active Memberships</span>
          <span className="stat-card-change up">memberships active</span>
        </div>
      </div>

      <div className="card-admin">
        {/* ── Admin search by Membership ID (server-side exact match) ── */}
        <div className="admin-search-bar">
          <span className="admin-search-icon" aria-hidden="true">🔍</span>
          <input
            className="admin-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch(searchInput, true) }}
            placeholder="Search by Membership ID — e.g. CCM-0101 (or legacy CCM-2026-00001)"
            aria-label="Search by Membership ID"
            spellCheck="false"
          />
          {searching && <span className="admin-search-spinner" aria-hidden="true" />}
          {searchInput && (
            <button
              className="admin-search-clear"
              onClick={clearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="card-admin-header" style={{ justifyContent: 'flex-start', gap: 18 }}>
          <h2>All Memberships ({shown.length})</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {REVIEW_STATUSES.map((c) => (
              <button
                key={c}
                className={`btn-admin btn-admin-sm ${reviewFilter === c ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                onClick={() => setReviewFilter(c)}
              >
                {label(c)}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{searchState.active ? '🔍' : '📋'}</div>
            <h3>{searchState.active ? 'No membership found with this Membership ID.' : 'No memberships found'}</h3>
            <p>{searchState.active ? 'Check the Membership ID and try again.' : 'No membership applications match the current filters.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Membership ID</th>
                    <th>Applicant</th>
                    <th>Plan</th>
                    <th>Submitted</th>
                    <th>Payment Method</th>
                    <th>Payment Screenshot</th>
                    <th>Documents</th>
                    <th>Membership Status</th>
                    <th style={{ width: 80 }}>Details</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((a) => (
                    <tr key={a.id || a._id}>
                      <td>
                        <strong className="ref-code">{a.application_id || a.membership_id || '—'}</strong>
                      </td>
                      <td>
                        <strong>{a.full_name}</strong>
                        {a.email ? <span className="cell-muted" style={{ display: 'block', fontSize: '0.72rem' }}>{a.email}</span> : ''}
                      </td>
                      <td className="cell-truncate">{a.membership_plan || DEFAULT_PLAN}</td>
                      <td>{formatDate(a.created_at)}</td>
                      <td>{a.payment_method ? methodLabel(a.payment_method) : <span className="cell-muted">—</span>}</td>
                      <td>
                        <ScreenshotCell url={a.payment_screenshot_url} name={a.payment_screenshot_name} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {a.cnic_file_url && <a className="badge badge-gray" href={a.cnic_file_url} target="_blank" rel="noreferrer" title={a.cnic_file_name || 'CNIC'}>🪪 CNIC</a>}
                          {a.bform_file_url && <a className="badge badge-gray" href={a.bform_file_url} target="_blank" rel="noreferrer" title={a.bform_file_name || 'B-Form'}>📄 B-Form</a>}
                          {a.guardian_cnic_file_url && <a className="badge badge-gray" href={a.guardian_cnic_file_url} target="_blank" rel="noreferrer" title={a.guardian_cnic_file_name || 'Guardian CNIC'}>🪪 Guardian</a>}
                          {!(a.cnic_file_url || a.bform_file_url || a.guardian_cnic_file_url) && <span className="cell-muted">—</span>}
                        </div>
                      </td>
                      <td>
                        {badge(a.membership_status || 'pending')}
                        <span className="cell-muted" style={{ display: 'block', fontSize: '0.7rem' }}>{badge(a.status || 'pending_review')}</span>
                      </td>
                      <td>
                        <button className="btn-admin-icon" onClick={() => setViewing(a)} title="View details">👁</button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          {(a.status || 'pending_review') !== 'approved' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => handleApprove(a)}
                              disabled={acting}
                              title="Approve & email membership"
                            >
                              ✓ Approve
                            </button>
                          )}
                          {(a.status || 'pending_review') !== 'rejected' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => setRejecting(a)}
                              disabled={acting}
                              title="Reject application"
                            >
                              ✕ Reject
                            </button>
                          )}
                          {a.status === 'approved' && a.pdf_path && (
                            <button className="btn-admin-icon" onClick={() => openApprovedPdf(a)} title="Open approved PDF">📄</button>
                          )}
                          <button className="btn-admin-icon danger" onClick={() => handleDelete(a)} title="Delete">🗑</button>
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

      {/* ── Read-only Details ── */}
      {viewing && (
        <Modal title={`${viewing.full_name || 'Application'} — ${viewing.application_id || ''}`} onClose={() => setViewing(null)} wide>
          <div className="booking-detail-grid">
            {/* Left column */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Membership Details</h4>
              <div className="detail-fields">
                <DetailRow k="Application ID" v={viewing.application_id} mono />
                <DetailRow k="Membership ID" v={viewing.membership_id} mono />
                <DetailRow k="Plan" v={viewing.membership_plan || DEFAULT_PLAN} />
                <DetailRow k="Fee" v={DEFAULT_FEE} />
                <DetailRow k="Membership Start" v={viewing.membership_start_date || viewing.office_start_date || '—'} />
                <DetailRow k="Membership Expiry" v={viewing.office_expiry_date || '—'} />
                <DetailRow k="Verified By" v={viewing.verified_by || '—'} />
                <DetailRow k="Approval Date" v={viewing.approval_date || '—'} />
                <DetailRow k="Submitted On" v={formatDate(viewing.created_at)} />
                <div className="detail-status-row">
                  <span className="detail-key">Membership Status</span>
                  {badge(viewing.membership_status || 'pending')}
                </div>
                <div className="detail-status-row">
                  <span className="detail-key">Review Status</span>
                  {badge(viewing.status || 'pending_review')}
                </div>
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Member Information</h4>
              <div className="detail-fields">
                <DetailRow k="Full Name" v={viewing.full_name} />
                <DetailRow k="Date of Birth" v={viewing.date_of_birth} />
                <DetailRow k="Age" v={computeAge(viewing.date_of_birth) !== null ? `${computeAge(viewing.date_of_birth)} years` : null} />
                <DetailRow k="Gender" v={viewing.gender ? label(viewing.gender) : null} />
                <DetailRow k="CNIC" v={viewing.cnic} mono />
                <DetailRow k="Phone" v={viewing.phone} />
                <DetailRow k="Email" v={viewing.email} />
                <DetailRow k="City" v={viewing.city} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Emergency Contact</h4>
              <div className="detail-fields">
                <DetailRow k="Name" v={viewing.emergency_contact_name} />
                <DetailRow k="Relationship" v={viewing.emergency_contact_relationship} />
                <DetailRow k="Phone" v={viewing.emergency_contact_phone} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Climbing Experience</h4>
              <div className="detail-fields">
                <DetailRow k="Experience Level" v={viewing.climbing_experience ? label(viewing.climbing_experience) : null} />
                <DetailRow k="Climbed Outdoors Before" v={viewing.climbed_outdoors_before ? label(viewing.climbed_outdoors_before) : null} />
                <DetailRow k="Preferred Days" v={(viewing.preferred_days || []).map(label).join(', ') || null} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Medical Information</h4>
              <div className="detail-fields">
                <DetailRow k="Conditions / Allergies" v={viewing.medical_conditions} />
              </div>
            </div>

            {/* Right column */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Payment Information</h4>
              <div className="detail-fields">
                <DetailRow k="Method" v={viewing.payment_method ? methodLabel(viewing.payment_method) : null} />
                <DetailRow k="Member Account Name" v={viewing.member_account_name} />
                <div className="detail-status-row">
                  <span className="detail-key">Payment Status</span>
                  {badge(viewing.payment_status || 'pending')}
                </div>
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Uploaded Documents</h4>
              <div className="admin-form">
                <FileLink label="Participant CNIC" url={viewing.cnic_file_url} name={viewing.cnic_file_name} />
                <FileLink label="B-Form (under 18)" url={viewing.bform_file_url} name={viewing.bform_file_name} />
                <FileLink label="Guardian CNIC" url={viewing.guardian_cnic_file_url} name={viewing.guardian_cnic_file_name} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Payment Screenshot</h4>
              {viewing.payment_screenshot_url ? (
                <div style={{ marginTop: 8 }}>
                  {isImage(viewing.payment_screenshot_url) ? (
                    <a href={viewing.payment_screenshot_url} target="_blank" rel="noreferrer">
                      <img
                        src={viewing.payment_screenshot_url}
                        alt="Payment screenshot"
                        style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, border: '1px solid #eee' }}
                      />
                    </a>
                  ) : (
                    <FileLink label="Screenshot" url={viewing.payment_screenshot_url} name={viewing.payment_screenshot_name} />
                  )}
                  <a
                    href={downloadUrl(viewing.payment_screenshot_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-admin btn-admin-sm"
                    style={{ marginTop: 8, display: 'inline-block' }}
                  >
                    ⬇ Download screenshot
                  </a>
                </div>
              ) : (
                <p className="cell-muted" style={{ marginTop: 8 }}>No payment screenshot uploaded.</p>
              )}

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Office Use (read-only)</h4>
              <div className="detail-fields">
                <DetailRow k="Verified By" v={viewing.verified_by || '—'} />
                <DetailRow k="Start Date" v={viewing.office_start_date || '—'} />
                <DetailRow k="Expiry Date" v={viewing.office_expiry_date || '—'} />
                <DetailRow k="Remarks" v={viewing.remarks || '—'} />
                <DetailRow k="Approved PDF" v={viewing.pdf_path ? 'Stored on server' : 'Not yet generated'} />
              </div>
            </div>

            {/* Bottom: terms, declaration, signature */}
            <div className="booking-detail-section" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <h4 className="detail-section-title">Terms &amp; Conditions (Liability Waiver)</h4>
              <ol style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: '0.82rem', color: '#444', lineHeight: 1.7 }}>
                {(viewing.agreed_terms || []).map((t, i) => (
                  <li key={i}>✓ {t}</li>
                ))}
                {(viewing.agreed_terms || []).length === 0 && <li className="cell-muted">No terms recorded.</li>}
              </ol>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Member Declaration</h4>
              <div className="detail-fields">
                <DetailRow k="Declaration Accepted" v={viewing.declaration_accepted ? 'Yes' : 'No'} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Digital Signature</h4>
              <div className="detail-fields">
                <DetailRow k="Signed By" v={viewing.signature_name} />
                <DetailRow k="Electronic Signature Confirmed" v={viewing.signature_confirmed ? 'Yes' : 'No'} />
                <DetailRow k="Signature Date" v={viewing.signature_date} />
              </div>
            </div>
          </div>

          <div className="admin-form-actions" style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 16 }}>
            {(viewing.status || 'pending_review') !== 'approved' && (
              <button
                className="btn-admin"
                style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                onClick={() => handleApprove(viewing)}
                disabled={acting}
              >
                ✓ Approve &amp; email membership
              </button>
            )}
            {(viewing.status || 'pending_review') !== 'rejected' && (
              <button
                className="btn-admin btn-admin-danger"
                onClick={() => setRejecting(viewing)}
                disabled={acting}
              >
                ✕ Reject application
              </button>
            )}
            {viewing.status === 'approved' && (
              <button className="btn-admin btn-admin-outline" onClick={() => openApprovedPdf(viewing)} disabled={acting}>
                📄 Open approved PDF
              </button>
            )}
            <button className="btn-admin btn-admin-outline" onClick={() => setViewing(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Rejection reason picker ── */}
      {rejecting && (
        <Modal title={`Reject — ${rejecting.full_name || 'Application'}`} onClose={() => setRejecting(null)}>
          <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Choose a reason — the applicant will receive the matching rejection email.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn-admin"
              style={{ justifyContent: 'flex-start', background: '#fff7f0', border: '1px solid #fde3d2', color: '#1c1c1c', textAlign: 'left' }}
              onClick={() => handleReject(rejecting, 'payment')}
              disabled={acting}
            >
              💳 Payment not verified
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, color: '#8a8a8a', marginTop: 2 }}>
                Email: "Payment could not be verified"
              </span>
            </button>
            <button
              className="btn-admin"
              style={{ justifyContent: 'flex-start', background: '#f6faf6', border: '1px solid #e0efe0', color: '#1c1c1c', textAlign: 'left' }}
              onClick={() => handleReject(rejecting, 'documentation')}
              disabled={acting}
            >
              📄 Improper / incomplete documentation
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, color: '#8a8a8a', marginTop: 2 }}>
                Email: "Documents incomplete"
              </span>
            </button>
            <button className="btn-admin btn-admin-outline" onClick={() => setRejecting(null)} disabled={acting}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
