/**
 * Post-build sitemap generator for Climb Crux (Astro hybrid).
 * Scans the static output for .html files and adds on-demand pages
 * (shop listing, shop products, team members) fetched from the API so they
 * stay indexed. Run after `astro build`.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_URL = 'https://www.climbcruxpakistan.com'
const DIST_DIR = fileURLToPath(new URL('../.vercel/output/static', import.meta.url))
const API_BASE = process.env.VITE_API_URL || 'https://climb-crux-backend.onrender.com/api'

/** Exclude these path patterns from the sitemap */
function shouldExclude(pathname) {
  return (
    pathname.includes('/_placeholder/') ||
    pathname === '404.html' ||
    pathname === '500.html'
  )
}

/** Recursively find all .html files */
function findHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath)
    }
  }
  return files
}

/** Build a <url> block with optional priority/changefreq and image entries. */
function buildUrl(loc, lastmod, { priority, changefreq, images = [] } = {}) {
  const parts = [`    <loc>${loc}</loc>`, `    <lastmod>${lastmod}</lastmod>`]
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`)
  if (priority) parts.push(`    <priority>${priority}</priority>`)
  for (const img of images) {
    parts.push(
      '    <image:image>',
      `      <image:loc>${img}</image:loc>`,
      '    </image:image>'
    )
  }
  return `  <url>\n${parts.join('\n')}\n  </url>`
}

/** Per-path SEO signals for the statically generated pages. */
const STATIC_SIGNALS = {
  '/': { priority: '1.0', changefreq: 'weekly' },
  '/sessions/': { priority: '0.9', changefreq: 'weekly' },
  '/shop/': { priority: '0.9', changefreq: 'weekly' },
  '/private-premium/': { priority: '0.8', changefreq: 'monthly' },
  '/membership/apply/': { priority: '0.8', changefreq: 'monthly' },
  '/about/': { priority: '0.7', changefreq: 'monthly' },
  '/gallery/': { priority: '0.5', changefreq: 'monthly' },
}

/** Fetch on-demand (serverless) pages from the API so they stay in the sitemap */
async function fetchDynamicUrls() {
  const today = new Date().toISOString().split('T')[0]
  const urls = []

  // The shop listing renders on-demand (fresh ItemList JSON-LD), so add it here.
  urls.push({ loc: `${SITE_URL}/shop/`, lastmod: today, priority: '0.9', changefreq: 'weekly' })

  try {
    const res = await fetch(`${API_BASE}/products`)
    const products = await res.json()
    for (const p of products) {
      // Raw API returns _id; fall back the same way mapId() does client-side
      const id = p.id || p._id
      if (!id) continue
      // Only index live products — draft/archived items shouldn't be crawled
      if (p.status === 'draft' || p.status === 'archived') continue
      const images = [p.imageUrl, ...(p.images || [])].filter(Boolean).slice(0, 5)
      urls.push({
        loc: `${SITE_URL}/shop/${id}`,
        lastmod: (p.updatedAt || today).split('T')[0],
        priority: '0.8',
        changefreq: 'weekly',
        images,
      })
    }
  } catch { /* API unreachable — skip dynamic product URLs */ }
  try {
    const res = await fetch(`${API_BASE}/team`)
    const members = await res.json()
    for (const m of members) {
      const id = m.id || m._id
      if (!id) continue
      urls.push({
        loc: `${SITE_URL}/our-team/${id}`,
        lastmod: (m.updatedAt || today).split('T')[0],
        priority: '0.6',
        changefreq: 'monthly',
        images: m.photoUrl ? [m.photoUrl] : [],
      })
    }
  } catch { /* API unreachable — skip dynamic team URLs */ }
  return urls
}

const htmlFiles = findHtmlFiles(DIST_DIR)

const urls = htmlFiles
  .map((filePath) => {
    // Get path relative to dist/
    const relPath = relative(DIST_DIR, filePath).replace(/\\/g, '/')
    if (shouldExclude(relPath)) return null

    // Convert /foo/index.html → /foo/, /index.html → /
    let urlPath = relPath
      .replace(/\/?index\.html$/, '/')
      .replace(/\.html$/, '/')

    // Ensure a leading slash so SITE_URL + path joins correctly (e.g. /about/)
    if (urlPath === '') urlPath = '/'
    if (!urlPath.startsWith('/')) urlPath = '/' + urlPath

    const loc = `${SITE_URL}${urlPath}`

    // Use file modification time as lastmod
    const stats = statSync(filePath)
    const lastmod = stats.mtime.toISOString().split('T')[0] // YYYY-MM-DD

    return { loc, lastmod, ...(STATIC_SIGNALS[urlPath] || {}) }
  })
  .filter(Boolean)

// Add on-demand pages, dedupe by URL, and keep a stable, sorted order
const dynamicUrls = await fetchDynamicUrls()
const seen = new Set()
const allUrls = [...urls, ...dynamicUrls]
  .filter((u) => (seen.has(u.loc) ? false : (seen.add(u.loc), true)))
  .sort((a, b) => a.loc.localeCompare(b.loc))

// Build XML (with the image namespace for product/team images)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.map((u) => buildUrl(u.loc, u.lastmod, u)).join('\n')}
</urlset>
`

const outPath = join(DIST_DIR, 'sitemap.xml')
writeFileSync(outPath, xml, 'utf-8')

console.log(`✅ Generated sitemap.xml with ${allUrls.length} URLs → ${outPath.replace(/\\/g, '/')}`)
