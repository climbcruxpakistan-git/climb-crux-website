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
