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

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '' })
  const [ordering, setOrdering] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

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

  // Build all images array: main imageUrl first, then additional images
  const allImages = product
    ? [product.imageUrl, ...(product.images || [])].filter(Boolean)
    : []

  // Random suggestions (exclude current product, pick up to 4)
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

  async function handleOrder(e) {
    e.preventDefault()
    if (!form.customer_name.trim() || !form.customer_phone.trim()) return
    setOrdering(true)
    try {
      const result = await placeOrder({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: 1,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_address: form.customer_address,
      })
      setOrderResult(result)
    } catch {
      alert('Failed to place order. Please try again.')
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
                <img
                  className="pd-main-image"
                  src={allImages[activeImg]}
                  alt={`${product.name} — image ${activeImg + 1}`}
                />
                {allImages.length > 1 && (
                  <button className="pd-arrow pd-arrow-right" onClick={nextImage} aria-label="Next image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                )}
                {/* Image counter */}
                <div className="pd-img-counter">
                  {activeImg + 1} / {allImages.length}
                </div>
              </div>
            ) : (
              <div className="pd-main-image-wrap pd-main-image-placeholder">
                <span className="pd-placeholder-icon">📦</span>
              </div>
            )}

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="pd-thumbnails">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${i === activeImg ? 'is-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product Info ── */}
          <div className="pd-info">
            {/* Brand & Category */}
            <div className="pd-meta">
              {product.brand && <span className="pd-brand">{product.brand}</span>}
              <span className="pd-category">{product.category}</span>
            </div>

            <h1 className="pd-title">{product.name}</h1>

            {/* Price */}
            <div className="pd-price-row">
              <span className="pd-price-current">PKR {product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="pd-price-original">PKR {product.originalPrice.toLocaleString()}</span>
              )}
            </div>

            {/* Stock */}
            <div className={`pd-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
              {product.inStock ? '✅ In Stock' : '❌ Out of Stock'}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pd-description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="pd-features">
                <h3>Key Features</h3>
                <ul>
                  {product.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buy Button */}
            <button
              className="btn btn-primary pd-buy-btn"
              disabled={!product.inStock}
              onClick={() => setShowCheckout(true)}
            >
              {product.inStock ? `Buy Now — PKR ${product.price.toLocaleString()}` : 'Sold Out'}
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
                    {sp.imageUrl ? (
                      <img src={sp.imageUrl} alt={sp.name} />
                    ) : (
                      <div className="pd-suggestion-placeholder">📦</div>
                    )}
                  </div>
                  <div className="pd-suggestion-body">
                    <span className="pd-suggestion-brand">
                      {sp.brand ? `${sp.brand} · ` : ''}{sp.category}
                    </span>
                    <h4 className="pd-suggestion-name">{sp.name}</h4>
                    <span className="pd-suggestion-price">PKR {sp.price.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Checkout Modal ── */}
      {showCheckout && !orderResult && (
        <div className="shop-modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
            <button className="shop-modal-close" onClick={() => setShowCheckout(false)}>✕</button>

            <div className="shop-modal-product">
              <div className="shop-modal-product-img">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="shop-card-image-placeholder"><span>📦</span></div>
                )}
              </div>
              <div className="shop-modal-product-info">
                <h3>{product.name}</h3>
                <div className="shop-card-price">
                  <span className="shop-card-price-current">PKR {product.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleOrder} className="shop-checkout-form">
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

              <button type="submit" className="btn btn-primary" disabled={ordering} style={{ width: '100%' }}>
                {ordering ? 'Placing order…' : `Place Order — PKR ${product.price.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Order Confirmation ── */}
      {orderResult && (
        <div className="shop-modal-overlay" onClick={() => { setShowCheckout(false); setOrderResult(null) }}>
          <div className="shop-modal shop-modal-success" onClick={(e) => e.stopPropagation()}>
            <div className="shop-success-icon">✅</div>
            <h2>Order Placed!</h2>
            <p className="shop-success-number">Order #: {orderResult.order_number}</p>
            <p style={{ color: 'var(--stone)', marginBottom: 20 }}>
              Your order has been received. Please complete payment using one of the methods below to confirm your order.
            </p>

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
              onClick={() => { setShowCheckout(false); setOrderResult(null) }}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}
