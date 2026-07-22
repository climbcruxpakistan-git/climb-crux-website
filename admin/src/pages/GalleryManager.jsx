import { useState, useEffect, useMemo, useRef } from 'react'
import { getGallery, saveGalleryItem, deleteGalleryItem } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const API = import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api'
const DEFAULT_CATEGORIES = ['Public Sessions', 'Private Sessions', 'High Grade Rock Climbing']

export default function GalleryManager() {
  const { addToast } = useToast()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ tag: '', cat: '', imageUrl: '', caption: '', photoSlug: '' })
  const [activeFolder, setActiveFolder] = useState(null)
  const [uploadPhotos, setUploadPhotos] = useState([])
  const [slugPreview, setSlugPreview] = useState([])
  const [slugLoading, setSlugLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  // Build unique categories from existing albums + defaults
  const existingCategories = useMemo(() => {
    const fromAlbums = [...new Set(photos.map((p) => p.cat).filter(Boolean))]
    const merged = new Set([...DEFAULT_CATEGORIES, ...fromAlbums])
    return [...merged].sort()
  }, [photos])

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
    // At category level: create a new category — leave category field empty for the admin to type
    setForm({ tag: '', cat: '', imageUrl: '', caption: '', photoSlug: '' })
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
    if (!form.cat) { addToast('Category is required', 'error'); return }
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

  /* ── File upload handlers ── */
  function handleFileSelect(e) {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  function handleFileDrop(e) {
    handleFiles(e.dataTransfer.files)
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return
    if (files.length > 20) {
      addToast(`You can upload up to 20 photos at a time. ${files.length} selected.`, 'error')
      return
    }

    // Auto-generate a slug from the subfolder tag
    const tagSlug = form.tag
      ? form.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : `subfolder-${Date.now()}`

    setUploading(true)

    const formData = new FormData()
    for (const file of files) {
      formData.append('photos', file)
    }
    formData.append('tags', tagSlug)
    if (form.tag.trim()) formData.append('title', form.tag.trim())

    try {
      const res = await fetch(`${API}/uploads`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }
      const uploaded = await res.json()

      // Update upload photos list
      setUploadPhotos((prev) => [...uploaded, ...prev])

      // Auto-set the photo slug to match
      setForm((prev) => ({ ...prev, photoSlug: tagSlug }))

      addToast(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} uploaded & linked`, 'success')
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  // Helper: get photo count for a subfolder
  function getSubfolderPhotoCount(item) {
    const slug = item.photoSlug?.trim().toLowerCase()
    if (!slug) return 0
    return uploadPhotos.filter((up) => (up.tags || []).some((t) => t.toLowerCase() === slug)).length
  }

  // Subfolders visible in the current folder view
  const shown = activeFolder
    ? photos.filter((p) => p.cat === activeFolder)
    : []

  // Helper: add subfolder from within a category folder — pre-selects its category
  function openNewInFolder() {
    const cat = activeFolder || (existingCategories.length > 0 ? existingCategories[0] : '')
    setForm({ tag: '', cat, imageUrl: '', caption: '', photoSlug: '' })
    setEditing('new')
  }

  if (loading) return <div className="empty-state"><h3>Loading gallery…</h3></div>

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Gallery</h1>
          <p className="page-header-admin-desc">
            Browse category folders. Click into a folder to see its subfolders (sessions).
          </p>
        </div>
        {activeFolder ? (
          <button className="btn-admin btn-admin-primary" onClick={openNewInFolder}>+ Add Subfolder</button>
        ) : (
          <button className="btn-admin btn-admin-primary" onClick={openNew}>+ New Category</button>
        )}
      </div>

      // LEVEL 1: Inside a category — show subfolder cards
      {activeFolder ? (
        <div className="card-admin">
          <div className="card-admin-header">
            <h2>
              <span
                onClick={() => setActiveFolder(null)}
                style={{ cursor: 'pointer', color: 'var(--stone)', fontWeight: 400 }}
                title="Back to all categories"
              >
                Categories
              </span>
              <span style={{ margin: '0 8px', color: 'var(--stone)', fontSize: '0.75rem' }}>›</span>
              <span style={{ color: 'var(--orange)' }}>{activeFolder}</span>
              <span style={{ fontWeight: 400, color: 'var(--stone)', marginLeft: 8, fontSize: '0.85rem' }}>
                ({shown.length} subfolder{shown.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-admin btn-admin-sm btn-admin-ghost" onClick={() => setActiveFolder(null)}>
                ← All categories
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <h3>No subfolders yet</h3>
              <p>Click "+ Add Subfolder" to create your first subfolder in {activeFolder}.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {shown.map((p) => {
                const slug = p.photoSlug?.trim().toLowerCase()
                const matchedPhotos = slug
                  ? uploadPhotos.filter((up) => (up.tags || []).some((t) => t.toLowerCase() === slug))
                  : []
                const hasSlug = slug && matchedPhotos.length > 0

                return (
                  <div key={p.id} style={{
                    borderRadius: 8, overflow: 'hidden', background: '#fff',
                    border: '1px solid #e5e0d4', display: 'flex', flexDirection: 'column',
                    cursor: 'pointer', transition: 'box-shadow 0.2s',
                  }}
                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                    onClick={() => openEdit(p)}
                  >
                    {/* Image preview */}
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
                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--stone)' }}>
                        {matchedPhotos.length > 0 ? `${matchedPhotos.length} photo${matchedPhotos.length > 1 ? 's' : ''}` : '0 photos'}
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
      ) : (
        // LEVEL 0: Category folder cards
        <>
          {/* Category folder grid */}
          <div className="card-admin">
            <div className="card-admin-header">
              <h2>All Categories ({existingCategories.length})</h2>
            </div>

            {existingCategories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <h3>No categories yet</h3>
                <p>Click "+ New Category" to create your first category folder.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {existingCategories.map((cat) => {
                  const albums = photos.filter((p) => p.cat === cat)
                  const totalPhotos = albums.reduce((sum, a) => sum + getSubfolderPhotoCount(a), 0)

                  // Gather up to 4 preview images from albums in this category
                  const previews = []
                  for (const album of albums) {
                    const slug = album.photoSlug?.trim().toLowerCase()
                    const matched = slug
                      ? uploadPhotos.filter((up) => (up.tags || []).some((t) => t.toLowerCase() === slug))
                      : []
                    for (const p of matched) {
                      if (previews.length >= 4) break
                      previews.push(p)
                    }
                    if (previews.length >= 4) break
                  }

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFolder(cat)}
                      style={{
                        borderRadius: 12, overflow: 'hidden',
                        border: '2px solid #e5e0d4',
                        background: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        padding: 0,
                        fontFamily: 'inherit',
                        color: 'inherit',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--orange)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(243,111,33,0.15)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e5e0d4'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {/* 2×2 preview grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        aspectRatio: '1',
                        gap: 2,
                        background: 'linear-gradient(155deg, #383839, #2c2b2d, #cf5711)',
                      }}>
                        {previews.slice(0, 4).map((p, i) => (
                          <img key={i} src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ))}
                        {Array.from({ length: 4 - Math.min(previews.length, 4) }).map((_, i) => (
                          <div key={`e-${i}`} style={{ background: 'transparent' }} />
                        ))}
                      </div>
                      {/* Info */}
                      <div style={{
                        padding: '14px 18px',
                        borderTop: '2px solid rgba(243,111,33,0.12)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>
                            {cat}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--stone)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--orange)' }}>{albums.length}</div>
                          <div>subfolder{albums.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* All subfolders flat list (collapsible) */}
          {photos.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--stone)', padding: '8px 0' }}>
                View all {photos.length} subfolders as list
              </summary>
              <div className="card-admin" style={{ marginTop: 8 }}>
                <div className="card-admin-header">
                  <h2>All Subfolders</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['All', ...existingCategories].map((c) => {
                      const isActive = c === 'All' ? !activeFolder : activeFolder === c
                      return (
                        <button
                          key={c}
                          className={`btn-admin btn-admin-sm ${isActive ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                          onClick={() => {
                            if (c === 'All') setActiveFolder(null)
                            else setActiveFolder(c)
                          }}
                        >
                          {c === 'All' ? `All (${photos.length})` : c}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {photos.map((p) => (
                    <div key={p.id} style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#f8f6f2',
                      border: '1px solid #e8e4da',
                      fontSize: '0.78rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                      onClick={() => { openEdit(p); setActiveFolder(p.cat) }}
                    >
                      <span style={{ fontWeight: 500 }}>{p.tag}</span>
                      <span style={{ color: 'var(--stone)', fontSize: '0.68rem' }}>{p.cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </>
      )}

      {editing && (
        <Modal title={editing === 'new' ? (form.cat ? 'Add Subfolder' : 'New Category') : 'Edit Subfolder'} onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="admin-field">
              <label>Subfolder name</label>
              <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. May 2025, Summer Camp, Advanced Clinic" />
            </div>
            <div className="admin-field">
              <label>Category — click one or type a new one</label>
              <input
                value={form.cat}
                onChange={(e) => setForm({ ...form, cat: e.target.value })}
                placeholder="e.g. Public Sessions, Workshops, Training…"
                style={{ marginBottom: 8 }}
              />
              {existingCategories.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {existingCategories.map((c) => {
                    const isActive = form.cat?.trim().toLowerCase() === c.toLowerCase()
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, cat: isActive ? '' : c })}
                        style={{
                          padding: '5px 14px',
                          borderRadius: 20,
                          border: isActive ? '2px solid var(--orange)' : '2px solid #e0dbcf',
                          background: isActive ? '#fff4ed' : '#f8f6f2',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--orange)' : 'var(--ink)',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) e.currentTarget.style.borderColor = '#cf5711'
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) e.currentTarget.style.borderColor = '#e0dbcf'
                        }}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Upload photos directly to this subfolder ── */}
            <div className="card-admin" style={{ border: '2px dashed #d8d0bc', background: dragOver ? 'rgba(243, 111, 33, 0.04)' : '#fefcf9', padding: 16, marginBottom: 16, transition: 'all 0.2s ease' }}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileDrop(e) }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                📷 Upload photos to this subfolder
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--stone)', margin: '0 0 12px' }}>
                Drag & drop images here, or click to select. They will be uploaded and linked to this subfolder automatically.
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  cursor: 'pointer', textAlign: 'center', padding: '24px 16px',
                  borderRadius: 8, border: '2px dashed #d8d0bc',
                  background: dragOver ? 'rgba(243, 111, 33, 0.08)' : '#f8f6f2',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.3 }}>
                  {uploading ? '⏳' : dragOver ? '📂' : '📁'}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--stone)', margin: 0 }}>
                  {uploading
                    ? 'Uploading…'
                    : dragOver
                      ? 'Drop images here'
                      : 'Click or drag & drop up to 20 images'
                  }
                </p>
              </div>

              {/* Preview uploaded images */}
              {form.photoSlug?.trim() && slugPreview.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#555', margin: '0 0 6px' }}>
                    {slugPreview.length} photo{slugPreview.length > 1 ? 's' : ''} in this subfolder:
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
              )}
            </div>

            {/* Photo Slug — link existing photos from Photos tab */}
            <details style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--stone)' }}>
                Or link existing photos from the Photos tab
              </summary>
              <div className="card-admin" style={{ border: '2px solid var(--orange)', background: '#fefcf9', padding: 16, marginTop: 8 }}>

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
            </details>

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
