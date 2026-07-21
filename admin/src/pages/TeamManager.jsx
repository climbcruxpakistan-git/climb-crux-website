import { useState, useEffect } from 'react'
import { getTeam, saveTeamMember, deleteTeamMember } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

const EMPTY_FORM = { name: '', role: '', bio: '', photoUrl: '', experience: '', coachingExperience: '', certifications: [], instagram: '' }

export default function TeamManager() {
  const { addToast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    getTeam()
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...EMPTY_FORM, certifications: [] }); setEditing('new') }

  function openEdit(m) {
    setForm({
      name: m.name || '', role: m.role || '', bio: m.bio || '',
      photoUrl: m.photoUrl || '', experience: m.experience || '',
      coachingExperience: m.coachingExperience || '',
      certifications: Array.isArray(m.certifications) ? [...m.certifications] : [],
      instagram: m.instagram || '',
    })
    setEditing(m.id)
  }

  async function handleSave() {
    if (!form.name) { addToast('Name is required', 'error'); return }
    try {
      const member = editing === 'new' ? { id: null, ...form } : { id: editing, ...form }
      await saveTeamMember(member)
      setMembers(await getTeam())
      setEditing(null)
      addToast('Team member saved', 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to save', 'error')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this team member?')) return
    try {
      await deleteTeamMember(id)
      setMembers(await getTeam())
      addToast('Team member deleted', 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to delete', 'error')
    }
  }

  function addCert() { setForm({ ...form, certifications: [...form.certifications, ''] }) }
  function updateCert(idx, val) { setForm({ ...form, certifications: form.certifications.map((c, i) => i === idx ? val : c) }) }
  function removeCert(idx) { setForm({ ...form, certifications: form.certifications.filter((_, i) => i !== idx) }) }

  if (loading) return <div className="empty-state"><h3>Loading team members…</h3></div>

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Team Members</h1>
          <p className="page-header-admin-desc">Manage instructors and their detailed profile pages.</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Member</button>
      </div>

      <div className="card-admin">
        {members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⊙</div>
            <h3>No team members yet</h3>
            <p>Add your first instructor.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Certifications</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id || m._id}>
                      <td>
                        {m.photoUrl ? (
                          <img src={m.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--chalk-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--stone)' }}>?</div>
                        )}
                      </td>
                      <td><strong>{m.name}</strong></td>
                      <td>{m.role}</td>
                      <td className="cell-truncate">{Array.isArray(m.certifications) ? m.certifications.join(', ') : m.certifications}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-admin-icon" onClick={() => openEdit(m)} title="Edit">✎</button>
                          <button className="btn-admin-icon danger" onClick={() => handleDelete(m.id)} title="Delete">✕</button>
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
        <Modal title={editing === 'new' ? 'Add Team Member' : 'Edit Team Member'} onClose={() => setEditing(null)}>
          <div className="admin-form" style={{ maxWidth: '100%' }}>
            <div className="admin-form-row">
              <div className="admin-field"><label>Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
              <div className="admin-field"><label>Role</label><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Founder & Head Guide" /></div>
            </div>
            <div className="admin-field"><label>Short Bio (shown on team card)</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Short biography…" /></div>
            <div className="admin-field">
              <label>Photo URL (Cloudinary)</label>
              <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="Paste Cloudinary URL from Photos tab" />
              {form.photoUrl && <img src={form.photoUrl} alt="" style={{ marginTop: 4, maxHeight: 100, borderRadius: 4, objectFit: 'cover' }} />}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e0d4', margin: '16px 0' }} />
            <h3 style={{ fontSize: '0.85rem', marginBottom: 16 }}>Detailed Profile (shown on profile page)</h3>

            <div className="admin-field"><label>Climbing Experience</label><textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} rows={3} placeholder="Years of climbing, notable ascents, hardest grades sent…" /></div>

            <div className="admin-field"><label>Coaching Experience</label><textarea value={form.coachingExperience} onChange={(e) => setForm({ ...form, coachingExperience: e.target.value })} rows={3} placeholder="Years of instruction, teaching philosophy, types of climbers coached…" /></div>

            {/* Certifications — add/remove list */}
            <div className="admin-field">
              <label>Certifications (add one at a time)</label>
              {form.certifications.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    style={{ flex: 1 }}
                    value={c}
                    onChange={(e) => updateCert(i, e.target.value)}
                    placeholder={`Certification ${i + 1}`}
                  />
                  <button className="btn-admin-icon danger" onClick={() => removeCert(i)}>✕</button>
                </div>
              ))}
              <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addCert} style={{ alignSelf: 'flex-start' }}>
                + Add Certification
              </button>
            </div>

            <div className="admin-field"><label>Instagram URL</label><input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/..." /></div>

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
