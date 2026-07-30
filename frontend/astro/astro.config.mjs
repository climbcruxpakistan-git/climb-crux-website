import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  integrations: [react()],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  output: 'static',
  site: 'https://climbcruxpakistan.com',
});
