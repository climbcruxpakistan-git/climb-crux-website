import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { getProducts, placeOrder } from '../api.js'
import './Shop.css'

const ACCOUNT_DETAILS = {
  bankName: 'HBL - Habib Bank Limited',
  accountTitle: 'Climb Crux Pakistan',
  accountNumber: '1234-5678-9012-3456',
  easypaisa: '0300-1234567',
  easypaisaName: 'Climb Crux Pakistan',
}

const CATEGORIES = ['All', 'Harnesses & Belay', 'Shoes', 'Climbing Hardware', 'Accessories', 'Apparel']

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  // Checkout modal state
  const [checkout, setCheckout] = useState(null)
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', customer_address: '' })
  const [ordering, setOrdering] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory)

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))]

  function openCheckout(product) {
    setCheckout(product)
    setForm({ customer_name: '', customer_email: '', customer_phone: '', customer_address: '' })
    setOrderResult(null)
  }

  async function handleOrder(e) {
    e.preventDefault()
    if (!form.customer_name.trim()) return
    setOrdering(true)
    try {
      const result = await placeOrder({
        product_id: checkout.id,
        product_name: checkout.name,
        product_price: checkout.price,
        quantity: 1,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_address: form.customer_address,
      })
      setOrderResult(result)
    } catch (err) {
      alert('Failed to place order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  return (
    <>
      <PageHeader title="Gear up.">
        <p>
          Curated climbing equipment for the Margalla Hills — from harnesses and hardware
          to the shoes that stick the slab.
        </p>
      </PageHeader>

      {/* Category Filter */}
      <section className="section shop-filter-section">
        <div className="wrap">
          <div className="shop-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`shop-cat-btn ${activeCategory === cat ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="section shop-section">
        <div className="wrap">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading products…</p>
          ) : filtered.length === 0 ? (
            <div className="shop-empty">
              <div className="shop-empty-icon">🧗</div>
              <h3>Nothing here yet</h3>
              <p>We're stocking this category. Check back soon!</p>
            </div>
          ) : (
            <div className="shop-grid">
              {filtered.map((product) => (
                <div key={product.id} className="shop-card">
                  {/* Badges */}
                  {product.originalPrice && (
                    <span className="shop-badge shop-badge-sale">Sale</span>
                  )}
                  {product.featured && !product.originalPrice && (
                    <span className="shop-badge shop-badge-featured">Featured</span>
                  )}

                  {/* Image */}
                  <div className="shop-card-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="shop-card-image-placeholder">
                        <span>📦</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="shop-card-body">
                    <span className="shop-card-category">{product.category}</span>
                    <h3 className="shop-card-title">{product.name}</h3>

                    {product.description && (
                      <p className="shop-card-desc">{product.description}</p>
                    )}

                    {/* Features */}
                    {product.features?.length > 0 && (
                      <ul className="shop-card-features">
                        {product.features.slice(0, 3).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                        {product.features.length > 3 && (
                          <li className="shop-card-more">+{product.features.length - 3} more</li>
                        )}
                      </ul>
                    )}

                    {/* Price */}
                    <div className="shop-card-price-row">
                      <div className="shop-card-price">
                        <span className="shop-card-price-current">PKR {product.price.toLocaleString()}</span>
                        {product.originalPrice && (
                          <span className="shop-card-price-original">PKR {product.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      {!product.inStock && (
                        <span className="shop-card-out">Out of stock</span>
                      )}
                    </div>

                    {/* Buy button */}
                    <button
                      className="btn btn-primary shop-card-btn"
                      disabled={!product.inStock}
                      onClick={() => openCheckout(product)}
                    >
                      {product.inStock ? 'Buy Now' : 'Sold Out'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Checkout Modal ── */}
      {checkout && !orderResult && (
        <div className="shop-modal-overlay" onClick={() => setCheckout(null)}>
          <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
            <button className="shop-modal-close" onClick={() => setCheckout(null)}>✕</button>

            <div className="shop-modal-product">
              <div className="shop-modal-product-img">
                {checkout.imageUrl ? (
                  <img src={checkout.imageUrl} alt={checkout.name} />
                ) : (
                  <div className="shop-card-image-placeholder"><span>📦</span></div>
                )}
              </div>
              <div className="shop-modal-product-info">
                <h3>{checkout.name}</h3>
                <div className="shop-card-price">
                  <span className="shop-card-price-current">PKR {checkout.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleOrder} className="shop-checkout-form">
              <div className="shop-field">
                <label>Full name *</label>
                <input
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="shop-field">
                <label>Phone number *</label>
                <input
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="03XX-XXXXXXX"
                  required
                />
              </div>
              <div className="shop-field">
                <label>Email address</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div className="shop-field">
                <label>Delivery address</label>
                <textarea
                  value={form.customer_address}
                  onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                  placeholder="Street, city, province"
                  rows={2}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={ordering} style={{ width: '100%' }}>
                {ordering ? 'Placing order…' : `Place Order — PKR ${checkout.price.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Order Confirmation ── */}
      {orderResult && (
        <div className="shop-modal-overlay" onClick={() => { setCheckout(null); setOrderResult(null) }}>
          <div className="shop-modal shop-modal-success" onClick={(e) => e.stopPropagation()}>
            <div className="shop-success-icon">✅</div>
            <h2>Order Placed!</h2>
            <p className="shop-success-number">Order #: {orderResult.order_number}</p>
            <p style={{ color: 'var(--stone)', marginBottom: 20 }}>
              Your order has been received. Please complete payment using one of the methods below to confirm your order.
            </p>

            <div className="shop-payment-info">
              <h4>🏦 Bank Transfer</h4>
              <div className="shop-payment-detail">
                <span>Bank:</span> {ACCOUNT_DETAILS.bankName}
              </div>
              <div className="shop-payment-detail">
                <span>Title:</span> {ACCOUNT_DETAILS.accountTitle}
              </div>
              <div className="shop-payment-detail">
                <span>Account:</span> {ACCOUNT_DETAILS.accountNumber}
              </div>
            </div>

            <div className="shop-payment-info">
              <h4>📱 EasyPaisa</h4>
              <div className="shop-payment-detail">
                <span>Send to:</span> {ACCOUNT_DETAILS.easypaisa}
              </div>
              <div className="shop-payment-detail">
                <span>Name:</span> {ACCOUNT_DETAILS.easypaisaName}
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--stone)', marginTop: 16 }}>
              After sending payment, we will verify and confirm your order. You'll be contacted via phone or email.
            </p>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => { setCheckout(null); setOrderResult(null) }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}
