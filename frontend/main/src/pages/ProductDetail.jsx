import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { getProduct, getProducts, getProductReviews, submitProductReview, optimizeImage } from '../api.js'
import './ProductDetail.css'

/** Site-wide date format: Day-Month-Year (DD-MM-YYYY), e.g. 05-08-2026. */
function formatDate(value) {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getFullYear()}`
}

/* ── Star Rating Component ── */
function StarRating({ rating, size = 20, interactive = false, onChange }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 'full' : rating >= i - 0.5 ? 'half' : 'empty'
    stars.push(
      <span
        key={i}
        className={`pd-star pd-star-${fill} ${interactive ? 'pd-star-interactive' : ''}`}
        style={{ width: size, height: size, fontSize: size }}
        onClick={() => interactive && onChange?.(i)}
        role={interactive ? 'button' : undefined}
        aria-label={interactive ? `${i} star` : undefined}
      >
        {fill === 'full' ? '★' : fill === 'half' ? '★' : '☆'}
      </span>
    )
  }
  return <span className="pd-star-rating" style={{ gap: 2 }}>{stars}</span>
}

/* ── Recently Viewed (localStorage) ── */
function trackRecentlyViewed(product) {
  try {
    const key = 'shop_recently_viewed'
    let list = JSON.parse(localStorage.getItem(key) || '[]')
    list = list.filter((p) => p.id !== product.id)
    list.unshift({ id: product.id, name: product.name, imageUrl: product.imageUrl, price: product.price })
    if (list.length > 10) list = list.slice(0, 10)
    localStorage.setItem(key, JSON.stringify(list))
  } catch { /* ignore */ }
}

function getRecentlyViewed(excludeId) {
  try {
    const key = 'shop_recently_viewed'
    const list = JSON.parse(localStorage.getItem(key) || '[]')
    return list.filter((p) => p.id !== excludeId).slice(0, 4)
  } catch { return [] }
}

/* ── Highlight icon mapping ── */
const FEATURE_ICONS = {
  lightweight: '🪶', durable: '🛡️', premium: '✨', fast: '⚡',
  water: '💧', reinforced: '🔩', adjustable: '⚙️', compact: '📏',
  safe: '🔒', comfortable: '🛋️', ergonomic: '✋', breathable: '💨',
}

function getFeatureIcon(feature, index) {
  const lower = feature.toLowerCase()
  for (const [key, icon] of Object.entries(FEATURE_ICONS)) {
    if (lower.includes(key)) return icon
  }
  const fallbacks = ['✅', '⭐', '🔹', '🔸', '⚡', '🎯', '💪', '🏆']
  return fallbacks[index % fallbacks.length]
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  // Zoom
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  // Reviews
  const [reviewData, setReviewData] = useState({ reviews: [], total: 0, avgRating: 0, distribution: [0,0,0,0,0] })
  const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 5, title: '', comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState([])

  // Quantity
  const [quantity, setQuantity] = useState(1)

  // Touch swipe
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([getProduct(id), getProducts(), getProductReviews(id)])
      .then(([p, all, reviews]) => {
        setProduct(p)
        setAllProducts(all)
        setReviewData(reviews)
        trackRecentlyViewed(p)
        setRecentlyViewed(getRecentlyViewed(id))
        // SEO: update document title
        document.title = `${p.name} — Climb Crux Pakistan`
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const totalPrice = product ? product.price * quantity : 0

  // Build all images array
  const allImages = product
    ? [product.imageUrl, ...(product.images || [])].filter(Boolean)
    : []

  // Related products: same category first, then similar price, max 4
  const relatedProducts = product
    ? allProducts
        .filter((p) => p.id !== id && p.inStock)
        .sort((a, b) => {
          const sameCat = (a.category === product.category ? 0 : 1) - (b.category === product.category ? 0 : 1)
          if (sameCat !== 0) return sameCat
          return Math.abs(a.price - product.price) - Math.abs(b.price - product.price)
        })
        .slice(0, 4)
    : []

  // Share handler
  function handleShare() {
    const url = window.location.href
    const text = `Check out ${product.name} at Climb Crux!`
    if (navigator.share) {
      navigator.share({ title: product.name, text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!')
      })
    }
  }

  // Touch swipe handlers
  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchMove(e) { touchEndX.current = e.touches[0].clientX }
  function handleTouchEnd() {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage()
      else prevImage()
    }
  }

  function prevImage() { setActiveImg((prev) => (prev === 0 ? allImages.length - 1 : prev - 1)) }
  function nextImage() { setActiveImg((prev) => (prev === allImages.length - 1 ? 0 : prev + 1)) }

  // Zoom mouse move
  const handleZoomMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

  // Submit review
  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!reviewForm.customer_name.trim() || !reviewForm.rating) {
      setReviewError('Name and rating are required')
      return
    }
    setReviewError('')
    setReviewSubmitting(true)
    try {
      await submitProductReview(id, reviewForm)
      setReviewSubmitted(true)
      // Refresh reviews
      const fresh = await getProductReviews(id)
      setReviewData(fresh)
    } catch {
      setReviewError('Failed to submit review')
    } finally { setReviewSubmitting(false) }
  }

  if (loading) {
    return (
      <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 24, height: 24, borderWidth: 3 }} />
        <p style={{ color: 'var(--stone)' }}>Loading product…</p>
      </div></section>
    )
  }

  if (!product) return null

  const stockStatus = product.stockStatus || (product.inStock ? 'in_stock' : 'out_of_stock')
  const stockLabels = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', backorder: 'Backorder' }
  const stockIcons = { in_stock: '✅', low_stock: '⚠️', out_of_stock: '❌', backorder: '📦' }

  /* ── Structured Data (JSON-LD) ── */
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description ? product.description.slice(0, 300) : `${product.name} from Climb Crux Pakistan`,
    sku: product.sku || undefined,

    category: product.category || undefined,
    image: [product.imageUrl, ...(product.images || [])].filter(Boolean),
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'PKR',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    ...(reviewData.total > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewData.avgRating,
        reviewCount: reviewData.total,
      },
    } : {}),
    ...(product.shipping?.deliveryTime ? {
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
        deliveryTime: product.shipping.deliveryTime,
      },
    } : {}),
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd, null, 2)}</script>
      {/* ─────────────────────────────────────────────────────────────
           MAIN SECTION — Two Column Layout
           ───────────────────────────────────────────────────────────── */}
      <section className="section pd-section">
        <div className="wrap pd-layout">

          {/* ══════ LEFT COLUMN: Image Gallery ══════ */}
          <div className="pd-gallery">
            {allImages.length > 0 ? (
              <div
                className="pd-main-image-wrap"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseMove={handleZoomMove}
                onClick={() => setZoomOpen(true)}
                style={{ cursor: 'zoom-in' }}
              >
                {allImages.length > 1 && (
                  <>
                    <button className="pd-arrow pd-arrow-left" onClick={(e) => { e.stopPropagation(); prevImage() }} aria-label="Previous image">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button className="pd-arrow pd-arrow-right" onClick={(e) => { e.stopPropagation(); nextImage() }} aria-label="Next image">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </>
                )}
                <img className="pd-main-image" src={optimizeImage(allImages[activeImg])} alt={`${product.name} — image ${activeImg + 1}`} loading={activeImg === 0 ? 'eager' : 'lazy'} />
                <div className="pd-img-counter">{activeImg + 1} / {allImages.length}</div>
                <div className="pd-zoom-hint">Click to zoom</div>
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
                    <img src={optimizeImage(img, 150)} alt={`${product.name} — thumbnail ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══════ RIGHT COLUMN: Product Info ══════ */}
          <div className="pd-info">

            <h1 className="pd-title">{product.name}</h1>

            {/* Rating */}
            {reviewData.total > 0 && (
              <div className="pd-rating-row">
                <StarRating rating={reviewData.avgRating} size={18} />
                <span className="pd-rating-avg">{reviewData.avgRating}</span>
                <span className="pd-rating-count">({reviewData.total} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="pd-price-row">
              <span className="pd-price-current">PKR {product.price.toLocaleString()}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="pd-price-original">PKR {product.compareAtPrice.toLocaleString()}</span>
                  <span className="pd-discount-badge">
                    -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className={`pd-stock pd-stock-${stockStatus}`}>
              <span>{stockIcons[stockStatus]} {stockLabels[stockStatus]}</span>
              {product.stockQuantity !== undefined && stockStatus !== 'out_of_stock' && (
                <span className="pd-stock-qty">{product.stockQuantity} available</span>
              )}
            </div>

            {/* Share */}
            <button className="pd-share-btn" onClick={handleShare}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>

            {/* ── Highlights (features with icons) ── */}
            {product.features?.length > 0 && (
              <div className="pd-highlights">
                {product.features.slice(0, 6).map((f, i) => (
                  <div key={i} className="pd-highlight-item">
                    <span className="pd-highlight-icon">{product.featureIcons?.[i] || getFeatureIcon(f, i)}</span>
                    <span className="pd-highlight-text">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Description ── */}
            {product.description && (
              <div className="pd-description">
                <h3>Description</h3>
                <div className="pd-description-rich" dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
              </div>
            )}

            {/* ── Specifications Table ── */}
            {product.specifications?.length > 0 && (
              <div className="pd-specs">
                <h3>Specifications</h3>
                <table className="pd-specs-table">
                  <tbody>
                    {product.specifications.map((s, i) => (
                      <tr key={i}><td className="pd-spec-key">{s.key}</td><td className="pd-spec-value">{s.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Variants ── */}
            {product.variants?.length > 0 && (
              <div className="pd-variants-section">
                <h3>Available Options</h3>
                {Object.entries(product.variants.reduce((groups, v) => {
                  if (!groups[v.name]) groups[v.name] = []
                  groups[v.name].push(v)
                  return groups
                }, {})).map(([groupName, options]) => (
                  <div key={groupName} className="pd-variant-group">
                    <span className="pd-variant-label">{groupName}</span>
                    <div className="pd-variant-options">
                      {options.map((v, i) => (
                        <span key={i} className="pd-variant-chip">
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

            {/* ── Policy Cards ── */}
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

            {/* ── Quantity + Buy ── */}
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
            <div className="pd-total-row">
              <span className="pd-total-label">Total</span>
              <span className="pd-total-amount">PKR {totalPrice.toLocaleString()}</span>
            </div>
            <button className="btn btn-primary pd-buy-btn" disabled={!product.inStock} onClick={() => navigate(`/shop/${id}/checkout?qty=${quantity}`)}>
              {product.inStock ? `Buy Now — PKR ${totalPrice.toLocaleString()}` : 'Sold Out'}
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
           REVIEWS SECTION
           ─────────────────────────────────────────────────────────────── */}
      <section className="section pd-reviews-section">
        <div className="wrap">
          <h2 className="pd-section-title">Customer Reviews</h2>

          {reviewData.total > 0 ? (
            <div className="pd-reviews-layout">
              {/* Summary */}
              <div className="pd-reviews-summary">
                <div className="pd-reviews-avg-score">{reviewData.avgRating}</div>
                <StarRating rating={reviewData.avgRating} size={22} />
                <div className="pd-reviews-total">{reviewData.total} review{reviewData.total > 1 ? 's' : ''}</div>
                <div className="pd-reviews-distribution">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="pd-reviews-bar-row">
                      <span className="pd-reviews-bar-label">{star}★</span>
                      <div className="pd-reviews-bar-track">
                        <div className="pd-reviews-bar-fill" style={{ width: `${(reviewData.distribution[star - 1] / reviewData.total) * 100}%` }} />
                      </div>
                      <span className="pd-reviews-bar-count">{reviewData.distribution[star - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="pd-reviews-list">
                {reviewData.reviews.map((r) => (
                  <div key={r.id} className="pd-review-card">
                    <div className="pd-review-header">
                      <div className="pd-review-avatar">{r.customer_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="pd-review-name">{r.customer_name}</div>
                        <StarRating rating={r.rating} size={14} />
                      </div>
                      {r.verified_purchase && <span className="pd-review-verified">Verified Purchase</span>}
                    </div>
                    {r.title && <div className="pd-review-title">{r.title}</div>}
                    {r.comment && <p className="pd-review-comment">{r.comment}</p>}
                    {r.photos?.length > 0 && (
                      <div className="pd-review-photos">
                        {r.photos.map((photo, i) => <img key={i} src={photo} alt="Review photo" className="pd-review-photo" />)}
                      </div>
                    )}
                    <div className="pd-review-date">{formatDate(r.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="pd-reviews-empty">No reviews yet. Be the first to review this product!</p>
          )}

          {/* Review Form */}
          <div className="pd-review-form-section">
            <h3>Write a Review</h3>
            {reviewSubmitted ? (
              <p className="pd-review-thanks">Thank you! Your review has been submitted.</p>
            ) : (
              <form className="pd-review-form" onSubmit={handleSubmitReview}>
                <div className="pd-review-form-row">
                  <div className="pd-review-field">
                    <label>Name *</label>
                    <input value={reviewForm.customer_name} onChange={(e) => setReviewForm({ ...reviewForm, customer_name: e.target.value })} placeholder="Your name" required />
                  </div>
                  <div className="pd-review-field">
                    <label>Rating *</label>
                    <StarRating rating={reviewForm.rating} size={28} interactive={true} onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
                  </div>
                </div>
                <div className="pd-review-field">
                  <label>Title (optional)</label>
                  <input value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Summary of your review" />
                </div>
                <div className="pd-review-field">
                  <label>Review</label>
                  <textarea rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share your experience with this product" />
                </div>
                {reviewError && <div className="form-error-banner">{reviewError}</div>}
                <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
           FAQS SECTION
           ─────────────────────────────────────────────────────────────── */}
      {product.faqs?.length > 0 && (
        <section className="section pd-faqs-section">
          <div className="wrap">
            <h2 className="pd-section-title">FAQs</h2>
            <div className="pd-faqs-list">
              {product.faqs.map((faq, i) => (
                <details key={i} className="pd-faq-item">
                  <summary className="pd-faq-question">{faq.question}</summary>
                  <div className="pd-faq-answer">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────
           RELATED PRODUCTS
           ─────────────────────────────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section className="section pd-suggestions-section">
          <div className="wrap">
            <h2 className="pd-section-title">You might also like</h2>
            <div className="pd-suggestions-grid">
              {relatedProducts.map((sp) => (
                <Link to={`/shop/${sp.id}`} key={sp.id} className="pd-suggestion-card">
                  <div className="pd-suggestion-img">
                    {sp.imageUrl ? <img src={optimizeImage(sp.imageUrl, 300)} alt={sp.name} loading="lazy" /> : <div className="pd-suggestion-placeholder">📦</div>}
                  </div>
                  <div className="pd-suggestion-body">
                    <span className="pd-suggestion-meta">{sp.category}</span>
                    <h4 className="pd-suggestion-name">{sp.name}</h4>
                    <span className="pd-suggestion-price">PKR {sp.price.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────
           RECENTLY VIEWED
           ─────────────────────────────────────────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <section className="section pd-recent-section">
          <div className="wrap">
            <h2 className="pd-section-title">Recently viewed</h2>
            <div className="pd-suggestions-grid">
              {recentlyViewed.map((rv) => (
                <Link to={`/shop/${rv.id}`} key={rv.id} className="pd-suggestion-card">
                  <div className="pd-suggestion-img">
                    {rv.imageUrl ? <img src={optimizeImage(rv.imageUrl, 300)} alt={rv.name} loading="lazy" /> : <div className="pd-suggestion-placeholder">📦</div>}
                  </div>
                  <div className="pd-suggestion-body">
                    <h4 className="pd-suggestion-name">{rv.name}</h4>
                    <span className="pd-suggestion-price">PKR {rv.price.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
           IMAGE ZOOM OVERLAY
           ═══════════════════════════════════════════════════════════════ */}
      {zoomOpen && allImages[activeImg] && (
        <div className="pd-zoom-overlay" onClick={() => setZoomOpen(false)}>
          <button className="pd-zoom-close" onClick={() => setZoomOpen(false)}>✕</button>
          <img
            className="pd-zoom-image"
            src={optimizeImage(allImages[activeImg])}
            alt={`${product.name} enlarged`}
            onClick={(e) => e.stopPropagation()}
            style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
          />
          <div className="pd-zoom-nav">
            {allImages.length > 1 && (
              <>
                <button className="pd-zoom-nav-btn" onClick={(e) => { e.stopPropagation(); prevImage() }}>‹</button>
                <span className="pd-zoom-counter">{activeImg + 1} / {allImages.length}</span>
                <button className="pd-zoom-nav-btn" onClick={(e) => { e.stopPropagation(); nextImage() }}>›</button>
              </>
            )}
          </div>
        </div>
      )}


    </>
  )
}
