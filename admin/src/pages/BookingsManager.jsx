import { useState, useEffect } from 'react'
import { getBookings, saveBooking, deleteBooking, patchBookingStatus, patchPaymentStatus } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

function formatMethod(method) {
  if (method === 'card') return 'Card'
  if (method === 'bank') return 'Bank Transfer'
  return '—'
}

function methodIcon(method) {
  if (method === 'card') return '💳'
  if (method === 'bank') return '🏦'
  return '—'
}

function badge(status) {
  const map = {
    pending_payment: 'badge-yellow',
    pending_verification: 'badge-orange',
    confirmed: 'badge-green',
    cancelled: 'badge-red',
    paid: 'badge-green',
    failed: 'badge-red',
  }
  const display = {
    pending_payment: 'Pending Payment',
    pending_verification: 'Verifying',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  }
  const label = display[status] || status || '—'
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{label}</span>
}

function paymentBadge(status) {
  const map = {
    pending: 'badge-yellow',
    verification_required: 'badge-orange',
    paid: 'badge-green',
    failed: 'badge-red',
    refunded: 'badge-gray',
  }
  const display = {
    verification_required: 'Verification Required',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  }
  const label = display[status] || status || '—'
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{label}</span>
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

      {paymentMethod === 'bank' && (
        <div className="payment-detail-fields">
          <div className="payment-detail-row">
            <span className="payment-detail-key">Sender bank</span>
            <span className="payment-detail-val">{paymentDetails?.payer_bank || paymentDetails?.yourBank || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span className="payment-detail-key">Account holder</span>
            <span className="payment-detail-val">{paymentDetails?.payer_name || paymentDetails?.accountHolder || '—'}</span>
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
    customer_name: '', customer_email: '', customer_phone: '',
    session_id: '', date: '', participants: 1, amount: 2500,
    booking_status: 'pending_payment',
    payment_method: '', payment_status: 'pending',
  }
  const [form, setForm] = useState(emptyForm)

  const paymentStatusOptions = ['All', 'pending', 'verification_required', 'paid', 'failed']
  const bookingStatusOptions = ['All', 'pending_payment', 'pending_verification', 'confirmed', 'cancelled']
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
      customer_name: b.customer_name || '',
      customer_email: b.customer_email || '',
      customer_phone: b.customer_phone || '',
      session_id: b.session_id || '',
      date: b.date || '',
      participants: b.participants || 1,
      amount: b.amount || 2500,
      booking_status: b.booking_status || 'pending_payment',
      payment_method: b.payment_method || '',
      payment_status: b.payment_status || 'pending',
    })
    setEditing(b.id)
  }

  async function handleSave() {
    if (!form.customer_name || !form.customer_email) {
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
    shown = shown.filter((b) => b.booking_status === statusFilter)
  }
  if (paymentFilter !== 'All') {
    shown = shown.filter((b) => (b.payment_status || 'pending') === paymentFilter)
  }
  if (datePreset !== 'all' || dateFrom || dateTo) {
    shown = shown.filter(isBookingInRange)
  }

  // Stats computed from filtered bookings
  const stats = {
    total: shown.length,
    pendingPayment: shown.filter((b) => b.booking_status === 'pending_payment').length,
    pendingVerification: shown.filter((b) => b.booking_status === 'pending_verification').length,
    paid: shown.filter((b) => b.payment_status === 'paid').length,
    pendingPayments: shown.filter((b) => (b.payment_status || 'pending') === 'pending' && b.payment_method).length,
    failed: shown.filter((b) => b.payment_status === 'failed').length,
    revenue: shown.reduce((sum, b) => sum + (b.payment_status === 'paid' ? (b.amount || 2500) : 0), 0),
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
          <span className="stat-card-change up">{stats.pendingPayment} awaiting payment</span>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon">✓</div>
          <span className="stat-card-value">{stats.paid}</span>
          <span className="stat-card-label">Paid Bookings</span>
          <span className="stat-card-change up">{stats.pendingVerification} verifying</span>
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
          <span className="stat-card-label">Total Revenue</span>
          <span className="stat-card-change up">{stats.paid} paid bookings</span>
        </div>
      </div>

      {/* ---- Pending Payment Confirmations (Bank Transfer) ---- */}
      {bookings.filter((b) => b.payment_method === 'bank' && b.payment_status === 'verification_required').length > 0 && (
        <div className="card-admin" style={{ borderLeft: '4px solid #f36f21' }}>
          <div className="card-admin-header">
            <h2>⏳ Pending Bank Transfer Confirmations</h2>
            <span style={{ fontSize: '0.78rem', color: '#888' }}>Awaiting payment verification</span>
          </div>
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Booking #</th>
                    <th>Customer</th>
                    <th>Course / Package</th>
                    <th>Amount</th>
                    <th>Sender Bank</th>
                    <th>Account Holder</th>
                    <th>Date</th>
                    <th style={{ width: 130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter((b) => b.payment_method === 'bank' && b.payment_status === 'verification_required').map((b) => (
                    <tr key={b.id || b._id}>
                      <td><strong className="ref-code" style={{ fontSize: '0.78rem' }}>{b.booking_number || '—'}</strong></td>
                      <td>
                        <strong>{b.customer_name}</strong>
                        <div className="cell-muted">{b.customer_email}</div>
                      </td>
                      <td>{b.session_id?.replace(/-/g, ' ') || '—'}</td>
                      <td>PKR {(b.amount || 2500).toLocaleString()}</td>
                      <td className="cell-muted" style={{ fontSize: '0.78rem' }}>{b.payment_details?.payer_bank || b.payment_details?.yourBank || '—'}</td>
                      <td className="cell-muted" style={{ fontSize: '0.78rem' }}>{b.payment_details?.payer_name || b.payment_details?.accountHolder || '—'}</td>
                      <td className="cell-muted">{b.date || b.created_at?.split('T')[0] || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn-admin btn-admin-sm"
                            style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                            onClick={async () => {
                              try {
                                await Promise.all([
                                  patchBookingStatus(b.id, 'confirmed'),
                                  patchPaymentStatus(b.id, 'paid'),
                                ])
                                setBookings(await getBookings())
                                addToast('Payment confirmed ✓', 'success')
                              } catch (err) {
                                addToast('Failed to confirm payment', 'error')
                              }
                            }}
                          >
                            ✓ Confirm
                          </button>
                          <button
                            className="btn-admin btn-admin-sm btn-admin-danger"
                            onClick={async () => {
                              try {
                                await patchPaymentStatus(b.id, 'failed')
                                setBookings(await getBookings())
                                addToast('Payment rejected', 'error')
                              } catch (err) {
                                addToast('Failed to reject payment', 'error')
                              }
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                {c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
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
                {c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')}
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
                      <td><strong>{b.customer_name}</strong></td>
                      <td className="cell-truncate">
                        {b.customer_email}
                        {b.customer_phone ? <span className="cell-muted"> · {b.customer_phone}</span> : ''}
                      </td>
                      <td>
                        <span className="cell-type">{b.session_id?.replace(/-/g, ' ') || '—'}</span>
                        {b.date ? <span className="cell-date">{b.date}</span> : ''}
                      </td>
                      <td>{badge(b.booking_status)}</td>
                      <td>
                        {b.payment_method ? (
                          <span className="payment-method-cell">
                            <span className="payment-method-icon-sm">{methodIcon(b.payment_method)}</span>
                            {formatMethod(b.payment_method)}
                          </span>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>
                      <td>{paymentBadge(b.payment_status || 'pending')}</td>
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
                          {b.booking_status !== 'confirmed' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updateStatus(b.id, 'confirmed')}
                              title="Confirm booking"
                            >
                              ✓
                            </button>
                          )}
                          {b.booking_status !== 'cancelled' && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updateStatus(b.id, 'cancelled')}
                              title="Cancel booking"
                            >
                              ✕
                            </button>
                          )}
                          {(b.payment_status || 'pending') !== 'paid' && b.payment_method && (
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => updatePaymentStatus(b.id, 'paid')}
                              title="Mark as paid"
                            >
                              💰
                            </button>
                          )}
                          {(b.payment_status || 'pending') !== 'failed' && b.payment_method && (
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
                <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Email</label>
                <input value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Phone</label>
                <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Participants</label>
                <input type="number" min="1" value={form.participants} onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })} />
              </div>
            </div>

            <h3 className="card-admin-header" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>Session Details</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Session Type</label>
                <input value={form.session_id} onChange={(e) => setForm({ ...form, session_id: e.target.value })} placeholder="e.g. public" />
              </div>
              <div className="admin-field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="admin-field">
              <label>Amount (PKR)</label>
              <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>

            <h3 className="card-admin-header" style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>Status</h3>
            <div className="admin-form-row admin-form-row--triple">
              <div className="admin-field">
                <label>Booking Status</label>
                <select value={form.booking_status} onChange={(e) => setForm({ ...form, booking_status: e.target.value })}>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  <option value="">None</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Payment Status</label>
                <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="verification_required">Verification Required</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
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
        <Modal title={viewing.customer_name || 'Booking Details'} onClose={() => setViewing(null)} wide>
          <div className="booking-detail-grid">
            {/* Left column: Booking info */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Contact &amp; Session</h4>
              <div className="detail-fields">
                <div className="detail-row">
                  <span className="detail-key">Name</span>
                  <span className="detail-val">{viewing.customer_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Email</span>
                  <span className="detail-val">{viewing.customer_email || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Phone</span>
                  <span className="detail-val">{viewing.customer_phone || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Booking #</span>
                  <span className="detail-val ref-code" style={{ fontFamily: 'monospace' }}>{viewing.booking_number || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Session</span>
                  <span className="detail-val">{viewing.session_id?.replace(/-/g, ' ') || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Date</span>
                  <span className="detail-val">{viewing.date || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Participants</span>
                  <span className="detail-val">{viewing.participants || '1'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">Amount</span>
                  <span className="detail-val">PKR {(viewing.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Status</h4>
              <div className="detail-status-row">
                <span className="detail-key">Booking</span>
                {badge(viewing.booking_status)}
              </div>
              <div className="detail-status-row">
                <span className="detail-key">Payment</span>
                {paymentBadge(viewing.payment_status || 'pending')}
              </div>

              <div className="detail-actions" style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {viewing.booking_status !== 'confirmed' && (
                    <button
                      className="btn-admin btn-admin-sm"
                      style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                      onClick={() => { updateStatus(viewing.id, 'confirmed'); setViewing(null) }}
                    >
                      ✓ Confirm booking
                    </button>
                  )}
                  {viewing.booking_status !== 'cancelled' && (
                    <button
                      className="btn-admin btn-admin-sm btn-admin-danger"
                      onClick={() => { updateStatus(viewing.id, 'cancelled'); setViewing(null) }}
                    >
                      ✕ Cancel booking
                    </button>
                  )}
                  {(viewing.payment_status || 'pending') !== 'paid' && viewing.payment_method && (
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
                paymentMethod={viewing.payment_method}
                paymentDetails={viewing.payment_details || viewing.paymentDetails}
              />
              {viewing.payment_status === 'paid' && (
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

            {/* Bottom row: Timeline */}
            <div className="booking-timeline-section" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <h4 className="detail-section-title">📋 Booking Timeline</h4>
              {(viewing.history && viewing.history.length > 0) ? (
                <div className="timeline">
                  {[...viewing.history]
                    .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
                    .map((event, idx) => {
                      const date = new Date(event.timestamp || event.createdAt)
                      const timeStr = date.toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })
                      const iconMap = {
                        booking_created: '🆕',
                        status_changed: '🔄',
                        payment_status_changed: '💰',
                        payment_method_set: '💳',
                        booking_updated: '✎',
                        email_sent: '📧',
                      }
                      return (
                        <div key={idx} className="timeline-event">
                          <div className="timeline-dot">
                            <span className="timeline-icon">{iconMap[event.type] || '📌'}</span>
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-desc">{event.description}</span>
                              <span className="timeline-time">{timeStr}</span>
                            </div>
                            {event.details && Object.keys(event.details).length > 0 && (
                              <div className="timeline-meta">
                                {event.details.from && event.details.to && (
                                  <span className="timeline-change">
                                    {event.details.from} → {event.details.to}
                                  </span>
                                )}
                                {event.details.updated && (
                                  <span className="cell-muted" style={{ fontSize: '0.75rem' }}>
                                    {event.details.updated}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p className="cell-muted" style={{ padding: '12px 0' }}>No history recorded yet.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
