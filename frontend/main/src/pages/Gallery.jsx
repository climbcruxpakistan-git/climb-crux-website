import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import PlaceholderPhoto from '../components/PlaceholderPhoto.jsx'
import { getGallery, getUploads } from '../api.js'
import './Gallery.css'

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([])
  const [uploadPhotos, setUploadPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState(null)

  useEffect(() => {
    Promise.all([
      getGallery(),
      getUploads().catch(() => []),
    ])
      .then(([gallery, uploads]) => {
        setGalleryItems(gallery)
        setUploadPhotos(uploads)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Build a lookup: slug → upload photos that match that tag
  const slugPhotoMap = useMemo(() => {
    const map = {}
    for (const item of galleryItems) {
      const slug = (item.photoSlug || '').trim().toLowerCase()
      if (!slug) continue
      if (!map[slug]) {
        map[slug] = uploadPhotos.filter((up) =>
          (up.tags || []).some((t) => t.toLowerCase() === slug)
        )
      }
    }
    return map
  }, [galleryItems, uploadPhotos])

  // Get all photos (both from imageUrl and from slug matches) for a folder item
  function getItemPhotos(item) {
    const slug = (item.photoSlug || '').trim().toLowerCase()
    const slugPhotos = slugPhotoMap[slug] || []
    if (slugPhotos.length > 0) return slugPhotos
    // Fallback: use the item's own imageUrl if it has one
    if (item.imageUrl) return [item]
    // Fallback: return the item itself so it shows with a placeholder photo
    return [item]
  }

  // Build folders from unique categories
  const categories = useMemo(() =>
    [...new Set(galleryItems.map((p) => p.cat))],
    [galleryItems]
  )

  // Get all displayable photos for a category (deduplicated by id)
  function getCategoryPhotos(cat) {
    const items = galleryItems.filter((p) => p.cat === cat)
    const seen = new Set()
    const all = []
    for (const item of items) {
      const photos = getItemPhotos(item)
      for (const p of photos) {
        const key = p.id || p.url || p._id
        if (key && seen.has(key)) continue
        if (key) seen.add(key)
        all.push({
          ...p,
          _folderTag: item.tag,
          _folderCaption: item.caption,
        })
      }
    }
    return all
  }

  // Total count across all items in a category (including slug-matched)
  function getCategoryCount(cat) {
    return getCategoryPhotos(cat).length
  }

  // Preview images for a folder card
  function folderPreview(cat) {
    const all = getCategoryPhotos(cat)
    const preview = all.slice(0, 4)
    const emptySlots = 4 - preview.length
    return (
      <div className="gallery-folder-previews">
        {preview.map((p, i) => {
          const url = p.url || p.imageUrl
          return url ? (
            <img key={i} src={url} alt="" className="gallery-folder-preview-img" />
          ) : (
            <div key={i} className="gallery-folder-preview-placeholder" />
          )
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="gallery-folder-preview-placeholder" />
        ))}
      </div>
    )
  }

  // All displayable photos in the active folder
  const folderPhotos = activeFolder
    ? getCategoryPhotos(activeFolder)
    : []

  const totalItems = galleryItems.length

  return (
    <>
      <PageHeader title="From the wall.">
        <p>
          A running record of sessions on Margalla Hills — public climbs,
          private coaching, and premium ascents.
        </p>
      </PageHeader>

      <section className="section">
        <div className="wrap">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading gallery…</p>
          ) : activeFolder ? (
            <>
              {/* Inside a category folder */}
              <div className="gallery-folder-header">
                <button className="btn btn-outline btn-sm" onClick={() => setActiveFolder(null)}>
                  ← Back to albums
                </button>
                <h2 className="gallery-folder-title">{activeFolder}</h2>
                <span className="gallery-folder-count">{folderPhotos.length} photo{folderPhotos.length !== 1 ? 's' : ''}</span>
              </div>
              {folderPhotos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--stone)', marginTop: 40 }}>No photos in this album yet.</p>
              ) : (
                <div className="gallery-photo-grid">
                  {folderPhotos.map((p, i) => {
                    const url = p.url || p.imageUrl
                    const label = p._folderTag || p.tag || p.title || 'Photo'
                    const caption = p._folderCaption || p.caption || ''
                    return (
                      <div key={p.id || i} className="gallery-photo-card">
                        {url ? (
                          <img src={url} alt={label} className="gallery-photo-img" />
                        ) : (
                          <PlaceholderPhoto tag={label} ratio="1 / 1" />
                        )}
                        <div className="gallery-photo-info">
                          <span className="gallery-photo-tag">{label}</span>
                          {caption && <span className="gallery-photo-caption">{caption}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : totalItems === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>No photos yet. Check back soon!</p>
          ) : (
            <>
              {/* Folder grid */}                <h2 style={{ marginBottom: 32 }}>Albums</h2>
              <div className="gallery-folder-grid">                  {categories.map((cat) => {
                  const count = getCategoryCount(cat)
                  return (
                    <button
                      key={cat}
                      className="gallery-folder-card"
                      onClick={() => setActiveFolder(cat)}
                    >
                      {folderPreview(cat)}
                      <div className="gallery-folder-info">
                        <h3 className="gallery-folder-name">{cat}</h3>
                        <span className="gallery-folder-count">{count} photo{count !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
