import { useState, useEffect, useMemo } from 'react'
import { getGallery, saveGalleryItem, deleteGalleryItem } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const API = import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api'
const CATEGORIES = ['Public Sessions', 'Private Sessions']

export default function GalleryManager() {
  const { addToast } = useToast()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ tag: '', cat: CATEGORIES[0], imageUrl: '', caption: '', photoSlug: '' })
  const [filter, setFilter] = useState('All')
  const [uploadPhotos, setUploadPhotos] = useState([])
  const [slugPreview, setSlugPreview] = useState([])
  const [slugLoading, setSlugLoading] = useState(false)

  useEffect(() => {
    getGallery()
      .then(setPhotos)
      .catch(console.error)
      .finally(() => setLoading(false))

    // Fetch all upload photos for slug matching
    fetch(`${API}/uploads`)
      .then((r) => r.json())
      .then(setUploadPhotos)
      .catch(() => {})
  }, [])

  // All unique tags available from uploaded photos (filtering out old category tags)
  const availablePhotoTags = useMemo(() => {
    const oldPageTags = ['main', 'gallery', 'instructors', 'about', 'sessions']
    const tags = [...new Set(uploadPhotos.flatMap((p) => p.tags || []))]
      .filter((t) => !oldPageTags.includes(t.toLowerCase()))
      .sort()
    return tags
  }, [uploadPhotos])

  // When photoSlug changes, find matching photos from uploads
  useEffect(() => {
    if (!form.photoSlug || form.photoSlug.trim() === '') {
      setSlugPreview([])
      return
    }
    setSlugLoading(true)
    const slug = form.photoSlug.trim().toLowerCase()
    const matches = uploadPhotos.filter((p) =>
      (p.tags || []).some((t) => t.toLowerCase() === slug)
    )
    setSlugPreview(matches)
    setSlugLoading(false)
  }, [form.photoSlug, uploadPhotos])

  function openNew() {
    setForm({ tag: '', cat: CATEGORIES[0], imageUrl: '', caption: '', photoSlug: '' })
    setEditing('new')
  }

  function openEdit(g) {
    setForm({
      tag: g.tag,
      cat: g.cat,
      imageUrl: g.imageUrl || '',
      caption: g.caption || '',
      photoSlug: g.photoSlug || '',
    })
    setEditing(g.id)
  }

  async function handleSave() {
    if (!form.tag) { addToast('Tag/description is required', 'error'); return }
    const item = editing === 'new' ? { id: null, ...form } : { id: editing, ...form }
    await saveGalleryItem(item)
    setPhotos(await getGallery())
    setEditing(null)
    addToast('Gallery item saved', 'success')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this gallery item?')) return
    await deleteGalleryItem(id)
    setPhotos(await getGallery())
    addToast('Gallery item deleted', 'success')
  }

  const shown = filter === 'All' ? photos : photos.filter((p) => p.cat === filter)

  if (loading) return <div className="empty-state"><h3>Loading gallery…</h3></div>

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Gallery</h1>
          <p className="page-header-admin-desc">
            Manage gallery photos. Connect a photo slug to automatically show all images with that tag from the{' '}
            <a href="/photos" style={{ color: 'var(--orange)' }}>Photos tab</a>.
          </p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Album</button>
      </div>

      {/* Browse existing gallery items */}
      <div className="card-admin">
        <div className="card-admin-header">
          <h2>All Albums ({photos.length})</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All', ...CATEGORIES].map((c) => (
              <button key={c} className={`btn-admin btn-admin-sm ${filter === c ? 'btn-admin-primary' : 'btn-admin-ghost'}`} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">▦</div>
            <h3>No albums</h3>
            <p>No albums in this category yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {shown.map((p) => {
              // Count photos from this album's slug
              const slug = p.photoSlug?.trim().toLowerCase()
              const matchedPhotos = slug
                ? uploadPhotos.filter((up) => (up.tags || []).some((t) => t.toLowerCase() === slug))
                : []
              const hasSlug = slug && matchedPhotos.length > 0

              return (
                <div key={p.id} style={{
                  borderRadius: 8, overflow: 'hidden', background: '#fff',
                  border: '1px solid #e5e0d4', display: 'flex', flexDirection: 'column',
                }}>
                  {/* Image — show slug preview if available, else fallback to imageUrl */}
                  <div style={{ aspectRatio: '1', overflow: 'hidden', background: 'linear-gradient(155deg, #383839, #2c2b2d, #cf5711)', position: 'relative' }}>
                    {hasSlug ? (
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
                        width: '100%', height: '100%', gap: 1,
                      }}>
                        {matchedPhotos.slice(0, 4).map((mp, i) => (
                          <img key={i} src={mp.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ))}
                      </div>
                    ) : p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ padding: 16, color: '#f6f2e9', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>{p.cat}</span>
                        <span style={{ fontSize: '0.82rem', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.tag}</span>
                      </div>
                    )}
                    {p.photoSlug && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4,
                        fontFamily: 'monospace',
                      }}>
                        slug: {p.photoSlug}
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--stone)' }}>
                      {matchedPhotos.length > 0 ? `${matchedPhotos.length} photo${matchedPhotos.length > 1 ? 's' : ''}` : p.cat}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-admin-icon" onClick={() => openEdit(p)} title="Edit">✎</button>
                      <button className="btn-admin-icon danger" onClick={() => handleDelete(p.id)} title="Delete">✕</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add Album' : 'Edit Album'} onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="admin-field">
              <label>Tag / Description</label>
              <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Public Session · Belay Practice" />
            </div>
            <div className="admin-field">
              <label>Category</label>
              <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>

            {/* Photo Slug — link to Photos tab */}
            <div className="card-admin" style={{ border: '2px solid var(--orange)', background: '#fefcf9', padding: 16 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                📸 Link photos from the Photos tab
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--stone)', margin: '0 0 12px' }}>
                Click a tag below to automatically show all photos with that tag in this album.
                Photos must first be uploaded in the{' '}
                <a href="/photos" style={{ color: 'var(--orange)', fontWeight: 600 }}>Photos tab</a>.
              </p>

              {/* Available photo tags as large clickable cards */}
              {availablePhotoTags.length > 0 ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {availablePhotoTags.map((tag) => {
                    const isActive = form.photoSlug?.trim().toLowerCase() === tag.toLowerCase()
                    const tagCount = uploadPhotos.filter((p) =>
                      (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase())
                    ).length
                    const previewPhotos = uploadPhotos
                      .filter((p) => (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase()))
                      .slice(0, 3)

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setForm({ ...form, photoSlug: isActive ? '' : tag })}
                        style={{
                          padding: 0,
                          borderRadius: 10,
                          border: isActive ? '2px solid var(--orange)' : '2px solid #e0dbcf',
                          cursor: 'pointer',
                          background: isActive ? '#fff' : '#f8f6f2',
                          width: 130,
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 2px 12px rgba(243,111,33,0.2)' : 'none',
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = '#cf5711'
                            e.currentTarget.style.background = '#fff'
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = '#e0dbcf'
                            e.currentTarget.style.background = '#f8f6f2'
                          }
                        }}
                      >
                        {/* Mini photo preview */}
                        {previewPhotos.length > 0 ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${Math.min(previewPhotos.length, 3)}, 1fr)`,
                            height: 65,
                            gap: 1,
                            overflow: 'hidden',
                          }}>
                            {previewPhotos.map((pp, i) => (
                              <img key={i} src={pp.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ))}
                          </div>
                        ) : (
                          <div style={{ height: 65, background: '#e8e4da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#b0a898' }}>
                            No photos yet
                          </div>
                        )}
                        {/* Tag name & count */}
                        <div style={{ padding: '8px 10px', textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isActive ? 'var(--orange)' : '#444' }}>
                            {tag}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--stone)' }}>
                            {tagCount} photo{tagCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {isActive && (
                          <div style={{
                            position: 'absolute', top: 6, right: 6,
                            background: 'var(--orange)', color: '#fff',
                            borderRadius: '50%', width: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 700,
                          }}>
                            ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div style={{ padding: '12px', background: '#f0ede6', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--stone)', margin: 0 }}>
                    No photos uploaded yet.{' '}
                    <a href="/photos" style={{ color: 'var(--orange)' }}>Go to the Photos tab</a> to upload images with tags.
                  </p>
                </div>
              )}

              {/* Live preview of slug-matched photos */}
              {form.photoSlug?.trim() && (
                <div style={{ marginTop: 12 }}>
                  {slugLoading ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--stone)' }}>Loading photos…</p>
                  ) : slugPreview.length > 0 ? (
                    <div>
                      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#555', margin: '8px 0 4px' }}>
                        Preview — {slugPreview.length} photo{slugPreview.length > 1 ? 's' : ''} tagged "{form.photoSlug}":
                      </p>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))',
                        gap: 4, maxHeight: 160, overflowY: 'auto',
                      }}>
                        {slugPreview.map((sp) => (
                          <img
                            key={sp.id || sp._id}
                            src={sp.url}
                            alt={sp.title || ''}
                            title={sp.title || sp.originalName}
                            style={{
                              width: '100%', aspectRatio: '1', objectFit: 'cover',
                              borderRadius: 4, cursor: 'pointer',
                              border: '2px solid transparent',
                              transition: 'border-color 0.15s',
                            }}
                            onMouseOver={(e) => e.target.style.borderColor = 'var(--orange)'}
                            onMouseOut={(e) => e.target.style.borderColor = 'transparent'}
                            onClick={() => {
                              navigator.clipboard.writeText(sp.url)
                              addToast('Photo URL copied to clipboard', 'success')
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Manual fallback URL */}
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--stone)' }}>
                Or manually paste a Cloudinary URL
              </summary>
              <div className="admin-field" style={{ marginTop: 8 }}>
                <label>Image URL</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Paste Cloudinary URL from Photos tab" />
                {form.imageUrl && <img src={form.imageUrl} alt="" style={{ marginTop: 4, maxHeight: 80, borderRadius: 4, objectFit: 'cover' }} />}
              </div>
              <div className="admin-field">
                <label>Caption (optional)</label>
                <textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} rows={2} placeholder="A short description of what's happening in this photo…" />
              </div>
            </details>

            <div className="admin-form-actions" style={{ marginTop: 12 }}>
              <button className="btn-admin btn-admin-primary" onClick={handleSave}>Save</button>
              <button className="btn-admin btn-admin-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
