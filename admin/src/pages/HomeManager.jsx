import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const API = import.meta.env.PROD ? 'https://climb-crux-backend.onrender.com/api' : '/api'

export default function HomeManager() {
  const { addToast } = useToast()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editPaths, setEditPaths] = useState(false)
  const [editTeasers, setEditTeasers] = useState(false)
  const [availableSlugs, setAvailableSlugs] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(`${API}/home`).then((r) => r.json()),
      fetch(`${API}/uploads`).then((r) => r.json()).catch(() => []),
    ])
      .then(([homeContent, uploads]) => {
        setContent(homeContent)
        // Extract unique tags from uploads as available session slugs
        const slugs = [...new Set(
          (uploads || []).flatMap((p) => (p.tags || []))
            .filter((t) => t && t.trim())
            .map((t) => t.trim())
        )].sort()
        setAvailableSlugs(slugs)
      })
      .catch(() => addToast('Failed to load home content', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function updateField(field, value) {
    const updated = { ...content, [field]: value }
    try {
      const res = await fetch(`${API}/home`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) throw new Error()
      setContent(await res.json())
      addToast('Home page updated', 'success')
    } catch {
      addToast('Failed to save', 'error')
    }
  }

  if (loading) return <div className="empty-state"><h3>Loading home content…</h3></div>
  if (!content) return <div className="empty-state"><h3>No content loaded</h3></div>

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Home Page</h1>
          <p className="page-header-admin-desc">Edit the hero section, path cards, and teaser photos.</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="card-admin">
        <div className="card-admin-header"><h2>Hero Section</h2></div>
        <div className="admin-form">
          <div className="admin-field">
            <label>Hero Title</label>
            <input value={content.heroTitle || ''} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} />
            <div className="admin-form-actions" style={{ paddingTop: 8 }}>
              <button className="btn-admin btn-admin-primary btn-admin-sm" onClick={() => updateField('heroTitle', content.heroTitle)}>Save</button>
            </div>
          </div>
          <div className="admin-field">
            <label>Hero Description</label>
            <textarea rows={3} value={content.heroLede || ''} onChange={(e) => setContent({ ...content, heroLede: e.target.value })} />
            <div className="admin-form-actions" style={{ paddingTop: 8 }}>
              <button className="btn-admin btn-admin-primary btn-admin-sm" onClick={() => updateField('heroLede', content.heroLede)}>Save</button>
            </div>
          </div>
          <div className="admin-field">
            <label>Hero Photo URL</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={content.heroPhotoUrl || ''} onChange={(e) => setContent({ ...content, heroPhotoUrl: e.target.value })} placeholder="Cloudinary URL from Photos tab" style={{ flex: 1 }} />
              <button className="btn-admin btn-admin-primary btn-admin-sm" onClick={() => updateField('heroPhotoUrl', content.heroPhotoUrl)}>Save</button>
            </div>
            {content.heroPhotoUrl && (
              <img src={content.heroPhotoUrl} alt="Hero preview" style={{ marginTop: 8, maxHeight: 120, borderRadius: 4, objectFit: 'cover' }} />
            )}
          </div>
        </div>
      </div>

      {/* Section Headers */}
      <div className="card-admin">
        <div className="card-admin-header"><h2>Section Headers</h2></div>
        <div className="admin-form" style={{ maxWidth: '100%' }}>
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Paths Eyebrow</label>
              <input value={content.pathsEyebrow || ''} onChange={(e) => setContent({ ...content, pathsEyebrow: e.target.value })} />
              <button className="btn-admin btn-admin-primary btn-admin-sm" style={{ marginTop: 6 }} onClick={() => updateField('pathsEyebrow', content.pathsEyebrow)}>Save</button>
            </div>
            <div className="admin-field">
              <label>Paths Title</label>
              <input value={content.pathsTitle || ''} onChange={(e) => setContent({ ...content, pathsTitle: e.target.value })} />
              <button className="btn-admin btn-admin-primary btn-admin-sm" style={{ marginTop: 6 }} onClick={() => updateField('pathsTitle', content.pathsTitle)}>Save</button>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Teasers Eyebrow</label>
              <input value={content.teasersEyebrow || ''} onChange={(e) => setContent({ ...content, teasersEyebrow: e.target.value })} />
              <button className="btn-admin btn-admin-primary btn-admin-sm" style={{ marginTop: 6 }} onClick={() => updateField('teasersEyebrow', content.teasersEyebrow)}>Save</button>
            </div>
            <div className="admin-field">
              <label>Teasers Title</label>
              <input value={content.teasersTitle || ''} onChange={(e) => setContent({ ...content, teasersTitle: e.target.value })} />
              <button className="btn-admin btn-admin-primary btn-admin-sm" style={{ marginTop: 6 }} onClick={() => updateField('teasersTitle', content.teasersTitle)}>Save</button>
            </div>
          </div>
        </div>
      </div>

      {/* Path Cards */}
      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Path Cards</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setEditPaths(true)}>Edit Cards</button>
        </div>
        <div className="sortable-list">
          {content.paths?.map((p, i) => (
            <div className="sortable-item" key={i}>
              <div className="sortable-item-left">
                {p.photoUrl && <img src={p.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                <div className="sortable-item-info">
                  <div className="sortable-item-title">{p.title}</div>
                  <div className="sortable-item-sub">{p.grade} · {p.cta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>      {/* Teaser Photos */}
      <div className="card-admin">
        <div className="card-admin-header"><h2>Teaser Photos</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setEditTeasers(true)}>Edit Teasers</button>
        </div>
        
        {/* Session slug picker for auto-teasers */}
        <div className="admin-form">
          <div className="admin-field">
            <label>Show Session Photos on Home Page</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--stone)', marginTop: -4, marginBottom: 6 }}>
              Select a session slug to display its photos in the teasers grid on the home page.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={content.teaserSessionSlug || ''}
                onChange={(e) => setContent({ ...content, teaserSessionSlug: e.target.value })}
                style={{
                  flex: 1, padding: '0.65em 0.8em', border: '1px solid #d8d0bc', borderRadius: 6,
                  fontSize: '0.9rem', background: '#fff', cursor: 'pointer',
                }}
              >
                <option value="">— No session selected (show manual teasers) —</option>
                {availableSlugs.map((slug) => (
                  <option key={slug} value={slug}>{slug}</option>
                ))}
              </select>
              <button className="btn-admin btn-admin-primary btn-admin-sm" onClick={() => updateField('teaserSessionSlug', content.teaserSessionSlug)}>Save</button>
            </div>
            {availableSlugs.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--stone)', marginTop: 4 }}>
                No session slugs found. Upload photos with a session slug in the Photos tab first.
              </p>
            )}
          </div>
        </div>

        {content.teaserSessionSlug && (
          <div className="sortable-list">
            <div className="sortable-item">
              <div className="sortable-item-left">
                <div style={{ width: 48, height: 48, borderRadius: 4, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                  📁
                </div>
                <div className="sortable-item-info">
                  <div className="sortable-item-title">Showing: {content.teaserSessionSlug}</div>
                  <div className="sortable-item-sub">Auto-loaded from session folder</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sortable-list">
          {content.teasers?.map((t, i) => (
            <div className="sortable-item" key={i}>
              <div className="sortable-item-left">
                {t.photoUrl && <img src={t.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                <div className="sortable-item-info">
                  <div className="sortable-item-title">{t.tag}</div>
                  {t.photoUrl && <div className="sortable-item-sub" style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.photoUrl}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editPaths && (
        <Modal title="Edit Path Cards" onClose={() => setEditPaths(false)}>
          <PathsForm items={content.paths || []} onSave={(items) => updateField('paths', items).then(() => setEditPaths(false))} onCancel={() => setEditPaths(false)} />
        </Modal>
      )}

      {editTeasers && (
        <Modal title="Edit Teaser Photos" onClose={() => setEditTeasers(false)}>
          <TeasersForm items={content.teasers || []} onSave={(items) => updateField('teasers', items).then(() => setEditTeasers(false))} onCancel={() => setEditTeasers(false)} />
        </Modal>
      )}
    </>
  )
}

function PathsForm({ items, onSave, onCancel }) {
  const [list, setList] = useState(items)
  function update(idx, field, val) { setList(list.map((item, i) => i === idx ? { ...item, [field]: val } : item)) }
  function add() { setList([...list, { grade: '', label: '', title: '', copy: '', to: '', cta: '', photoUrl: '' }]) }
  function remove(idx) { setList(list.filter((_, i) => i !== idx)) }
  return (
    <div className="admin-form">
      {list.map((item, i) => (
        <div key={i} style={{ border: '1px solid #e5e0d4', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <button className="btn-admin-icon danger" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => remove(i)}>✕</button>
          <div className="admin-form-row">
            <div className="admin-field"><label>Title</label><input value={item.title} onChange={(e) => update(i, 'title', e.target.value)} /></div>
            <div className="admin-field"><label>Grade</label><input value={item.grade} onChange={(e) => update(i, 'grade', e.target.value)} /></div>
          </div>
          <div className="admin-form-row">
            <div className="admin-field"><label>Label</label><input value={item.label} onChange={(e) => update(i, 'label', e.target.value)} /></div>
            <div className="admin-field"><label>Link To</label><input value={item.to} onChange={(e) => update(i, 'to', e.target.value)} /></div>
          </div>
          <div className="admin-field"><label>CTA Text</label><input value={item.cta} onChange={(e) => update(i, 'cta', e.target.value)} /></div>
          <div className="admin-field">
            <label>Photo URL (Cloudinary)</label>
            <input value={item.photoUrl} onChange={(e) => update(i, 'photoUrl', e.target.value)} placeholder="Paste Cloudinary URL from Photos tab" />
            {item.photoUrl && <img src={item.photoUrl} alt="" style={{ marginTop: 4, maxHeight: 60, borderRadius: 4, objectFit: 'cover' }} />}
          </div>
          <div className="admin-field"><label>Description</label><textarea rows={2} value={item.copy} onChange={(e) => update(i, 'copy', e.target.value)} /></div>
        </div>
      ))}
      <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={add} style={{ alignSelf: 'flex-start' }}>+ Add Card</button>
      <div className="admin-form-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => onSave(list)}>Save All</button>
        <button className="btn-admin btn-admin-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function TeasersForm({ items, onSave, onCancel }) {
  const [list, setList] = useState(items)
  function update(idx, field, val) { setList(list.map((item, i) => i === idx ? { ...item, [field]: val } : item)) }
  function add() { setList([...list, { tag: '', photoUrl: '' }]) }
  function remove(idx) { setList(list.filter((_, i) => i !== idx)) }
  return (
    <div className="admin-form">
      {list.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Tag (e.g. Public Session · 4+)" value={item.tag} onChange={(e) => update(i, 'tag', e.target.value)} style={{ padding: '0.65em 0.8em', border: '1px solid #d8d0bc', borderRadius: 6, fontSize: '0.9rem' }} />
            <input placeholder="Photo URL (Cloudinary)" value={item.photoUrl} onChange={(e) => update(i, 'photoUrl', e.target.value)} style={{ padding: '0.65em 0.8em', border: '1px solid #d8d0bc', borderRadius: 6, fontSize: '0.9rem' }} />
            {item.photoUrl && <img src={item.photoUrl} alt="" style={{ maxHeight: 60, borderRadius: 4, objectFit: 'cover' }} />}
          </div>
          <button className="btn-admin-icon danger" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={add} style={{ alignSelf: 'flex-start' }}>+ Add Teaser</button>
      <div className="admin-form-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => onSave(list)}>Save All</button>
        <button className="btn-admin btn-admin-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
