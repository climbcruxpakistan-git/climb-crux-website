import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  integrations: [react()],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  // Hybrid: most pages are statically generated (fast, SEO-friendly), but the
  // booking flow pages (marked `export const prerender = false`) render on-demand
  // so any booking number works after deploy.
  output: 'hybrid',
  // www is the canonical domain (canonical tags, sitemap and schema all use it).
  site: 'https://www.climbcruxpakistan.com',
  vite: {
    server: {
      // Allow the dev server to serve files from this project plus the shared
      // config at ../../shared/contact.js. Providing fs.allow replaces the
      // default list, so '.' is listed explicitly to keep the project root served.
      fs: { allow: ['.', '../../shared'] },
    },
  },
});
