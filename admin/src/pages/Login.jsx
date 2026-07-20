import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--admin-bg)',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--admin-surface)',
        borderRadius: 'var(--admin-radius)',
        boxShadow: 'var(--admin-shadow)',
        padding: 40,
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Climb Crux" style={{ height: 48, margin: '0 auto 12px' }} />
          <div style={{
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--charcoal)',
            fontSize: '1.2rem',
          }}>
            Admin Panel
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--stone)',
            marginTop: 4,
          }}>
            Sign in to manage your content
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: '0.85rem',
            marginBottom: 20,
            border: '1px solid #fca5a5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="admin-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="admin-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-admin btn-admin-primary"
            disabled={sending}
            style={{ width: '100%', justifyContent: 'center', padding: '0.85em 1.3em', fontSize: '0.82rem' }}
          >
            {sending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
