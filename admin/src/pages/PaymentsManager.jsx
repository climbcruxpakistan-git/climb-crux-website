import { useState, useEffect } from 'react'
import { getPendingPayments, verifyPayment, getBookings } from '../store.js'
import { useToast } from '../components/Toast.jsx'

function methodLabel(method) {
  if (method === 'bank_transfer' || method === 'bank') return 'Bank Transfer'
  if (method === 'easypaisa') return 'EasyPaisa'
  return method || '—'
}

function methodIcon(method) {
  if (method === 'bank_transfer' || method === 'bank') return '🏦'
  if (method === 'easypaisa') return '📱'
  return '💳'
}

export default function PaymentsManager() {
  const { addToast } = useToast()
  const [payments, setPayments] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null) // id being processed

  function loadData() {
    setLoading(true)
    Promise.all([getPendingPayments(), getBookings()])
      .then(([p, b]) => {
        setPayments(p)
        setBookings(b)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  async function handleVerify(bookingId, action) {
    setProcessing(bookingId)
    try {
      await verifyPayment(bookingId, action)
      addToast(
        action === 'approve' ? 'Payment approved ✓ Booking confirmed' : 'Payment rejected',
        action === 'approve' ? 'success' : 'error',
      )
      loadData()
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error')
    } finally {
      setProcessing(null)
    }
  }

  // Merge payments with booking data that may not have a Payment record yet
  // Also include bookings that are in 'verification_required' status but might not have a matched Payment record
  const processedPayments = payments.length > 0
    ? payments
    : bookings
      .filter((b) => b.payment_status === 'verification_required')
      .map((b) => ({
        id: b.id,
        bookingId: b.id,
        method: b.payment_method,
        status: 'verification_required',
        payer_name: b.payer_name,
        payer_bank: b.payer_bank,
        booking: b,
      }))

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <h3>Loading pending payments…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Pending Payments</h1>
          <p className="page-header-admin-desc">
            Verify and confirm manual payments (Bank Transfer &amp; EasyPaisa).
            Confirm only after receiving payment proof via WhatsApp.
          </p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={loadData}>
          ⟳ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card orange">
          <div className="stat-card-icon">⏳</div>
          <span className="stat-card-value">{processedPayments.length}</span>
          <span className="stat-card-label">Pending Verification</span>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-icon">🏦</div>
          <span className="stat-card-value">
            {processedPayments.filter((p) => p.method === 'bank_transfer' || p.method === 'bank').length}
          </span>
          <span className="stat-card-label">Bank Transfers</span>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-icon">📱</div>
          <span className="stat-card-value">
            {processedPayments.filter((p) => p.method === 'easypaisa').length}
          </span>
          <span className="stat-card-label">EasyPaisa</span>
        </div>
      </div>

      {/* Reference: Our account details */}
      <div className="card-admin" style={{ padding: '18px 24px', borderLeft: '4px solid #f36f21' }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div className="payment-detail-card" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <div className="payment-detail-header" style={{ borderBottom: 'none', marginBottom: 10, paddingBottom: 0 }}>
              <span className="payment-detail-method-icon">🏦</span>
              <span className="payment-detail-method-name">Our Bank Account</span>
            </div>
            <div className="payment-detail-fields">
              <div className="payment-detail-row">
                <span className="payment-detail-key">Bank:</span>
                <span className="payment-detail-val">Bank Al Habib Limited</span>
              </div>
              <div className="payment-detail-row">
                <span className="payment-detail-key">Account:</span>
                <span className="payment-detail-val">CLIMB CRUX</span>
              </div>
              <div className="payment-detail-row">
                <span className="payment-detail-key">IBAN:</span>
                <span className="payment-detail-val" style={{ fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all' }}>PK93 BAHL 5742 0081 0003 9501</span>
              </div>
              <div className="payment-detail-row">
                <span className="payment-detail-key">Branch Code:</span>
                <span className="payment-detail-val">5742</span>
              </div>
            </div>
          </div>
          <div className="payment-detail-card" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <div className="payment-detail-header" style={{ borderBottom: 'none', marginBottom: 10, paddingBottom: 0 }}>
              <span className="payment-detail-method-icon">📱</span>
              <span className="payment-detail-method-name">Our EasyPaisa</span>
            </div>
            <div className="payment-detail-fields">
              <div className="payment-detail-row">
                <span className="payment-detail-key">Account:</span>
                <span className="payment-detail-val">Saif Ud Din</span>
              </div>
              <div className="payment-detail-row">
                <span className="payment-detail-key">Number:</span>
                <span className="payment-detail-val mono">0313 2690377</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {processedPayments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✓</div>
          <h3>All caught up!</h3>
          <p>No pending payments to verify.</p>
        </div>
      ) : (
        <div className="card-admin">
          <div className="card-admin-header">
            <h2>Payments awaiting verification ({processedPayments.length})</h2>
          </div>
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Booking #</th>
                    <th>Customer</th>
                    <th>Session</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Sender Details</th>
                    <th>Date</th>
                    <th style={{ width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedPayments.map((p) => {
                    const b = p.booking || {}
                    const bookingId = p.bookingId || b.id
                    const isProcessing = processing === bookingId
                    return (
                      <tr key={bookingId || p.id}>
                        <td>
                          <strong className="ref-code" style={{ fontSize: '0.78rem' }}>
                            {b.booking_number || '—'}
                          </strong>
                        </td>
                        <td>
                          <strong>{b.customer_name || '—'}</strong>
                          <div className="cell-muted">{b.customer_email || ''}</div>
                          <div className="cell-muted">{b.customer_phone || ''}</div>
                        </td>
                        <td>
                          <span className="cell-type">
                            {(b.session_id || '').replace(/-/g, ' ') || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="payment-method-cell">
                            <span className="payment-method-icon-sm">{methodIcon(p.method)}</span>
                            {methodLabel(p.method)}
                          </span>
                        </td>
                        <td>PKR {(b.amount || 0).toLocaleString()}</td>
                        <td style={{ fontSize: '0.78rem' }}>
                          {p.method === 'easypaisa' ? (
                            <>
                              <div className="cell-muted">Name: {p.payer_name || b.payer_name || '—'}</div>
                              <div className="cell-muted">Phone: {p.payer_phone || b.payer_phone || '—'}</div>
                            </>
                          ) : (
                            <>
                              <div className="cell-muted">Bank: {p.payer_bank || b.payer_bank || '—'}</div>
                              <div className="cell-muted">Holder: {p.payer_name || b.payer_name || '—'}</div>
                            </>
                          )}
                        </td>
                        <td className="cell-muted">
                          {b.date || (b.created_at || '').split('T')[0] || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{
                                background: '#16a34a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '6px 14px',
                                fontSize: '0.75rem',
                                opacity: isProcessing ? 0.6 : 1,
                              }}
                              disabled={isProcessing}
                              onClick={() => handleVerify(bookingId, 'approve')}
                            >
                              {isProcessing ? '…' : '✓ Approve'}
                            </button>
                            <button
                              className="btn-admin btn-admin-sm"
                              style={{
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '6px 14px',
                                fontSize: '0.75rem',
                                opacity: isProcessing ? 0.6 : 1,
                              }}
                              disabled={isProcessing}
                              onClick={() => handleVerify(bookingId, 'reject')}
                            >
                              {isProcessing ? '…' : '✕ Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


    </>
  )
}
