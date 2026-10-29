import { useEffect, useMemo, useRef, useState } from 'react'
import { getProducts, optimizeImage } from '../../lib/api'

const WISHLIST_KEY = 'cc_wishlist'

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name: A to Z' },
]

const STOCK_LABELS = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  backorder: 'Backorder',
}

const STOCK_TONES = {
  in_stock: 'green',
  low_stock: 'amber',
  out_of_stock: 'red',
  backorder: 'blue',
}

function money(value) {
  return `PKR ${Number(value || 0).toLocaleString('en-PK')}`
}

function parseList(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

function getStock(product) {
  const status = product.stockStatus || (product.inStock ? 'in_stock' : 'out_of_stock')
  const quantity = Number(product.stockQuantity)
  return {
    status,
    label: STOCK_LABELS[status] || 'Out of stock',
    tone: STOCK_TONES[status] || 'red',
    quantity: Number.isFinite(quantity) ? quantity : null,
  }
}

function getCert(product) {
  const specs = product.specifications || []
  const match = specs.find((spec) => /certif|standard/i.test(`${spec.key} ${spec.value}`))
  if (match?.value) return match.value
  if (Array.isArray(product.certifications) && product.certifications.length) {
    return product.certifications[0]
  }
  const text = [
    product.name,
    product.description,
    ...(product.features || []),
    ...specs.map((spec) => `${spec.key} ${spec.value}`),
  ].join(' ')
  const found = text.match(/\b(?:CE|UIAA|EN\s?\d{3,4}|ISO\s?\d+)\b/i)
  return found ? found[0].toUpperCase() : ''
}

function specLine(product) {
  const specs = (product.specifications || []).filter((spec) => spec?.key && spec?.value)
  if (specs.length) {
    return specs
      .slice(0, 2)
      .map((spec) => `${spec.key}: ${spec.value}`)
      .join(' · ')
  }
  return (product.features || [])[0] || product.description || ''
}

function searchScore(product, query) {
  const name = (product.name || '').toLowerCase()
  const brand = (product.brand || '').toLowerCase()
  const category = (product.category || '').toLowerCase()
  const sku = (product.sku || '').toLowerCase()
  const extras = [
    product.description,
    ...(product.features || []),
    ...(product.specifications || []).map((spec) => `${spec.key} ${spec.value}`),
    ...(product.variants || []).map((variant) => `${variant.name} ${variant.value} ${variant.sku}`),
  ]
    .join(' ')
    .toLowerCase()

  let score = 0
  for (const word of query.split(/\s+/).filter(Boolean)) {
    let wordScore = 0
    if (name.startsWith(word)) wordScore += 6
    if (name.includes(word)) wordScore += 4
    if (brand.includes(word)) wordScore += 3
    if (category.includes(word)) wordScore += 2
    if (sku.includes(word)) wordScore += 2
    if (extras.includes(word)) wordScore += 1
    if (wordScore === 0) return 0
    score += wordScore
  }
  return score
}

function ProductCard({ product, saved, onToggleSave }) {
  const cert = getCert(product)
  const stock = getStock(product)
  const spec = specLine(product)
  const price = Number(product.price) || 0
  const originalPrice = Number(product.originalPrice || product.compareAtPrice || 0)
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const available = stock.status !== 'out_of_stock'
  const href = `/shop/${product.id}/`
  const image = product.imageUrl || product.images?.[0]

  return (
    <article className="sp-card">
      <div className="sp-card-media">
        <a className="sp-card-media-link" href={href} aria-label={`View ${product.name}`}>
          {image ? (
            <img
              src={optimizeImage(image, 560)}
              alt={product.featuredImageAlt || product.name}
              loading="lazy"
            />
          ) : (
            <span className="sp-card-placeholder" aria-hidden="true">CRUX</span>
          )}
        </a>
        <div className="sp-card-badges">
          {discount > 0 && <span className="sp-badge sp-badge-sale">-{discount}%</span>}
          {stock.status === 'low_stock' && <span className="sp-badge sp-badge-low">Low stock</span>}
          {product.featured && discount === 0 && <span className="sp-badge sp-badge-featured">Featured</span>}
        </div>
        <button
          type="button"
          className={`sp-save ${saved ? 'is-saved' : ''}`}
          onClick={() => onToggleSave(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className="sp-card-body">
        <div className="sp-card-brandline">
          <span className="sp-card-brand">{product.brand || product.category || 'Climb Crux'}</span>
          {cert && <span className="sp-cert">{cert}</span>}
        </div>

        <h3 className="sp-card-title">
          <a href={href}>{product.name}</a>
        </h3>

        {spec && <p className="sp-card-spec">{spec}</p>}

        <div className="sp-card-price">
          <span className="sp-card-price-main">{money(price)}</span>
          {discount > 0 && (
            <>
              <span className="sp-card-price-old">{money(originalPrice)}</span>
              <span className="sp-card-discount">-{discount}%</span>
            </>
          )}
        </div>

        <div className={`sp-stock sp-stock-${stock.tone}`}>
          <span className="sp-stock-dot" aria-hidden="true" />
          <span>
            {stock.label}
            {stock.quantity !== null && stock.status === 'low_stock' ? ` · ${stock.quantity} left` : ''}
          </span>
          {(product.shipping?.deliveryTime || product.shipping?.freeShipping) && (
            <span className="sp-ship">
              {product.shipping.freeShipping ? 'Free delivery' : product.shipping.deliveryTime}
            </span>
          )}
        </div>

        <div className="sp-card-actions">
          <a className="btn btn-outline sp-card-view" href={href}>View</a>
          {available ? (
            <a className="btn btn-primary sp-card-buy" href={`${href}checkout/`}>Buy now</a>
          ) : (
            <span className="btn sp-card-buy is-disabled" aria-disabled="true">Sold out</span>
          )}
        </div>
      </div>
    </article>
  )
}

function CardSkeleton() {
  return (
    <div className="sp-card sp-card-skeleton" aria-hidden="true">
      <div className="sp-skeleton-media" />
      <div className="sp-skeleton-body">
        <span className="sp-skeleton-line sp-skeleton-line-sm" />
        <span className="sp-skeleton-line" />
        <span className="sp-skeleton-line sp-skeleton-line-md" />
        <span className="sp-skeleton-line sp-skeleton-line-price" />
      </div>
    </div>
  )
}

export default function Shop({ initial = [], initialParams = {} }) {
  const [products, setProducts] = useState(() => (Array.isArray(initial) ? initial : []))
  const [loading, setLoading] = useState(() => !(Array.isArray(initial) && initial.length > 0))
  const [searchQuery, setSearchQuery] = useState(() => initialParams.q || '')
  const [activeCategory, setActiveCategory] = useState(() => initialParams.cat || 'All')
  const [sortBy, setSortBy] = useState(() =>
    SORTS.some((sort) => sort.value === initialParams.sort) ? initialParams.sort : 'featured'
  )
  const [selectedBrands, setSelectedBrands] = useState(() => parseList(initialParams.brand))
  const [selectedCerts, setSelectedCerts] = useState(() => parseList(initialParams.cert))
  const [inStockOnly, setInStockOnly] = useState(() => initialParams.stock === 'in')
  const [savedOnly, setSavedOnly] = useState(() => initialParams.saved === '1')
  const [priceMin, setPriceMin] = useState(() => {
    const value = Number(initialParams.min)
    return initialParams.min && Number.isFinite(value) ? value : null
  })
  const [priceMax, setPriceMax] = useState(() => {
    const value = Number(initialParams.max)
    return initialParams.max && Number.isFinite(value) ? value : null
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [wishlist, setWishlist] = useState([])
  const [wishlistReady, setWishlistReady] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    document.title = 'Climbing Gear & Equipment in Pakistan | Climb Crux'
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) setWishlist(parsed)
    } catch {
      setWishlist([])
    } finally {
      setWishlistReady(true)
    }
  }, [])

  useEffect(() => {
    if (!wishlistReady) return
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
    } catch {
      /* ignore storage errors */
    }
  }, [wishlist, wishlistReady])

  useEffect(() => {
    if (!filtersOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setFiltersOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth > 1020) setFiltersOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [filtersOpen])

  const catalogue = useMemo(
    () => products.filter((product) => product.status !== 'draft' && product.status !== 'archived'),
    [products]
  )

  const bounds = useMemo(() => {
    if (!catalogue.length) return { min: 0, max: 0 }
    const prices = catalogue.map((product) => Number(product.price) || 0)
    const min = Math.floor(Math.min(...prices) / 500) * 500
    let max = Math.ceil(Math.max(...prices) / 500) * 500
    if (max <= min) max = min + 500
    return { min, max }
  }, [catalogue])

  const rawMin = priceMin === null ? bounds.min : Math.min(Math.max(priceMin, bounds.min), bounds.max)
  const rawMax = priceMax === null ? bounds.max : Math.max(Math.min(priceMax, bounds.max), bounds.min)
  const effectiveMin = Math.min(rawMin, rawMax)
  const effectiveMax = Math.max(rawMin, rawMax)
  const priceSpan = bounds.max - bounds.min || 1
  const rangeLow = ((effectiveMin - bounds.min) / priceSpan) * 100
  const rangeHigh = ((effectiveMax - bounds.min) / priceSpan) * 100
  const priceChanged = effectiveMin > bounds.min || effectiveMax < bounds.max

  const categories = useMemo(
    () => ['All', ...new Set(catalogue.map((product) => product.category).filter(Boolean))],
    [catalogue]
  )

  const brands = useMemo(
    () =>
      [...new Set(catalogue.map((product) => product.brand).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [catalogue]
  )

  const certs = useMemo(
    () => [...new Set(catalogue.map(getCert).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [catalogue]
  )

  const facetCounts = useMemo(() => {
    const byCategory = {}
    const byBrand = {}
    const byCert = {}
    for (const product of catalogue) {
      const category = product.category || 'Uncategorized'
      byCategory[category] = (byCategory[category] || 0) + 1
      if (product.brand) byBrand[product.brand] = (byBrand[product.brand] || 0) + 1
      const cert = getCert(product)
      if (cert) byCert[cert] = (byCert[cert] || 0) + 1
    }
    return { byCategory, byBrand, byCert }
  }, [catalogue])

  const query = searchQuery.trim().toLowerCase()
  const hasActiveFilters =
    Boolean(query) ||
    activeCategory !== 'All' ||
    selectedBrands.size > 0 ||
    selectedCerts.size > 0 ||
    priceChanged ||
    inStockOnly ||
    savedOnly
  const activeFilterCount = [
    Boolean(query),
    activeCategory !== 'All',
    selectedBrands.size > 0,
    selectedCerts.size > 0,
    priceChanged,
    inStockOnly,
    savedOnly,
  ].filter(Boolean).length

  const filtered = useMemo(() => {
    return catalogue
      .filter((product) => activeCategory === 'All' || product.category === activeCategory)
      .filter((product) => selectedBrands.size === 0 || selectedBrands.has(product.brand || ''))
      .filter((product) => selectedCerts.size === 0 || selectedCerts.has(getCert(product)))
      .filter((product) => {
        const price = Number(product.price) || 0
        return price >= effectiveMin && price <= effectiveMax
      })
      .filter((product) => !inStockOnly || getStock(product).status !== 'out_of_stock')
      .filter((product) => !savedOnly || wishlist.includes(product.id))
      .map((product, index) => ({ product, index, score: query ? searchScore(product, query) : 0 }))
      .filter(({ score }) => !query || score > 0)
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.product.price - b.product.price || a.index - b.index
        if (sortBy === 'price-desc') return b.product.price - a.product.price || a.index - b.index
        if (sortBy === 'newest') {
          const aDate = a.product.createdAt || ''
          const bDate = b.product.createdAt || ''
          return (bDate < aDate ? -1 : bDate > aDate ? 1 : a.index - b.index)
        }
        if (sortBy === 'name') {
          return a.product.name.localeCompare(b.product.name) || a.index - b.index
        }
        if (query) return b.score - a.score || a.index - b.index
        return (
          Number(b.product.featured) - Number(a.product.featured) ||
          Number(a.product.sortOrder || 0) - Number(b.product.sortOrder || 0) ||
          a.index - b.index
        )
      })
      .map(({ product }) => product)
  }, [
    catalogue,
    activeCategory,
    selectedBrands,
    selectedCerts,
    effectiveMin,
    effectiveMax,
    inStockOnly,
    savedOnly,
    wishlist,
    query,
    sortBy,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (activeCategory !== 'All') params.set('cat', activeCategory)
    if (sortBy !== 'featured') params.set('sort', sortBy)
    if (selectedBrands.size > 0) params.set('brand', [...selectedBrands].join(','))
    if (selectedCerts.size > 0) params.set('cert', [...selectedCerts].join(','))
    if (priceChanged) params.set('min', String(effectiveMin))
    if (priceChanged) params.set('max', String(effectiveMax))
    if (inStockOnly) params.set('stock', 'in')
    if (savedOnly) params.set('saved', '1')
    const next = params.toString()
    const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
      window.history.replaceState(null, '', url)
    }
  }, [
    searchQuery,
    activeCategory,
    sortBy,
    selectedBrands,
    selectedCerts,
    priceChanged,
    effectiveMin,
    effectiveMax,
    inStockOnly,
    savedOnly,
  ])

  const toggleBrand = (brand) => {
    setSelectedBrands((previous) => {
      const next = new Set(previous)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })
  }

  const toggleCert = (cert) => {
    setSelectedCerts((previous) => {
      const next = new Set(previous)
      if (next.has(cert)) next.delete(cert)
      else next.add(cert)
      return next
    })
  }

  const toggleSave = (id) => {
    setWishlist((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    )
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setActiveCategory('All')
    setSelectedBrands(new Set())
    setSelectedCerts(new Set())
    setInStockOnly(false)
    setSavedOnly(false)
    setPriceMin(null)
    setPriceMax(null)
    setSortBy('featured')
  }

  const emptyTitle = savedOnly
    ? 'No saved gear yet'
    : query
      ? 'No matches found'
      : 'No gear matches those filters'
  const emptyCopy = savedOnly
    ? 'Tap the heart on any product to keep it here for later.'
    : query
      ? `We couldn't find anything matching “${searchQuery.trim()}”.`
      : 'Try clearing a filter or widening the price range.'

  return (
    <section className="sp-shop">
      <div className="wrap">
        <div className="sp-layout">
          {filtersOpen && (
            <div
              className="sp-drawer-overlay"
              onClick={() => setFiltersOpen(false)}
              aria-hidden="true"
            />
          )}

          <aside className={`sp-sidebar ${filtersOpen ? 'is-open' : ''}`} aria-label="Product filters">
            <div className="sp-sidebar-head">
              <h2 className="sp-sidebar-title">
                Filters
                {activeFilterCount > 0 && <span className="sp-filter-count">{activeFilterCount}</span>}
              </h2>
              <button
                type="button"
                className="sp-clear"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
              >
                Clear all
              </button>
              <button
                type="button"
                className="sp-sidebar-close"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            <div className="sp-filter-group">
              <h3 className="sp-filter-title">Category</h3>
              <ul className="sp-cat-list">
                {categories.map((category) => (
                  <li key={category}>
                    <button
                      type="button"
                      className={`sp-cat ${activeCategory === category ? 'is-active' : ''}`}
                      onClick={() => setActiveCategory(category)}
                    >
                      <span>{category}</span>
                      <span className="sp-cat-count">
                        {category === 'All'
                          ? catalogue.length
                          : facetCounts.byCategory[category] || 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {brands.length > 0 && (
              <div className="sp-filter-group">
                <h3 className="sp-filter-title">Brand</h3>
                <div className="sp-check-list">
                  {brands.map((brand) => (
                    <label key={brand} className="sp-check">
                      <input
                        type="checkbox"
                        checked={selectedBrands.has(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span>{brand}</span>
                      <span className="sp-check-count">{facetCounts.byBrand[brand] || 0}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {bounds.max > bounds.min && (
              <div className="sp-filter-group">
                <h3 className="sp-filter-title">Price</h3>
                <div
                  className="sp-range"
                  style={{ '--lo': `${rangeLow}%`, '--hi': `${rangeHigh}%` }}
                >
                  <span className="sp-range-track" aria-hidden="true" />
                  <span className="sp-range-fill" aria-hidden="true" />
                  <input
                    type="range"
                    min={bounds.min}
                    max={bounds.max}
                    step={100}
                    value={effectiveMin}
                    onChange={(event) =>
                      setPriceMin(Math.min(Number(event.target.value), effectiveMax))
                    }
                    aria-label="Minimum price"
                  />
                  <input
                    type="range"
                    min={bounds.min}
                    max={bounds.max}
                    step={100}
                    value={effectiveMax}
                    onChange={(event) =>
                      setPriceMax(Math.max(Number(event.target.value), effectiveMin))
                    }
                    aria-label="Maximum price"
                  />
                </div>
                <div className="sp-range-values">
                  <span>{money(effectiveMin)}</span>
                  <span>{money(effectiveMax)}</span>
                </div>
              </div>
            )}

            <div className="sp-filter-group">
              <h3 className="sp-filter-title">Availability</h3>
              <div className="sp-check-list">
                <label className="sp-check">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) => setInStockOnly(event.target.checked)}
                  />
                  <span>In stock only</span>
                </label>
                <label className="sp-check">
                  <input
                    type="checkbox"
                    checked={savedOnly}
                    onChange={(event) => setSavedOnly(event.target.checked)}
                  />
                  <span>Saved items</span>
                  {wishlist.length > 0 && <span className="sp-check-count">{wishlist.length}</span>}
                </label>
              </div>
            </div>

            {certs.length > 0 && (
              <div className="sp-filter-group">
                <h3 className="sp-filter-title">Certification</h3>
                <div className="sp-check-list">
                  {certs.map((cert) => (
                    <label key={cert} className="sp-check">
                      <input
                        type="checkbox"
                        checked={selectedCerts.has(cert)}
                        onChange={() => toggleCert(cert)}
                      />
                      <span>{cert}</span>
                      <span className="sp-check-count">{facetCounts.byCert[cert] || 0}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary sp-drawer-apply"
              onClick={() => setFiltersOpen(false)}
            >
              Show {filtered.length} product{filtered.length === 1 ? '' : 's'}
            </button>
          </aside>

          <div className="sp-main">
            <div className="sp-toolbar">
              <div className="sp-search">
                <svg
                  className="sp-search-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchRef}
                  type="search"
                  className="sp-search-input"
                  placeholder="Search harnesses, ropes, carabiners…"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="sp-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="sp-toolbar-right">
                <button
                  type="button"
                  className="sp-filter-toggle"
                  onClick={() => setFiltersOpen(true)}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="9" cy="6" r="2" fill="var(--chalk)" />
                    <circle cx="15" cy="12" r="2" fill="var(--chalk)" />
                    <circle cx="8" cy="18" r="2" fill="var(--chalk)" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && <span className="sp-filter-count">{activeFilterCount}</span>}
                </button>

                <label className="sp-sort">
                  <span>Sort</span>
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    {SORTS.map((sort) => (
                      <option key={sort.value} value={sort.value}>{sort.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="sp-summary">
              <p role="status">
                {loading && catalogue.length === 0
                  ? 'Loading products…'
                  : `Showing ${filtered.length} of ${catalogue.length} product${catalogue.length === 1 ? '' : 's'}`}
              </p>
            </div>

            {loading && catalogue.length === 0 ? (
              <div className="sp-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>{emptyTitle}</h3>
                <p>{emptyCopy}</p>
                {hasActiveFilters && (
                  <button type="button" className="btn btn-outline" onClick={clearAllFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="sp-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    saved={wishlist.includes(product.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
