import { Router } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@climbcrux'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'climbcrux@admin'
const JWT_SECRET = process.env.JWT_SECRET || 'climb-crux-admin-secret-change-in-production'

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({ token, email })
})

// GET /api/auth/verify — check if a token is still valid
router.get('/verify', (req, res) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ valid: true, email: decoded.email })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router
