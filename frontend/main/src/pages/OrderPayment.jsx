import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getOrderByNumber, submitOrderPaymentProof } from '../api.js'
import './OrderPayment.css'

/**
 * Equipment-order payment page (manual verification workflow). The customer
 * arrives here right after placing an order (Order ID: CCE-XXXXXX). They see
 * the total, both payment methods' details, and upload their payment
 * screenshot. After a successful upload the order moves to Verification
 * Pending and the first customer email (with the order PDF) is sent.
 */
const ORDER_STATUS_META = {
  pending_payment: {
    emoji: '🟠', label: 'Payment Pending', color: 'orange',
    message: 'Please transfer the total amount using one of the payment methods below, then upload your payment screenshot for verification.',
  },
  pending_verification: {
    emoji: '🔵', label: 'Payment Received — Under Verification', color: 'blue',
    message: 'Your payment screenshot has been received and is being verified by the Climb Crux team. You will receive a confirmation email once verified.',
  },
  confirmed: {
    emoji: '🟢', label: 'Order Confirmed', color: 'green',
    message: 'Your payment has been verified and your order is confirmed. Check your email for the order confirmation.',
  },
  processing: {
    emoji: '🟢', label: 'Order Processing', color: 'green',
    message: 'Your order is confirmed and is now being processed by the Climb Crux team.',
  },
  ready_for_pickup: {
    emoji: '🟢', label: 'Ready for Pickup', color: 'green',
    message: 'Your order is ready for pickup. Please arrange to collect it.',
  },
  shipped: {
    emoji: '🟢', label: 'Shipped', color: 'green',
    message: 'Your order has been shipped. Please watch out for delivery updates.',
  },
  delivered: {
    emoji: '⚪', label: 'Delivered', color: 'gray',
    message: 'Your order has been delivered. Thank you for shopping with Climb Crux!',
  },
  declined: {
    emoji: '🔴', label: 'Order Declined', color: 'red',
    message: 'Unfortunately, your payment could not be verified. Please check your email for more information or contact Climb Crux for assistance.',
  },
  cancelled: {
    emoji: '🔴', label: 'Order Declined', color: 'red',
    message: 'Unfortunately, your payment could not be verified. Please check your email for more information or contact Climb Crux for assistance.',
  },
}

