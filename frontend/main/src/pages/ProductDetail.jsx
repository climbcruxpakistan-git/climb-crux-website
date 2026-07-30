import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getProduct, getProducts, placeOrder } from '../api.js'
import './ProductDetail.css'

const WHATSAPP_NUMBER = '+92 313 2690377'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  // Quantity
  const [quantity, setQuantity] = useState(1)

  // Checkout flow: null | 'info' | 'payment-select' | 'bank-form' | 'easypaisa-form' | 'confirm'
  const [flow, setFlow] = useState(null)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '' })
  const [paymentMethod, setPaymentMethod] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const [error, setError] = useState('')

  // Bank transfer fields
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  // EasyPaisa fields
  const [easypaisaSender, setEasypaisaSender] = useState('')
  const [easypaisaPhone, setEasypaisaPhone] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([getProduct(id), getProducts()])
      .then(([p, all]) => {
        setProduct(p)
        setAllProducts(all)
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const totalPrice = product ? product.price * quantity : 0

  // Build all images array
  const allImages = product
    ? [product.imageUrl, ...(product.images || [])].filter(Boolean)
    : []

  // Random suggestions
  const suggestions = allProducts
    .filter((p) => p.id !== id && p.inStock)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)

  function prevImage() {
    setActiveImg((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  function nextImage() {
    setActiveImg((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  function openCheckout() {
    setFlow('info')
    setForm({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '' })
    setError('')
  }

  function handleMethodSelect(method) {
    setPaymentMethod(method)
    if (method === 'bank_transfer') setFlow('bank-form')
    if (method === 'easypaisa') setFlow('easypaisa-form')
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    setError('')
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      setError('Name and phone are required')
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
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_address: form.customer_address,
      }
      // Attach payment details based on selected method
      if (paymentMethod === 'bank_transfer') {
        orderData.payment_method = 'bank_transfer'
        orderData.payer_bank = bankName
        orderData.payer_name = accountHolder
      } else if (paymentMethod === 'easypaisa') {
        orderData.payment_method = 'easypaisa'
        orderData.payer_name = easypaisaSender
        orderData.payer_phone = easypaisaPhone
      }
      const result = await placeOrder(orderData)
      setOrderResult(result)
      setFlow(null)
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
          <p style={{ color: 'var(--stone)' }}>Loading product…</p>
        </div>
      </section>
    )
  }

  if (!product) return null

  return (
    <>
      <PageHeader title={product.name}>
        <p>
          {product.brand ? `${product.brand} · ` : ''}{product.category}
        </p>
      </PageHeader>

      <section className="section pd-section">
        <div className="wrap pd-layout">
          {/* ── Left: Image Gallery ── */}
          <div className="pd-gallery">
            {allImages.length > 0 ? (
              <div className="pd-main-image-wrap">
                {allImages.length > 1 && (
                  <button className="pd-arrow pd-arrow-left" onClick={prevImage} aria-label="Previous image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                )}
                <img className="pd-main-image" src={allImages[activeImg]} alt={`${product.name} — image ${activeImg + 1}`} />
                {allImages.length > 1 && (
                  <button className="pd-arrow pd-arrow-right" onClick={nextImage} aria-label="Next image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                )}
                <div className="pd-img-counter">{activeImg + 1} / {allImages.length}</div>
              </div>
            ) : (
              <div className="pd-main-image-wrap pd-main-image-placeholder">
                <span className="pd-placeholder-icon">📦</span>
              </div>
            )}
            {allImages.length > 1 && (
              <div className="pd-thumbnails">
                {allImages.map((img, i) => (
                  <button key={i} className={`pd-thumb ${i === activeImg ? 'is-active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={img} alt={`Thumbnail ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product Info + Buy ── */}
          <div className="pd-info">
            <div className="pd-meta">
              {product.brand && <span className="pd-brand">{product.brand}</span>}
              <span className="pd-category">{product.category}</span>
              {product.sku && <span className="pd-sku">SKU: {product.sku}</span>}
            </div>

            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-price-row">
              <span className="pd-price-current">PKR {product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="pd-price-original">PKR {product.originalPrice.toLocaleString()}</span>
                  <span className="pd-discount-badge">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* ── Stock Status ── */}
            {(() => {
              const status = product.stockStatus || (product.inStock ? 'in_stock' : 'out_of_stock')
              const labels = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', backorder: 'Backorder' }
              const icons = { in_stock: '✅', low_stock: '⚠️', out_of_stock: '❌', backorder: '📦' }
              return (
                <div className={`pd-stock pd-stock-${status}`}>
                  <span>{icons[status] || '❓'} {labels[status]}</span>
                  {product.stockQuantity !== undefined && status !== 'out_of_stock' && (
                    <span className="pd-stock-qty">{product.stockQuantity} available</span>
                  )}
                </div>
              )
            })()}

            {product.description && (
              <div className="pd-description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {product.features?.length > 0 && (
              <div className="pd-features">
                <h3>Key Features</h3>
                <ul>
                  {product.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {/* ── Variants ── */}
            {product.variants?.length > 0 && (
              <div className="pd-variants-section">
                <h3>Available Options</h3>
                {Object.entries(
                  product.variants.reduce((groups, v) => {
                    if (!groups[v.name]) groups[v.name] = []
                    groups[v.name].push(v)
                    return groups
                  }, {})
                ).map(([groupName, options]) => (
                  <div key={groupName} className="pd-variant-group">
                    <span className="pd-variant-label">{groupName}</span>
                    <div className="pd-variant-options">
                      {options.map((v, i) => (
                        <span key={i} className="pd-variant-chip" title={v.sku ? `SKU: ${v.sku}` : ''}>
                          {v.value}
                          {v.price && <span className="pd-variant-price">+PKR {v.price.toLocaleString()}</span>}
                          {v.stockQuantity <= 0 && <span className="pd-variant-oos">(unavailable)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Specifications ── */}
            {product.specifications?.length > 0 && (
              <div className="pd-specs">
                <h3>Specifications</h3>
                <table className="pd-specs-table">
                  <tbody>
                    {product.specifications.map((s, i) => (
                      <tr key={i}>
                        <td className="pd-spec-key">{s.key}</td>
                        <td className="pd-spec-value">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Shipping, Warranty, Returns Cards ── */}
            {(product.shipping?.deliveryTime || product.warranty?.period || product.returns?.window) && (
              <div className="pd-policy-cards">
                {product.shipping?.deliveryTime && (
                  <div className="pd-policy-card">
                    <div className="pd-policy-icon">🚚</div>
                    <div className="pd-policy-text">
                      <span className="pd-policy-label">Shipping</span>
                      <span className="pd-policy-value">{product.shipping.deliveryTime}</span>
                      {product.shipping.freeShipping && <span className="pd-policy-badge">Free</span>}
                    </div>
                  </div>
                )}
                {product.warranty?.period && (
                  <div className="pd-policy-card">
                    <div className="pd-policy-icon">🛡️</div>
                    <div className="pd-policy-text">
                      <span className="pd-policy-label">Warranty</span>
                      <span className="pd-policy-value">{product.warranty.period}</span>
                      {product.warranty.details && <span className="pd-policy-detail">{product.warranty.details}</span>}
                    </div>
                  </div>
                )}
                {product.returns?.window && (
                  <div className="pd-policy-card">
                    <div className="pd-policy-icon">↩️</div>
                    <div className="pd-policy-text">
                      <span className="pd-policy-label">Returns</span>
                      <span className="pd-policy-value">{product.returns.window}</span>
                      {product.returns.policy && <span className="pd-policy-detail">{product.returns.policy}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Quantity Selector ── */}
            {product.inStock && (
              <div className="pd-qty-row">
                <span className="pd-qty-label">Quantity</span>
                <div className="pd-qty-selector">
                  <button className="pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
                  <span className="pd-qty-value">{quantity}</span>
                  <button className="pd-qty-btn" onClick={() => setQuantity(Math.min(10, quantity + 1))} disabled={quantity >= 10}>+</button>
                </div>
              </div>
            )}

            {/* ── Total Price ── */}
            <div className="pd-total-row">
              <span className="pd-total-label">Total</span>
              <span className="pd-total-amount">PKR {totalPrice.toLocaleString()}</span>
            </div>

            {/* ── Buy Button ── */}
            <button className="btn btn-primary pd-buy-btn" disabled={!product.inStock} onClick={openCheckout}>
              {product.inStock ? `Buy Now — PKR ${totalPrice.toLocaleString()}` : 'Sold Out'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Random Suggestions ── */}
      {suggestions.length > 0 && (
        <section className="section pd-suggestions-section">
          <div className="wrap">
            <h2 className="pd-suggestions-title">You might also like</h2>
            <div className="pd-suggestions-grid">
              {suggestions.map((sp) => (
                <Link to={`/shop/${sp.id}`} key={sp.id} className="pd-suggestion-card">
                  <div className="pd-suggestion-img">
                    {sp.imageUrl ? <img src={sp.imageUrl} alt={sp.name} /> : <div className="pd-suggestion-placeholder">📦</div>}
                  </div>
                  <div className="pd-suggestion-body">
                    <span className="pd-suggestion-brand">{sp.brand ? `${sp.brand} · ` : ''}{sp.category}</span>
                    <h4 className="pd-suggestion-name">{sp.name}</h4>
                    <span className="pd-suggestion-price">PKR {sp.price.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CHECKOUT FLOW MODAL ── */}
      {flow && !orderResult && (
        <div className="shop-modal-overlay" onClick={() => { setFlow(null); setError('') }}>
          <div className="shop-modal shop-modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="shop-modal-close" onClick={() => { setFlow(null); setError('') }}>✕</button>

            {/* ── Step: Customer Info ── */}
            {flow === 'info' && (
              <>
                <div className="shop-modal-product" style={{ marginBottom: 20 }}>
                  <div className="shop-modal-product-img">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="shop-card-image-placeholder"><span>📦</span></div>}
                  </div>
                  <div className="shop-modal-product-info">
                    <h3>{product.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="shop-card-price-current">PKR {product.price.toLocaleString()}</span>
                      <span style={{ color: 'var(--stone)', fontSize: '0.82rem' }}>× {quantity}</span>
                      <span style={{ fontWeight: 700, color: 'var(--orange-dark)', fontSize: '1.1rem' }}>= PKR {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {error && <div className="form-error-banner">{error}</div>}

                <div className="shop-checkout-form">
                  <div className="shop-field">
                    <label>Full name *</label>
                    <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Your name" required />
                  </div>
                  <div className="shop-field">
                    <label>Phone number *</label>
                    <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="03XX-XXXXXXX" required />
                  </div>
                  <div className="shop-field">
                    <label>Email address</label>
                    <input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} placeholder="your@email.com" />
                  </div>
                  <div className="shop-field">
                    <label>Delivery address</label>
                    <textarea value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} placeholder="Street, city, province" rows={2} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setError(''); setFlow('payment-select') }}>
                    Continue to Payment →
                  </button>
                </div>
              </>
            )}

            {/* ── Step: Payment Method Selection ── */}
            {flow === 'payment-select' && (
              <>
                <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16, fontSize: '1rem' }}>
                  Choose payment method
                </h3>

                <div className="payment-method-grid">
                  <div className={`payment-method-card ${paymentMethod === 'bank_transfer' ? 'is-selected' : ''}`} onClick={() => handleMethodSelect('bank_transfer')}>
                    <div className="payment-method-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </div>
                    <span className="payment-method-label">Bank Transfer</span>
                    <div className="payment-method-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                  </div>
                  <div className={`payment-method-card ${paymentMethod === 'easypaisa' ? 'is-selected' : ''}`} onClick={() => handleMethodSelect('easypaisa')}>
                    <div className="payment-method-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                    </div>
                    <span className="payment-method-label">EasyPaisa</span>
                    <div className="payment-method-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                  </div>
                  <div className="payment-method-card" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <div className="payment-method-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                    </div>
                    <span className="payment-method-label">Credit / Debit Card<span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.6, marginTop: 2 }}>Coming soon</span></span>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-outline" onClick={() => setFlow('info')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!paymentMethod}
                    onClick={() => { if (paymentMethod === 'bank_transfer') setFlow('bank-form'); if (paymentMethod === 'easypaisa') setFlow('easypaisa-form') }}>
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* ── Step: Bank Transfer Details ── */}
            {flow === 'bank-form' && (
              <form onSubmit={handlePlaceOrder}>
                <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16, fontSize: '1rem' }}>Bank Transfer Details</h3>

                <div className="payment-bank-info">
                  <div className="bank-info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="bank-detail-title">Transfer to our bank account</p>
                    <p className="bank-detail-row"><span className="bank-label">Bank:</span> Bank Al Habib Limited</p>
                    <p className="bank-detail-row"><span className="bank-label">Account name:</span> CLIMB CRUX</p>
                    <p className="bank-detail-row"><span className="bank-label">IBAN:</span> PK93 BAHL 5742 0081 0003 9501</p>
                    <p className="bank-detail-row"><span className="bank-label">Branch Code:</span> 5742</p>
                    <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
                      Please transfer <strong>PKR {totalPrice.toLocaleString()}</strong> to the account above.
                    </p>
                    <div style={{ marginTop: 12, padding: 12, background: '#fef7ed', border: '1px solid #fde4c8', borderRadius: 8 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--stone-dark)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--orange-dark)' }}>📤 After sending the payment</strong>, please send the payment proof/screenshot to
                        our WhatsApp at <strong style={{ color: 'var(--orange-dark)' }}>{WHATSAPP_NUMBER}</strong> for verification along with your order number.
                        Your order will only be confirmed once the payment is verified.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label>Sender bank name</label>
                  <input type="text" placeholder="e.g. HBL, Meezan Bank, UBL" required value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Account holder name</label>
                  <input type="text" placeholder="Name on the account used for payment" required value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                </div>

                {error && <div className="form-error-banner">{error}</div>}

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setFlow('payment-select')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                  <button type="submit" className="btn btn-primary" disabled={ordering} style={{ flex: 1, justifyContent: 'center' }}>
                    {ordering ? <><span className="btn-spinner" /> Placing Order…</> : `Place Order — PKR ${totalPrice.toLocaleString()}`}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step: EasyPaisa Details ── */}
            {flow === 'easypaisa-form' && (
              <form onSubmit={handlePlaceOrder}>
                <h3 className="summary-title" style={{ color: 'var(--charcoal)', marginBottom: 16, fontSize: '1rem' }}>EasyPaisa Transfer Details</h3>

                <div className="payment-bank-info">
                  <div className="bank-info-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                  </div>
                  <div>
                    <p className="bank-detail-title">Send payment via EasyPaisa</p>
                    <p className="bank-detail-row"><span className="bank-label">EasyPaisa number:</span> 0313 2690377</p>
                    <p className="bank-detail-row"><span className="bank-label">Account name:</span> Saif Ud Din</p>
                    <p className="bank-detail-row" style={{ marginTop: 8, fontWeight: 500, color: 'var(--orange-dark)' }}>
                      Please send <strong>PKR {totalPrice.toLocaleString()}</strong> to the EasyPaisa account above.
                    </p>
                    <div style={{ marginTop: 12, padding: 12, background: '#fef7ed', border: '1px solid #fde4c8', borderRadius: 8 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--stone-dark)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--orange-dark)' }}>📤 After sending the payment</strong>, please send the payment proof/screenshot to
                        our WhatsApp at <strong style={{ color: 'var(--orange-dark)' }}>{WHATSAPP_NUMBER}</strong> for verification along with your order number.
                        Your order will only be confirmed once the payment is verified.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label>Sender name</label>
                  <input type="text" placeholder="Your full name" required value={easypaisaSender} onChange={(e) => setEasypaisaSender(e.target.value)} />
                </div>
                <div className="field">
                  <label>Phone number</label>
                  <input type="tel" placeholder="03XX-XXXXXXX" required value={easypaisaPhone} onChange={(e) => setEasypaisaPhone(e.target.value)} />
                </div>

                {error && <div className="form-error-banner">{error}</div>}

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setFlow('payment-select')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                  <button type="submit" className="btn btn-primary" disabled={ordering} style={{ flex: 1, justifyContent: 'center' }}>
                    {ordering ? <><span className="btn-spinner" /> Placing Order…</> : `Place Order — PKR ${totalPrice.toLocaleString()}`}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ── Order Confirmation ── */}
      {orderResult && (
        <div className="shop-modal-overlay" onClick={() => { setOrderResult(null); setFlow(null) }}>
          <div className="shop-modal shop-modal--wide shop-modal-success" onClick={(e) => e.stopPropagation()}>
            <div className="shop-success-icon">✅</div>
            <h2>Order Placed!</h2>
            <p className="shop-success-number">Order #: {orderResult.order_number}</p>
            <p style={{ color: 'var(--stone)', marginBottom: 20 }}>
              Your order has been received. Please complete payment using one of the methods below to confirm your order.
            </p>

            <div className="pd-confirm-summary" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Item</div>
                <div style={{ fontWeight: 600 }}>{product.name}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Qty</div>
                <div style={{ fontWeight: 600 }}>{quantity}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                <div style={{ fontWeight: 700, color: 'var(--orange-dark)' }}>PKR {totalPrice.toLocaleString()}</div>
              </div>
            </div>

            <div className="shop-payment-info">
              <h4>🏦 Bank Transfer</h4>
              <div className="shop-payment-detail"><span>Bank:</span> Bank Al Habib Limited</div>
              <div className="shop-payment-detail"><span>Title:</span> CLIMB CRUX</div>
              <div className="shop-payment-detail"><span>IBAN:</span> PK93 BAHL 5742 0081 0003 9501</div>
            </div>

            <div className="shop-payment-info">
              <h4>📱 EasyPaisa</h4>
              <div className="shop-payment-detail"><span>Send to:</span> 0313 2690377</div>
              <div className="shop-payment-detail"><span>Name:</span> Saif Ud Din</div>
            </div>

            <div style={{ marginTop: 12, padding: 12, background: '#fef7ed', border: '1px solid #fde4c8', borderRadius: 8, textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--stone-dark)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--orange-dark)' }}>📤 After sending the payment</strong>, please send the payment proof/screenshot to
                our WhatsApp at <strong style={{ color: 'var(--orange-dark)' }}>{WHATSAPP_NUMBER}</strong> for verification along with your order number.
                Your order will only be confirmed once the payment is verified.
              </p>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}
              onClick={() => { setOrderResult(null); setFlow(null) }}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}
