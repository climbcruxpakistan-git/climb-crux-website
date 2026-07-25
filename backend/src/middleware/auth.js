import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'climb-crux-admin-secret-change-in-production'

/**
 * Middleware that requires a valid JWT for non-GET requests.
 * GET requests pass through (public read access).
 * POST, PUT, PATCH, DELETE require a valid Bearer token from admin login.
 */
export function requireAdmin(req, res, next) {
  // Allow GET requests without auth (public read)
  if (req.method === 'GET') return next()

  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' })
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' })
  }
}
