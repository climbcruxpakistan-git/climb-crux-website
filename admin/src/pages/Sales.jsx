import { useState, useEffect, useMemo } from 'react'
import { getProductOrders, patchOrderStatus, approveProductOrder, declineProductOrder, deleteProductOrder } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'
import { formatDate, formatDateTime } from '../formatDate.js'

/** Cloudinary URL that forces a download instead of preview. */
function downloadUrl(url) {
  if (!url) return ''
  return url.replace('/upload/', '/upload/fl_attachment/')
}

function formatMethod(method) {
  if (method === 'bank_transfer' || method === 'bank') return 'Bank Transfer'
  if (method === 'easypaisa') return 'EasyPaisa'
  return method ? method.replace(/_/g, ' ') : '—'
}

function methodIcon(method) {
  if (method === 'bank_transfer' || method === 'bank') return '🏦'
  if (method === 'easypaisa') return '📱'
  return '—'
}

const STATUS_META = {
  pending_payment: { color: 'badge-yellow', label: 'Payment Pending' },
  pending_verification: { color: 'badge-orange', label: 'Verification Pending' },
  confirmed: { color: 'badge-green', label: 'Confirmed' },
  processing: { color: 'badge-blue', label: 'Processing' },
  ready_for_pickup: { color: 'badge-blue', label: 'Ready for Pickup' },
  shipped: { color: 'badge-blue', label: 'Shipped' },
  delivered: { color: 'badge-green', label: 'Delivered' },
  declined: { color: 'badge-red', label: 'Declined' },
  cancelled: { color: 'badge-red', label: 'Declined' },
}

function statusBadge(status) {
  const meta = STATUS_META[status] || { color: 'badge-gray', label: status || '—' }
  return <span className={`badge ${meta.color}`}>{meta.label}</span>
}

const PAYMENT_META = {
  pending: { color: 'badge-yellow', label: 'Pending' },
  verification_required: { color: 'badge-orange', label: 'Verification Required' },
  paid: { color: 'badge-green', label: 'Paid' },
  failed: { color: 'badge-red', label: 'Failed' },
  refunded: { color: 'badge-gray', label: 'Refunded' },
}

function paymentBadge(status) {
  const meta = PAYMENT_META[status] || { color: 'badge-gray', label: status || '—' }
  return <span className={`badge ${meta.color}`}>{meta.label}</span>
}

/** Suggested decline reasons (kept in sync with backend ORDER_DECLINE_REASONS). */
const DECLINE_REASONS = [
  { value: 'payment_not_received', label: 'Payment Not Received' },
  { value: 'incorrect_amount', label: 'Incorrect Payment Amount' },
  { value: 'invalid_screenshot', label: 'Invalid Payment Screenshot' },
  { value: 'other', label: 'Other' },
]

