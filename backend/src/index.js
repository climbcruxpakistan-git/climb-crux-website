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
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climb-crux'

const app = express()

app.use(cors())
app.use(express.json({ strict: false }))

app.use('/api/sessions', sessionRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/about', aboutRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/session-content', sessionContentRoutes)
app.use('/api/home', homeContentRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentRoutes)
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
