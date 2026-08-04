import rateLimit from 'express-rate-limit'

/**
 * Strict limiter for login endpoint — prevents brute-force attacks.
 * 5 requests per minute per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a minute.' },
})

/**
 * Moderate limiter for booking creation and payment submission — prevents spam.
 * 10 requests per minute per IP.
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

/**
 * Standard limiter for general API routes — prevents scraping and abuse.
 * 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})

/**
 * Strict limiter for the public status checker — prevents automated
 * enumeration of booking/membership reference codes. 20 requests per
 * 15 minutes per IP. Blocked attempts are logged for monitoring.
 */
export const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  handler: (req, res) => {
    console.warn(`[status-check] Rate limit exceeded from IP ${req.ip}`)
    res.status(429).json({ error: 'Too many requests. Please try again later.' })
  },
})
