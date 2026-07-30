import { useState, useEffect, useMemo } from 'react'
import { getGallery, getUploads } from '../../lib/api'

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([])
  const [uploadPhotos, setUploadPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState(null)
  const [activeAlbum, setActiveAlbum] = useState(null)

  useEffect(() => {
    Promise.all([getGallery(), getUploads().catch(() => [])])
      .then(([gallery, uploads]) => {
        setGalleryItems(gallery)
        setUploadPhotos(uploads)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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

  function getAlbumPhotos(item) {
    if (!item) return []
    const slug = (item.photoSlug || '').trim().toLowerCase()
    const slugPhotos = slugPhotoMap[slug] || []
    if (slugPhotos.length > 0) return slugPhotos
    if (item.imageUrl) return [item]
    return [item]
  }

  const categories = useMemo(() =>
    [...new Set(galleryItems.map((p) => p.cat))], [galleryItems])

  function getAlbumsInCategory(cat) {
    return galleryItems.filter((p) => p.cat === cat)
  }

  function renderPreviewGrid(photos) {
    const preview = photos.slice(0, 4)
    const emptySlots = 4 - preview.length
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {preview.map((p, i) => {
          const url = p.url || p.imageUrl
          return url ? (
            <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
          ) : (
            <div key={i} style={{ background: '#ece5d5', aspectRatio: '1' }} />
          )
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`e-${i}`} style={{ background: '#ece5d5', aspectRatio: '1' }} />
        ))}
      </div>
    )
  }

  const currentAlbums = activeFolder ? getAlbumsInCategory(activeFolder) : []
  const albumPhotos = activeAlbum ? getAlbumPhotos(activeAlbum) : []

  return (
    <>
      <section className="section">
        <div className="wrap">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>Loading gallery…</p>
          ) : activeAlbum ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveAlbum(null)}>← Back to {activeFolder}</button>
                <h2 style={{ margin: 0, flex: 1 }}>{activeAlbum.tag}</h2>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--stone)' }}>{albumPhotos.length} photo{albumPhotos.length !== 1 ? 's' : ''}</span>
              </div>
              {albumPhotos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--stone)', marginTop: 40 }}>No photos in this album yet.</p>
              ) : (
                <div className="gallery-photo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {albumPhotos.map((p, i) => {
                    const url = p.url || p.imageUrl
                    const label = p.tag || p.title || 'Photo'
                    return (
                      <div key={p.id || i} style={{ background: 'var(--chalk)', border: '1px solid var(--chalk-dim)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                        {url ? (
                          <img src={url} alt={label} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                        ) : (
                          <div className="placeholder-photo" style={{ aspectRatio: '1' }}><span className="tag">{label}</span></div>
                        )}
                        <div style={{ padding: '10px 14px' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--orange)' }}>{label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : activeFolder ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveFolder(null)}>← Back to albums</button>
                <h2 style={{ margin: 0, flex: 1 }}>{activeFolder}</h2>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--stone)' }}>{currentAlbums.length} album{currentAlbums.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {currentAlbums.map((item) => (
                  <button key={item.id} className="gallery-folder-card" onClick={() => setActiveAlbum(item)}
                    style={{ background: 'var(--chalk)', border: '1px solid var(--chalk-dim)', padding: 0, cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    {renderPreviewGrid(getAlbumPhotos(item))}
                    <div style={{ padding: '14px 16px' }}>
                      <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{item.tag}</h3>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase' }}>
                        {getAlbumPhotos(item).length} photo{getAlbumPhotos(item).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : galleryItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--stone)' }}>No photos yet. Check back soon!</p>
          ) : (
            <>
              <h2 style={{ marginBottom: 32 }}>Albums</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {categories.map((cat) => {
                  const albums = getAlbumsInCategory(cat)
                  const totalPhotos = albums.reduce((sum, a) => sum + getAlbumPhotos(a).length, 0)
                  return (
                    <button key={cat} className="gallery-folder-card" onClick={() => setActiveFolder(cat)}
                      style={{ background: 'var(--chalk)', border: '1px solid var(--chalk-dim)', padding: 0, cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      {(() => {
                        const allPhotos = []
                        for (const album of albums) {
                          const photos = getAlbumPhotos(album)
                          for (const p of photos) { if (allPhotos.length >= 4) break; allPhotos.push(p) }
                          if (allPhotos.length >= 4) break
                        }
                        return renderPreviewGrid(allPhotos)
                      })()}
                      <div style={{ padding: '14px 16px' }}>
                        <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{cat}</h3>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase' }}>
                          {albums.length} album{albums.length !== 1 ? 's' : ''} · {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
                        </span>
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
