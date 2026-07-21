import { useState, useEffect, useRef } from 'react'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const API = import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api'

export default function PhotosManager() {
  const { addToast } = useToast()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', sessionSlug: '' })
  const [pendingFiles, setPendingFiles] = useState(null)
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingSlug, setPendingSlug] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [filter, setFilter] = useState('All')
  const fileRef = useRef()

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    try {
      const res = await fetch(`${API}/uploads`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPhotos(data)
    } catch (err) {
      addToast('Failed to load photos', 'error')
    } finally {
      setLoading(false)
    }
  }

  function promptForTags(files) {
    if (!files || files.length === 0) return
    if (files.length > 20) {
      addToast(`You can upload up to 20 photos at a time. ${files.length} selected.`, 'error')
      return
    }
    setPendingFiles(Array.from(files))
    setPendingCount(files.length)
    setPendingTitle('')
    setPendingSlug('')
  }

  function cancelPending() {
    setPendingFiles(null)
    setPendingTitle('')
    setPendingSlug('')
    setPendingCount(0)
  }

  async function confirmUpload() {
    if (!pendingFiles) return
    setUploading(true)

    const formData = new FormData()
    for (const file of pendingFiles) {
      formData.append('photos', file)
    }
    if (pendingTitle.trim()) formData.append('title', pendingTitle.trim())
    // Session slug is the only tag — used for gallery album matching
    if (pendingSlug.trim()) formData.append('tags', pendingSlug.trim())

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
      setPhotos((prev) => [...uploaded, ...prev])
      addToast(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} uploaded`, 'success')
      cancelPending()
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error')
      cancelPending()
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this photo from Cloudinary?')) return
    try {
      const res = await fetch(`${API}/uploads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setPhotos((prev) => prev.filter((p) => (p.id || p._id) !== id))
      addToast('Photo deleted', 'success')
    } catch (err) {
      addToast('Delete failed', 'error')
    }
  }

  function handleFileSelect(e) {
    promptForTags(e.target.files)
    // Reset the input so selecting the same files again triggers onChange
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    promptForTags(e.dataTransfer.files)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  async function handleEdit(photo) {
    // Session slug is the first (and usually only) custom tag
    const customTags = (photo.tags || []).filter((t) => t.trim())
    setEditForm({
      title: photo.title || '',
      sessionSlug: customTags[0] || '',
    })
    setEditing(photo.id || photo._id)
  }

  async function handleSaveEdit() {
    const id = editing
    if (!id) return
    try {
      const tags = editForm.sessionSlug?.trim() ? [editForm.sessionSlug.trim()] : []

      const res = await fetch(`${API}/uploads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          tags,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const updated = await res.json()
      setPhotos((prev) => prev.map((p) => ((p.id || p._id) === id ? { ...p, ...updated } : p)))
      setEditing(null)
      addToast('Photo updated', 'success')
    } catch (err) {
      addToast('Save failed', 'error')
    }
  }

  function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      addToast('URL copied to clipboard', 'success')
    }).catch(() => {
      addToast('Could not copy URL', 'error')
    })
  }

  // Collect unique session slugs for filter
  const allSlugs = [...new Set(photos.flatMap((p) => p.tags || []))]
  const slugFilters = ['All', ...allSlugs]
  const shown = filter === 'All' ? photos : photos.filter((p) => (p.tags || []).includes(filter))

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Photos</h1>
          <p className="page-header-admin-desc">
            Upload images and give them a session slug. Then link them to gallery albums using the same slug.
          </p>
        </div>
      </div>

      {/* Filter by session slug */}
      {allSlugs.length > 0 && (
        <div className="card-admin">
          <div className="card-admin-header">
            <h2>Filter by session</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {slugFilters.map((f) => (
                <button
                  key={f}
                  className={`btn-admin btn-admin-sm ${filter === f ? 'btn-admin-primary' : 'btn-admin-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'All' ? 'All' : f}
                  <span style={{ opacity: 0.6, marginLeft: 4 }}>
                    ({f === 'All' ? photos.length : photos.filter((p) => (p.tags || []).includes(f)).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className="card-admin"
        style={{
          border: dragOver ? '2px dashed var(--orange)' : '2px dashed #d8d0bc',
          background: dragOver ? 'rgba(243, 111, 33, 0.04)' : 'var(--admin-surface)',
          transition: 'all 0.2s ease',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Drop Zone — simplified, tags asked after selection */}
        <div
          style={{
            cursor: 'pointer', textAlign: 'center', padding: '32px 32px 40px',
          }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.3 }}>📁</div>
          <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>
            {uploading ? 'Uploading…' : dragOver ? 'Drop images here' : 'Click or drag images here'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--stone)', margin: 0 }}>
            JPG, PNG, GIF, WebP, AVIF · Up to 10MB each · Up to 20 at a time
          </p>
          {uploading && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 32, height: 32,
                border: '3px solid var(--chalk-dim)',
                borderTop: '3px solid var(--orange)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="empty-state"><h3>Loading photos…</h3></div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📷</div>
          <h3>{filter === 'All' ? 'No photos yet' : `No photos for "${filter}"`}</h3>
          <p>{filter === 'All' ? 'Upload your first image above.' : 'Upload photos with this session slug, or choose a different filter.'}</p>
        </div>
      ) : (
        <div className="card-admin" style={{ padding: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            padding: 20,
          }}>
            {shown.map((p) => {
              const id = p.id || p._id
              const url = p.url
              return (
                <div key={id} style={{
                  background: '#fff',
                  border: '1px solid #e5e0d4',
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Image Preview */}
                  <div style={{
                    aspectRatio: '16 / 10',
                    overflow: 'hidden',
                    background: '#f8f6f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={url}
                      alt={p.title || p.originalName || 'Photo'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  </div>

                  {/* Info & Actions */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Title */}
                    {p.title && (
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)' }}>
                        {p.title}
                      </div>
                    )}

                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.tags.map((tag) => (
                          <span key={tag} style={{
                            display: 'inline-block',
                            background: 'rgba(243, 111, 33, 0.1)',
                            color: 'var(--orange)',
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Original name */}
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--stone)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.originalName || 'Photo'} · {p.width}×{p.height}
                    </div>

                    {/* URL Field */}
                    <div style={{
                      display: 'flex', gap: 6, alignItems: 'center',
                      background: '#f8f6f2', borderRadius: 6, padding: '4px 6px',
                    }}>
                      <input
                        readOnly
                        value={url}
                        onClick={(e) => e.target.select()}
                        style={{
                          flex: 1, border: 'none', background: 'transparent',
                          fontSize: '0.72rem', color: 'var(--ink)',
                          fontFamily: 'monospace', padding: '4px', outline: 'none', cursor: 'text',
                        }}
                      />
                      <button
                        className="btn-admin btn-admin-sm btn-admin-primary"
                        style={{ fontSize: '0.6rem', padding: '3px 8px', flexShrink: 0 }}
                        onClick={() => copyUrl(url)}
                        title="Copy URL"
                      >
                        Copy
                      </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--stone)' }}>
                        {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn-admin-icon"
                          onClick={() => handleEdit(p)}
                          title="Edit title & tags"
                          style={{ fontSize: '0.8rem' }}
                        >
                          ✎
                        </button>
                        <button
                          className="btn-admin btn-admin-sm btn-admin-danger"
                          style={{ fontSize: '0.6rem', padding: '3px 10px' }}
                          onClick={() => handleDelete(id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {/* Tag Prompt Modal — shown after file selection before upload */}
      {(pendingFiles || uploading) && (
        <Modal
          title={uploading ? `Uploading ${pendingCount} photo${pendingCount > 1 ? 's' : ''}…` : `Tag ${pendingCount} photo${pendingCount > 1 ? 's' : ''} before uploading`}
          onClose={uploading ? undefined : cancelPending}
        >
          {uploading ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{
                width: 40, height: 40,
                border: '3px solid var(--chalk-dim)',
                borderTop: '3px solid var(--orange)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ margin: 0, color: 'var(--stone)' }}>
                Uploading to Cloudinary…
              </p>
            </div>
          ) : (
            <div className="admin-form">
              <div className="admin-field">
                <label>Title (optional — applied to all {pendingCount} photos)</label>
                <input
                  value={pendingTitle}
                  onChange={(e) => setPendingTitle(e.target.value)}
                  placeholder="e.g. Morning session on Margalla"
                />
              </div>
              <div className="admin-field">
                <label>Session Slug</label>
                <input
                  value={pendingSlug}
                  onChange={(e) => setPendingSlug(e.target.value)}
                  placeholder="e.g. session-1, summer-camp, advanced-clinic"
                />
                <p style={{ fontSize: '0.73rem', color: 'var(--stone)', marginTop: 4 }}>
                  This slug links these photos to a gallery album. In the{' '}
                  <a href="/gallery" style={{ color: 'var(--orange)' }}>Gallery tab</a>,
                  create an album and set its Photo Slug to this same value.
                </p>
              </div>
              <div className="admin-form-actions">
                <button
                  className="btn-admin btn-admin-primary"
                  onClick={confirmUpload}
                >
                  Upload {pendingCount} photo{pendingCount > 1 ? 's' : ''}
                </button>
                <button className="btn-admin btn-admin-outline" onClick={cancelPending}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Photo Metadata" onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="admin-field">
              <label>Title</label>
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Photo title" />
            </div>
            <div className="admin-field">
              <label>Session Slug</label>
              <input
                value={editForm.sessionSlug || ''}
                onChange={(e) => setEditForm({ ...editForm, sessionSlug: e.target.value })}
                placeholder="e.g. session-1"
              />
              <p style={{ fontSize: '0.73rem', color: 'var(--stone)', marginTop: 4 }}>
                This slug links this photo to a gallery album with the same slug.
              </p>
            </div>
            <div className="admin-form-actions">
              <button className="btn-admin btn-admin-primary" onClick={handleSaveEdit}>Save</button>
              <button className="btn-admin btn-admin-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
