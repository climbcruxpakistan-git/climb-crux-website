import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getProducts } from '../api.js'
import './Shop.css'

export default function Shop() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

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
                    <span className="shop-card-category">
                      {product.brand ? `${product.brand} · ` : ''}{product.category}
                    </span>
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
    </>
  )
}
