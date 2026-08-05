import { useState, useEffect, useCallback } from 'react'
import { sendEmail, getEmailHistory } from '../store.js'
import { useToast } from '../components/Toast.jsx'
import { formatDateTime } from '../formatDate.js'

const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'docx']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB (mirrors backend)

/** Format a byte size as KB/MB. */
function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function EmailSender() {
  const { addToast } = useToast()
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([]) // selected File objects
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const loadHistory = useCallback(() => {
    getEmailHistory()
      .then(setHistory)
      .catch((err) => addToast(`Failed to load email history: ${err.message}`, 'error'))
      .finally(() => setLoadingHistory(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  function handleFiles(selected) {
    const list = Array.from(selected || [])
    const input = document.getElementById('email-attachments')
    const reject = (msg) => {
      addToast(msg, 'error')
      if (input) input.value = '' // clear the stale selection so re-picking works
    }
    // Reject unsupported types
    const unsupported = list.find((f) => {
      const ext = (f.name || '').split('.').pop().toLowerCase()
      return !ALLOWED_EXT.includes(ext)
    })
    if (unsupported) {
      return reject(`"${unsupported.name}" is not allowed. Use PDF, JPG, JPEG, PNG or DOCX.`)
    }
    const tooBig = list.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      return reject(`"${tooBig.name}" is larger than 10 MB.`)
    }
    if (list.length > 5) {
      return reject('You can attach up to 5 files.')
    }
    setFiles(list)
    if (input) input.value = '' // allow re-selecting the same file next time
  }

  function resetForm() {
    setTo('')
    setSubject('')
    setMessage('')
    setFiles([])
    const input = document.getElementById('email-attachments')
    if (input) input.value = ''
  }

  async function handleSend(e) {
    e.preventDefault()
    if (sending) return
    if (!to.trim()) return addToast('Recipient email is required', 'error')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) return addToast('Enter a valid recipient email address', 'error')
    if (!subject.trim()) return addToast('Subject is required', 'error')
    if (!message.trim()) return addToast('Message body is required', 'error')

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('to', to.trim())
      formData.append('subject', subject.trim())
      formData.append('message', message)
      files.forEach((f) => formData.append('attachments', f))
      await sendEmail(formData)
      addToast('Email sent successfully.', 'success')
      resetForm()
      loadHistory()
    } catch (err) {
      // Failure — keep the form so the admin can edit and resend.
      addToast(`Failed to send: ${err.message}`, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="page-header-admin">
        <div>
          <h1>Email</h1>
          <p className="page-header-admin-desc">
            Send a professional email from <strong>Climb Crux</strong> ({'bookings@climbcruxpakistan.com'}) to any recipient.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        {/* ── Compose form ── */}
        <div className="card-admin">
          <div className="card-admin-header">
            <h2>Compose Email</h2>
          </div>
          <form onSubmit={handleSend} noValidate>
            <div className="admin-field">
              <label htmlFor="email-to">Recipient Email <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                id="email-to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="customer@example.com"
                autoComplete="off"
              />
            </div>

            <div className="admin-field">
              <label htmlFor="email-subject">Subject <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                id="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your booking with Climb Crux"
                autoComplete="off"
              />
            </div>

            <div className="admin-field">
              <label htmlFor="email-message">Message Body <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea
                id="email-message"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here…"
                style={{ resize: 'vertical', minHeight: 160 }}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="email-attachments">Attachments <span className="field-hint" style={{ marginLeft: 8 }}>(optional — up to 5 files, 10 MB each)</span></label>
              <input
                id="email-attachments"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {files.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {files.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="badge badge-blue"
                      style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      📎 {f.name} ({formatSize(f.size)})
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                        aria-label={`Remove ${f.name}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <button type="submit" className="btn-admin btn-admin-primary" disabled={sending}>
                {sending ? '… Sending…' : '✉ Send Email'}
              </button>
              <button type="button" className="btn-admin btn-admin-ghost" onClick={resetForm} disabled={sending}>
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* ── Recent emails ── */}
        <div className="card-admin">
          <div className="card-admin-header">
            <h2>Recent Emails ({history.length})</h2>
          </div>

          {loadingHistory ? (
            <div className="empty-state"><h3>Loading email history…</h3></div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📮</div>
              <h3>No emails sent yet</h3>
              <p>Emails you send from this page will appear here.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Subject</th>
                      <th>Attachments</th>
                      <th>Status</th>
                      <th>Sent By</th>
                      <th>Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((m) => (
                      <tr key={m.id || m._id}>
                        <td><strong>{m.recipient}</strong></td>
                        <td style={{ maxWidth: 240 }}>{m.subject}</td>
                        <td>
                          {m.attachments?.length ? (
                            <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                              {m.attachments.length} file{m.attachments.length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="cell-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${m.delivery_status === 'sent' ? 'badge-green' : 'badge-red'}`}>
                            {m.delivery_status === 'sent' ? '✓ Sent' : '✕ Failed'}
                          </span>
                        </td>
                        <td>{m.sent_by || 'Admin'}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--stone)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(m.created_at) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
