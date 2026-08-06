import { useState, useEffect, useMemo } from 'react'
import { getProducts, optimizeImage } from '../../lib/api'

// Relevance score for shop search: every word of the query must match
// somewhere across the product's fields (AND semantics for multi-word
// queries). Name matches rank highest, then category/SKU, then
// features/description. Returns 0 when any word matches nowhere.
function searchScore(p, query) {
  const name = (p.name || '').toLowerCase()
  const category = (p.category || '').toLowerCase()
  const sku = (p.sku || '').toLowerCase()
  const extras = [
    p.description,
    ...(p.features || []),
    ...(p.specifications || []).map((s) => `${s.key} ${s.value}`),
    ...(p.variants || []).map((v) => `${v.name} ${v.value} ${v.sku}`),
  ].join(' ').toLowerCase()

  let score = 0
  for (const word of query.split(/\s+/).filter(Boolean)) {
    let s = 0
    if (name.startsWith(word)) s += 5
    if (name.includes(word)) s += 3
    if (category.includes(word)) s += 2
    if (sku.includes(word)) s += 2
    if (extras.includes(word)) s += 1
    if (s === 0) return 0 // this word matched nowhere → product doesn't match
    score += s
  }
  return score
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Search term + category live in the URL (?q=…&cat=…) so they're shareable.
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('q') || ''
  })

  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window === 'undefined') return 'All'
    return new URLSearchParams(window.location.search).get('cat') || 'All'
  })

  const [minPrice, setMinPrice] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('min') || ''
  })

  const [maxPrice, setMaxPrice] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('max') || ''
  })

  const [sortBy, setSortBy] = useState(() => {
    if (typeof window === 'undefined') return 'featured'
    const value = new URLSearchParams(window.location.search).get('sort')
    return ['featured', 'price-asc', 'price-desc', 'newest'].includes(value) ? value : 'featured'
  })

  useEffect(() => {
    document.title = 'Shop — Climb Crux Pakistan'
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Keep the ?q=, ?cat=, ?min=, ?max= and ?sort= URL params in sync (without adding history entries).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (searchQuery.trim()) params.set('q', searchQuery)
    else params.delete('q')
    if (activeCategory && activeCategory !== 'All') params.set('cat', activeCategory)
    else params.delete('cat')
    if (minPrice) params.set('min', minPrice)
    else params.delete('min')
    if (maxPrice) params.set('max', maxPrice)
    else params.delete('max')
    if (sortBy && sortBy !== 'featured') params.set('sort', sortBy)
    else params.delete('sort')
    const next = params.toString()
    const nextSearch = next ? `?${next}` : ''
    if (window.location.search !== nextSearch) {
      window.history.replaceState(null, '', nextSearch || window.location.pathname)
    }
  }, [searchQuery, activeCategory, minPrice, maxPrice, sortBy])

  const query = searchQuery.trim().toLowerCase()
  const minNum = parseFloat(minPrice)
  const maxNum = parseFloat(maxPrice)
  const hasActiveFilters = query || activeCategory !== 'All' || Number.isFinite(minNum) || Number.isFinite(maxNum)

  // Category + price filter first, then sort. Relevance-sort applies only in the
  // default "featured" order when searching; original order otherwise.
  const filtered = products
    .filter((p) => activeCategory === 'All' || p.category === activeCategory)
    .filter((p) => (!Number.isFinite(minNum) || p.price >= minNum) && (!Number.isFinite(maxNum) || p.price <= maxNum))
    .map((p, index) => ({ p, index, score: query ? searchScore(p, query) : 0 }))
    .filter(({ score }) => !query || score > 0)
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.p.price - b.p.price || a.index - b.index
      if (sortBy === 'price-desc') return b.p.price - a.p.price || a.index - b.index
      if (sortBy === 'newest') {
        const ta = a.p.createdAt || ''
        const tb = b.p.createdAt || ''
        return (tb < ta ? -1 : tb > ta ? 1 : a.index - b.index)
      }
      // Featured: relevance when searching, original order otherwise.
      return (query ? b.score - a.score : 0) || a.index - b.index
    })
    .map(({ p }) => p)

  // Reset every filter (search, category, price, sort) from the empty state.
  const clearAllFilters = () => {
    setSearchQuery('')
    setActiveCategory('All')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('featured')
    document.querySelector('.shop-search-input')?.focus()
  }

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))]

  const recommended = useMemo(() => {
    const shown = new Set(filtered.map((p) => p.id))
    return products
      .filter((p) => !shown.has(p.id) && p.status !== 'draft' && p.status !== 'archived')
      .slice(0, 4)
  }, [products, filtered])

  function navigate(id) {
    window.location.href = `/shop/${id}`
  }

  return (
    <>
      <section className="section shop-filter-section">
        <div className="wrap">
          <div className="shop-search" role="search">
            <svg className="shop-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className="shop-search-input"
              placeholder="Search equipment, e.g. harness, rope, carabiner…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
            {query && (
              <button type="button" className="shop-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
            )}
          </div>
          <div className="shop-toolbar">
            <div className="shop-price-filter">
              <span className="shop-price-label">Price</span>
              <div className="shop-price-range">
                <input
                  type="number"
                  min="0"
                  className="shop-price-input"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  aria-label="Minimum price"
                />
                <span className="shop-price-dash">—</span>
                <input
                  type="number"
                  min="0"
                  className="shop-price-input"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  aria-label="Maximum price"
                />
              </div>
              {(minPrice || maxPrice) && (
                <button type="button" className="shop-price-clear" onClick={() => { setMinPrice(''); setMaxPrice('') }} aria-label="Clear price filter">✕</button>
              )}
            </div>
            <div className="shop-sort">
              <label className="shop-sort-label" htmlFor="shop-sort">Sort</label>
              <select id="shop-sort" className="shop-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          <div className="shop-categories">
            {categories.map((cat) => (
              <button key={cat} className={`shop-cat-btn ${activeCategory === cat ? 'is-active' : ''}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section shop-section">
        <div className="wrap">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading products…</p>
          ) : filtered.length === 0 ? (
            <div className="shop-empty">
              <div className="shop-empty-icon">{hasActiveFilters ? '🔍' : '🧗'}</div>
              <h3>{hasActiveFilters ? 'No matches found' : 'Nothing here yet'}</h3>
              <p>{hasActiveFilters ? (query ? `We couldn't find anything matching “${searchQuery.trim()}”.` : 'No products match your current search or filters.') : "We're stocking this category. Check back soon!"}</p>
              {hasActiveFilters && (
                <button className="btn btn-outline shop-empty-clear" onClick={clearAllFilters}>Clear filters</button>
              )}
            </div>
          ) : (
            <>
            {hasActiveFilters && (
              <p className="shop-results-count" role="status">
                Showing {filtered.length} of {products.length} product{products.length === 1 ? '' : 's'}
              </p>
            )}
            <div className="shop-grid">
              {filtered.map((product) => (
                <div key={product.id} className="shop-card" onClick={() => navigate(product.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(product.id) }}>
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
                  <div className="shop-card-image">
                    {product.imageUrl || product.images?.[0] ? (
                      <img src={optimizeImage(product.imageUrl || product.images[0], 400)} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="shop-card-image-placeholder"><span>📦</span></div>
                    )}
                  </div>
                  <div className="shop-card-body">
                    <h3 className="shop-card-title">{product.name}</h3>
                    {product.features?.length > 0 && (
                      <ul className="shop-card-features">
                        {product.features.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                        {product.features.length > 3 && <li className="shop-card-more">+{product.features.length - 3} more</li>}
                      </ul>
                    )}
                    <div className="shop-card-price-row">
                      <div className="shop-card-price">
                        <span className="shop-card-price-current">PKR {product.price.toLocaleString()}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <>
                            <span className="shop-card-price-original">PKR {product.originalPrice.toLocaleString()}</span>
                            <span className="shop-card-discount-pct">-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>
                          </>
                        )}
                      </div>
                      {(() => {
                        const status = product.stockStatus || (product.inStock ? 'in_stock' : 'out_of_stock')
                        const labels = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', backorder: 'Backorder' }
                        const colors = { in_stock: 'badge-green', low_stock: 'badge-yellow', out_of_stock: 'badge-red', backorder: 'badge-blue' }
                        if (status === 'in_stock' && !product.lowStockThreshold) return null
                        return <span className={`shop-card-out ${colors[status] || ''}`}>{labels[status] || (product.inStock ? 'In Stock' : 'Out')}</span>
                      })()}
                    </div>
                    {product.shipping?.deliveryTime && (
                      <div className="shop-card-delivery"><span>🚚</span> {product.shipping.deliveryTime}{product.shipping.freeShipping ? ' · Free' : ''}</div>
                    )}
                    <div className="btn btn-primary shop-card-btn" style={{ textAlign: 'center', opacity: product.inStock ? 1 : 0.4 }}
                      role="button" tabIndex={0}
                      onClick={(e) => { if (product.inStock) { e.stopPropagation(); window.location.href = `/shop/${product.id}/checkout` } }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && product.inStock) { e.stopPropagation(); window.location.href = `/shop/${product.id}/checkout` } }}>
                      {product.inStock ? 'Buy Now' : 'Sold Out'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </section>

      {recommended.length > 0 && !loading && (
        <section className="section shop-section">
          <div className="wrap">
            <h2 className="pd-section-title">You might also like</h2>
            <div className="shop-grid">
              {recommended.map((product) => (
                <div key={product.id} className="shop-card" onClick={() => navigate(product.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(product.id) }}>
                  {(product.stockStatus === 'low_stock') && <span className="shop-badge shop-badge-low-stock">Low Stock</span>}
                  <div className="shop-card-image">
                    {product.imageUrl || product.images?.[0] ? <img src={optimizeImage(product.imageUrl || product.images[0], 400)} alt={product.name} loading="lazy" /> : <div className="shop-card-image-placeholder"><span>📦</span></div>}
                  </div>
                  <div className="shop-card-body">
                    <h3 className="shop-card-title">{product.name}</h3>
                    <div className="shop-card-price"><span className="shop-card-price-current">PKR {product.price.toLocaleString()}</span></div>
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
