import { useState, useEffect } from 'react'
import {
  getMembershipApplications,
  updateMembershipApplication,
  deleteMembershipApplication,
} from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const REVIEW_STATUSES = ['All', 'pending_review', 'approved', 'rejected']
const PAYMENT_STATUSES = ['All', 'pending', 'paid', 'failed']
const MEMBERSHIP_STATUSES = ['pending', 'active', 'expired', 'cancelled']

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

function DetailRow({ k, v, mono }) {
  if (v === undefined || v === null || v === '') return null
  return (
    <div className="detail-row">
      <span className="detail-key">{k}</span>
      <span className={`detail-val${mono ? ' ref-code' : ''}`}>{v}</span>
    </div>
  )
}

export default function MembershipApplicationsManager() {
  const { addToast } = useToast()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewFilter, setReviewFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [viewing, setViewing] = useState(null)
  const [office, setOffice] = useState({
    membership_id: '',
    payment_status: 'pending',
    membership_status: 'pending',
    office_start_date: '',
    office_expiry_date: '',
    verified_by: '',
    remarks: '',
  })

  useEffect(() => {
    getMembershipApplications()
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openView(a) {
    setOffice({
      membership_id: a.membership_id || '',
      payment_status: a.payment_status || 'pending',
      membership_status: a.membership_status || 'pending',
      office_start_date: a.office_start_date || '',
      office_expiry_date: a.office_expiry_date || '',
      verified_by: a.verified_by || '',
      remarks: a.remarks || '',
    })
    setViewing(a)
  }

  async function handleOfficeSave() {
    if (!viewing) return
    try {
      await updateMembershipApplication(viewing.id, office)
      setApps(await getMembershipApplications())
      setViewing({ ...viewing, ...office })
      addToast('Application updated', 'success')
    } catch (err) {
      addToast(`Failed to update: ${err.message}`, 'error')
    }
  }

  async function updateReviewStatus(a, status) {
    try {
      await updateMembershipApplication(a.id, { status })
      setApps(await getMembershipApplications())
      addToast(`Application ${label(status)}`, 'success')
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error')
    }
  }

  async function handleDelete(a) {
    if (!confirm('Delete this membership application?')) return
    try {
      await deleteMembershipApplication(a.id)
      setApps(await getMembershipApplications())
      addToast('Application deleted', 'success')
    } catch (err) {
      addToast(`Failed to delete: ${err.message}`, 'error')
    }
  }

  let shown = apps
  if (reviewFilter !== 'All') shown = shown.filter((a) => (a.status || 'pending_review') === reviewFilter)
  if (paymentFilter !== 'All') shown = shown.filter((a) => (a.payment_status || 'pending') === paymentFilter)

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => (a.status || 'pending_review') === 'pending_review').length,
    paid: apps.filter((a) => a.payment_status === 'paid').length,
    active: apps.filter((a) => a.membership_status === 'active').length,
  }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading membership applications…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Membership Applications</h1>
          <p className="page-header-admin-desc">
            Review online membership applications, verify documents &amp; payments, and manage member status.
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
          <span className="stat-card-change down">awaiting review</span>
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
        <div className="card-admin-header">
          <h2>All Applications ({shown.length})</h2>
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
            <span style={{ width: 1, height: 24, background: '#e5e0d4', margin: '0 4px' }} />
            {PAYMENT_STATUSES.map((c) => (
              <button
                key={c}
                className={`btn-admin btn-admin-sm ${paymentFilter === c ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                onClick={() => setPaymentFilter(c)}
              >
                {label(c)}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No applications found</h3>
            <p>No membership applications match the current filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Start</th>
                    <th>Payment</th>
                    <th>Payment Status</th>
                    <th>Membership</th>
                    <th style={{ width: 80 }}>View</th>
                    <th style={{ width: 150 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((a) => (
                    <tr key={a.id || a._id}>
                      <td>
                        <strong className="ref-code">{a.application_id || '—'}</strong>
                      </td>
                      <td><strong>{a.full_name}</strong></td>
                      <td className="cell-truncate">
                        {a.email}
                        {a.phone ? <span className="cell-muted"> · {a.phone}</span> : ''}
                      </td>
                      <td>{a.membership_start_date || '—'}</td>
                      <td>{a.payment_method ? methodLabel(a.payment_method) : <span className="cell-muted">—</span>}</td>
                      <td>{badge(a.payment_status || 'pending')}</td>
                      <td>{badge(a.membership_status || 'pending')}</td>
                      <td>
                        <button className="btn-admin-icon" onClick={() => openView(a)} title="View details">👁</button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          {(a.status || 'pending_review') !== 'approved' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updateReviewStatus(a, 'approved')}
                              title="Approve application"
                            >
                              ✓
                            </button>
                          )}
                          {(a.status || 'pending_review') !== 'rejected' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updateReviewStatus(a, 'rejected')}
                              title="Reject application"
                            >
                              ✕
                            </button>
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

      {/* ── Detail / Review Modal ── */}
      {viewing && (
        <Modal title={`${viewing.full_name || 'Application'} — ${viewing.application_id || ''}`} onClose={() => setViewing(null)} wide>
          <div className="booking-detail-grid">
            {/* Left: applicant details */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Member Information</h4>
              <div className="detail-fields">
                <DetailRow k="Application ID" v={viewing.application_id} mono />
                <DetailRow k="Full Name" v={viewing.full_name} />
                <DetailRow k="Date of Birth" v={viewing.date_of_birth} />
                <DetailRow k="Age" v={computeAge(viewing.date_of_birth) !== null ? `${computeAge(viewing.date_of_birth)} years` : null} />
                <DetailRow k="Gender" v={viewing.gender ? label(viewing.gender) : null} />
                <DetailRow k="CNIC" v={viewing.cnic} mono />
                <DetailRow k="Phone" v={viewing.phone} />
                <DetailRow k="Email" v={viewing.email} />
                <DetailRow k="City" v={viewing.city} />
                <DetailRow k="Membership Start" v={viewing.membership_start_date} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Emergency Contact</h4>
              <div className="detail-fields">
                <DetailRow k="Name" v={viewing.emergency_contact_name} />
                <DetailRow k="Relationship" v={viewing.emergency_contact_relationship} />
                <DetailRow k="Phone" v={viewing.emergency_contact_phone} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Experience &amp; Medical</h4>
              <div className="detail-fields">
                <DetailRow k="Experience" v={viewing.climbing_experience ? label(viewing.climbing_experience) : null} />
                <DetailRow k="Climbed Outdoors Before" v={viewing.climbed_outdoors_before ? label(viewing.climbed_outdoors_before) : null} />
                <DetailRow k="Preferred Days" v={(viewing.preferred_days || []).map(label).join(', ') || null} />
                <DetailRow k="Medical Conditions" v={viewing.medical_conditions} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Payment</h4>
              <div className="detail-fields">
                <DetailRow k="Method" v={viewing.payment_method ? label(viewing.payment_method) : null} />
                <DetailRow k="Member Account Name" v={viewing.member_account_name} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Declaration &amp; Signature</h4>
              <div className="detail-fields">
                <DetailRow k="Signature" v={viewing.signature_name} />
                <DetailRow k="Signature Date" v={viewing.signature_date} />
                <DetailRow k="Terms Accepted" v={(viewing.agreed_terms || []).length === 7 ? `✓ All ${(viewing.agreed_terms || []).length} terms ticked` : `⚠ ${(viewing.agreed_terms || []).length}/7 terms ticked`} />
              </div>
            </div>

            {/* Right: documents + office use */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Uploaded Documents</h4>
              <div className="admin-form">
                <DocLink label="Participant CNIC" url={viewing.cnic_file_url} name={viewing.cnic_file_name} />
                <DocLink label="B-Form" url={viewing.bform_file_url} name={viewing.bform_file_name} />
                <DocLink label="Guardian CNIC" url={viewing.guardian_cnic_file_url} name={viewing.guardian_cnic_file_name} />
                <DocLink label="Payment Screenshot" url={viewing.payment_screenshot_url} name={viewing.payment_screenshot_name} />
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Office Use Only</h4>
              <div className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-field">
                    <label>Membership ID</label>
                    <input value={office.membership_id} onChange={(e) => setOffice({ ...office, membership_id: e.target.value })} placeholder="e.g. CM-2026-001" />
                  </div>
                  <div className="admin-field">
                    <label>Verified By</label>
                    <input value={office.verified_by} onChange={(e) => setOffice({ ...office, verified_by: e.target.value })} />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-field">
                    <label>Payment Status</label>
                    <select value={office.payment_status} onChange={(e) => setOffice({ ...office, payment_status: e.target.value })}>
                      {['pending', 'paid', 'failed'].map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label>Membership Status</label>
                    <select value={office.membership_status} onChange={(e) => setOffice({ ...office, membership_status: e.target.value })}>
                      {MEMBERSHIP_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-field">
                    <label>Start Date</label>
                    <input type="date" value={office.office_start_date} onChange={(e) => setOffice({ ...office, office_start_date: e.target.value })} />
                  </div>
                  <div className="admin-field">
                    <label>Expiry Date</label>
                    <input type="date" value={office.office_expiry_date} onChange={(e) => setOffice({ ...office, office_expiry_date: e.target.value })} />
                  </div>
                </div>
                <div className="admin-field">
                  <label>Remarks</label>
                  <textarea rows={3} value={office.remarks} onChange={(e) => setOffice({ ...office, remarks: e.target.value })} placeholder="Any notes for the record…" />
                </div>
                <div className="admin-form-actions">
                  <button className="btn-admin btn-admin-primary" onClick={handleOfficeSave}>Save</button>
                  {(viewing.status || 'pending_review') !== 'approved' && (
                    <button
                      className="btn-admin"
                      style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                      onClick={() => { updateReviewStatus(viewing, 'approved'); setViewing(null) }}
                    >
                      ✓ Approve application
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function DocLink({ label, url, name }) {
  if (!url) return null
  return (
    <div className="payment-detail-row" style={{ padding: '6px 0', borderBottom: '1px solid #f0ece2' }}>
      <span className="detail-key">{label}</span>
      <a href={url} target="_blank" rel="noreferrer" className="detail-val" style={{ color: '#f36f21', fontWeight: 600 }}>
        {name || 'View file'} ↗
      </a>
    </div>
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
