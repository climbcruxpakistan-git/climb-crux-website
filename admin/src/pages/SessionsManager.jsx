import { useState, useEffect } from 'react'
import { getSessions, saveSession, deleteSession, saveIncludedItems, saveFaqs, getSessionContent, saveSessionContent } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

export default function SessionsManager() {
  const { addToast } = useToast()
  const [sessions, setSessions] = useState([])
  const [included, setIncluded] = useState([])
  const [faqs, setFaqsState] = useState([])
  const [sessionsDisabled, setSessionsDisabled] = useState(false)
  const [pageContent, setPageContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showFaq, setShowFaq] = useState(null)
  const [showIncluded, setShowIncluded] = useState(null)
  const defaultFeatures = [
    { text: '2–3 hour guided session' },
    { text: 'Certified instructor & safety briefing' },
    { text: 'Harness, helmet, rope, belay gear & climbing shoes' },
    { text: 'Group of up to 20 climbers' },
  ]

  const [showPricing, setShowPricing] = useState(false)
  const [pricing, setPricing] = useState({ title: 'Public Session', price: '4,500', unit: '/ person', features: defaultFeatures })
  const [showSessionsContent, setShowSessionsContent] = useState(false)
  const [showPpContent, setShowPpContent] = useState(false)
  const [form, setForm] = useState({ date: '', time: '', spots: '' })

  useEffect(() => {
    Promise.all([getSessions(), getSessionContent()])
      .then(([sessions, content]) => {
        setSessions(sessions)
        setIncluded(content.includedItems || [])
        setFaqsState(content.faqs || [])
        setSessionsDisabled(content.sessionsDisabled || false)
        setPageContent(content)
        setPricing({
          title: content.pricingTitle || 'Public Session',
          price: content.pricingPrice || '4,500',
          unit: content.pricingUnit || '/ person',
          features: content.pricingFeatures?.length ? content.pricingFeatures : defaultFeatures,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function reload() {
    getSessions().then(setSessions).catch(console.error)
  }

  function openNew() {
    setForm({ date: '', time: '', spots: '' })
    setEditing('new')
  }

  function openEdit(s) {
    setForm({ date: s.date, time: s.time, spots: s.spots })
    setEditing(s.id)
  }

  async function handleSave() {
    if (!form.date || !form.time) {
      addToast('Date and time are required', 'error')
      return
    }
    const session = editing === 'new' ? { id: null, ...form } : { id: editing, ...form }
    await saveSession(session)
    await reload()
    setEditing(null)
    addToast('Session saved', 'success')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this session?')) return
    await deleteSession(id)
    await reload()
    addToast('Session deleted', 'success')
  }

  async function handleIncludedSave(items) {
    await saveIncludedItems(items)
    setIncluded(items)
    setShowIncluded(null)
    addToast('Included items updated', 'success')
  }

  async function handleToggleSessions() {
    const next = !sessionsDisabled
    const content = await getSessionContent()
    await saveSessionContent({ ...content, sessionsDisabled: next })
    setSessionsDisabled(next)
    addToast(next ? 'Sessions hidden from visitors' : 'Sessions now visible', 'success')
  }

  async function handleFaqSave(faq) {
    const list = [...faqs]
    const idx = showFaq === 'new' ? -1 : list.findIndex((f) => f.q === showFaq)
    if (idx >= 0) {
      list[idx] = faq
    } else {
      list.push(faq)
    }
    await saveFaqs(list)
    setFaqsState(list)
    setShowFaq(null)
    addToast('FAQ saved', 'success')
  }

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading sessions…</h3>
      </div>
    )
  }

  const c = pageContent

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Public Sessions</h1>
          <p className="page-header-admin-desc">
            Manage upcoming sessions, pricing card, included features, FAQs, and page content.
          </p>
        </div>
        <button className="btn-admin btn-admin-primary" onClick={openNew}>
          + Add Session
        </button>
      </div>

      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Upcoming Sessions</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer', color: sessionsDisabled ? '#dc2626' : '#666' }}>
              <span>Hide sessions</span>
              <button
                onClick={handleToggleSessions}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: sessionsDisabled ? '#dc2626' : '#ccc',
                  position: 'relative', transition: 'background 0.2s',
                }}
                aria-label={sessionsDisabled ? 'Show sessions' : 'Hide sessions'}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  left: sessionsDisabled ? 20 : 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </label>
            <button className="btn-admin btn-admin-primary" onClick={openNew}>+ Add Session</button>
          </div>
        </div>
        {sessionsDisabled ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">🔴</div>
            <h3>Public sessions are hidden</h3>
            <p>Visitors will see a message suggesting private sessions instead. Toggle the switch above to show sessions again.</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">📅</div>
            <h3>No sessions scheduled</h3>
            <p>Add a public session above.</p>
          </div>
        ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Spots</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.date}</strong></td>
                    <td>{s.time}</td>
                    <td>
                      <span className={`badge ${s.spots === 'Open' ? 'badge-green' : s.spots.includes('left') ? 'badge-yellow' : 'badge-gray'}`}>
                        {s.spots}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-admin-icon" onClick={() => openEdit(s)} title="Edit">✎</button>
                        <button className="btn-admin-icon danger" onClick={() => handleDelete(s.id)} title="Delete">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}            </tbody>
          </table>
        </div>
        </div>
        )}
      </div>

      {/* Public Session Pricing Card */}
      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Public Session Pricing Card</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setShowPricing(true)}>
            Edit Pricing Card
          </button>
        </div>
        <div style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Title</span>
              <div style={{ fontWeight: 600 }}>{pricing.title}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Price</span>
              <div style={{ fontWeight: 600 }}>PKR {pricing.price} <span style={{ fontWeight: 400, color: '#888' }}>{pricing.unit}</span></div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Features ({pricing.features.length})</span>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.85rem' }}>
                {pricing.features.map((f, i) => (
                  <li key={i}>{f.text || f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="card-admin">
        <div className="card-admin-header">
          <h2>"What's Included" Section</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setShowIncluded(true)}>
            Edit Items
          </button>
        </div>
        <div className="sortable-list">
          {included.map((item, i) => (
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

      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Frequently Asked Questions</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setShowFaq('new')}>
            + Add FAQ
          </button>
        </div>
        <div className="sortable-list">
          {faqs.map((f, i) => (
            <div className="sortable-item" key={i}>
              <div className="sortable-item-left">
                <div className="sortable-item-info">
                  <div className="sortable-item-title">{f.q}</div>
                  <div className="sortable-item-sub">{f.a.slice(0, 80)}…</div>
                </div>
              </div>
              <div className="sortable-item-actions">
                <button className="btn-admin-icon" onClick={() => setShowFaq(f.q)} title="Edit">✎</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions Page Content */}
      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Sessions Page Content</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setShowSessionsContent(true)}>Edit</button>
        </div>
        <div style={{ padding: '12px 0', fontSize: '0.85rem', color: 'var(--stone)' }}>
          <p>Edit page header, section headings, and custom session card for the Public Sessions page.</p>
        </div>
      </div>

      {/* Private & Premium Page Content */}
      <div className="card-admin">
        <div className="card-admin-header">
          <h2>Private &amp; Premium Page Content</h2>
          <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => setShowPpContent(true)}>Edit</button>
        </div>
        <div style={{ padding: '12px 0', fontSize: '0.85rem', color: 'var(--stone)' }}>
          <p>Edit page header, section headings, custom session card, and customizable items for the Private &amp; Premium page.</p>
        </div>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add Session' : 'Edit Session'} onClose={() => setEditing(null)}>
          <div className="admin-form">
            <div className="admin-field">
              <label>Date</label>
              <input type="text" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. Sun, Aug 16" />
              <span className="field-hint">Format: Day, Mon DD</span>
            </div>
            <div className="admin-field">
              <label>Time</label>
              <input type="text" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="e.g. 8:00 AM – 1:00 PM" />
            </div>
            <div className="admin-field">
              <label>Spots</label>
              <input type="text" value={form.spots} onChange={(e) => setForm({ ...form, spots: e.target.value })} placeholder="e.g. 5 spots left or Open" />
            </div>
            <div className="admin-form-actions">
              <button className="btn-admin btn-admin-primary" onClick={handleSave}>Save</button>
              <button className="btn-admin btn-admin-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {showPricing && (
        <Modal title="Edit Public Session Pricing Card" onClose={() => setShowPricing(null)}>
          <PricingForm
            data={pricing}
            onSave={async (data) => {
              const content = await getSessionContent()
              await saveSessionContent({
                ...content,
                pricingTitle: data.title,
                pricingPrice: data.price,
                pricingUnit: data.unit,
                pricingFeatures: data.features,
              })
              setPricing(data)
              setShowPricing(null)
              addToast('Pricing card updated', 'success')
            }}
            onCancel={() => setShowPricing(null)}
          />
        </Modal>
      )}

      {showIncluded && (
        <Modal title="Edit Included Items" onClose={() => setShowIncluded(null)}>
          <IncludedForm items={included} onSave={handleIncludedSave} onCancel={() => setShowIncluded(null)} />
        </Modal>
      )}

      {showFaq && (
        <Modal title={showFaq === 'new' ? 'Add FAQ' : 'Edit FAQ'} onClose={() => setShowFaq(null)}>
          <FaqForm faq={showFaq === 'new' ? { q: '', a: '' } : faqs.find((f) => f.q === showFaq) || { q: '', a: '' }} onSave={handleFaqSave} onCancel={() => setShowFaq(null)} />
        </Modal>
      )}

      {showSessionsContent && (
        <Modal title="Sessions Page Content" onClose={() => setShowSessionsContent(false)} wide>
          <SessionsPageContentForm
            content={{
              sessionsHeaderTitle: c.sessionsHeaderTitle || '',
              sessionsHeaderDesc: c.sessionsHeaderDesc || '',
              sessionsSectionTitle: c.sessionsSectionTitle || '',
              pricingSectionTitle: c.pricingSectionTitle || '',
              includedSectionTitle: c.includedSectionTitle || '',
              faqEyebrow: c.faqEyebrow || '',
              faqSectionTitle: c.faqSectionTitle || '',
              customSession: c.customSession || { title: '', grade: '', label: '', price: '', unit: '', features: [''] },
            }}
            onSave={async (data) => {
              const content = await getSessionContent()
              await saveSessionContent({ ...content, ...data })
              const updated = await getSessionContent()
              setPageContent(updated)
              setShowSessionsContent(false)
              addToast('Sessions page content updated', 'success')
            }}
            onCancel={() => setShowSessionsContent(false)}
          />
        </Modal>
      )}

      {showPpContent && (
        <Modal title="Private &amp; Premium Page Content" onClose={() => setShowPpContent(false)} wide>
          <PrivatePremiumContentForm
            content={{
              ppHeaderTitle: c.ppHeaderTitle || '',
              ppHeaderDesc: c.ppHeaderDesc || '',
              ppEyebrow: c.ppEyebrow || '',
              ppSectionTitle: c.ppSectionTitle || '',
              ppSectionDesc: c.ppSectionDesc || '',
              ppCustomSession: c.ppCustomSession || { title: '', grade: '', label: '', price: '', unit: '', features: [''] },
              ppCustomEyebrow: c.ppCustomEyebrow || '',
              ppCustomSectionTitle: c.ppCustomSectionTitle || '',
              ppCustomItems: c.ppCustomItems || [],
            }}
            onSave={async (data) => {
              const content = await getSessionContent()
              await saveSessionContent({ ...content, ...data })
              const updated = await getSessionContent()
              setPageContent(updated)
              setShowPpContent(false)
              addToast('Private & Premium page content updated', 'success')
            }}
            onCancel={() => setShowPpContent(false)}
          />
        </Modal>
      )}
    </>
  )
}

function IncludedForm({ items, onSave, onCancel }) {
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

function FaqForm({ faq, onSave, onCancel }) {
  const [form, setForm] = useState(faq)
  return (
    <div className="admin-form">
      <div className="admin-field"><label>Question</label><input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} /></div>
      <div className="admin-field"><label>Answer</label><textarea value={form.a} onChange={(e) => setForm({ ...form, a: e.target.value })} rows={4} /></div>
      <div className="admin-form-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => onSave(form)}>Save</button>
        <button className="btn-admin btn-admin-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function PricingForm({ data, onSave, onCancel }) {
  const [title, setTitle] = useState(data.title)
  const [price, setPrice] = useState(data.price)
  const [unit, setUnit] = useState(data.unit)
  const [features, setFeatures] = useState(
    data.features.map((f) => (typeof f === 'string' ? f : f.text || ''))
  )

  function updateFeature(idx, val) {
    setFeatures(features.map((f, i) => (i === idx ? val : f)))
  }
  function addFeature() { setFeatures([...features, '']) }
  function removeFeature(idx) { setFeatures(features.filter((_, i) => i !== idx)) }

  async function handleSave() {
    await onSave({
      title,
      price,
      unit,
      features: features.filter((f) => f.trim()).map((text) => ({ text })),
    })
  }

  return (
    <div className="admin-form">
      <div className="admin-form-row">
        <div className="admin-field">
          <label>Card Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Public Session" />
        </div>
      </div>
      <div className="admin-form-row">
        <div className="admin-field">
          <label>Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 4,500" />
        </div>
        <div className="admin-field">
          <label>Unit</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. / person" />
        </div>
      </div>
      <div className="admin-field">
        <label>Features</label>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input style={{ flex: 1 }} value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
            <button className="btn-admin-icon danger" onClick={() => removeFeature(i)}>✕</button>
          </div>
        ))}
        <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addFeature} style={{ alignSelf: 'flex-start' }}>+ Add Feature</button>
      </div>
      <div className="admin-form-actions">
        <button className="btn-admin btn-admin-primary" onClick={handleSave}>Save</button>
        <button className="btn-admin btn-admin-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function SessionsPageContentForm({ content, onSave, onCancel }) {
  const [form, setForm] = useState(content)

  function updateCustom(field, val) {
    setForm({ ...form, customSession: { ...form.customSession, [field]: val } })
  }

  function addFeature() {
    setForm({ ...form, customSession: { ...form.customSession, features: [...(form.customSession?.features || []), ''] } })
  }

  function updateFeature(idx, val) {
    const feat = [...(form.customSession?.features || [])]
    feat[idx] = val
    setForm({ ...form, customSession: { ...form.customSession, features: feat } })
  }

  function removeFeature(idx) {
    const feat = (form.customSession?.features || []).filter((_, i) => i !== idx)
    setForm({ ...form, customSession: { ...form.customSession, features: feat } })
  }

  return (
    <div className="admin-form">
      <h3 style={{ marginBottom: 12 }}>Page Header</h3>
      <div className="admin-field">
        <label>Header Title</label>
        <input value={form.sessionsHeaderTitle} onChange={(e) => setForm({ ...form, sessionsHeaderTitle: e.target.value })} />
      </div>
      <div className="admin-field">
        <label>Header Description</label>
        <textarea rows={3} value={form.sessionsHeaderDesc} onChange={(e) => setForm({ ...form, sessionsHeaderDesc: e.target.value })} />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e0d4', margin: '16px 0' }} />
      <h3 style={{ marginBottom: 12 }}>Section Headings</h3>
      <div className="admin-field"><label>Sessions Section Title</label><input value={form.sessionsSectionTitle} onChange={(e) => setForm({ ...form, sessionsSectionTitle: e.target.value })} /></div>
      <div className="admin-field"><label>Pricing Section Title</label><input value={form.pricingSectionTitle} onChange={(e) => setForm({ ...form, pricingSectionTitle: e.target.value })} /></div>
      <div className="admin-field"><label>Included Section Title</label><input value={form.includedSectionTitle} onChange={(e) => setForm({ ...form, includedSectionTitle: e.target.value })} /></div>
      <div className="admin-field"><label>FAQ Eyebrow</label><input value={form.faqEyebrow} onChange={(e) => setForm({ ...form, faqEyebrow: e.target.value })} /></div>
      <div className="admin-field"><label>FAQ Section Title</label><input value={form.faqSectionTitle} onChange={(e) => setForm({ ...form, faqSectionTitle: e.target.value })} /></div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e0d4', margin: '16px 0' }} />
      <h3 style={{ marginBottom: 12 }}>Customizable Session Card</h3>
      <div className="admin-form-row">
        <div className="admin-field"><label>Title</label><input value={form.customSession?.title || ''} onChange={(e) => updateCustom('title', e.target.value)} /></div>
        <div className="admin-field"><label>Grade</label><input value={form.customSession?.grade || ''} onChange={(e) => updateCustom('grade', e.target.value)} /></div>
      </div>
      <div className="admin-form-row">
        <div className="admin-field"><label>Label</label><input value={form.customSession?.label || ''} onChange={(e) => updateCustom('label', e.target.value)} /></div>
        <div className="admin-field"><label>Price</label><input value={form.customSession?.price || ''} onChange={(e) => updateCustom('price', e.target.value)} /></div>
      </div>
      <div className="admin-field"><label>Unit</label><input value={form.customSession?.unit || ''} onChange={(e) => updateCustom('unit', e.target.value)} /></div>
      <div className="admin-field">
        <label>Features</label>
        {(form.customSession?.features || []).map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input style={{ flex: 1 }} value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
            <button className="btn-admin-icon danger" onClick={() => removeFeature(i)}>✕</button>
          </div>
        ))}
        <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addFeature} style={{ alignSelf: 'flex-start' }}>+ Add Feature</button>
      </div>

      <div className="admin-form-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => onSave(form)}>Save All</button>
        <button className="btn-admin btn-admin-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function PrivatePremiumContentForm({ content, onSave, onCancel }) {
  const [form, setForm] = useState(content)

  function updateCustom(field, val) {
    setForm({ ...form, ppCustomSession: { ...form.ppCustomSession, [field]: val } })
  }

  function addFeature() {
    setForm({ ...form, ppCustomSession: { ...form.ppCustomSession, features: [...(form.ppCustomSession?.features || []), ''] } })
  }

  function updateFeature(idx, val) {
    const feat = [...(form.ppCustomSession?.features || [])]
    feat[idx] = val
    setForm({ ...form, ppCustomSession: { ...form.ppCustomSession, features: feat } })
  }

  function removeFeature(idx) {
    const feat = (form.ppCustomSession?.features || []).filter((_, i) => i !== idx)
    setForm({ ...form, ppCustomSession: { ...form.ppCustomSession, features: feat } })
  }

  function addCustomItem() {
    setForm({ ...form, ppCustomItems: [...(form.ppCustomItems || []), { h: '', p: '' }] })
  }

  function updateCustomItem(idx, field, val) {
    const items = [...(form.ppCustomItems || [])]
    items[idx] = { ...items[idx], [field]: val }
    setForm({ ...form, ppCustomItems: items })
  }

  function removeCustomItem(idx) {
    setForm({ ...form, ppCustomItems: (form.ppCustomItems || []).filter((_, i) => i !== idx) })
  }

  return (
    <div className="admin-form">
      <h3 style={{ marginBottom: 12 }}>Page Header</h3>
      <div className="admin-field">
        <label>Header Title</label>
        <input value={form.ppHeaderTitle} onChange={(e) => setForm({ ...form, ppHeaderTitle: e.target.value })} />
      </div>
      <div className="admin-field">
        <label>Header Description</label>
        <textarea rows={3} value={form.ppHeaderDesc} onChange={(e) => setForm({ ...form, ppHeaderDesc: e.target.value })} />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e0d4', margin: '16px 0' }} />
      <h3 style={{ marginBottom: 12 }}>Section Headings</h3>
      <div className="admin-field"><label>Plans Eyebrow</label><input value={form.ppEyebrow} onChange={(e) => setForm({ ...form, ppEyebrow: e.target.value })} /></div>
      <div className="admin-field"><label>Plans Section Title</label><input value={form.ppSectionTitle} onChange={(e) => setForm({ ...form, ppSectionTitle: e.target.value })} /></div>
      <div className="admin-field"><label>Plans Section Description</label><textarea rows={2} value={form.ppSectionDesc} onChange={(e) => setForm({ ...form, ppSectionDesc: e.target.value })} /></div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e0d4', margin: '16px 0' }} />
      <h3 style={{ marginBottom: 12 }}>Customizable Session Card</h3>
      <div className="admin-form-row">
        <div className="admin-field"><label>Title</label><input value={form.ppCustomSession?.title || ''} onChange={(e) => updateCustom('title', e.target.value)} /></div>
        <div className="admin-field"><label>Grade</label><input value={form.ppCustomSession?.grade || ''} onChange={(e) => updateCustom('grade', e.target.value)} /></div>
      </div>
      <div className="admin-form-row">
        <div className="admin-field"><label>Label</label><input value={form.ppCustomSession?.label || ''} onChange={(e) => updateCustom('label', e.target.value)} /></div>
        <div className="admin-field"><label>Price</label><input value={form.ppCustomSession?.price || ''} onChange={(e) => updateCustom('price', e.target.value)} /></div>
      </div>
      <div className="admin-field"><label>Unit</label><input value={form.ppCustomSession?.unit || ''} onChange={(e) => updateCustom('unit', e.target.value)} /></div>
      <div className="admin-field">
        <label>Features</label>
        {(form.ppCustomSession?.features || []).map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input style={{ flex: 1 }} value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
            <button className="btn-admin-icon danger" onClick={() => removeFeature(i)}>✕</button>
          </div>
        ))}
        <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addFeature} style={{ alignSelf: 'flex-start' }}>+ Add Feature</button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e0d4', margin: '16px 0' }} />
      <h3 style={{ marginBottom: 12 }}>"What Gets Customized" Section</h3>
      <div className="admin-field"><label>Section Eyebrow</label><input value={form.ppCustomEyebrow} onChange={(e) => setForm({ ...form, ppCustomEyebrow: e.target.value })} /></div>
      <div className="admin-field"><label>Section Title</label><input value={form.ppCustomSectionTitle} onChange={(e) => setForm({ ...form, ppCustomSectionTitle: e.target.value })} /></div>
      <div className="admin-field">
        <label>Custom Items</label>
        {(form.ppCustomItems || []).map((item, i) => (
          <div key={i} style={{ border: '1px solid #e5e0d4', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
              <input style={{ flex: 1 }} placeholder="Heading" value={item.h} onChange={(e) => updateCustomItem(i, 'h', e.target.value)} />
              <button className="btn-admin-icon danger" onClick={() => removeCustomItem(i)}>✕</button>
            </div>
            <textarea style={{ width: '100%' }} rows={2} placeholder="Description" value={item.p} onChange={(e) => updateCustomItem(i, 'p', e.target.value)} />
          </div>
        ))}
        <button className="btn-admin btn-admin-ghost btn-admin-sm" onClick={addCustomItem} style={{ alignSelf: 'flex-start' }}>+ Add Item</button>
      </div>

      <div className="admin-form-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => onSave(form)}>Save All</button>
        <button className="btn-admin btn-admin-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
