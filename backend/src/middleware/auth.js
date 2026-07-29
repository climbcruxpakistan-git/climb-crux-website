import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'climb-crux-admin-secret-change-in-production'

/**
 * Parse and verify a JWT from the Authorization header.
 * Returns the decoded payload on success, or sends a 401 response and returns null.
 */
function verifyToken(req, res) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' })
    return null
  }
  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch {
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' })
    return null
  }
}

/**
 * Middleware that requires a valid JWT for non-GET requests.
 * GET requests pass through (public read access).
 * POST, PUT, PATCH, DELETE require a valid Bearer token from admin login.
 */
export function requireAdmin(req, res, next) {
  if (req.method === 'GET') return next()
  const decoded = verifyToken(req, res)
  if (!decoded) return
  req.user = decoded
  next()
}

/**
 * Strict middleware that requires a valid JWT for ALL requests, including GET.
 * Use this for routes that expose sensitive data (e.g. orders).
 */
export function requireAdminStrict(req, res, next) {
  const decoded = verifyToken(req, res)
  if (!decoded) return
  req.user = decoded
  next()
}