/** Fulfilment stages an admin can move a confirmed order through. */
const FULFILMENT_STAGES = [
  { value: 'processing', label: 'Processing' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

export default function Sales() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewing, setViewing] = useState(null)
  const [declining, setDeclining] = useState(null)
  const [declineOther, setDeclineOther] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    getProductOrders()
      .then(setOrders)
      .catch((err) => addToast(`Failed to load orders: ${err.message}`, 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refresh() {
    try {
      const list = await getProductOrders()
      setOrders(list)
      return list
    } catch (err) {
      addToast(`Failed to refresh orders: ${err.message}`, 'error')
      return null
    }
  }

  // Search by Order ID (CCE-XXXXXX), customer name or phone.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = orders
    if (q) {
      list = list.filter((o) =>
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_phone || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'All') list = list.filter((o) => o.status === statusFilter)
    return list
  }, [orders, search, statusFilter])

  const stats = {
    total: orders.length,
    pendingVerification: orders.filter((o) => o.status === 'pending_verification').length,
    pendingPayment: orders.filter((o) => o.status === 'pending_payment').length,
    revenue: orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0),
  }

  async function handleApprove(order) {
    const label = order.order_number || 'this order'
    if (!confirm(`Approve payment for ${label}?\n\nThis will:\n• Mark the order as Confirmed & payment as Paid\n• Email the confirmation to ${order.customer_email || 'the customer'}`)) return
    setActing(true)
    try {
      const res = await approveProductOrder(order.id)
      const list = await refresh()
      if (viewing && list) setViewing(list.find((o) => o.id === order.id) || null)
      if (res.emailSent === false) {
        addToast('Order confirmed, but the confirmation email could not be sent', 'error')
      } else {
        addToast('Order approved — confirmation email sent', 'success')
      }
    } catch (err) {
      addToast(`Failed to approve: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  async function handleDecline(order, reason) {
    setActing(true)
    try {
      const res = await declineProductOrder(order.id, reason)
      await refresh()
      if (res.emailSent === false) {
        addToast('Order declined, but the decline email could not be sent', 'error')
      } else {
        addToast('Order declined — email sent to customer', 'success')
      }
    } catch (err) {
      addToast(`Failed to decline: ${err.message}`, 'error')
    } finally {
      setActing(false)
      setDeclining(null)
      setDeclineOther('')
      setViewing(null)
    }
  }

  async function handleStage(order, stage) {
    setActing(true)
    try {
      await patchOrderStatus(order.id, stage)
      const list = await refresh()
      if (viewing && list) setViewing(list.find((o) => o.id === order.id) || null)
      addToast(`Order moved to ${stage.replace(/_/g, ' ')}`, 'success')
    } catch (err) {
      addToast(`Failed to update status: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  async function handleDelete(order) {
    const label = order.order_number || 'this order'
    if (!confirm(`Delete ${label}?\n\nThis permanently removes the shopping request, its payment record, and any uploaded screenshot. This cannot be undone.`)) return
    setActing(true)
    try {
      await deleteProductOrder(order.id)
      const list = await refresh()
      if (viewing) setViewing(null)
      addToast(`Order ${order.order_number || ''} deleted`, 'success')
      void list
    } catch (err) {
      addToast(`Failed to delete: ${err.message}`, 'error')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <div className="empty-state"><h3>Loading orders…</h3></div>
  }

  const reviewable = viewing && !['confirmed', 'declined', 'delivered', 'cancelled'].includes(viewing.status)
  const confirmedOrAfter = viewing && ['confirmed', 'processing', 'ready_for_pickup', 'shipped', 'delivered'].includes(viewing.status)

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Sales</h1>
          <p className="page-header-admin-desc">Equipment orders with manual payment verification.</p>
        </div>
      </div>

      {/* ---- Stats Cards ---- */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-card-icon">📦</div>
          <span className="stat-card-value">{stats.total}</span>
          <span className="stat-card-label">Total Orders</span>
          <span className="stat-card-change up">{stats.pendingPayment} awaiting payment</span>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon">💰</div>
          <span className="stat-card-value">PKR {stats.revenue.toLocaleString()}</span>
          <span className="stat-card-label">Revenue (paid)</span>
          <span className="stat-card-change up">{orders.filter((o) => o.payment_status === 'paid').length} paid orders</span>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-icon">⏳</div>
          <span className="stat-card-value">{stats.pendingVerification}</span>
          <span className="stat-card-label">Pending Verification</span>
          <span className="stat-card-change down">{orders.filter((o) => o.status === 'declined').length} declined</span>
        </div>
      </div>

      <div className="card-admin">
        {/* ── Search by Order ID (CCE-XXXXXX) ── */}
        <div className="admin-search-bar">
          <span className="admin-search-icon" aria-hidden="true">🔍</span>
          <input
            className="admin-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID — e.g. CCE-482731 (or customer name / phone)"
            aria-label="Search orders"
            spellCheck="false"
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')} title="Clear search" aria-label="Clear search">✕</button>
          )}
        </div>

        <div className="card-admin-header">
          <h2>All Orders ({filtered.length})</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'pending_payment', 'pending_verification', 'confirmed', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'declined'].map((c) => (
              <button
                key={c}
                className={`btn-admin btn-admin-sm ${statusFilter === c ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                onClick={() => setStatusFilter(c)}
              >
                {c === 'All' ? 'All' : (STATUS_META[c]?.label || c.replace(/_/g, ' '))}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>{search ? 'No order found with this Order ID.' : 'No orders yet'}</h3>
            <p>{search ? 'Check the Order ID and try again.' : 'Orders from customers will appear here.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Order Date</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Total</th>
                    <th>Payment Method</th>
                    <th>Current Status</th>
                    <th style={{ width: 80 }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id || o._id} style={{ cursor: 'pointer' }} onClick={() => setViewing(o)}>
                      <td><span className="ref-code" title={`View order ${o.order_number}`}>{o.order_number || '—'}</span></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--stone)', whiteSpace: 'nowrap' }}>
                        {formatDate(o.created_at) || '—'}
                      </td>
                      <td><strong>{o.customer_name}</strong></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{o.customer_phone || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>PKR {(o.total_amount || 0).toLocaleString()}</td>
                      <td>
                        {o.payment_method ? (
                          <span className="payment-method-cell">
                            <span className="payment-method-icon-sm">{methodIcon(o.payment_method)}</span>
                            {formatMethod(o.payment_method)}
                          </span>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>
                      <td>{statusBadge(o.status)}</td>
                      <td>
                        <button className="btn-admin-icon" onClick={(e) => { e.stopPropagation(); setViewing(o) }} title="View details">👁</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ---- Order Details Modal ---- */}
      {viewing && (
        <Modal title={`Order ${viewing.order_number || ''}`.trim()} onClose={() => setViewing(null)} wide>
          <div className="booking-detail-grid">
            {/* Left column: Customer + Order */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Customer</h4>
              <div className="detail-fields">
                <div className="detail-row"><span className="detail-key">Name</span><span className="detail-val">{viewing.customer_name}</span></div>
                <div className="detail-row"><span className="detail-key">Email</span><span className="detail-val">{viewing.customer_email || '—'}</span></div>
                <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-val">{viewing.customer_phone || '—'}</span></div>
                <div className="detail-row"><span className="detail-key">Shipping Address</span><span className="detail-val">{viewing.customer_address || '—'}</span></div>
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Order</h4>
              <div className="detail-fields">
                <div className="detail-row"><span className="detail-key">Order ID</span><span className="detail-val ref-code" style={{ fontFamily: 'monospace' }}>{viewing.order_number || '—'}</span></div>
                <div className="detail-row"><span className="detail-key">Order Date</span><span className="detail-val">{formatDate(viewing.created_at) || '—'}</span></div>
                <div className="detail-row"><span className="detail-key">Product</span><span className="detail-val">{viewing.product_name}</span></div>
                <div className="detail-row"><span className="detail-key">Quantity</span><span className="detail-val">{viewing.quantity || 1}</span></div>
                <div className="detail-row"><span className="detail-key">Unit Price</span><span className="detail-val">PKR {(viewing.product_price || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Total Amount</span><span className="detail-val">PKR {(viewing.total_amount || 0).toLocaleString()}</span></div>
              </div>

              <h4 className="detail-section-title" style={{ marginTop: 24 }}>Status</h4>
              <div className="detail-status-row"><span className="detail-key">Order</span>{statusBadge(viewing.status)}</div>
              <div className="detail-status-row"><span className="detail-key">Payment</span>{paymentBadge(viewing.payment_status || 'pending')}</div>

              {(viewing.verified_by || viewing.rejected_by) && (
                <div className="detail-fields" style={{ marginTop: 16 }}>
                  {viewing.verified_by && (
                    <div className="detail-row">
                      <span className="detail-key">Approved By</span>
                      <span className="detail-val">{viewing.verified_by} · {formatDate(viewing.approval_date) || '—'}</span>
                    </div>
                  )}
                  {viewing.rejected_by && (
                    <div className="detail-row">
                      <span className="detail-key">Declined By</span>
                      <span className="detail-val">{viewing.rejected_by} · {formatDate(viewing.rejection_date) || '—'}</span>
                    </div>
                  )}
                  {viewing.decline_reason && (
                    <div className="detail-row">
                      <span className="detail-key">Decline Reason</span>
                      <span className="detail-val">{viewing.decline_reason.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column: Payment */}
            <div className="booking-detail-section">
              <h4 className="detail-section-title">Payment</h4>
              <div className="payment-detail-card">
                <div className="payment-detail-header">
                  <span className="payment-detail-method-icon">{methodIcon(viewing.payment_method)}</span>
                  <span className="payment-detail-method-name">{viewing.payment_method ? formatMethod(viewing.payment_method) : 'No payment method'}</span>
                </div>
                {(viewing.payment_method === 'bank_transfer' || viewing.payment_method === 'bank') && (
                  <div className="payment-detail-fields">
                    <div className="payment-detail-row"><span className="payment-detail-key">Sender bank</span><span className="payment-detail-val">{viewing.payer_bank || '—'}</span></div>
                    <div className="payment-detail-row"><span className="payment-detail-key">Account holder</span><span className="payment-detail-val">{viewing.payer_name || '—'}</span></div>
                  </div>
                )}
                {viewing.payment_method === 'easypaisa' && (
                  <div className="payment-detail-fields">
                    <div className="payment-detail-row"><span className="payment-detail-key">Sender name</span><span className="payment-detail-val">{viewing.payer_name || '—'}</span></div>
                    <div className="payment-detail-row"><span className="payment-detail-key">Phone</span><span className="payment-detail-val mono">{viewing.payer_phone || '—'}</span></div>
                  </div>
                )}
              </div>

              {viewing.payment_screenshot_url ? (
                <div className="payment-detail-card" style={{ marginTop: 16 }}>
                  <div className="payment-detail-header">
                    <span className="payment-detail-method-icon">📎</span>
                    <span className="payment-detail-method-name">Uploaded Payment Screenshot</span>
                  </div>
                  <div style={{ padding: 12 }}>
                    <img
                      src={viewing.payment_screenshot_url}
                      alt="Payment proof screenshot"
                      style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, border: '1px solid #eee', display: 'block' }}
                    />
                    {viewing.payment_submitted_at && (
                      <p className="cell-muted" style={{ margin: '8px 0 0', fontSize: '0.75rem' }}>
                        Uploaded {formatDateTime(viewing.payment_submitted_at)}
                      </p>
                    )}
                    <div style={{ marginTop: 10 }}>
                      <a href={downloadUrl(viewing.payment_screenshot_url)} target="_blank" rel="noreferrer" className="btn-admin btn-admin-sm">
                        ⬇ Download proof
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="cell-muted" style={{ marginTop: 12, fontSize: '0.8rem' }}>No payment screenshot uploaded yet.</p>
              )}

              {viewing.payment_status === 'paid' && (
                <div className="payment-verified-badge" style={{ marginTop: 16 }}>
                  <span className="verified-icon">✓</span> Payment verified
                </div>
              )}
            </div>
          </div>

          {/* ---- Admin Actions ---- */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 18 }}>
            {reviewable && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <button
                  className="btn-admin btn-admin-sm"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleApprove(viewing)}
                  disabled={acting}
                  title="Approve payment — confirm order & email customer"
                >
                  ✓ Approve Payment
                </button>
                <button
                  className="btn-admin btn-admin-sm btn-admin-danger"
                  onClick={() => setDeclining(viewing)}
                  disabled={acting}
                  title="Decline payment — with a reason"
                >
                  ✕ Decline Payment
                </button>
              </div>
            )}

            {confirmedOrAfter && (
              <>
                <div style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Update fulfilment status
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FULFILMENT_STAGES.map((s) => (
                    <button
                      key={s.value}
                      className={`btn-admin btn-admin-sm ${viewing.status === s.value ? 'btn-admin-primary' : 'btn-admin-outline'}`}
                      onClick={() => handleStage(viewing, s.value)}
                      disabled={acting}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {reviewable && (
              <p className="cell-muted" style={{ margin: '14px 0 0', fontSize: '0.78rem' }}>
                Approve marks the order Confirmed and sends the confirmation email. Decline marks it Declined and emails the customer with your reason.
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button
                className="btn-admin btn-admin-sm btn-admin-danger"
                onClick={() => handleDelete(viewing)}
                disabled={acting}
                title="Permanently delete this shopping request"
              >
                🗑 Delete Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---- Decline reason picker ---- */}
      {declining && (
        <Modal title={`Decline — ${declining.order_number || 'Order'}`} onClose={() => setDeclining(null)}>
          <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Choose a reason — the customer will receive it in the decline email. The order will be
            declined and the payment marked as failed.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DECLINE_REASONS.map((r) => (
              <button
                key={r.value}
                className="btn-admin"
                style={{ justifyContent: 'flex-start', background: '#fff7f0', border: '1px solid #fde3d2', color: '#1c1c1c', textAlign: 'left' }}
                onClick={() => handleDecline(declining, r.value)}
                disabled={acting}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="admin-field" style={{ marginTop: 14 }}>
            <label>Or type a custom reason</label>
            <input
              value={declineOther}
              onChange={(e) => setDeclineOther(e.target.value)}
              placeholder="e.g. Transfer came from a different account…"
            />
            {declineOther.trim() && (
              <button
                className="btn-admin btn-admin-sm btn-admin-danger"
                style={{ marginTop: 8 }}
                onClick={() => handleDecline(declining, declineOther.trim())}
                disabled={acting}
              >
                Decline with this reason
              </button>
            )}
          </div>
          <button className="btn-admin btn-admin-outline" style={{ marginTop: 10 }} onClick={() => setDeclining(null)} disabled={acting}>
            Cancel
          </button>
        </Modal>
      )}
    </>
  )
}
