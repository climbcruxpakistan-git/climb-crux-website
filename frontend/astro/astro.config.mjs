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
  // The guide page was renamed to target "islamabad"; keep the old URL working
  // with a permanent redirect so existing links and search results survive.
  // The route library now lives under the guide (/rock-climbing-guide-islamabad/
  // routes) so its URLs carry the "rock climbing guide Islamabad" keywords —
  // the old /routes hub and every /routes/<route>/ page 301 to their new homes.
  redirects: {
    '/rock-climbing-guide-pakistan': '/rock-climbing-guide-islamabad',
    '/routes': '/rock-climbing-guide-islamabad/routes',
    '/routes/[slug]': '/rock-climbing-guide-islamabad/routes/[slug]',
  },
  vite: {
    server: {
      // Allow the dev server to serve files from this project plus the shared
      // config at ../../shared/contact.js. Providing fs.allow replaces the
      // default list, so '.' is listed explicitly to keep the project root served.
      fs: { allow: ['.', '../../shared'] },
    },
  },
});
