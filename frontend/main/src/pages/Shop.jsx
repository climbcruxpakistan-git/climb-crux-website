import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getProducts, optimizeImage } from '../api.js'
import './Shop.css'

export default function Shop() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    document.title = 'Shop — Climb Crux Pakistan'
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory)

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))]

  // Product recommendations: top 4 featured products (excluding current set)
  const recommended = useMemo(() => {
    const shown = new Set(filtered.map((p) => p.id))
    return products
      .filter((p) => !shown.has(p.id) && p.status !== 'draft' && p.status !== 'archived')
      .slice(0, 4)
  }, [products, filtered])

  const stockLabels = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', backorder: 'Backorder' }

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
                <div
                  key={product.id}
                  className="shop-card"
                  onClick={() => navigate(`/shop/${product.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/shop/${product.id}`) }}
                >
                  {/* Badges */}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="shop-badge shop-badge-sale">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                  {(product.stockStatus === 'low_stock') && (
                    <span className="shop-badge shop-badge-low-stock">Low Stock</span>
                  )}
                  {product.featured && (!product.originalPrice || product.originalPrice <= product.price) && (
                    <span className="shop-badge shop-badge-featured">Featured</span>
                  )}

                  {/* Image */}
                  <div className="shop-card-image">
                    {product.imageUrl || product.images?.[0] ? (
                      <img src={optimizeImage(product.imageUrl || product.images[0], 400)} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="shop-card-image-placeholder">
                        <span>📦</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="shop-card-body">
                    <h3 className="shop-card-title">{product.name}</h3>



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
                        {product.originalPrice && product.originalPrice > product.price && (
                          <>
                            <span className="shop-card-price-original">PKR {product.originalPrice.toLocaleString()}</span>
                            <span className="shop-card-discount-pct">
                              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                      {(() => {
                        const status = product.stockStatus || (product.inStock ? 'in_stock' : 'out_of_stock')
                        const labels = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', backorder: 'Backorder' }
                        const colors = { in_stock: 'badge-green', low_stock: 'badge-yellow', out_of_stock: 'badge-red', backorder: 'badge-blue' }
                        if (status === 'in_stock' && !product.lowStockThreshold) return null
                        return (
                          <span className={`shop-card-out ${colors[status] || ''}`}>{labels[status] || (product.inStock ? 'In Stock' : 'Out')}</span>
                        )
                      })()}
                    </div>

                    {/* Estimated Delivery */}
                    {product.shipping?.deliveryTime && (
                      <div className="shop-card-delivery">
                        <span>🚚</span> {product.shipping.deliveryTime}
                        {product.shipping.freeShipping ? ' · Free' : ''}
                      </div>
                    )}

                    {/* Buy button navigates to detail page */}
                    <div
                      className="btn btn-primary shop-card-btn"
                      style={{ textAlign: 'center', pointerEvents: 'none', opacity: product.inStock ? 1 : 0.4 }}
                    >
                      {product.inStock ? 'Buy Now' : 'Sold Out'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Product Recommendations ── */}
      {recommended.length > 0 && !loading && (
        <section className="section shop-section">
          <div className="wrap">
            <h2 className="pd-section-title">You might also like</h2>
            <div className="shop-grid">
              {recommended.map((product) => (
                <div
                  key={product.id}
                  className="shop-card"
                  onClick={() => navigate(`/shop/${product.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/shop/${product.id}`) }}
                >
                  {(product.stockStatus === 'low_stock') && (
                    <span className="shop-badge shop-badge-low-stock">Low Stock</span>
                  )}
                  <div className="shop-card-image">
                    {product.imageUrl || product.images?.[0] ? (
                      <img src={optimizeImage(product.imageUrl || product.images[0], 400)} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="shop-card-image-placeholder"><span>📦</span></div>
                    )}
                  </div>
                  <div className="shop-card-body">
                    <h3 className="shop-card-title">{product.name}</h3>
                    <div className="shop-card-price">
                      <span className="shop-card-price-current">PKR {product.price.toLocaleString()}</span>
                    </div>
                    <div className="btn btn-primary shop-card-btn" style={{ textAlign: 'center', pointerEvents: 'none', opacity: product.inStock ? 1 : 0.4 }}>
                      {product.inStock ? 'View Details' : 'Sold Out'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
