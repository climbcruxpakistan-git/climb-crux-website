import { useState, useEffect, useRef } from 'react'
import { getProducts, saveProduct, deleteProduct, getProductOrders, patchOrderStatus, patchOrderPayment } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api')

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

function emptyImages() {
  return ['']
}

const STOCK_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'backorder', label: 'Backorder' },
]

export default function ShopManager() {
  const { addToast } = useToast()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('products')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    // Basic
    name: '', slug: '', sku: '', brand: '', category: 'Uncategorized',
    // Pricing
    price: '', compareAtPrice: '',
    // Description
    description: '',
    // Images
    imageUrl: '', featuredImageAlt: '', images: emptyImages(),
    // Inventory
    stockQuantity: 0, lowStockThreshold: 5, stockStatus: 'in_stock',
    // Variants
    variants: [],
    // Specs
    specifications: [],
    // Features
    features: [''],
    // Shipping
    deliveryTime: '', freeShipping: false,
    // Warranty
    warrantyPeriod: '', warrantyDetails: '',
    // Returns
    returnWindow: '', returnPolicy: '',
    // SEO
    seoTitle: '', metaDescription: '', canonicalUrl: '',
    // Flags
    featured: false, sortOrder: 0,
  })
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingAdditional, setUploadingAdditional] = useState(false)
  const mainFileRef = useRef()
  const additionalFileRef = useRef()

  // Order detail modal
  const [viewOrder, setViewOrder] = useState(null)
  const [payForm, setPayForm] = useState({ payment_status: 'paid', payment_method: '', payer_bank: '', payer_name: '', payer_phone: '' })

  useEffect(() => {
    Promise.all([getProducts(), getProductOrders()])
      .then(([p, o]) => { setProducts(p); setOrders(o) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function reload() {
    Promise.all([getProducts(), getProductOrders()])
      .then(([p, o]) => { setProducts(p); setOrders(o) })
      .catch(console.error)
  }

  function emptyForm() {
    setForm({
      name: '', slug: '', sku: '', brand: '', category: 'Uncategorized',
      price: '', compareAtPrice: '',
      description: '',
      imageUrl: '', featuredImageAlt: '', images: emptyImages(),
      stockQuantity: 0, lowStockThreshold: 5, stockStatus: 'in_stock',
      variants: [],
      specifications: [],
      features: [''],
      deliveryTime: '', freeShipping: false,
      warrantyPeriod: '', warrantyDetails: '',
      returnWindow: '', returnPolicy: '',
      seoTitle: '', metaDescription: '', canonicalUrl: '',
      featured: false, sortOrder: 0,
    })
  }

  function openNew() {
    emptyForm()
    setEditing('new')
  }

  function openEdit(p) {
    const rawImages = (p.images || []).filter(Boolean)
    const imgs = rawImages.length > 0 ? [...rawImages, ''] : ['']
    setForm({
      name: p.name || '',
      slug: p.slug || '',
      sku: p.sku || '',
      brand: p.brand || '',
      category: p.category || 'Uncategorized',
      price: p.price?.toString() || '',
      compareAtPrice: (p.compareAtPrice ?? p.originalPrice)?.toString() || '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      featuredImageAlt: p.featuredImageAlt || '',
      images: imgs,
      stockQuantity: p.stockQuantity ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      stockStatus: p.stockStatus || 'in_stock',
      variants: (p.variants || []).length > 0 ? p.variants : [],
      specifications: (p.specifications || []).length > 0 ? p.specifications : [],
      features: (p.features || []).length > 0 ? p.features : [''],
      deliveryTime: p.shipping?.deliveryTime || '',
      freeShipping: p.shipping?.freeShipping || false,
      warrantyPeriod: p.warranty?.period || '',
      warrantyDetails: p.warranty?.details || '',
      returnWindow: p.returns?.window || '',
      returnPolicy: p.returns?.policy || '',
      seoTitle: p.seo?.title || '',
      metaDescription: p.seo?.metaDescription || '',
      canonicalUrl: p.seo?.canonicalUrl || '',
      featured: p.featured || false,
      sortOrder: p.sortOrder || 0,
    })
    setEditing(p.id)
  }

  async function handleSave() {
    if (!form.name || !form.price) {
      addToast('Name and price are required', 'error')
      return
    }

    const data = {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      brand: form.brand,
      category: form.category,
      price: parseFloat(form.price),
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
      originalPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
      description: form.description,
      imageUrl: form.imageUrl,
      featuredImageAlt: form.featuredImageAlt || '',
      images: form.images.filter((url) => url.trim()),
      stockQuantity: parseInt(form.stockQuantity, 10) || 0,
      lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
      stockStatus: form.stockStatus,
      inStock: form.stockStatus === 'in_stock' || form.stockStatus === 'low_stock' || form.stockStatus === 'backorder',
      variants: form.variants.filter((v) => v.name.trim() && v.value.trim()),
      specifications: form.specifications.filter((s) => s.key.trim()),
      features: form.features.filter((f) => f.trim()),
      shipping: {
        deliveryTime: form.deliveryTime,
        freeShipping: form.freeShipping,
      },
      warranty: {
        period: form.warrantyPeriod,
        details: form.warrantyDetails,
      },
      returns: {
        window: form.returnWindow,
        policy: form.returnPolicy,
      },
      seo: {
        title: form.seoTitle,
        metaDescription: form.metaDescription,
        canonicalUrl: form.canonicalUrl,
      },
      featured: form.featured,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
    }

    if (editing !== 'new') data.id = editing
    await saveProduct(data)
    await reload()
    setEditing(null)
    addToast('Product saved', 'success')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    await reload()
    addToast('Product deleted', 'success')
  }

  function openOrder(order) {
    setViewOrder(order)
    setPayForm({
      payment_status: order.payment_status === 'paid' ? 'paid' : 'paid',
      payment_method: order.payment_method || '',
      payer_bank: order.payer_bank || '',
      payer_name: order.payer_name || '',
      payer_phone: order.payer_phone || '',
    })
  }

  async function handleUpdateStatus(orderId, status) {
    await patchOrderStatus(orderId, status)
    await reload()
    addToast('Order status updated', 'success')
  }

  async function handleUpdatePayment(orderId) {
    await patchOrderPayment(orderId, payForm)
    await reload()
    setViewOrder(null)
    addToast('Payment status updated', 'success')
  }

  /* ── Array field helpers ── */

  function addListItem(field, empty) {
    setForm({ ...form, [field]: [...form[field], { ...empty }] })
  }

  function updateListItem(field, idx, key, val) {
    setForm({
      ...form,
      [field]: form[field].map((item, i) => i === idx ? { ...item, [key]: val } : item),
    })
  }

  function removeListItem(field, idx) {
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== idx) })
  }

  function addFeature() { setForm({ ...form, features: [...form.features, ''] }) }
  function updateFeature(idx, val) {
    setForm({ ...form, features: form.features.map((f, i) => i === idx ? val : f) })
  }
  function removeFeature(idx) {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) })
  }

  /* ── Image Upload Handlers ── */

  async function uploadMainImage(file) {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
    if (!allowed.includes(file.type)) {
      addToast('Only JPG, PNG, GIF, WebP & AVIF images are allowed', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('Image must be under 10MB', 'error')
      return
    }

    setUploadingMain(true)
    const formData = new FormData()
    formData.append('photos', file)

    try {
      const res = await fetch(`${API}/uploads`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }
      const uploaded = await res.json()
      if (uploaded && uploaded.length > 0) {
        setForm({ ...form, imageUrl: uploaded[0].url })
        addToast('Main image uploaded', 'success')
      }
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error')
    } finally {
      setUploadingMain(false)
      if (mainFileRef.current) mainFileRef.current.value = ''
    }
  }

  async function uploadAdditionalImages(files) {
    if (!files || files.length === 0) return
    if (files.length > 10) {
      addToast('You can upload up to 10 additional images at once', 'error')
      return
    }

    setUploadingAdditional(true)
    const formData = new FormData()
    for (const file of files) {
      formData.append('photos', file)
    }

    try {
      const res = await fetch(`${API}/uploads`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }
      const uploaded = await res.json()
      if (uploaded && uploaded.length > 0) {
        const newImgs = uploaded.map((p) => p.url)
        const existing = form.images.filter((url) => url.trim())
        setForm({ ...form, images: [...existing, ...newImgs, ''] })
        addToast(`${newImgs.length} image${newImgs.length > 1 ? 's' : ''} uploaded`, 'success')
      }
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error')
    } finally {
      setUploadingAdditional(false)
      if (additionalFileRef.current) additionalFileRef.current.value = ''
    }
  }

  function removeGalleryImage(idx) {
    const filled = form.images.filter((url) => url.trim())
    const updated = filled.filter((_, j) => j !== idx)
    setForm({ ...form, images: updated.length > 0 ? [...updated, ''] : [''] })
  }

  if (loading) return <div className="empty-state"><h3>Loading shop…</h3></div>

  /* Badge helpers */
  const statusBadge = (s) => {
    const colors = {
      pending_payment: 'badge-yellow',
      pending_verification: 'badge-yellow',
      confirmed: 'badge-green',
      shipped: 'badge-blue',
      cancelled: 'badge-gray',
    }
    return <span className={`badge ${colors[s] || 'badge-gray'}`}>{s?.replace(/_/g, ' ')}</span>
  }

  const payStatusBadge = (s) => {
    const colors = {
      pending: 'badge-yellow',
      verification_required: 'badge-yellow',
      paid: 'badge-green',
      failed: 'badge-red',
      refunded: 'badge-gray',
    }
    return <span className={`badge ${colors[s] || 'badge-gray'}`}>{s?.replace(/_/g, ' ')}</span>
  }

  const stockBadge = (p) => {
    const colors = { in_stock: 'badge-green', low_stock: 'badge-yellow', out_of_stock: 'badge-red', backorder: 'badge-blue' }
    const labels = { in_stock: 'In Stock', low_stock: 'Low', out_of_stock: 'Out', backorder: 'Backorder' }
    return <span className={`badge ${colors[p.stockStatus] || (p.inStock ? 'badge-green' : 'badge-red')}`}>
      {labels[p.stockStatus] || (p.inStock ? 'In Stock' : 'Out')}
    </span>
  }

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0)

  const pendingOrders = orders.filter((o) => !['confirmed', 'shipped', 'cancelled'].includes(o.status)).length

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Shop</h1>
          <p className="page-header-admin-desc">Manage products and track orders.</p>
        </div>
        {tab === 'products' && (
          <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Product</button>
        )}
      </div>

      {/* Stats row */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="card-admin" style={{ flex: 1, minWidth: 140, padding: 16 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Orders</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>{orders.length}</div>
          </div>
          <div className="card-admin" style={{ flex: 1, minWidth: 140, padding: 16 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308', marginTop: 4 }}>{pendingOrders}</div>
          </div>
          <div className="card-admin" style={{ flex: 1, minWidth: 140, padding: 16 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue (paid)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--orange)', marginTop: 4 }}>PKR {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        <button
          className={`btn-admin ${tab === 'products' ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: tab === 'products' ? '2px solid var(--orange)' : '2px solid transparent', marginBottom: -2 }}
          onClick={() => setTab('products')}
        >
          Products ({products.length})
        </button>
        <button
          className={`btn-admin ${tab === 'orders' ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: tab === 'orders' ? '2px solid var(--orange)' : '2px solid transparent', marginBottom: -2 }}
          onClick={() => setTab('orders')}
        >
          Orders ({orders.length})
        </button>
      </div>

      {/* ── Products Tab ── */}
      {tab === 'products' && (
        <div className="card-admin">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No products yet</h3>
              <p>Add your first product to start selling gear.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>Img</th>
                      <th>Name / SKU</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Featured</th>
                      <th style={{ width: 90 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 6, background: '#e8e4da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>📦</div>
                          )}
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                          {p.sku && <div style={{ fontSize: '0.68rem', color: 'var(--stone)', fontFamily: 'monospace' }}>{p.sku}</div>}
                        </td>
                        <td>{p.brand ? <span className="badge badge-blue">{p.brand}</span> : '—'}</td>
                        <td><span className="badge badge-gray">{p.category}</span></td>
                        <td>
                          PKR {p.price?.toLocaleString()}
                          {p.compareAtPrice && <div style={{ fontSize: '0.65rem', color: '#aaa', textDecoration: 'line-through' }}>PKR {p.compareAtPrice.toLocaleString()}</div>}
                        </td>
                        <td>{stockBadge(p)}</td>
                        <td>{p.featured ? '⭐' : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-admin-icon" onClick={() => openEdit(p)} title="Edit">✎</button>
                            <button className="btn-admin-icon danger" onClick={() => handleDelete(p.id)} title="Delete">✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ── */}
      {tab === 'orders' && (
        <div className="card-admin">
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No orders yet</h3>
              <p>Orders from customers will appear here.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => openOrder(o)}>
                        <td><code style={{ fontSize: '0.7rem' }}>{o.order_number}</code></td>
                        <td>
                          <div><strong>{o.customer_name}</strong></div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--stone)' }}>{o.customer_phone}</div>
                        </td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</td>
                        <td>{o.quantity}</td>
                        <td>PKR {o.total_amount?.toLocaleString()}</td>
                        <td>{statusBadge(o.status)}</td>
                        <td>{payStatusBadge(o.payment_status)}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--stone)', whiteSpace: 'nowrap' }}>
                          {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <button className="btn-admin-icon" onClick={(e) => { e.stopPropagation(); openOrder(o) }} title="View">→</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCT EDIT MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {editing && (
        <Modal title={editing === 'new' ? 'Add Product' : 'Edit Product'} onClose={() => setEditing(null)} wide>
          <div className="admin-form" style={{ maxWidth: 'none' }}>

            {/* ── 1. Basic Information ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Basic Information</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Product name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grigri+" />
              </div>
              <div className="admin-field">
                <label>Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. petzl-grigri-plus" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>SKU</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PTZ-GR-001" />
              </div>
              <div className="admin-field">
                <label>Brand</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Petzl" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Harnesses & Belay" />
              </div>
            </div>

            {/* ── 2. Pricing ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Pricing</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Price (PKR) *</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="8500" />
              </div>
              <div className="admin-field">
                <label>Compare-at Price (for sale badge)</label>
                <input type="number" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} placeholder="Leave empty if not on sale" />
              </div>
            </div>

            {/* ── 3. Description ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Description</h3>
            <div className="admin-field">
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full product description…" />
            </div>

            {/* ── 4. Images ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Images</h3>
            <div className="admin-field">
              <label>Featured Image</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input
                      style={{ flex: 1 }}
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="Paste Cloudinary URL…"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      ref={mainFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                      style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files?.[0]) uploadMainImage(e.target.files[0]) }}
                    />
                    <button
                      className="btn-admin btn-admin-sm btn-admin-outline"
                      type="button"
                      disabled={uploadingMain}
                      onClick={() => mainFileRef.current?.click()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {uploadingMain ? (
                        <><span style={{ width: 14, height: 14, border: '2px solid var(--chalk-dim)', borderTop: '2px solid var(--orange)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Uploading…</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> Upload from device</>
                      )}
                    </button>
                  </div>
                  {form.imageUrl && (
                    <div className="admin-field" style={{ marginTop: 6 }}>
                      <label style={{ fontSize: '0.62rem' }}>Alt Text</label>
                      <input value={form.featuredImageAlt || ''}
                        onChange={(e) => setForm({ ...form, featuredImageAlt: e.target.value })}
                        placeholder="Describe the image for accessibility"
                        style={{ fontSize: '0.82rem', padding: '0.45em 0.7em' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {form.imageUrl && (
                <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                  <img src={form.imageUrl} alt="" style={{ maxHeight: 100, borderRadius: 6, border: '1px solid var(--border)' }} />
                  <button className="btn-admin-icon danger" onClick={() => setForm({ ...form, imageUrl: '', featuredImageAlt: '' })}
                    style={{ position: 'absolute', top: -6, right: -6, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}
                  >✕</button>
                </div>
              )}
            </div>

            <div className="admin-field" style={{ marginTop: 8 }}>
              <label>Gallery Images</label>
              {/* Thumbnail previews */}
              {form.images.filter((url) => url.trim()).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {form.images.filter((url) => url.trim()).map((url, i) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={url} alt={`Gallery ${i + 1}`}
                        style={{ width: 80, height: 80, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }} />
                      <button className="btn-admin-icon danger" onClick={() => removeGalleryImage(i)}
                        style={{ position: 'absolute', top: -6, right: -6, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', cursor: 'pointer', border: '1px solid #e5e0d4' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <input ref={additionalFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" multiple
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.length > 0) uploadAdditionalImages(e.target.files) }} />
                <button className="btn-admin btn-admin-sm btn-admin-outline" type="button" disabled={uploadingAdditional}
                  onClick={() => additionalFileRef.current?.click()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {uploadingAdditional ? (
                    <><span style={{ width: 14, height: 14, border: '2px solid var(--chalk-dim)', borderTop: '2px solid var(--orange)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Uploading…</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> Upload images</>
                  )}
                </button>
                <span style={{ color: 'var(--stone)', fontSize: '0.78rem' }}>or</span>
                <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={() => setForm({ ...form, images: [...form.images, ''] })}>
                  + Add URL field
                </button>
              </div>

              {/* Gallery image URL inputs */}
              {form.images.map((url, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input style={{ flex: 1 }} value={url}
                    onChange={(e) => setForm({ ...form, images: form.images.map((x, j) => j === i ? e.target.value : x) })}
                    placeholder={`Gallery image ${i + 1} URL`} />
                  {!url.trim() && (
                    <button className="btn-admin-icon danger" onClick={() => removeListItem('images', i)}>✕</button>
                  )}
                </div>
              ))}
              <p style={{ fontSize: '0.73rem', color: 'var(--stone)', marginTop: 4 }}>
                Upload images from your device, or paste Cloudinary URLs.
              </p>
            </div>

            {/* ── 5. Inventory ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Inventory</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Stock Quantity</label>
                <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" min="0" />
              </div>
              <div className="admin-field">
                <label>Low Stock Threshold</label>
                <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="5" min="1" />
              </div>
            </div>
            <div className="admin-field">
              <label>Stock Status</label>
              <select value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}>
                {STOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* ── 6. Variants ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>
              Variants
              <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={() => addListItem('variants', { name: '', value: '', price: '', sku: '', stockQuantity: 0 })}
                style={{ float: 'right', marginTop: -4 }}>+ Add Variant</button>
            </h3>
            {form.variants.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--stone)', margin: 0 }}>No variants yet. Click "Add Variant" to add size, color, etc.</p>
            )}
            {form.variants.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <select style={{ width: 90, padding: '0.5em', borderRadius: 6, border: '1px solid #d8d0bc', fontSize: '0.82rem' }}
                  value={v.name} onChange={(e) => updateListItem('variants', i, 'name', e.target.value)}>
                  <option value="">Type</option>
                  <option value="Size">Size</option>
                  <option value="Color">Color</option>
                  <option value="Length">Length</option>
                  <option value="Weight">Weight</option>
                  <option value="Style">Style</option>
                </select>
                <input style={{ width: 100 }} value={v.value} onChange={(e) => updateListItem('variants', i, 'value', e.target.value)} placeholder="Value" />
                <input style={{ width: 90 }} type="number" value={v.price} onChange={(e) => updateListItem('variants', i, 'price', e.target.value)} placeholder="Price" />
                <input style={{ width: 90 }} value={v.sku} onChange={(e) => updateListItem('variants', i, 'sku', e.target.value)} placeholder="SKU" />
                <input style={{ width: 70 }} type="number" value={v.stockQuantity} onChange={(e) => updateListItem('variants', i, 'stockQuantity', e.target.value)} placeholder="Qty" />
                <button className="btn-admin-icon danger" onClick={() => removeListItem('variants', i)}>✕</button>
              </div>
            ))}

            {/* ── 7. Specifications ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>
              Specifications
              <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={() => addListItem('specifications', { key: '', value: '' })}
                style={{ float: 'right', marginTop: -4 }}>+ Add Spec</button>
            </h3>
            {form.specifications.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input style={{ flex: 1 }} value={s.key} onChange={(e) => updateListItem('specifications', i, 'key', e.target.value)} placeholder="e.g. Material" />
                <input style={{ flex: 1 }} value={s.value} onChange={(e) => updateListItem('specifications', i, 'value', e.target.value)} placeholder="e.g. Nylon" />
                <button className="btn-admin-icon danger" onClick={() => removeListItem('specifications', i)}>✕</button>
              </div>
            ))}

            {/* ── 8. Features ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Features</h3>
            {form.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input style={{ flex: 1 }} value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                <button className="btn-admin-icon danger" onClick={() => removeFeature(i)} title="Remove">✕</button>
              </div>
            ))}
            <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addFeature} style={{ alignSelf: 'flex-start' }}>+ Add Feature</button>

            {/* ── 9. Shipping ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Shipping</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Delivery Time</label>
                <input value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} placeholder="e.g. 2–3 Days" />
              </div>
              <div className="admin-field" style={{ justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', marginTop: 22 }}>
                  <input type="checkbox" checked={form.freeShipping} onChange={(e) => setForm({ ...form, freeShipping: e.target.checked })} />
                  Free Shipping Eligible
                </label>
              </div>
            </div>

            {/* ── 10. Warranty ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Warranty</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Warranty Period</label>
                <input value={form.warrantyPeriod} onChange={(e) => setForm({ ...form, warrantyPeriod: e.target.value })} placeholder="e.g. 1 Year" />
              </div>
              <div className="admin-field">
                <label>Warranty Details</label>
                <input value={form.warrantyDetails} onChange={(e) => setForm({ ...form, warrantyDetails: e.target.value })} placeholder="e.g. Covers manufacturer defects" />
              </div>
            </div>

            {/* ── 11. Returns ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Returns</h3>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Return Window</label>
                <input value={form.returnWindow} onChange={(e) => setForm({ ...form, returnWindow: e.target.value })} placeholder="e.g. 30 Days" />
              </div>
              <div className="admin-field">
                <label>Return Policy</label>
                <input value={form.returnPolicy} onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })} placeholder="e.g. Full refund within 30 days" />
              </div>
            </div>

            {/* ── 12. SEO ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>SEO</h3>
            <div className="admin-field">
              <label>SEO Title</label>
              <input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="e.g. Petzl Grigri+ Belay Device | Climb Crux Pakistan" />
            </div>
            <div className="admin-field">
              <label>Meta Description</label>
              <textarea rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="A short description for search engines…" />
            </div>
            <div className="admin-field">
              <label>Canonical URL</label>
              <input value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} placeholder="https://climbcruxpakistan.com/shop/product-slug" />
            </div>

            {/* ── 13. Flags ── */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--orange)', borderBottom: '2px solid var(--orange)', paddingBottom: 6, margin: '16px 0 8px' }}>Settings</h3>
            <div className="admin-form-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Featured (show on homepage)
              </label>
              <div className="admin-field" style={{ maxWidth: 120 }}>
                <label>Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="admin-form-actions" style={{ marginTop: 16 }}>
              <button className="btn-admin btn-admin-primary" onClick={handleSave}>Save Product</button>
              <button className="btn-admin btn-admin-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>

          </div>
        </Modal>
      )}

      {/* ── Order Detail Modal ── */}
      {viewOrder && (
        <Modal title={`Order #${viewOrder.order_number}`} onClose={() => setViewOrder(null)}>
          <div className="admin-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--stone)', marginBottom: 8 }}>Customer</h4>
                <p style={{ margin: 0, fontWeight: 600 }}>{viewOrder.customer_name}</p>
                {viewOrder.customer_phone && <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--stone)' }}>📞 {viewOrder.customer_phone}</p>}
                {viewOrder.customer_email && <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--stone)' }}>✉ {viewOrder.customer_email}</p>}
                {viewOrder.customer_address && <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--stone)' }}>📍 {viewOrder.customer_address}</p>}
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--stone)', marginBottom: 8 }}>Order</h4>
                <p style={{ margin: 0 }}><strong>{viewOrder.product_name}</strong></p>
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--stone)' }}>Qty: {viewOrder.quantity} × PKR {viewOrder.product_price?.toLocaleString()}</p>
                <p style={{ margin: '4px 0', fontWeight: 700, color: 'var(--orange)' }}>Total: PKR {viewOrder.total_amount?.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>Status</span><div style={{ marginTop: 4 }}>{statusBadge(viewOrder.status)}</div></div>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>Payment</span><div style={{ marginTop: 4 }}>{payStatusBadge(viewOrder.payment_status)}</div></div>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>Payment Method</span><div style={{ marginTop: 4, fontSize: '0.85rem', fontWeight: 500 }}>{viewOrder.payment_method || '—'}</div></div>
              {viewOrder.paid_at && <div><span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>Paid at</span><div style={{ marginTop: 4, fontSize: '0.85rem' }}>{new Date(viewOrder.paid_at).toLocaleString()}</div></div>}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <h4 style={{ fontSize: '0.85rem', marginBottom: 12 }}>Update Status</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['pending_payment', 'pending_verification', 'confirmed', 'shipped', 'cancelled'].map((s) => (
                <button key={s}
                  className={`btn-admin btn-admin-sm ${viewOrder.status === s ? 'btn-admin-primary' : 'btn-admin-outline'}`}
                  onClick={() => handleUpdateStatus(viewOrder.id, s)}
                  disabled={viewOrder.status === s}
                >{s.replace(/_/g, ' ')}</button>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <h4 style={{ fontSize: '0.85rem', marginBottom: 12 }}>Update Payment</h4>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Payment Status</label>
                <select value={payForm.payment_status} onChange={(e) => setPayForm({ ...payForm, payment_status: e.target.value })}>
                  {['pending', 'verification_required', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Payment Method</label>
                <input value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })} placeholder="Bank Transfer / EasyPaisa" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field"><label>Payer Bank</label><input value={payForm.payer_bank} onChange={(e) => setPayForm({ ...payForm, payer_bank: e.target.value })} /></div>
              <div className="admin-field"><label>Payer Name</label><input value={payForm.payer_name} onChange={(e) => setPayForm({ ...payForm, payer_name: e.target.value })} /></div>
              <div className="admin-field"><label>Payer Phone</label><input value={payForm.payer_phone} onChange={(e) => setPayForm({ ...payForm, payer_phone: e.target.value })} /></div>
            </div>
            <div className="admin-form-actions">
              <button className="btn-admin btn-admin-primary" onClick={() => handleUpdatePayment(viewOrder.id)}>Update Payment</button>
              <button className="btn-admin btn-admin-outline" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
