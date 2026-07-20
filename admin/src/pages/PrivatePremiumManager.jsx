import { useState, useEffect } from 'react'
import { getPlans, savePlan, deletePlan } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

export default function PrivatePremiumManager() {
  const { addToast } = useToast()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const emptyForm = { title: '', type: '', grade: '', label: '', price: '', unit: '/ person', tag: '', featured: false, features: [''] }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...emptyForm }); setEditing('new') }
  function openEdit(p) { setForm({ ...p }); setEditing(p.id) }

  async function handleSave() {
    if (!form.title || !form.price) { addToast('Title and price are required', 'error'); return }
    const plan = editing === 'new'
      ? { id: null, ...form, features: form.features.filter((f) => f.trim()) }
      : { ...form, features: form.features.filter((f) => f.trim()) }
    await savePlan(plan)
    setPlans(await getPlans())
    setEditing(null)
    addToast('Plan saved', 'success')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this plan?')) return
    await deletePlan(id)
    setPlans(await getPlans())
    addToast('Plan deleted', 'success')
  }

  function updateFeature(idx, val) { setForm({ ...form, features: form.features.map((f, i) => i === idx ? val : f) }) }
  function addFeature() { setForm({ ...form, features: [...form.features, ''] }) }
  function removeFeature(idx) { setForm({ ...form, features: form.features.filter((_, i) => i !== idx) }) }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading plans…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Private & Premium Plans</h1>
          <p className="page-header-admin-desc">Manage pricing plans and premium offerings.</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Plan</button>
      </div>

      <div className="card-admin">
        {plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✦</div>
            <h3>No plans yet</h3>
            <p>Add your first pricing plan.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Grade</th>
                    <th>Price</th>
                    <th>Featured</th>
                    <th>Features</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id || p._id}>
                      <td><strong>{p.title}</strong></td>
                      <td><span className="badge badge-orange">{p.grade}</span></td>
                      <td>PKR {p.price}</td>
                      <td>{p.featured ? <span className="badge badge-green">Featured</span> : <span className="badge badge-gray">No</span>}</td>
                      <td className="cell-truncate">{p.features?.join(', ')}</td>
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

      {editing && (
        <Modal title={editing === 'new' ? 'Add Plan' : 'Edit Plan'} onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-field"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="admin-field"><label>Type ID</label><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. private-starter" /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field"><label>Grade</label><input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. Up to 5c" /></div>
              <div className="admin-field"><label>Label</label><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Small Group" /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field"><label>Price</label><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 8,000" /></div>
              <div className="admin-field"><label>Unit</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field"><label>Tag (optional)</label><input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Most booked" /></div>
              <div className="admin-field">
                <label>Featured</label>
                <select value={form.featured ? 'true' : 'false'} onChange={(e) => setForm({ ...form, featured: e.target.value === 'true' })}>
                  <option value="false">No</option>
                  <option value="true">Yes (dark card)</option>
                </select>
              </div>
            </div>
            <div className="admin-field">
              <label>Features</label>
              {form.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input style={{ flex: 1 }} value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                  <button className="btn-admin-icon danger" onClick={() => removeFeature(i)}>✕</button>
                </div>
              ))}
              <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addFeature} style={{ alignSelf: 'flex-start' }}>+ Add Feature</button>
            </div>
            <div className="admin-form-actions">
              <button className="btn-admin btn-admin-primary" onClick={handleSave}>Save</button>
              <button className="btn-admin btn-admin-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
