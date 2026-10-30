import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getProduct, getProducts, getProductReviews, submitProductReview, optimizeImage } from '../../lib/api'
import { getCert } from './Shop.jsx'

const WHATSAPP = '923350044403'
const SITE_URL = 'https://www.climbcruxpakistan.com'

function formatDate(value) {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(value)
}

function StarRating({ rating, size = 20, interactive = false, onChange }) {
  return (
    <span className="pd-star-rating" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rating >= i ? 'full' : rating >= i - 0.5 ? 'half' : 'empty'
        return (
          <span key={i} className={`pd-star pd-star-${fill} ${interactive ? 'pd-star-interactive' : ''}`}
            style={{ fontSize: size }} onClick={() => interactive && onChange?.(i)}
            role={interactive ? 'button' : undefined} aria-label={interactive ? `${i} star` : undefined}>
            {fill === 'empty' ? '☆' : '★'}
          </span>
        )
      })}
    </span>
  )
}

function jsonParse(s) { try { return s ? JSON.parse(s) : null } catch { return null } }

/**
 * Admin descriptions are free text: dashed "Label: value" lines, loose bullets,
 * and plain paragraphs. Split them so the page can show a spec table.
 */
function parseDescription(text = '') {
  const rows = [], bullets = [], intro = []
  text.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const dashed = line.startsWith('-')
    const clean = line.replace(/^-\s*/, '')
    const m = clean.match(/^([^:]{2,40}):\s*(.+)$/)
    if (m && (dashed || clean.length < 70)) rows.push({ key: m[1].trim(), value: m[2].trim().replace(/\.$/, '') })
    else if (dashed) bullets.push(clean)
    else intro.push(clean)
  })
  return { rows, bullets, intro }
}

/**
 * The shop sidebar, shown beside every product so shoppers can narrow the
 * catalogue without going back to the listing. Nothing here filters the page
 * it sits on — each facet is a link into /shop/ with the matching query params
 * (the same ones Shop.jsx reads), so the panel works without its own state.
 */
