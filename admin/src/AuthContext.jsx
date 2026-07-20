import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API = '/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    if (stored) {
      // Verify the token is still valid
      fetch(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Invalid token')
          const text = await res.text()
          return text ? JSON.parse(text) : null
        })
        .then((data) => {
          if (data?.email) setUser({ email: data.email, token: stored })
          else throw new Error('Invalid token')
        })
        .catch(() => {
          localStorage.removeItem('admin_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const text = await res.text()
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      throw new Error('Server returned an invalid response. Is the backend running?')
    }
    if (!res.ok) throw new Error(data?.error || 'Login failed')
    if (!data?.token) throw new Error('Server did not return a token')
    localStorage.setItem('admin_token', data.token)
    setUser({ email: data.email, token: data.token })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
