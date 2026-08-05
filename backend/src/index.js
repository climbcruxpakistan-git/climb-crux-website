import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dns from 'dns'

// Use custom DNS servers if configured (helps when system DNS blocks mongodb.net)
const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(',').map((s) => s.trim())
  : null
if (dnsServers) dns.setServers(dnsServers)

import sessionRoutes from './routes/sessions.js'
import planRoutes from './routes/plans.js'
import teamRoutes from './routes/team.js'
import galleryRoutes from './routes/gallery.js'
import bookingRoutes from './routes/bookings.js'
import aboutRoutes from './routes/about.js'
import uploadRoutes from './routes/uploads.js'
import sessionContentRoutes from './routes/sessionContent.js'
import homeContentRoutes from './routes/homeContent.js'
import authRoutes from './routes/auth.js'
import paymentRoutes from './routes/payments.js'
import productRoutes from './routes/products.js'
import reviewRoutes from './routes/reviews.js'
import membershipRoutes from './routes/membership.js'
import statusRoutes from './routes/status.js'
import emailRoutes from './routes/emails.js'

import { requireAdmin, requireAdminStrict } from './middleware/auth.js'
import { authLimiter, bookingLimiter, apiLimiter, statusLimiter } from './middleware/rateLimiter.js'

const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climb-crux'

const app = express()

// Render sits behind a reverse proxy — trust the first hop so req.ip is the
// real client IP (fixes express-rate-limit's X-Forwarded-For validation error).
app.set('trust proxy', 1)

// CORS: allow specific frontend origins + localhost for development
const FRONTEND_URL = process.env.FRONTEND_URL
const ADMIN_URL = process.env.ADMIN_URL

const allowedOrigins = [
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4321',
  // Production — always include known Vercel deployments
  'https://climb-crux-admin.vercel.app',
  'https://climb-crux-frontend.vercel.app',
  // Production — custom domain
  'https://climbcruxpakistan.com',
  'https://www.climbcruxpakistan.com',
  // Production (set via Render env vars for custom domains)
  ...(FRONTEND_URL ? [FRONTEND_URL] : []),
  ...(ADMIN_URL ? [ADMIN_URL] : []),
]

// If no production origins are configured, allow all (backward compat for dev)
const corsOrigin = (FRONTEND_URL || ADMIN_URL)
  ? allowedOrigins
  : '*'

app.use(cors({ origin: corsOrigin }))

if (corsOrigin !== '*') {
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`)
} else {
  console.log('CORS: permissive mode (all origins allowed)')
}

app.use(express.json({ strict: false }))

// ── Rate limiting ──────────────────────────────────────────────────────
// Apply standard rate limit to all /api routes by default
app.use('/api', apiLimiter)

// Override with stricter limits on sensitive endpoints
app.use('/api/auth/login', authLimiter)
app.use('/api/bookings', bookingLimiter)

// ── Routes ─────────────────────────────────────────────────────────────
// Auth routes are public (login & verify)
app.use('/api/auth', authRoutes)

// Protected admin routes — require JWT for write operations (POST, PUT, PATCH, DELETE)
app.use('/api/sessions', requireAdmin, sessionRoutes)
app.use('/api/plans', requireAdmin, planRoutes)
app.use('/api/team', requireAdmin, teamRoutes)
app.use('/api/gallery', requireAdmin, galleryRoutes)
// Bookings has mixed public (create, lookup) and admin (patch, delete) endpoints.
// Auth is applied selectively within the bookings route file.
app.use('/api/bookings', bookingRoutes)
app.use('/api/about', requireAdmin, aboutRoutes)
app.use('/api/uploads', requireAdmin, uploadRoutes)
app.use('/api/session-content', requireAdmin, sessionContentRoutes)
app.use('/api/home', requireAdmin, homeContentRoutes)
app.use('/api/payments', requireAdmin, paymentRoutes)
app.use('/api/products', productRoutes)
app.use('/api/products/:productId/reviews', reviewRoutes)
// Membership — public apply + form download; admin endpoints protected inside
app.use('/api/membership', membershipRoutes)
// Public status checker — strict rate limit prevents code enumeration
app.use('/api/status', statusLimiter, statusRoutes)
// Manual Email Sender — admin only (send + history)
app.use('/api/emails', requireAdminStrict, emailRoutes)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('API Error:', err)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' })
  }
  res.status(500).json({ error: err.message || 'Internal server error' })
})

// Startup status
const emailConfigured = process.env.RESEND_API_KEY
console.log(`Email service (Resend): ${emailConfigured ? '✓ configured' : '✗ not configured (set RESEND_API_KEY)'}`)

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`Connected to MongoDB at ${MONGODB_URI}`)
    app.listen(PORT, () => console.log(`API server on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