export default function OrderPayment() {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const uploadRetry = searchParams.get('upload') === 'retry'

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotName, setScreenshotName] = useState('')
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => {
    if (!orderNumber) return
    setLoading(true)
    getOrderByNumber(orderNumber)
      .then(setOrder)
      .catch(() => setError('Order not found. Please check your Order ID and try again.'))
      .finally(() => setLoading(false))
  }, [orderNumber])

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0] || null
    if (!file) { setScreenshot(null); setScreenshotName(''); return }
    const okType = /\.(jpe?g|png|webp)$/i.test(file.name) || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    if (!okType) {
      setScreenshot(null); setScreenshotName('')
      setError('Please upload an image file (JPG, PNG or WebP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setScreenshot(null); setScreenshotName('')
      setError('Payment screenshot must be 10 MB or smaller')
      return
    }
    setError('')
    setScreenshot(file)
    setScreenshotName(file.name)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!screenshot) {
      setError('Please attach your payment screenshot before submitting for verification')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('payment_screenshot', screenshot)
      await submitOrderPaymentProof(order.id, fd)
      setUploaded(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Failed to submit payment proof. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
        <p style={{ color: 'var(--stone)' }}>Loading your order…</p>
      </div></section>
    )
  }

  if (error && !order) {
    return (
      <>
        <PageHeader title="Payment" />
        <section className="section">
          <div className="wrap" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3>Order not found</h3>
            <p style={{ color: 'var(--stone)', maxWidth: '40ch', margin: '8px auto 24px' }}>{error}</p>
            <Link to="/shop" className="btn btn-primary">Back to shop</Link>
          </div>
        </section>
      </>
    )
  }

  const status = uploaded ? 'pending_verification' : (order.status || 'pending_payment')
  const statusMeta = ORDER_STATUS_META[status] || ORDER_STATUS_META.pending_payment
  const needsUpload = !order.payment_screenshot_url && status === 'pending_payment'
  const total = order.total_amount || 0

  return (
    <>
      <PageHeader title={needsUpload ? 'Complete your payment.' : 'Order status.'}>
        <p>{needsUpload
          ? 'Please transfer the total amount using one of the payment methods below. After completing the payment, upload your payment screenshot for verification.'
          : 'Track the status of your equipment order below.'}</p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          <div className="op-card">
            {/* ── Status banner ── */}
            <div className={`op-status op-status--${statusMeta.color}`} role="status">
              <span className="op-status-emoji" aria-hidden="true">{statusMeta.emoji}</span>
              <div>
                <strong>{statusMeta.label}</strong>
                <p>{statusMeta.message}</p>
              </div>
            </div>

            {uploadRetry && (
              <div className="op-upload-retry" role="status">
                Your payment screenshot couldn't be uploaded when placing your order. Please try the upload below.
              </div>
            )}

            {order.decline_reason && status === 'declined' && (
              <div className="op-decline-reason">Reason: <strong>{order.decline_reason.replace(/_/g, ' ')}</strong></div>
            )}

            {/* ── Order summary ── */}
            <div className="op-summary">
              <div className="op-summary-row"><span>Order ID</span><span className="ref-code">{order.order_number}</span></div>
              <div className="op-summary-row"><span>Item</span><span>{order.product_name} × {order.quantity}</span></div>
              <div className="op-summary-row op-summary-total"><span>Total Amount</span><span>PKR {total.toLocaleString()}</span></div>
            </div>

            {error && (
              <div className="form-error-banner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            {/* ── Payment details + upload (only while payment is pending) ── */}
            {needsUpload && (
              <>
                <div className="op-methods">
                  {/* Bank Transfer */}
                  <div className={`payment-bank-info ${order.payment_method === 'bank_transfer' ? 'is-selected' : ''}`}>
                    <div className="bank-info-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="bank-detail-title">Bank Transfer Details</p>
                      <p className="bank-detail-row"><span className="bank-label">Bank:</span> Bank Al Habib Limited</p>
                      <p className="bank-detail-row"><span className="bank-label">Account name:</span> CLIMB CRUX</p>
                      <p className="bank-detail-row"><span className="bank-label">IBAN:</span> PK93 BAHL 5742 0081 0003 9501</p>
                      <p className="bank-detail-row"><span className="bank-label">Branch Code:</span> 5742</p>
                      <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
                        Please transfer <strong>PKR {total.toLocaleString()}</strong> to the account above.
                      </p>
                    </div>
                  </div>

                  {/* EasyPaisa */}
                  <div className={`payment-bank-info ${order.payment_method === 'easypaisa' ? 'is-selected' : ''}`}>
                    <div className="bank-info-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    </div>
                    <div>
                      <p className="bank-detail-title">EasyPaisa Details</p>
                      <p className="bank-detail-row"><span className="bank-label">EasyPaisa number:</span> 0313 2690377</p>
                      <p className="bank-detail-row"><span className="bank-label">Account name:</span> Saif Ud Din</p>
                      <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
                        Please send <strong>PKR {total.toLocaleString()}</strong> to the EasyPaisa account above.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Upload screenshot ── */}
                <form className="op-upload" onSubmit={handleSubmit}>
                  <h3 className="op-upload-title">Upload Payment Screenshot</h3>
                  <p className="op-upload-desc">
                    Please transfer the total amount using one of the payment methods above. After completing the
                    payment, upload your payment screenshot below. Your payment will be reviewed by the Climb Crux team.
                  </p>
                  <div className="field">
                    <input
                      id="op-screenshot"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleScreenshotChange}
                      required
                    />
                    {screenshotName ? (
                      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--orange-dark)', fontWeight: 600 }}>
                        📎 {screenshotName} attached — ready to submit
                      </p>
                    ) : (
                      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--stone)' }}>
                        JPG, PNG or WebP image · max 10 MB
                      </p>
                    )}
                  </div>
                  <div className="form-actions">
                    <Link to="/shop" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>← Back to shop</Link>
                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                      {submitting ? <><span className="btn-spinner" /> Uploading…</> : 'Upload & Submit for Verification'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── After upload / already submitted: status actions ── */}
            {!needsUpload && (
              <div className="op-actions">
                <p className="form-note" style={{ marginBottom: 12 }}>
                  {status === 'pending_verification'
                    ? 'You can track this order anytime using your Order ID on the Check Status page.'
                    : (status === 'declined' || status === 'cancelled')
                      ? 'If you believe this is a mistake or need assistance, please contact the Climb Crux team.'
                      : 'Thank you for shopping with Climb Crux!'}
                </p>
                <div className="form-actions">
                  <Link to="/shop" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>← Back to shop</Link>
                  <Link to="/check-status" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Check Order Status</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
