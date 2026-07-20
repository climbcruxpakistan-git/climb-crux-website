import { useState, useEffect } from 'react'
import { getAbout, saveAbout } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

export default function AboutManager() {
  const { addToast } = useToast()
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [safetyItems, setSafetyItems] = useState([])
  const [editSafety, setEditSafety] = useState(null)

  useEffect(() => {
    getAbout()
      .then((data) => {
        setAbout(data)
        setDescription(data.description || '')
        setSafetyItems(data.safetyItems || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleDescriptionSave() {
    const data = { description, safetyItems }
    await saveAbout(data)
    setAbout(await getAbout())
    addToast('About page updated', 'success')
  }

  async function handleSafetySave(items) {
    const data = { description, safetyItems: items }
    await saveAbout(data)
    setSafetyItems(items)
    setAbout({ ...about, safetyItems: items })
    setEditSafety(null)
    addToast('Safety items updated', 'success')
  }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading about page…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>About Page</h1>
          <p className="page-header-admin-desc">Manage the about page description and safety approach content.</p>
        </div>
      </div>

      <div className="card-admin">
        <div className="card-admin-header"><h2>Page Description</h2></div>
        <div className="admin-form">
          <div className="admin-field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="About page description…" />
          </div>
          <div className="admin-form-actions">
            <button className="btn-admin btn-admin-primary" onClick={handleDescriptionSave}>Save Description</button>
          </div>
        </div>
      </div>

      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Safety Approach</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setEditSafety(true)}>Edit Items</button>
        </div>
        <div className="sortable-list">
          {safetyItems.map((item, i) => (
            <div className="sortable-item" key={i}>
              <div className="sortable-item-left">
                <div className="sortable-item-info">
                  <div className="sortable-item-title">{item.h}</div>
                  <div className="sortable-item-sub">{item.p}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editSafety && (
        <Modal title="Edit Safety Items" onClose={() => setEditSafety(null)}>
          <SafetyForm items={safetyItems} onSave={handleSafetySave} onCancel={() => setEditSafety(null)} />
        </Modal>
      )}
    </>
  )
}

function SafetyForm({ items, onSave, onCancel }) {
  const [list, setList] = useState(items)
  function update(idx, field, val) { setList(list.map((item, i) => i === idx ? { ...item, [field]: val } : item)) }
  function add() { setList([...list, { h: '', p: '' }]) }
  function remove(idx) { setList(list.filter((_, i) => i !== idx)) }
  return (
    <div className="admin-form">
      {list.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Heading" value={item.h} onChange={(e) => update(i, 'h', e.target.value)} style={{ padding: '0.65em 0.8em', border: '1px solid #d8d0bc', borderRadius: 6, fontSize: '0.9rem' }} />
            <textarea placeholder="Description" value={item.p} onChange={(e) => update(i, 'p', e.target.value)} rows={2} style={{ padding: '0.65em 0.8em', border: '1px solid #d8d0bc', borderRadius: 6, fontSize: '0.9rem', resize: 'vertical' }} />
          </div>
          <button className="btn-admin-icon danger" onClick={() => remove(i)} title="Remove">✕</button>
        </div>
      ))}
      <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={add} style={{ alignSelf: 'flex-start' }}>+ Add Item</button>
      <div className="admin-form-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => onSave(list)}>Save All</button>
        <button className="btn-admin btn-admin-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
