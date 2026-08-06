import { useState, useEffect, useRef, useMemo } from 'react'
import { getProducts, saveProduct, deleteProduct } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api')

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

function emptyImages() { return [''] }

const STOCK_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'backorder', label: 'Backorder' },
]

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const EDITOR_TABS = [
  { id: 'general', label: 'General' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'images', label: 'Images' },
  { id: 'variants', label: 'Variants' },
  { id: 'specs', label: 'Specifications' },
  { id: 'features', label: 'Features' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'seo', label: 'SEO' },
  { id: 'publish', label: 'Publish' },
]

export default function ShopManager() {
  const { addToast } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editorTab, setEditorTab] = useState('general')
  const [editing, setEditing] = useState(null)

  // ── Search, Filters, Sorting ──
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStock, setFilterStock] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  // ── Form state ──
  const [form, setForm] = useState({
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
    featured: false, sortOrder: 0, status: 'published',
  })
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingAdditional, setUploadingAdditional] = useState(false)
  const mainFileRef = useRef()
  const additionalFileRef = useRef()

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function reload() {
    return getProducts().then(setProducts).catch(console.error)
  }

  // ── Derive unique categories & brands for filter dropdowns ──
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean))
    return [...set].sort()
  }, [products])

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean))
    return [...set].sort()
  }, [products])

  // ── Search + Filter + Sort logic ──
  const filteredProducts = useMemo(() => {
    let list = [...products]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      )
    }

    // Filters
    if (filterCategory) list = list.filter((p) => p.category === filterCategory)
    if (filterBrand) list = list.filter((p) => p.brand === filterBrand)
    if (filterStock) list = list.filter((p) => (p.stockStatus || (p.inStock ? 'in_stock' : 'out_of_stock')) === filterStock)
    if (filterStatus) list = list.filter((p) => (p.status || 'published') === filterStatus)
    if (filterPriceMin) list = list.filter((p) => (p.price || 0) >= parseFloat(filterPriceMin))
    if (filterPriceMax) list = list.filter((p) => (p.price || 0) <= parseFloat(filterPriceMax))

    // Sort
    list.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'createdAt': cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0); break
        case 'price': cmp = (a.price || 0) - (b.price || 0); break
        case 'stock': cmp = (a.stockQuantity || 0) - (b.stockQuantity || 0); break
        default: cmp = 0
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [products, search, filterCategory, filterBrand, filterStock, filterStatus, sortBy, sortDir])

  function toggleSortDir() { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')) }

  // ── Form helpers ──
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
      featured: false, sortOrder: 0, status: 'published',
    })
  }

  function openNew() {
    emptyForm()
    setEditorTab('general')
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
      status: p.status || 'published',
    })
    setEditorTab('general')
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
      shipping: { deliveryTime: form.deliveryTime, freeShipping: form.freeShipping },
      warranty: { period: form.warrantyPeriod, details: form.warrantyDetails },
      returns: { window: form.returnWindow, policy: form.returnPolicy },
      seo: { title: form.seoTitle, metaDescription: form.metaDescription, canonicalUrl: form.canonicalUrl },
      featured: form.featured,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      status: form.status,
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

  // ── Array field helpers ──
  function addListItem(field, empty) { setForm({ ...form, [field]: [...form[field], { ...empty }] }) }
  function updateListItem(field, idx, key, val) {
    setForm({ ...form, [field]: form[field].map((item, i) => i === idx ? { ...item, [key]: val } : item) })
  }
  function removeListItem(field, idx) { setForm({ ...form, [field]: form[field].filter((_, i) => i !== idx) }) }
  function moveListItem(field, idx, dir) {
    const items = [...form[field]]
    const target = idx + dir
    if (target < 0 || target >= items.length) return
    ;[items[idx], items[target]] = [items[target], items[idx]]
    setForm({ ...form, [field]: items })
  }

  // ── Feature helpers ──
  function addFeature() { setForm({ ...form, features: [...form.features, ''] }) }
  function updateFeature(idx, val) { setForm({ ...form, features: form.features.map((f, i) => i === idx ? val : f) }) }
  function removeFeature(idx) { setForm({ ...form, features: form.features.filter((_, i) => i !== idx) }) }

  // ── Image Upload ──
  async function uploadMainImage(file) {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
    if (!allowed.includes(file.type)) { addToast('Only JPG, PNG, GIF, WebP & AVIF images are allowed', 'error'); return }
    if (file.size > 10 * 1024 * 1024) { addToast('Image must be under 10MB', 'error'); return }

    setUploadingMain(true)
    const formData = new FormData()
    formData.append('photos', file)
    try {
      const res = await fetch(`${API}/uploads`, { method: 'POST', headers: { ...authHeaders() }, body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const uploaded = await res.json()
      if (uploaded?.length > 0) { setForm({ ...form, imageUrl: uploaded[0].url }); addToast('Main image uploaded', 'success') }
    } catch (err) { addToast(err.message || 'Upload failed', 'error') }
    finally { setUploadingMain(false); if (mainFileRef.current) mainFileRef.current.value = '' }
  }

  async function uploadAdditionalImages(files) {
    if (!files || files.length === 0) return
    if (files.length > 10) { addToast('You can upload up to 10 images at once', 'error'); return }

    setUploadingAdditional(true)
    const formData = new FormData()
    for (const file of files) formData.append('photos', file)
    try {
      const res = await fetch(`${API}/uploads`, { method: 'POST', headers: { ...authHeaders() }, body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const uploaded = await res.json()
      if (uploaded?.length > 0) {
        const newImgs = uploaded.map((p) => p.url)
        const existing = form.images.filter((url) => url.trim())
        setForm({ ...form, images: [...existing, ...newImgs, ''] })
        addToast(`${newImgs.length} image${newImgs.length > 1 ? 's' : ''} uploaded`, 'success')
      }
    } catch (err) { addToast(err.message || 'Upload failed', 'error') }
    finally { setUploadingAdditional(false); if (additionalFileRef.current) additionalFileRef.current.value = '' }
  }

  function removeGalleryImage(idx) {
    const filled = form.images.filter((url) => url.trim())
    const updated = filled.filter((_, j) => j !== idx)
    setForm({ ...form, images: updated.length > 0 ? [...updated, ''] : [''] })
  }

  function moveGalleryImage(idx, dir) {
    const filled = form.images.filter((url) => url.trim())
    const target = idx + dir
    if (target < 0 || target >= filled.length) return
    ;[filled[idx], filled[target]] = [filled[target], filled[idx]]
    setForm({ ...form, images: [...filled, ''] })
  }

  // ── Badge helpers ──
  const stockBadge = (p) => {
    const colors = { in_stock: 'badge-green', low_stock: 'badge-yellow', out_of_stock: 'badge-red', backorder: 'badge-blue' }
    const labels = { in_stock: 'In Stock', low_stock: 'Low', out_of_stock: 'Out', backorder: 'Backorder' }
    const s = p.stockStatus || (p.inStock ? 'in_stock' : 'out_of_stock')
    return <span className={`badge ${colors[s] || 'badge-green'}`}>{labels[s] || 'In Stock'}</span>
  }
  const pubBadge = (s) => {
    const colors = { published: 'badge-green', draft: 'badge-yellow', archived: 'badge-gray' }
    return <span className={`badge ${colors[s] || 'badge-gray'}`}>{s || 'published'}</span>
  }

  // ── Tabbed editor ──
  function renderEditorTab() {
    switch (editorTab) {
      case 'general': return renderGeneral()
      case 'pricing': return renderPricing()
      case 'inventory': return renderInventory()
      case 'images': return renderImages()
      case 'variants': return renderVariants()
      case 'specs': return renderSpecs()
      case 'features': return renderFeatures()
      case 'shipping': return renderShipping()
      case 'seo': return renderSEO()
      case 'publish': return renderPublish()
      default: return null
    }
  }

  /* ── Tab Content ── */

  function renderGeneral() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
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
            <label>Brand</label>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Petzl" />
          </div>
          <div className="admin-field">
            <label>Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Harnesses & Belay" />
          </div>
        </div>
        <div className="admin-field">
          <label>Description</label>
          <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full product description…" />
        </div>
      </div>
    )
  }

  function renderPricing() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Price (PKR) *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="8500" min="0" />
          </div>
          <div className="admin-field">
            <label>Compare-at Price (sale)</label>
            <input type="number" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} placeholder="Leave empty if not on sale" min="0" />
          </div>
        </div>
        {form.compareAtPrice && parseFloat(form.compareAtPrice) > parseFloat(form.price) && (
          <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.06)', borderRadius: 6, color: '#dc2626', fontSize: '0.85rem', fontWeight: 500 }}>
            Discount: -{Math.round(((parseFloat(form.compareAtPrice) - parseFloat(form.price)) / parseFloat(form.compareAtPrice)) * 100)}%
          </div>
        )}
      </div>
    )
  }

  function renderInventory() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PTZ-GR-001" />
          </div>
          <div className="admin-field">
            <label>Stock Quantity</label>
            <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" min="0" />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Low Stock Threshold</label>
            <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="5" min="1" />
          </div>
          <div className="admin-field">
            <label>Stock Status</label>
            <select value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}>
              {STOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        {form.stockQuantity > 0 && form.stockQuantity <= form.lowStockThreshold && (
          <div style={{ padding: '10px 14px', background: 'rgba(234,179,8,0.08)', borderRadius: 6, color: '#a16207', fontSize: '0.85rem', fontWeight: 500 }}>
            ⚠️ Stock level ({form.stockQuantity}) is at or below the low stock threshold ({form.lowStockThreshold})
          </div>
        )}
      </div>
    )
  }

  function renderImages() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <h4 style={{ fontSize: '0.78rem', color: 'var(--stone)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Featured Image</h4>
        <div className="admin-field">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Paste Cloudinary URL…" />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                <input ref={mainFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.[0]) uploadMainImage(e.target.files[0]) }} />
                <button className="btn-admin btn-admin-sm btn-admin-outline" type="button" disabled={uploadingMain}
                  onClick={() => mainFileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {uploadingMain ? <><span className="spinner-sm" /> Uploading…</> : <>📤 Upload from device</>}
                </button>
              </div>
            </div>
          </div>
          {form.imageUrl && (
            <div style={{ marginTop: 8 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={form.imageUrl} alt="" style={{ maxHeight: 100, borderRadius: 6, border: '1px solid var(--border)' }} />
                <button className="btn-admin-icon danger" onClick={() => setForm({ ...form, imageUrl: '', featuredImageAlt: '' })}
                  style={{ position: 'absolute', top: -6, right: -6, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>✕</button>
              </div>
              <div style={{ marginTop: 6 }}>
                <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--stone)' }}>Alt Text</label>
                <input value={form.featuredImageAlt || ''} onChange={(e) => setForm({ ...form, featuredImageAlt: e.target.value })} placeholder="Describe the image for accessibility" />
              </div>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
        <h4 style={{ fontSize: '0.78rem', color: 'var(--stone)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gallery Images</h4>
        <div className="admin-field">
          {/* Upload button */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <input ref={additionalFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" multiple
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.length > 0) uploadAdditionalImages(e.target.files) }} />
            <button className="btn-admin btn-admin-sm btn-admin-outline" type="button" disabled={uploadingAdditional}
              onClick={() => additionalFileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {uploadingAdditional ? <><span className="spinner-sm" /> Uploading…</> : <>📤 Upload images</>}
            </button>
            <span style={{ color: 'var(--stone)', fontSize: '0.78rem' }}>or</span>
            <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={() => setForm({ ...form, images: [...form.images, ''] })}>
              + Add URL field
            </button>
            <span style={{ color: 'var(--stone)', fontSize: '0.73rem', marginLeft: 'auto' }}>Drag arrows to reorder</span>
          </div>

          {/* Gallery grid with thumbnails */}
          {form.images.filter((url) => url.trim()).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.images.filter((url) => url.trim()).map((url, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 8, background: '#f8f6f2', borderRadius: 6 }}>
                  <img src={url} alt={`Gallery ${i + 1}`} style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                  <input style={{ flex: 1 }} value={url} onChange={(e) => {
                    const filled = form.images.filter((u) => u.trim())
                    filled[i] = e.target.value
                    setForm({ ...form, images: [...filled, ''] })
                  }} placeholder={`Gallery image ${i + 1} URL`} />
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn-admin-icon" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0} title="Move up">↑</button>
                    <button className="btn-admin-icon" onClick={() => moveGalleryImage(i, 1)} disabled={i === form.images.filter((u) => u.trim()).length - 1} title="Move down">↓</button>
                    <button className="btn-admin-icon danger" onClick={() => removeGalleryImage(i)} title="Remove">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderVariants() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--stone)' }}>Add size, color, length, weight options.</p>
          <button className="btn-admin btn-admin-sm btn-admin-primary" onClick={() => addListItem('variants', { name: '', value: '', price: '', sku: '', stockQuantity: 0 })}>+ Add Variant</button>
        </div>
        {form.variants.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--stone)', padding: 20, textAlign: 'center' }}>No variants yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.variants.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', padding: 8, background: '#f8f6f2', borderRadius: 6 }}>
                <select style={{ width: 90, padding: '0.45em', borderRadius: 6, border: '1px solid #d8d0bc', fontSize: '0.82rem' }}
                  value={v.name} onChange={(e) => updateListItem('variants', i, 'name', e.target.value)}>
                  <option value="">Type</option>
                  <option value="Size">Size</option>
                  <option value="Color">Color</option>
                  <option value="Length">Length</option>
                  <option value="Weight">Weight</option>
                  <option value="Style">Style</option>
                </select>
                <input style={{ width: 100 }} value={v.value} onChange={(e) => updateListItem('variants', i, 'value', e.target.value)} placeholder="Value" />
                <input style={{ width: 80 }} type="number" value={v.price} onChange={(e) => updateListItem('variants', i, 'price', e.target.value)} placeholder="Price" />
                <input style={{ width: 80 }} value={v.sku} onChange={(e) => updateListItem('variants', i, 'sku', e.target.value)} placeholder="SKU" />
                <input style={{ width: 60 }} type="number" value={v.stockQuantity} onChange={(e) => updateListItem('variants', i, 'stockQuantity', e.target.value)} placeholder="Qty" />
                <button className="btn-admin-icon danger" onClick={() => removeListItem('variants', i)} title="Remove variant">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderSpecs() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--stone)' }}>Key-value pairs for technical specifications.</p>
          <button className="btn-admin btn-admin-sm btn-admin-primary" onClick={() => addListItem('specifications', { key: '', value: '' })}>+ Add Spec</button>
        </div>
        {form.specifications.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--stone)', padding: 20, textAlign: 'center' }}>No specifications yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.specifications.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input style={{ flex: 1 }} value={s.key} onChange={(e) => updateListItem('specifications', i, 'key', e.target.value)} placeholder="e.g. Material" />
                <input style={{ flex: 1 }} value={s.value} onChange={(e) => updateListItem('specifications', i, 'value', e.target.value)} placeholder="e.g. Nylon" />
                <button className="btn-admin-icon danger" onClick={() => removeListItem('specifications', i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderFeatures() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--stone)', marginBottom: 12 }}>Key selling points shown as highlights on the product page.</p>
        {form.features.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--stone)', padding: 20, textAlign: 'center' }}>No features yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input style={{ flex: 1 }} value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                <button className="btn-admin-icon danger" onClick={() => removeFeature(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
        <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addFeature} style={{ alignSelf: 'flex-start', marginTop: 8 }}>+ Add Feature</button>
      </div>
    )
  }

  function renderShipping() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Delivery Time</label>
            <input value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} placeholder="e.g. 2–3 Days" />
            <span className="field-hint">Estimated delivery timeframe</span>
          </div>
          <div className="admin-field" style={{ justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', marginTop: 22 }}>
              <input type="checkbox" checked={form.freeShipping} onChange={(e) => setForm({ ...form, freeShipping: e.target.checked })} />
              Free Shipping Eligible
            </label>
          </div>
        </div>
      </div>
    )
  }

  function renderSEO() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <div className="admin-field">
          <label>SEO Title</label>
          <input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="e.g. Petzl Grigri+ Belay Device | Climb Crux Pakistan" />
          <span className="field-hint">{form.seoTitle ? `${form.seoTitle.length} characters — recommended: 50–60` : ''}</span>
        </div>
        <div className="admin-field">
          <label>Meta Description</label>
          <textarea rows={3} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="A short description for search engines…" />
          <span className="field-hint">{form.metaDescription ? `${form.metaDescription.length} characters — recommended: 150–160` : ''}</span>
        </div>
        <div className="admin-field">
          <label>Canonical URL</label>
          <input value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} placeholder="https://www.climbcruxpakistan.com/shop/product-slug" />
        </div>
      </div>
    )
  }

  function renderPublish() {
    return (
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="field-hint">
              {form.status === 'draft' ? 'Hidden from customers. Save as draft while building.' :
               form.status === 'published' ? 'Visible to customers on the shop page.' :
               'Removed from the shop but kept in the database.'}
            </span>
          </div>
          <div className="admin-field">
            <label>Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            <span className="field-hint">Lower numbers appear first.</span>
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', marginTop: 8 }}>
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          Featured (show on homepage)
        </label>
        <div style={{ marginTop: 16, padding: '14px 16px', background: form.status === 'published' ? 'rgba(34,197,94,0.06)' : form.status === 'draft' ? 'rgba(234,179,8,0.06)' : 'rgba(100,100,100,0.04)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: form.status === 'published' ? '#16a34a' : form.status === 'draft' ? '#a16207' : 'var(--stone-dark)' }}>
            {form.status === 'published' ? '✅ Published — visible to customers' :
             form.status === 'draft' ? '✏️ Draft — hidden from customers' :
             '📦 Archived — hidden from customers'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--stone)', marginTop: 4 }}>
            {form.status === 'published' ? 'This product is live on your shop page.' :
             form.status === 'draft' ? 'Save as Published when ready to launch.' :
             'Archived products can be restored anytime.'}
          </div>
        </div>
      </div>
    )
  }

  // ── Reset filters ──
  function resetFilters() {
    setSearch('')
    setFilterCategory('')
    setFilterBrand('')
    setFilterStock('')
    setFilterStatus('')
    setFilterPriceMin('')
    setFilterPriceMax('')
    setSortBy('name')
    setSortDir('asc')
  }

  const hasFilters = search || filterCategory || filterBrand || filterStock || filterStatus || filterPriceMin || filterPriceMax

  if (loading) return <div className="empty-state"><h3>Loading shop…</h3></div>

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>The Shop</h1>
          <p className="page-header-admin-desc">Manage products. Order fulfilment lives on the Sales page.</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Product</button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCTS LIST
          ═══════════════════════════════════════════════════════════════ */}
          {/* Search + Filters bar */}
          <div className="card-admin" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div className="admin-form-row" style={{ alignItems: 'flex-end' }}>
              <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                <label>Search</label>
                <div className="search-bar" style={{ maxWidth: '100%' }}>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU or category…" />
                </div>
              </div>
            </div>
            <div className="admin-form-row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
              <div className="admin-field">
                <label>Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Brand</label>
                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                  <option value="">All brands</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Stock</label>
                <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                  <option value="">All stock statuses</option>
                  {STOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Price Range</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} placeholder="Min" min="0" style={{ width: '48%', padding: '0.45em 0.6em', border: '1px solid #d8d0bc', borderRadius: 6, fontSize: '0.82rem' }} />
                  <span style={{ color: 'var(--stone)' }}>–</span>
                  <input type="number" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} placeholder="Max" min="0" style={{ width: '48%', padding: '0.45em 0.6em', border: '1px solid #d8d0bc', borderRadius: 6, fontSize: '0.82rem' }} />
                </div>
              </div>
              <div className="admin-field">
                <label>Sort</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: 1 }}>
                    <option value="name">Name</option>
                    <option value="createdAt">Date Added</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock</option>
                  </select>
                  <button className="btn-admin btn-admin-sm btn-admin-outline" onClick={toggleSortDir} title={sortDir === 'asc' ? 'Ascending' : 'Descending'} style={{ padding: '0.4em 0.6em' }}>
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
            {hasFilters && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--stone)' }}>{filteredProducts.length} of {products.length} products</span>
                <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={resetFilters}>Clear filters</button>
              </div>
            )}
          </div>

          {/* Product list */}
          <div className="card-admin" style={{ padding: 0 }}>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>{hasFilters ? 'No products match your search' : 'No products yet'}</h3>
                <p>{hasFilters ? 'Try adjusting your filters.' : 'Add your first product to start selling gear.'}</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ boxShadow: 'none' }}>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>Img</th>
                        <th>Name / SKU</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e8e4da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>📦</div>
                            )}
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                            {p.sku && <div style={{ fontSize: '0.68rem', color: 'var(--stone)', fontFamily: 'monospace' }}>{p.sku}</div>}
                          </td>
                          <td><span className="badge badge-gray">{p.category}</span></td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            PKR {p.price?.toLocaleString()}
                            {p.compareAtPrice && <div style={{ fontSize: '0.62rem', color: '#aaa', textDecoration: 'line-through' }}>PKR {p.compareAtPrice.toLocaleString()}</div>}
                          </td>
                          <td>{stockBadge(p)}</td>
                          <td>{pubBadge(p.status || 'published')}</td>
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

      {/* ═══════════════════════════════════════════════════════════════
          TABBED PRODUCT EDITOR MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {editing && (
        <Modal title={editing === 'new' ? 'Add Product' : 'Edit Product'} onClose={() => setEditing(null)} wide>
          {/* Tab navigation */}
          <div className="editor-tabs">
            {EDITOR_TABS.map((t) => (
              <button key={t.id} className={`editor-tab ${editorTab === t.id ? 'is-active' : ''}`} onClick={() => setEditorTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="editor-content">
            {renderEditorTab()}
          </div>

          {/* Actions bar */}
          <div className="editor-actions">
            <button className="btn-admin btn-admin-primary" onClick={handleSave}>Save Product</button>
            <button className="btn-admin btn-admin-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
.spinner-sm { width: 14px; height: 14px; border: 2px solid var(--chalk-dim); border-top: 2px solid var(--orange); border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite; }
.editor-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 20px; overflow-x: auto; flex-wrap: nowrap; }
.editor-tab { font-family: var(--font-display); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.06em; padding: 0.6em 1em; border: none; background: transparent; color: var(--stone); cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s ease; font-weight: 600; }
.editor-tab:hover { color: var(--charcoal); background: var(--chalk-dim); }
.editor-tab.is-active { color: var(--orange); border-bottom-color: var(--orange); background: rgba(243,111,33,0.04); }
.editor-content { min-height: 300px; }
.editor-actions { display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); margin-top: 16px; }
@media (max-width: 600px) { .editor-tabs { gap: 0; } .editor-tab { font-size: 0.65rem; padding: 0.5em 0.7em; } }
`}</style>
    </>
  )
}
