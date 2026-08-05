import { useState, useEffect } from 'react'
import { getProduct, placeOrder, submitOrderPaymentProof, optimizeImage } from '../../lib/api'

/**
 * Parse JSON-stringified initial data from Astro page props.
 * Falls back to null if parsing fails.
 */
function jsonParse(str) {
  try { return str ? JSON.parse(str) : null } catch { return null }
}

function initialQty() {
  const params = new URLSearchParams(window.location.search)
  const qty = parseInt(params.get('qty') || '1', 10)
  return Number.isFinite(qty) ? Math.min(10, Math.max(1, qty)) : 1
}

export default function Checkout({ id, initialProduct }) {
  const parsedInitialProduct = jsonParse(initialProduct)

  const [product, setProduct] = useState(parsedInitialProduct)
  const [loading, setLoading] = useState(!parsedInitialProduct)
  const [quantity, setQuantity] = useState(() => initialQty())

  // Customer info
  const [checkoutForm, setCheckoutForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '' })

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [easypaisaSender, setEasypaisaSender] = useState('')
  const [easypaisaPhone, setEasypaisaPhone] = useState('')

  // Payment screenshot — captured on this page once a method is chosen
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotName, setScreenshotName] = useState('')

  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState('')

  // Hydrate: fetch fresh data on mount for stock/pricing updates
  useEffect(() => {
    if (parsedInitialProduct) {
      getProduct(id)
        .then(setProduct)
        .catch(() => {})
      return
    }
    setLoading(true)
    getProduct(id)
      .then(setProduct)
      .catch(() => { window.location.href = '/shop' })
      .finally(() => setLoading(false))
  }, [id])

  const totalPrice = product ? product.price * quantity : 0
  const maxQty = product ? Math.min(10, product.stockQuantity ?? 10) : 10
  const imageUrl = product ? (product.imageUrl || product.images?.[0]) : null

  function handleMethodSelect(method) {
    setPaymentMethod(method)
    setError('')
  }

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

  function renderScreenshotUpload() {
    return (
      <div className="co-upload">
        <div className="co-upload-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Upload payment screenshot</span>
        </div>
        <p className="co-upload-desc">
          After completing the transfer, attach your payment screenshot below. It will be reviewed by the Climb Crux team.
        </p>
        <div className="field">
          <input
            id="co-screenshot"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleScreenshotChange}
            required
          />
          {screenshotName ? (
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--orange-dark)', fontWeight: 600 }}>
              📎 {screenshotName} attached — will be submitted with your order
            </p>
          ) : (
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--stone)' }}>
              JPG, PNG or WebP image · max 10 MB
            </p>
          )}
        </div>
      </div>
    )
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    setError('')
    if (!checkoutForm.customer_name.trim() || !checkoutForm.customer_phone.trim()) {
      setError('Name and phone number are required')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!paymentMethod) {
      setError('Please choose a payment method')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!screenshot) {
      setError('Please attach your payment screenshot before placing your order')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setOrdering(true)
    try {
      const orderData = {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity,
        total_amount: totalPrice,
        customer_name: checkoutForm.customer_name,
        customer_email: checkoutForm.customer_email,
        customer_phone: checkoutForm.customer_phone,
        customer_address: checkoutForm.customer_address,
      }
      if (paymentMethod === 'bank_transfer') {
        orderData.payment_method = 'bank_transfer'
        orderData.payer_bank = bankName
        orderData.payer_name = accountHolder
      } else if (paymentMethod === 'easypaisa') {
        orderData.payment_method = 'easypaisa'
        orderData.payer_name = easypaisaSender
        orderData.payer_phone = easypaisaPhone
      }
      // Create the order, then upload the payment screenshot straight away so
      // the order moves to Verification Pending in one step.
      const result = await placeOrder(orderData)
      let uploadFailed = false
      try {
        const fd = new FormData()
        fd.append('payment_screenshot', screenshot)
        await submitOrderPaymentProof(result.id, fd)
      } catch (uploadErr) {
        // Screenshot upload failed — the order is still Payment Pending and
        // the payment page will let the customer retry the upload.
        uploadFailed = true
        console.error('Payment screenshot upload failed:', uploadErr)
      }
      window.location.href = `/shop/orders/${encodeURIComponent(result.order_number)}/payment${uploadFailed ? '?upload=retry' : ''}`
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
        <p style={{ color: 'var(--stone)' }}>Loading checkout…</p>
      </div></section>
    )
  }

  if (!product) return null

  return (
    <section className="section">
      <div className="wrap">
        {!product.inStock && (
          <div className="form-error-banner" style={{ maxWidth: 860, margin: '0 auto 24px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            This product is currently out of stock. You can still add your details, but the order can't be completed right now.
          </div>
        )}

        {error && (
          <div className="form-error-banner" style={{ maxWidth: 860, margin: '0 auto 24px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        <form className="checkout-grid" onSubmit={handlePlaceOrder}>
          {/* ── LEFT: Form ── */}
          <div className="checkout-form-col">
            {/* Step 1: Your information */}
            <div className="co-card">
              <h3 className="co-card-title"><span className="co-step-num">1</span> Your information</h3>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="co-name">Full name *</label>
                  <input id="co-name" type="text" placeholder="Your name" required autoComplete="name"
                    value={checkoutForm.customer_name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="co-phone">Phone number *</label>
                  <input id="co-phone" type="tel" placeholder="03XX-XXXXXXX" required autoComplete="tel"
                    value={checkoutForm.customer_phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_phone: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="co-email">Email address</label>
                <input id="co-email" type="email" placeholder="your@email.com" autoComplete="email"
                  value={checkoutForm.customer_email}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_email: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="co-address">Delivery address</label>
                <textarea id="co-address" rows={2} placeholder="Street, city, province" autoComplete="street-address"
                  value={checkoutForm.customer_address}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_address: e.target.value })} />
              </div>
            </div>

            {/* Step 2: Payment */}
            <div className="co-card">
              <h3 className="co-card-title"><span className="co-step-num">2</span> Payment method</h3>
              <div className="payment-method-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div
                  className={`payment-method-card ${paymentMethod === 'bank_transfer' ? 'is-selected' : ''}`}
                  onClick={() => handleMethodSelect('bank_transfer')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMethodSelect('bank_transfer') }}
                >
                  <div className="payment-method-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <span className="payment-method-label">Bank Transfer</span>
                  <div className="payment-method-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>
                <div
                  className={`payment-method-card ${paymentMethod === 'easypaisa' ? 'is-selected' : ''}`}
                  onClick={() => handleMethodSelect('easypaisa')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMethodSelect('easypaisa') }}
                >
                  <div className="payment-method-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <span className="payment-method-label">EasyPaisa</span>
                  <div className="payment-method-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>
              </div>

              {paymentMethod === 'bank_transfer' && (
                <div className="co-pay-panel">
                  <div className="payment-bank-info">
                    <div className="bank-info-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="bank-detail-title">Transfer to our bank account</p>
                      <p className="bank-detail-row"><span className="bank-label">Bank:</span> Bank Al Habib Limited</p>
                      <p className="bank-detail-row"><span className="bank-label">Account name:</span> CLIMB CRUX</p>
                      <p className="bank-detail-row"><span className="bank-label">IBAN:</span> PK93 BAHL 5742 0081 0003 9501</p>
                      <p className="bank-detail-row"><span className="bank-label">Branch Code:</span> 5742</p>                        <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
                          Please transfer <strong>PKR {totalPrice.toLocaleString()}</strong> to the account above.
                        </p>
                        <div className="co-proof-note">
                          <p><strong style={{ color: 'var(--orange-dark)' }}>📤 After sending</strong>, attach your payment screenshot below for verification.</p>
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label htmlFor="co-bank-name">Sender bank name</label>
                        <input id="co-bank-name" type="text" placeholder="e.g. HBL, Meezan Bank, UBL" required
                          value={bankName} onChange={(e) => setBankName(e.target.value)} />
                      </div>
                      <div className="field">
                        <label htmlFor="co-account-holder">Account holder name</label>
                        <input id="co-account-holder" type="text" placeholder="Name on the account" required
                          value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

              {paymentMethod === 'easypaisa' && (
                <div className="co-pay-panel">
                  <div className="payment-bank-info">
                    <div className="bank-info-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    </div>
                    <div>
                      <p className="bank-detail-title">Send payment via EasyPaisa</p>
                      <p className="bank-detail-row"><span className="bank-label">EasyPaisa number:</span> 0313 2690377</p>
                      <p className="bank-detail-row"><span className="bank-label">Account name:</span> Saif Ud Din</p>                        <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
                          Please send <strong>PKR {totalPrice.toLocaleString()}</strong> to the EasyPaisa account above.
                        </p>
                        <div className="co-proof-note">
                          <p><strong style={{ color: 'var(--orange-dark)' }}>📤 After sending</strong>, attach your payment screenshot below for verification.</p>
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label htmlFor="co-easypaisa-sender">Sender name</label>
                        <input id="co-easypaisa-sender" type="text" placeholder="Your full name" required
                          value={easypaisaSender} onChange={(e) => setEasypaisaSender(e.target.value)} />
                      </div>
                      <div className="field">
                        <label htmlFor="co-easypaisa-phone">Phone number</label>
                        <input id="co-easypaisa-phone" type="tel" placeholder="03XX-XXXXXXX" required
                          value={easypaisaPhone} onChange={(e) => setEasypaisaPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

              {!paymentMethod && (
                <p className="form-note" style={{ marginTop: 4 }}>Select a payment method to see the transfer details.</p>
              )}

              {paymentMethod && renderScreenshotUpload()}

              <div className="form-actions">
                <a href={`/shop/${id}`} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>← Back to product</a>
                <button type="submit" className="btn btn-primary" disabled={ordering || !product.inStock} style={{ flex: 1, justifyContent: 'center' }}>
                  {ordering ? <><span className="btn-spinner" /> Placing Order…</> : `Place Order — PKR ${totalPrice.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order summary ── */}
          <aside className="co-summary">
            <h3 className="co-summary-title">Order summary</h3>
            <div className="co-summary-product">
              <div className="co-summary-img">
                {imageUrl ? (
                  <img src={optimizeImage(imageUrl, 150)} alt={product.name} />
                ) : (
                  <span>📦</span>
                )}
              </div>
              <div className="co-summary-info">
                <span className="co-summary-name">{product.name}</span>
                <span className="co-summary-price">PKR {product.price.toLocaleString()} each</span>
              </div>
            </div>

            <div className="co-summary-qty">
              <span className="co-summary-label">Quantity</span>
              <div className="co-qty-selector">
                <button type="button" className="co-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
                <span className="co-qty-value">{quantity}</span>
                <button type="button" className="co-qty-btn" onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} disabled={quantity >= maxQty}>+</button>
              </div>
            </div>

            <div className="co-summary-line"><span>Subtotal</span><span>PKR {totalPrice.toLocaleString()}</span></div>
            {product.shipping?.deliveryTime && (
              <div className="co-summary-line co-summary-muted"><span>Delivery</span><span>{product.shipping.deliveryTime}{product.shipping.freeShipping ? ' · Free' : ''}</span></div>
            )}

            <div className="co-summary-total">
              <span>Total</span>
              <span>PKR {totalPrice.toLocaleString()}</span>
            </div>

            <div className="co-summary-badges">
              <span>🔒 Secure checkout</span>
              {product.shipping?.freeShipping && <span>🚚 Free shipping</span>}
            </div>
          </aside>
        </form>
      </div>
    </section>
  )
}
