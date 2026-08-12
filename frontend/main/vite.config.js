import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { WHATSAPP_DISPLAY } from '../../shared/contact.js'

// Inject the shared WhatsApp number into the static index.html JSON-LD so the
// SEO structured data always matches the contact info shown everywhere else.
// Keep the placeholder in sync with the one used in index.html.
const injectContactInfo = {
  name: 'inject-contact-info',
  transformIndexHtml(html) {
    const out = html.replace('{{WHATSAPP_DISPLAY}}', WHATSAPP_DISPLAY)
    if (out === html) {
      console.warn('[inject-contact-info] placeholder {{WHATSAPP_DISPLAY}} not found in index.html')
    }
    return out
  },
}

export default defineConfig({
  plugins: [react(), injectContactInfo],
  server: {
    port: 5173,
    // Allow the dev server to serve files from this project plus the shared
    // config at ../../shared/contact.js. Note: providing fs.allow REPLACES the
    // default list (which otherwise includes the project root), so '.' must be
    // listed explicitly or the dev server 403s its own pages.
    fs: {
      allow: ['.', '../../shared'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
