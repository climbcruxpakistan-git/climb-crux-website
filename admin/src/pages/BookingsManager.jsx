import { useState, useEffect } from 'react'
import { getBookings, saveBooking, deleteBooking, patchBookingStatus, patchPaymentStatus } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

function formatMethod(method) {
  if (method === 'card') return 'Card'
  if (method === 'bank') return 'Bank Transfer'
  if (method === 'easypaisa') return 'EasyPaisa'
  return '—'
}

function methodIcon(method) {
  if (method === 'card') return '💳'
  if (method === 'bank') return '🏦'
  if (method === 'easypaisa') return '📱'
  return '—'
}

function badge(status) {
  const map = {
    pending: 'badge-yellow',
    confirmed: 'badge-green',
    cancelled: 'badge-red',
    paid: 'badge-green',
    failed: 'badge-red',
  }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || '—'}</span>
}

function paymentBadge(status) {
  const map = {
    pending: 'badge-yellow',
    paid: 'badge-green',
    failed: 'badge-red',
  }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || '—'}</span>
}

function PaymentDetailCard({ paymentMethod, paymentDetails }) {
  if (!paymentMethod) {
    return <p className="payment-no-info">No payment information.</p>
  }

  return (
    <div className="payment-detail-card">
      <div className="payment-detail-header">
        <span className="payment-detail-method-icon">{methodIcon(paymentMethod)}</span>
        <span className="payment-detail-method-name">{formatMethod(paymentMethod)}</span>
      </div>

      {paymentMethod === 'card' && (
        <div className="payment-detail-fields">
          <div className="payment-detail-row">
            <span className="payment-detail-key">Cardholder</span>
            <span className="payment-detail-val">{paymentDetails?.cardHolder || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span className="payment-detail-key">Card ending in</span>
            <span className="payment-detail-val mono">•••• {paymentDetails?.cardLastFour || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span className="payment-detail-key">Expiry</span>
            <span className="payment-detail-val">{paymentDetails?.cardExpiry || '—'}</span>
          </div>
        </div>
      )}

      {paymentMethod === 'bank' && (
        <div className="payment-detail-fields">
          <div className="payment-detail-row">
            <span className="payment-detail-key">Your bank</span>
            <span className="payment-detail-val">{paymentDetails?.yourBank || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span className="payment-detail-key">Account holder</span>
            <span className="payment-detail-val">{paymentDetails?.accountHolder || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span className="payment-detail-key">Account number</span>
            <span className="payment-detail-val mono">{paymentDetails?.yourAccountNumber || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span className="payment-detail-key">Transaction ID</span>
            <span className="payment-detail-val mono">{paymentDetails?.transactionId || '—'}</span>
          </div>
        </div>
      )}

      {paymentMethod === 'easypaisa' && (
        <div className="payment-detail-fields">
          <div className="payment-detail-row">
            <span className="payment-detail-key">Phone number</span>
            <span className="payment-detail-val mono">{paymentDetails?.phone || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span className="payment-detail-key">Transaction ID</span>
            <span className="payment-detail-val mono">{paymentDetails?.transactionId || '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BookingsManager() {
  const { addToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [datePreset, setDatePreset] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)

  const emptyForm = {
    name: '', email: '', phone: '', type: '', date: '',
    groupSize: '1', experience: '', message: '', status: 'pending',
    paymentMethod: '', paymentStatus: 'pending',
    paymentDetails: {},
  }
  const [form, setForm] = useState(emptyForm)

  const paymentStatusOptions = ['All', 'pending', 'paid', 'failed']
  const bookingStatusOptions = ['All', 'Pending', 'Confirmed', 'Cancelled']
  const datePresets = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'custom', label: 'Custom' },
  ]

  function getDateRange(preset) {
    const now = new Date()
    const to = now.toISOString().split('T')[0]
    let from
    switch (preset) {
      case 'today':
        from = to
        break
      case 'week': {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        from = startOfWeek.toISOString().split('T')[0]
        break
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        from = startOfMonth.toISOString().split('T')[0]
        break
      }
      default:
        return { from: '', to: '' }
    }
    return { from, to }
  }

  function handleDatePreset(preset) {
    setDatePreset(preset)
    if (preset !== 'custom') {
      const range = getDateRange(preset)
      setDateFrom(range.from)
      setDateTo(range.to)
    }
  }

  function isBookingInRange(b) {
    if (!b.date) return datePreset === 'all' && !dateFrom && !dateTo
    const bookingDate = b.date
    if (dateFrom && bookingDate < dateFrom) return false
    if (dateTo && bookingDate > dateTo) return false
    return true
  }

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setForm({ ...emptyForm })
    setEditing('new')
  }

  function openEdit(b) {
    setForm({
      name: b.name || '',
      email: b.email || '',
      phone: b.phone || '',
      type: b.type || '',
      date: b.date || '',
      groupSize: b.groupSize || '1',
      experience: b.experience || '',
      message: b.message || '',
      status: b.status || 'pending',
      paymentMethod: b.paymentMethod || '',
      paymentStatus: b.paymentStatus || 'pending',
      paymentDetails: b.paymentDetails || {},
    })
    setEditing(b.id)
  }

  async function handleSave() {
    if (!form.name || !form.email) {
      addToast('Name and email are required', 'error')
      return
    }
    const booking = editing === 'new'
      ? { id: null, ...form }
      : { id: editing, ...form }
    await saveBooking(booking)
    setBookings(await getBookings())
    setEditing(null)
    addToast('Booking saved', 'success')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this booking?')) return
    await deleteBooking(id)
    setBookings(await getBookings())
    addToast('Booking deleted', 'success')
  }

  async function updateStatus(id, status) {
    try {
      await patchBookingStatus(id, status)
      setBookings(await getBookings())
      addToast(`Booking ${status}`, 'success')
    } catch (err) {
      addToast(`Failed to update status: ${err.message}`, 'error')
    }
  }

  async function updatePaymentStatus(id, paymentStatus) {
    try {
      await patchPaymentStatus(id, paymentStatus)
      setBookings(await getBookings())
      addToast(`Payment ${paymentStatus}`, 'success')
    } catch (err) {
      addToast(`Failed to update payment: ${err.message}`, 'error')
    }
  }

  // Apply filters (status + payment + date range)
  let shown = bookings
  if (statusFilter !== 'All') {
    shown = shown.filter((b) => b.status === statusFilter.toLowerCase())
  }
  if (paymentFilter !== 'All') {
    shown = shown.filter((b) => (b.paymentStatus || 'pending') === paymentFilter)
  }
  if (datePreset !== 'all' || dateFrom || dateTo) {
    shown = shown.filter(isBookingInRange)
  }

  // Stats computed from filtered bookings
  const stats = {
    total: shown.length,
    pending: shown.filter((b) => b.status === 'pending').length,
    paid: shown.filter((b) => b.paymentStatus === 'paid').length,
    paidWithMethod: shown.filter((b) => b.paymentStatus === 'paid' && b.paymentMethod).length,
    pendingPayments: shown.filter((b) => (b.paymentStatus || 'pending') === 'pending' && b.paymentMethod).length,
    failed: shown.filter((b) => b.paymentStatus === 'failed').length,
    revenue: shown.filter((b) => b.paymentStatus === 'paid').length * 2500,
  }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading bookings…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Bookings</h1>
          <p className="page-header-admin-desc">View and manage customer booking requests with payment details.</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Booking</button>
      </div>

      {/* ---- Stats Cards (filtered) ---- */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-card-icon">📋</div>
          <span className="stat-card-value">{stats.total}</span>
          <span className="stat-card-label">Total Bookings</span>
          <span className="stat-card-change up">{stats.pending} pending</span>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon">✓</div>
          <span className="stat-card-value">{stats.paid}</span>
          <span className="stat-card-label">Paid Bookings</span>
          <span className="stat-card-change up">{stats.paidWithMethod} with payment</span>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-icon">⏳</div>
          <span className="stat-card-value">{stats.pendingPayments}</span>
          <span className="stat-card-label">Pending Payments</span>
          <span className="stat-card-change down">{stats.failed} failed</span>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-icon">💰</div>
          <span className="stat-card-value">PKR {stats.revenue.toLocaleString()}</span>
          <span className="stat-card-label">Estimated Revenue</span>
          <span className="stat-card-change up">{stats.paid} × PKR 2,500</span>
        </div>
      </div>

      {/* ---- Date Range Filter ---- */}
      <div className="date-range-bar">
        <div className="date-range-presets">
          {datePresets.map((p) => (
            <button
              key={p.value}
              className={`btn-admin btn-admin-sm ${datePreset === p.value ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
              onClick={() => handleDatePreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {datePreset === 'custom' && (
          <div className="date-range-inputs">
            <label>
              <span>From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label>
              <span>To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
          </div>
        )}
        {(datePreset !== 'all' || dateFrom || dateTo) && (
          <span className="date-range-summary">
            {shown.length} of {bookings.length} bookings
          </span>
        )}
      </div>

      <div className="card-admin">
        <div className="card-admin-header">
          <h2>All Bookings ({shown.length})</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Booking status filters */}
            {bookingStatusOptions.map((c) => (
              <button
                key={c}
                className={`btn-admin btn-admin-sm ${statusFilter === c ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                onClick={() => setStatusFilter(c)}
              >
                {c}
              </button>
            ))}
            <span style={{ width: 1, height: 24, background: '#e5e0d4', margin: '0 4px' }} />
            {/* Payment status filters */}
            <span className="btn-admin btn-admin-sm" style={{ opacity: 0.5, cursor: 'default', fontWeight: 400 }}>
              Payment:
            </span>
            {paymentStatusOptions.map((c) => (
              <button
                key={c}
                className={`btn-admin btn-admin-sm ${paymentFilter === c ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                onClick={() => setPaymentFilter(c)}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No bookings found</h3>
            <p>No bookings match the current filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Type / Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Payment Status</th>
                    <th style={{ width: 80 }}>View</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((b) => (
                    <tr key={b.id || b._id}>
                      <td><strong>{b.name}</strong></td>
                      <td className="cell-truncate">
                        {b.email}
                        {b.phone ? <span className="cell-muted"> · {b.phone}</span> : ''}
                      </td>
                      <td>
                        <span className="cell-type">{b.type?.replace(/-/g, ' ') || '—'}</span>
                        {b.date ? <span className="cell-date">{b.date}</span> : ''}
                      </td>
                      <td>{badge(b.status)}</td>
                      <td>
                        {b.paymentMethod ? (
                          <span className="payment-method-cell">
                            <span className="payment-method-icon-sm">{methodIcon(b.paymentMethod)}</span>
                            {formatMethod(b.paymentMethod)}
                          </span>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>
                      <td>{paymentBadge(b.paymentStatus || 'pending')}</td>
                      <td>
                        <button
                          className="btn-admin-icon"
                          onClick={() => setViewing(b)}
                          title="View details"
                        >
                          👁
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button className="btn-admin-icon" onClick={() => openEdit(b)} title="Edit">✎</button>
                          {b.status !== 'confirmed' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updateStatus(b.id, 'confirmed')}
                              title="Confirm booking"
                            >
                              ✓
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updateStatus(b.id, 'cancelled')}
                              title="Cancel booking"
                            >
                              ✕
                            </button>
                          )}
                          {(b.paymentStatus || 'pending') !== 'paid' && b.paymentMethod && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updatePaymentStatus(b.id, 'paid')}
                              title="Mark as paid"
                            >
                              💰
                            </button>
                          )}
                          {(b.paymentStatus || 'pending') !== 'failed' && b.paymentMethod && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updatePaymentStatus(b.id, 'failed')}
                              title="Mark as failed"
                            >
                              ⚠
                            </button>
                          )}
                          <button className="btn-admin-icon danger" onClick={() => handleDelete(b.id)} title="Delete">✕</button>
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

      {/* ---- Edit / Add Modal ---- */}
      {editing && (
        <Modal title={editing === 'new' ? 'Add Booking' : 'Edit Booking'} onClose={() => setEditing(null)} wide>
          <div className="admin-form">
            <h3 className="card-admin-header" style={{ margin: 0, fontSize: '0.85rem' }}>Contact Details</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Group Size</label>
                <input type="number" min="1" value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: e.target.value })} />
              </div>
            </div>

            <h3 className="card-admin-header" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>Session Details</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Session Type</label>
                <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. public" />
              </div>
              <div className="admin-field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="admin-field">
              <label>Experience</label>
              <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}>
                <option value="">Select</option>
                <option value="beginner">First time</option>
                <option value="some">A few times</option>
                <option value="intermediate">Regular climber</option>
                <option value="advanced">Experienced</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
            </div>

            <h3 className="card-admin-header" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>Status</h3>
            <div className="admin-form-row admin-form-row--triple">
              <div className="admin-field">
                <label>Booking Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Payment Method</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="">None</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="easypaisa">EasyPaisa / JazzCash</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Payment Status</label>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="admin-form-actions">
              <button className="btn-admin btn-admin-primary" onClick={handleSave}>Save</button>
              <button className="btn-admin btn-admin-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---- View Details Modal ---- */}
      {viewing && (
        <Modal title={viewing.name || 'Booking Details'} onClose={() => setViewing(null)} wide>
          <div className="booking-detail-grid">
            {/* Left column: Booking info */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Contact &amp; Session</h4>
              <div className="detail-fields">
                <div className="detail-row">
                  <span className="detail-key">Name</span>
                  <span className="detail-val">{viewing.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Email</span>
                  <span className="detail-val">{viewing.email || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Phone</span>
                  <span className="detail-val">{viewing.phone || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Session</span>
                  <span className="detail-val">{viewing.type?.replace(/-/g, ' ') || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Date</span>
                  <span className="detail-val">{viewing.date || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Group size</span>
                  <span className="detail-val">{viewing.groupSize || '1'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Experience</span>
                  <span className="detail-val">{viewing.experience || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Message</span>
                  <span className="detail-val">{viewing.message || '—'}</span>
                </div>
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Status</h4>
              <div className="detail-status-row">
                <span className="detail-key">Booking</span>
                {badge(viewing.status)}
              </div>
              <div className="detail-status-row">
                <span className="detail-key">Payment</span>
                {paymentBadge(viewing.paymentStatus || 'pending')}
              </div>

              <div className="detail-actions" style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {viewing.status === 'pending' && (
                    <button
                      className="btn-admin btn-admin-sm"
                      style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                      onClick={() => { updateStatus(viewing.id, 'confirmed'); setViewing(null) }}
                    >
                      ✓ Confirm booking
                    </button>
                  )}
                  {viewing.status !== 'cancelled' && (
                    <button
                      className="btn-admin btn-admin-sm btn-admin-danger"
                      onClick={() => { updateStatus(viewing.id, 'cancelled'); setViewing(null) }}
                    >
                      ✕ Cancel booking
                    </button>
                  )}
                  {(viewing.paymentStatus || 'pending') !== 'paid' && viewing.paymentMethod && (
                    <button
                      className="btn-admin btn-admin-sm"
                      style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                      onClick={() => { updatePaymentStatus(viewing.id, 'paid'); setViewing(null) }}
                    >
                      💰 Mark as paid
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Payment details */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Payment Information</h4>
              <PaymentDetailCard
                paymentMethod={viewing.paymentMethod}
                paymentDetails={viewing.paymentDetails}
              />
              {viewing.paymentStatus === 'paid' && (
                <div className="payment-verified-badge">
                  <span className="verified-icon">✓</span> Payment verified
                </div>
              )}
              <button
                className="btn-admin btn-admin-outline btn-admin-sm"
                style={{ marginTop: 16 }}
                onClick={() => { setViewing(null); openEdit(viewing) }}
              >
                ✎ Edit booking
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
