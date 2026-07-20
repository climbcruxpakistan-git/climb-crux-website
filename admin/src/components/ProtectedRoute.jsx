import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--admin-bg)',
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        fontSize: '0.85rem',
        letterSpacing: '0.06em',
        color: 'var(--stone)',
      }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
