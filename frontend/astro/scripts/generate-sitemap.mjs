/**
 * Post-build sitemap generator for Astro SSG.
 * Scans the dist/ directory for .html files and produces a sitemap.xml.
 * Run after `astro build`.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_URL = 'https://www.climbcruxpakistan.com'
const DIST_DIR = fileURLToPath(new URL('../.vercel/output/static', import.meta.url))

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

    return { loc, lastmod }
  })
  .filter(Boolean)

// Build XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>
`

const outPath = join(DIST_DIR, 'sitemap.xml')
writeFileSync(outPath, xml, 'utf-8')

console.log(`✅ Generated sitemap.xml with ${urls.length} URLs → ${outPath.replace(/\\/g, '/')}`)
