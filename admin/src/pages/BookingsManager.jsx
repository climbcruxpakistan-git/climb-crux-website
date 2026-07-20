import { useState, useEffect } from 'react'
import { getBookings, saveBooking, deleteBooking } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

export default function BookingsManager() {
  const { addToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [editing, setEditing] = useState(null)
  const emptyForm = { name: '', email: '', phone: '', type: '', date: '', groupSize: '1', experience: '', message: '', status: 'pending' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...emptyForm }); setEditing('new') }

  function openEdit(b) {
    setForm({ name: b.name || '', email: b.email || '', phone: b.phone || '', type: b.type || '', date: b.date || '', groupSize: b.groupSize || '1', experience: b.experience || '', message: b.message || '', status: b.status || 'pending' })
    setEditing(b.id)
  }

  async function handleSave() {
    if (!form.name || !form.email) { addToast('Name and email are required', 'error'); return }
    const booking = editing === 'new' ? { id: null, ...form } : { id: editing, ...form }
    await saveBooking(booking)
    setBookings(await getBookings())
    setEditing(null)
    addToast('Booking saved', 'success')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this booking?')) return
    await deleteBooking(id)
    setBookings(await getBookings())
    addToast('Booking deleted', 'success')
  }

  async function updateStatus(id, status) {
    const booking = bookings.find((b) => b.id === id)
    if (booking) {
      await saveBooking({ ...booking, status })
      setBookings(await getBookings())
      addToast(`Booking ${status}`, 'success')
    }
  }

  const shown = filter === 'All' ? bookings : bookings.filter((b) => b.status === filter.toLowerCase())
  const statusBadge = (status) => {
    const cls = status === 'confirmed' ? 'badge-green' : status === 'cancelled' ? 'badge-red' : 'badge-yellow'
    return <span className={`badge ${cls}`}>{status || 'pending'}</span>
  }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading bookings…</h3>
      </div>
    )
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Bookings</h1>
          <p className="page-header-admin-desc">View and manage customer booking requests.</p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Booking</button>
      </div>

      <div className="card-admin">
        <div className="card-admin-header">
          <h2>All Bookings ({bookings.length})</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All', 'Pending', 'Confirmed', 'Cancelled'].map((c) => (
              <button key={c} className={`btn-admin btn-admin-sm ${filter === c ? 'btn-admin-primary' : 'btn-admin-ghost'}`} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No bookings yet</h3>
            <p>Bookings from the website will appear here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((b) => (
                    <tr key={b.id || b._id}>
                      <td><strong>{b.name}</strong></td>
                      <td className="cell-truncate">{b.email} {b.phone ? `· ${b.phone}` : ''}</td>
                      <td>{b.type?.replace(/-/g, ' ') || '—'}</td>
                      <td>{b.date || '—'}</td>
                      <td>{statusBadge(b.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button className="btn-admin-icon" onClick={() => openEdit(b)} title="Edit">✎</button>
                          {b.status !== 'confirmed' && (
                            <button className="btn-admin btn-admin-sm" style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }} onClick={() => updateStatus(b.id, 'confirmed')} title="Confirm">✓</button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button className="btn-admin btn-admin-sm" style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem' }} onClick={() => updateStatus(b.id, 'cancelled')} title="Cancel">✕</button>
                          )}
                          <button className="btn-admin-icon danger" onClick={() => handleDelete(b.id)} title="Delete">✕</button>
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
        <Modal title={editing === 'new' ? 'Add Booking' : 'Edit Booking'} onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="admin-field"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="admin-field"><label>Group Size</label><input type="number" min="1" value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: e.target.value })} /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field"><label>Session Type</label><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. public" /></div>
              <div className="admin-field"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div className="admin-field">
              <label>Experience</label>
              <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}>
                <option value="">Select</option>
                <option value="beginner">First time</option>
                <option value="some">A few times</option>
                <option value="intermediate">Regular climber</option>
                <option value="advanced">Experienced</option>
              </select>
            </div>
            <div className="admin-field"><label>Message</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} /></div>
            <div className="admin-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
