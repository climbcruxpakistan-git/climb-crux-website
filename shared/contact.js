/**
 * 🔑 Single source of truth for the Climb Crux WhatsApp contact number.
 *
 * Change the number HERE and every app picks it up on the next deploy:
 *   · frontend/main (React SPA)  — Footer, Book Now, SEO JSON-LD (via vite.config.js)
 *   · frontend/astro (Astro SSG) — Footer, Book Now, SEO JSON-LD
 *   · backend (emails)           — booking / membership / order emails
 *
 * The backend also honours a CLIMB_CRUX_WHATSAPP env var which overrides this
 * value for emails only — useful for changing the number on Render without a redeploy.
 */

/** International digits (no +, no spaces) for wa.me / tel links. */
export const WHATSAPP_DIGITS = '923350044403'

/** Human-readable display format. */
export const WHATSAPP_DISPLAY = '+92 335 0044403'

/** WhatsApp deep link. */
export const WHATSAPP_WA_ME = `https://wa.me/${WHATSAPP_DIGITS}`

/** Click-to-call link. */
export const WHATSAPP_TEL = `tel:${WHATSAPP_DIGITS}`