function ShopFilters({ products }) {
  const [open, setOpen] = useState(false)
  const [priceLo, setPriceLo] = useState(null)
  const [priceHi, setPriceHi] = useState(null)

  const catalogue = useMemo(
    () => (products || []).filter((p) => p.status !== 'draft' && p.status !== 'archived'),
    [products]
  )

  const facets = useMemo(() => {
    const categories = [], brands = [], certs = []
    const categoryCount = {}, brandCount = {}, certCount = {}
    let low = null, high = null
    for (const p of catalogue) {
      if (p.category) {
        if (!categoryCount[p.category]) categories.push(p.category)
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
      }
      if (p.brand) {
        if (!brandCount[p.brand]) brands.push(p.brand)
        brandCount[p.brand] = (brandCount[p.brand] || 0) + 1
      }
      const cert = getCert(p)
      if (cert) {
        if (!certCount[cert]) certs.push(cert)
        certCount[cert] = (certCount[cert] || 0) + 1
      }
      const price = Number(p.price) || 0
      low = low === null ? price : Math.min(low, price)
      high = high === null ? price : Math.max(high, price)
    }
    brands.sort((a, b) => a.localeCompare(b))
    certs.sort((a, b) => a.localeCompare(b))
    const min = low === null ? 0 : Math.floor(low / 500) * 500
    let max = high === null ? 500 : Math.ceil(high / 500) * 500
    if (max <= min) max = min + 500
    return { categories, brands, certs, categoryCount, brandCount, certCount, min, max }
  }, [catalogue])

  const lo = priceLo === null ? facets.min : Math.min(Math.max(priceLo, facets.min), facets.max)
  const hi = priceHi === null ? facets.max : Math.max(Math.min(priceHi, facets.max), facets.min)
  const span = facets.max - facets.min || 1
  const shopHref = (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return qs ? `/shop/?${qs}` : '/shop/'
  }
  const applyPrice = () => {
    const params = {}
    if (lo > facets.min) params.min = String(lo)
    if (hi < facets.max) params.max = String(hi)
    window.location.href = shopHref(params)
  }

  return (
    <aside className={`px-filters-card ${open ? 'is-open' : ''}`} aria-label="Product filters">
      <div className="px-filters-head">
        <h2 className="sp-sidebar-title">Filters</h2>
        <a className="sp-clear" href="/shop/">Clear all</a>
        <button type="button" className="px-filters-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="px-filters-body">
        <div className="sp-filter-group">
          <h3 className="sp-filter-title">Category</h3>
          <ul className="sp-cat-list">
            <li>
              <a className="sp-cat" href="/shop/"><span>All</span><span className="sp-cat-count">{catalogue.length}</span></a>
            </li>
            {facets.categories.map((c) => (
              <li key={c}>
                <a className="sp-cat" href={shopHref({ cat: c })}>
                  <span>{c}</span><span className="sp-cat-count">{facets.categoryCount[c]}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {facets.brands.length > 0 && (
          <div className="sp-filter-group">
            <h3 className="sp-filter-title">Brand</h3>
            <div className="sp-check-list">
              {facets.brands.map((b) => (
                <a key={b} className="sp-check px-facet" href={shopHref({ brand: b })}>
                  <span>{b}</span><span className="sp-check-count">{facets.brandCount[b]}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {facets.max > facets.min && (
          <div className="sp-filter-group">
            <h3 className="sp-filter-title">Price</h3>
            <div
              className="sp-range"
              style={{ '--lo': `${((lo - facets.min) / span) * 100}%`, '--hi': `${((hi - facets.min) / span) * 100}%` }}
            >
              <span className="sp-range-track" aria-hidden="true" />
              <span className="sp-range-fill" aria-hidden="true" />
              <input
                type="range" min={facets.min} max={facets.max} step={100} value={lo}
                onChange={(e) => setPriceLo(Math.min(Number(e.target.value), hi))}
                onPointerUp={applyPrice} onTouchEnd={applyPrice} onKeyUp={applyPrice}
                aria-label="Minimum price"
              />
              <input
                type="range" min={facets.min} max={facets.max} step={100} value={hi}
                onChange={(e) => setPriceHi(Math.max(Number(e.target.value), lo))}
                onPointerUp={applyPrice} onTouchEnd={applyPrice} onKeyUp={applyPrice}
                aria-label="Maximum price"
              />
            </div>
            <div className="sp-range-values">
              <span>PKR {lo.toLocaleString('en-PK')}</span>
              <span>PKR {hi.toLocaleString('en-PK')}</span>
            </div>
          </div>
        )}

        <div className="sp-filter-group">
          <h3 className="sp-filter-title">Availability</h3>
          <div className="sp-check-list">
            <a className="sp-check px-facet" href={shopHref({ stock: 'in' })}><span>In stock only</span></a>
            <a className="sp-check px-facet" href={shopHref({ saved: '1' })}><span>Saved items</span></a>
          </div>
        </div>

        {facets.certs.length > 0 && (
          <div className="sp-filter-group">
            <h3 className="sp-filter-title">Certification</h3>
            <div className="sp-check-list">
              {facets.certs.map((c) => (
                <a key={c} className="sp-check px-facet" href={shopHref({ cert: c })}>
                  <span>{c}</span><span className="sp-check-count">{facets.certCount[c]}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default function ProductDetail({ id, initialProduct, initialAllProducts, initialReviewData }) {
  const first = jsonParse(initialProduct)
  const [product, setProduct] = useState(first)
  const [allProducts, setAllProducts] = useState(jsonParse(initialAllProducts) || [])
  const [loading, setLoading] = useState(!first)
  const [activeImg, setActiveImg] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [reviewData, setReviewData] = useState(jsonParse(initialReviewData) || { reviews: [], total: 0, avgRating: 0, distribution: [0, 0, 0, 0, 0] })
  const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 5, title: '', comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const done = (p, reviews, all) => {
      setProduct(p); setReviewData(reviews)
      if (all) setAllProducts(all)
      const t = p.seo?.title?.trim(); if (t) document.title = t
    }
    if (first) {
      Promise.all([getProduct(id), getProductReviews(id)]).then(([p, r]) => done(p, r)).catch(() => {})
      return
    }
    setLoading(true)
    Promise.all([getProduct(id), getProductReviews(id), getProducts()])
      .then(([p, r, all]) => done(p, r, all))
      .catch(() => { window.location.href = '/shop/' })
      .finally(() => setLoading(false))
  }, [id])

  const allImages = product ? [product.imageUrl, ...(product.images || [])].filter(Boolean) : []
  const prevImage = () => setActiveImg((i) => (i === 0 ? allImages.length - 1 : i - 1))
  const nextImage = () => setActiveImg((i) => (i === allImages.length - 1 ? 0 : i + 1))
  const onTouchEnd = useCallback(() => {
    const d = touchStartX.current - touchEndX.current
    if (Math.abs(d) > 50) (d > 0 ? nextImage : prevImage)()
  }, [allImages.length])

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!reviewForm.customer_name.trim()) { setReviewError('Name and rating are required'); return }
    setReviewError(''); setReviewSubmitting(true)
    try { await submitProductReview(id, reviewForm); setReviewSubmitted(true); setReviewData(await getProductReviews(id)) }
    catch { setReviewError('Failed to submit review') } finally { setReviewSubmitting(false) }
  }

  if (loading) return <section className="section"><div className="wrap" style={{ textAlign: 'center', padding: '60px 20px' }}><p>Loading product…</p></div></section>
  if (!product) return null

  // ── Derived display data ──
  const parsed = parseDescription(product.description)
  const specs = product.specifications?.length ? product.specifications : parsed.rows
  const find = (re) => specs.find((s) => re.test(s.key))
  const certRow = find(/certif/i)
  const condition = (product.features || []).find((f) => /^condition:/i.test(f))?.replace(/^condition:\s*/i, '')

  const qty = product.stockQuantity ?? 10
  const maxQty = Math.max(1, Math.min(10, qty))
  const totalPrice = product.price * quantity
  const status = product.stockStatus || (product.inStock ? 'in_stock' : 'out_of_stock')
  const low = product.inStock && qty > 0 && qty <= (product.lowStockThreshold ?? 5)
  const hasDiscount = product.compareAtPrice > product.price
  const goBuy = () => { window.location.href = `/shop/${id}/checkout/?qty=${quantity}` }
  // Built from `id` (not window.location) so the island also renders on the server.
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi Climb Crux, I have a question about ${product.name} (${SITE_URL}/shop/${id}/)`)}`

  // Complete your setup: different categories first, one per category
  const seen = new Set([product.category])
  const setup = allProducts.filter((p) => p.id !== id && p.inStock && p.category !== product.category)
    .filter((p) => (seen.has(p.category) ? false : seen.add(p.category))).slice(0, 4)
  const related = setup.length ? setup : allProducts.filter((p) => p.id !== id && p.inStock).slice(0, 4)

  return (
    <section className="section pd-section px">
      <div className="wrap px-layout">
        <ShopFilters products={allProducts} />

        <div className="px-main">
        <nav className="px-crumbs" aria-label="Breadcrumb">
          <a href="/shop/">Shop</a><span>›</span>
          <a href={`/shop/?cat=${encodeURIComponent(product.category)}`}>{product.category}</a><span>›</span>
          <strong>{product.name}</strong>
        </nav>

        <div className={`px-top ${allImages.length > 1 ? 'has-thumbs' : ''}`}>
          {/* ── Gallery ── */}
          <div className="px-gallery">
            <div className="px-stage" onClick={() => setZoomOpen(true)}
              onTouchStart={(e) => (touchStartX.current = touchEndX.current = e.touches[0].clientX)}
              onTouchMove={(e) => (touchEndX.current = e.touches[0].clientX)} onTouchEnd={onTouchEnd}>
              {allImages.length ? <img src={optimizeImage(allImages[activeImg])} alt={`${product.name} — image ${activeImg + 1}`} /> : <span className="px-noimg">No photo yet</span>}
              {allImages.length > 1 && <>
                <button className="px-arrow px-prev" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); prevImage() }}>‹</button>
                <button className="px-arrow px-next" aria-label="Next image" onClick={(e) => { e.stopPropagation(); nextImage() }}>›</button>
                <span className="px-count">{activeImg + 1} / {allImages.length}</span>
              </>}
              {allImages.length > 0 && <span className="px-zoom">Tap to zoom</span>}
            </div>
            {allImages.length > 1 && (
              <div className="px-thumbs">
                {allImages.map((img, i) => (
                  <button key={i} className={i === activeImg ? 'is-active' : ''} onClick={() => setActiveImg(i)} aria-label={`Show image ${i + 1}`}>
                    <img src={optimizeImage(img, 150)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Buy box ── */}
          <div className="px-buy">
            {product.brand && <span className="px-brand">{product.brand}</span>}
            {/* Name and badge share one non-wrapping row, so the badge always
                sits on the same line as the product name. */}
            <div className="px-headline">
              <h1 className="px-title">{product.name}</h1>
              {certRow && <span className="px-cert"><i />{certRow.value.replace(/\s*certified$/i, '')} certified</span>}
            </div>
            {reviewData.total > 0 && (
              <a className="px-rating" href="#reviews"><StarRating rating={reviewData.avgRating} size={16} /> {reviewData.avgRating} ({reviewData.total})</a>
            )}
            <div className="px-price-row">
              <span className="px-price">PKR {product.price.toLocaleString()}</span>
              {hasDiscount && <>
                <s className="px-was">PKR {product.compareAtPrice.toLocaleString()}</s>
                <span className="px-off">-{Math.round((1 - product.price / product.compareAtPrice) * 100)}%</span>
              </>}
            </div>
            <p className={`px-stock px-stock-${low ? 'low' : status}`}>
              <i />{status === 'out_of_stock' ? 'Sold out' : low ? `Only ${qty} left` : 'In stock'}
              {condition && <span> · {condition}</span>}
            </p>
            {product.variants?.length > 0 && (
              <div className="px-variants">
                {product.variants.map((v, i) => (
                  <span key={i} className={`px-chip ${v.stockQuantity <= 0 ? 'is-out' : ''}`}>{v.name}: {v.value}{v.stockQuantity <= 0 && ' (unavailable)'}</span>
                ))}
              </div>
            )}

            {/* Quantity and everything below it stay together as one block that
                is pushed to the bottom of the column. */}
            <div className="px-buyfoot">
              {product.inStock && (
                <div className="px-qty-row">
                  <div className="px-qty">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">−</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} disabled={quantity >= maxQty} aria-label="Increase quantity">+</button>
                  </div>
                  <span className="px-total">Total: <b>PKR {totalPrice.toLocaleString()}</b></span>
                </div>
              )}

              <div className="px-actions">
                <button className="btn btn-primary px-buy-btn" disabled={!product.inStock} onClick={goBuy}>
                  {product.inStock ? 'Buy now' : 'Sold out'}
                </button>
                <a className="btn btn-outline px-wa-btn" href={wa} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
              </div>

              <p className="px-policies">
                <a href="/return-refund-policy/">Return &amp; Refund Policy</a><span>–</span><a href="/shipping-policy/">Shipping Policy</a>
              </p>
            </div>
          </div>
        </div>

        {/* ── Specifications ── */}
        {(specs.length > 0 || parsed.bullets.length > 0) && (
          <div className="px-specs">
            <h2>Specifications</h2>
            {specs.length > 0 && <table><tbody>{specs.map((s, i) => <tr key={i}><th scope="row">{s.key}</th><td>{s.value}</td></tr>)}</tbody></table>}
            {parsed.bullets.length > 0 && <ul>{parsed.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
          </div>
        )}

        {/* ── Complete your setup ── */}
        {related.length > 0 && (
          <div className="px-setup">
            <h2>Complete your setup <small>Gear that goes with this product</small></h2>
            <div className="px-grid">
              {related.map((p) => (
                <a key={p.id} href={`/shop/${p.id}/`} className="px-card">
                  <div className="px-card-img">
                    {p.compareAtPrice > p.price && <span className="px-card-off">-{Math.round((1 - p.price / p.compareAtPrice) * 100)}%</span>}
                    {p.imageUrl && <img src={optimizeImage(p.imageUrl, 300)} alt={p.name} loading="lazy" />}
                  </div>
                  <div className="px-card-body">
                    {p.brand && <span className="px-brand">{p.brand}</span>}
                    <h3>{p.name}</h3>
                    <p><b>PKR {p.price.toLocaleString()}</b>{p.compareAtPrice > p.price && <s>PKR {p.compareAtPrice.toLocaleString()}</s>}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      {/* ── Reviews (unchanged markup/classes) ── */}
      <div id="reviews" style={{ marginTop: 64 }}>
        <h2 className="pd-section-title">Customer Reviews</h2>
        {reviewData.total > 0 ? (
          <div className="pd-reviews-layout">
            <div className="pd-reviews-summary">
              <div className="pd-reviews-avg-score">{reviewData.avgRating}</div>
              <StarRating rating={reviewData.avgRating} size={22} />
              <div className="pd-reviews-total">{reviewData.total} review{reviewData.total > 1 ? 's' : ''}</div>
              <div className="pd-reviews-distribution">
                {[5, 4, 3, 2, 1].map((s) => (
                  <div key={s} className="pd-reviews-bar-row">
                    <span className="pd-reviews-bar-label">{s}★</span>
                    <div className="pd-reviews-bar-track"><div className="pd-reviews-bar-fill" style={{ width: `${(reviewData.distribution[s - 1] / reviewData.total) * 100}%` }} /></div>
                    <span className="pd-reviews-bar-count">{reviewData.distribution[s - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pd-reviews-list">
              {reviewData.reviews.map((r) => (
                <div key={r.id} className="pd-review-card">
                  <div className="pd-review-header">
                    <div className="pd-review-avatar">{r.customer_name.charAt(0).toUpperCase()}</div>
                    <div><div className="pd-review-name">{r.customer_name}</div><StarRating rating={r.rating} size={14} /></div>
                    {r.verified_purchase && <span className="pd-review-verified">Verified Purchase</span>}
                  </div>
                  {r.title && <div className="pd-review-title">{r.title}</div>}
                  {r.comment && <p className="pd-review-comment">{r.comment}</p>}
                  {r.photos?.length > 0 && <div className="pd-review-photos">{r.photos.map((ph, i) => <img key={i} src={ph} alt="Review photo" className="pd-review-photo" />)}</div>}
                  <div className="pd-review-date">{formatDate(r.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="pd-reviews-empty">No reviews yet. Be the first to review this product!</p>}

        <div className="pd-review-form-section"><h3>Write a Review</h3>
          {reviewSubmitted ? <p className="pd-review-thanks">Thank you! Your review has been submitted.</p> : (
            <form className="pd-review-form" onSubmit={handleSubmitReview}>
              <div className="pd-review-form-row">
                <div className="pd-review-field"><label>Name *</label><input value={reviewForm.customer_name} onChange={(e) => setReviewForm({ ...reviewForm, customer_name: e.target.value })} placeholder="Your name" required /></div>
                <div className="pd-review-field"><label>Rating *</label><StarRating rating={reviewForm.rating} size={28} interactive onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} /></div>
              </div>
              <div className="pd-review-field"><label>Title (optional)</label><input value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Summary of your review" /></div>
              <div className="pd-review-field"><label>Review</label><textarea rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share your experience with this product" /></div>
              {reviewError && <div className="form-error-banner">{reviewError}</div>}
              <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>{reviewSubmitting ? 'Submitting…' : 'Submit Review'}</button>
            </form>
          )}
        </div>
      </div>

      {product.faqs?.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 className="pd-section-title">FAQs</h2>
          <div className="pd-faqs-list">
            {product.faqs.map((f, i) => <details key={i} className="pd-faq-item"><summary className="pd-faq-question">{f.question}</summary><div className="pd-faq-answer">{f.answer}</div></details>)}
          </div>
        </div>
      )}

        </div>{/* /px-main */}
      </div>{/* /px-layout */}

      {/* Mobile sticky bar */}
      {product.inStock && (
        <div className="px-sticky">
          <div><small>Total</small><b>PKR {totalPrice.toLocaleString()}</b></div>
          <button className="btn btn-primary" onClick={goBuy}>Buy now</button>
        </div>
      )}

      {zoomOpen && allImages[activeImg] && (
        <div className="pd-zoom-overlay" onClick={() => setZoomOpen(false)}>
          <button className="pd-zoom-close" onClick={() => setZoomOpen(false)} aria-label="Close">✕</button>
          <img className="pd-zoom-image" src={optimizeImage(allImages[activeImg])} alt={`${product.name} enlarged`} onClick={(e) => e.stopPropagation()} />
          {allImages.length > 1 && (
            <div className="pd-zoom-nav">
              <button className="pd-zoom-nav-btn" onClick={(e) => { e.stopPropagation(); prevImage() }}>‹</button>
              <span className="pd-zoom-counter">{activeImg + 1} / {allImages.length}</span>
              <button className="pd-zoom-nav-btn" onClick={(e) => { e.stopPropagation(); nextImage() }}>›</button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
