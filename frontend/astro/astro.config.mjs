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
  site: 'https://climbcruxpakistan.com',
});
