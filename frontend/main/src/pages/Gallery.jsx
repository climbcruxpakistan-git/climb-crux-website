import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import PlaceholderPhoto from '../components/PlaceholderPhoto.jsx'
import { getGallery, getUploads } from '../api.js'
import './Gallery.css'

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([])
  const [uploadPhotos, setUploadPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState(null)   // category name
  const [activeAlbum, setActiveAlbum] = useState(null)     // gallery item (album)

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

  // Get all photos for a specific gallery item (album)
  function getAlbumPhotos(item) {
    if (!item) return []
    const slug = (item.photoSlug || '').trim().toLowerCase()
    const slugPhotos = slugPhotoMap[slug] || []
    if (slugPhotos.length > 0) return slugPhotos
    if (item.imageUrl) return [item]
    return [item]
  }

  // Build folders from unique categories
  const categories = useMemo(() =>
    [...new Set(galleryItems.map((p) => p.cat))],
    [galleryItems]
  )

  // Get albums (gallery items) within a category
  function getAlbumsInCategory(cat) {
    return galleryItems.filter((p) => p.cat === cat)
  }

  // Render a 2×2 preview grid from an array of photo objects (shared helper)
  function renderPreviewGrid(photos) {
    const preview = photos.slice(0, 4)
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

  // 2×2 preview grid for a single album
  function albumPreview(item) {
    return renderPreviewGrid(getAlbumPhotos(item))
  }

  // 2×2 preview grid for a whole category (gathers up to 4 photos from all albums)
  function categoryPreview(cat) {
    const albums = getAlbumsInCategory(cat)
    const allPhotos = []
    for (const album of albums) {
      const photos = getAlbumPhotos(album)
      for (const p of photos) {
        if (allPhotos.length >= 4) break
        allPhotos.push(p)
      }
      if (allPhotos.length >= 4) break
    }
    return renderPreviewGrid(allPhotos)
  }

  // Albums in the selected category
  const currentAlbums = activeFolder ? getAlbumsInCategory(activeFolder) : []

  // Photos for the active album
  const albumPhotos = activeAlbum ? getAlbumPhotos(activeAlbum) : []

  // Navigate back to album list within the current category
  function backToAlbums() {
    setActiveAlbum(null)
  }

  // Navigate back to category list
  function backToCategories() {
    setActiveFolder(null)
    setActiveAlbum(null)
  }

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
          ) : activeAlbum ? (
            /* ── Level 2: Photos inside an album ── */
            <>
              <div className="gallery-folder-header">
                <button className="btn btn-outline btn-sm" onClick={backToAlbums}>
                  ← Back to {activeFolder}
                </button>
                <h2 className="gallery-folder-title">{activeAlbum.tag}</h2>
                <span className="gallery-folder-count">{albumPhotos.length} photo{albumPhotos.length !== 1 ? 's' : ''}</span>
              </div>
              {albumPhotos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--stone)', marginTop: 40 }}>No photos in this album yet.</p>
              ) : (
                <div className="gallery-photo-grid">
                  {albumPhotos.map((p, i) => {
                    const url = p.url || p.imageUrl
                    const label = p.tag || p.title || 'Photo'
                    const caption = activeAlbum.caption || ''
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
          ) : activeFolder ? (
            /* ── Level 1: Album subfolders within a category ── */
            <>
              <div className="gallery-folder-header">
                <button className="btn btn-outline btn-sm" onClick={backToCategories}>
                  ← Back to albums
                </button>
                <h2 className="gallery-folder-title">{activeFolder}</h2>
                <span className="gallery-folder-count">{currentAlbums.length} album{currentAlbums.length !== 1 ? 's' : ''}</span>
              </div>
              {currentAlbums.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--stone)', marginTop: 40 }}>No albums in this category yet.</p>
              ) : (
                <div className="gallery-folder-grid">
                  {currentAlbums.map((item) => {
                    const photos = getAlbumPhotos(item)
                    return (
                      <button
                        key={item.id}
                        className="gallery-folder-card"
                        onClick={() => setActiveAlbum(item)}
                      >
                        {albumPreview(item)}
                        <div className="gallery-folder-info">
                          <h3 className="gallery-folder-name">{item.tag}</h3>
                          <span className="gallery-folder-count">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : totalItems === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>No photos yet. Check back soon!</p>
          ) : (
            /* ── Level 0: Category folders ── */
            <>
              <h2 style={{ marginBottom: 32 }}>Albums</h2>
              <div className="gallery-folder-grid">
                {categories.map((cat) => {
                  const albums = getAlbumsInCategory(cat)
                  const totalPhotos = albums.reduce((sum, a) => sum + getAlbumPhotos(a).length, 0)
                  return (
                    <button
                      key={cat}
                      className="gallery-folder-card"
                      onClick={() => setActiveFolder(cat)}
                    >
                      {categoryPreview(cat)}
                      <div className="gallery-folder-info">
                        <h3 className="gallery-folder-name">{cat}</h3>
                        <span className="gallery-folder-count">{albums.length} album{albums.length !== 1 ? 's' : ''} · {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}</span>
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
