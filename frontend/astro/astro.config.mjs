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
  // One canonical URL shape per page: trailing slash. Every page is built as
  // /path/index.html, so `/path` and `/path/` used to both answer 200 with
  // identical HTML — two indexable URLs per page in Search Console.
  //
  // With `always`, @astrojs/vercel writes a 308 redirect for every page route
  // (static and on-demand) from `/path` to `/path/` into the build output, so
  // the slashless variant can no longer return 200. Do NOT also set
  // `trailingSlash: true` in vercel.json: the adapter detects that combination,
  // warns about `ERR_TOO_MANY_REDIRECTS`, and silently downgrades this value to
  // `ignore` for the build — which would drop those redirects entirely.
  trailingSlash: 'always',
  // The guide page was renamed to target "islamabad"; keep the old URL working
  // with a permanent redirect so existing links and search results survive.
  // The route library now lives under the guide (/rock-climbing-guide-islamabad/
  // routes) so its URLs carry the "rock climbing guide Islamabad" keywords —
  // the old /routes hub and every /routes/<route>/ page 301 to their new homes.
  // Astro normalises these keys and matches both spellings, so `/routes` and
  // `/routes/` both land on the same rule. The `[slug]` destination is left
  // slashless on purpose: the adapter substitutes the param into the Location
  // header as `$1` only for slashless destinations, and the 308 rule from
  // `trailingSlash` above then adds the slash on the final URL.
  redirects: {
    '/rock-climbing-guide-pakistan': '/rock-climbing-guide-islamabad/',
    '/routes': '/rock-climbing-guide-islamabad/routes/',
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
