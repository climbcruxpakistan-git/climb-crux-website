<!--
  Climb Crux — Pull Request Template
  ---------------------------------------------------------------
  Complete the checklists below. The SEO checklist (section 3) is
  REQUIRED for any PR touching the frontend/astro, frontend/main,
  admin, or backend directories — it exists so content/SEO changes
  never ship to only one deployment.
-->

## 1. Summary

<!-- What does this PR do? Why? (2–3 sentences) -->

**Fixes / relates to:** <!-- issue numbers, if any -->

## 2. Changes

<!-- List the main changes. If this is the SEO change-set, use section 3. -->

- [ ] ...

## 3. ⚠️ SEO / Content deployment checklist

> The site spans **four deployments**. A content or SEO change is only
> "live" once ALL affected deployments have been redeployed.
> Deployment targets:
> - **Astro site** → Vercel (`frontend/astro`)
> - **Legacy SPA** → Vercel (`frontend/main`)
> - **Backend API** → Render (`backend`)
> - **Admin panel** → Vercel (`admin`)
>
> ⚠️ **The live domain (`www.climbcruxpakistan.com`) currently serves the
> legacy SPA build** (`frontend/main`). The Astro site is a separate Vercel
> project. When verifying, check the live domain **and** the Astro
> deployment URL separately so no deployment is missed.

### Files touched in this PR (tick all that apply)

- [ ] `frontend/astro/**` (layout meta/JSON-LD, page titles/descriptions, robots, sitemap)
- [ ] `frontend/main/**` (`index.html` meta, `public/robots.txt`, `public/sitemap.xml`)
- [ ] `admin/**` (page content editors)
- [ ] `backend/**` (models, routes, seed) — note: **Mongoose schema defaults only affect new/empty docs; already-stored content lives in MongoDB** and must be updated separately (admin panel or a one-off script).

### Deploy checklist

- [ ] **Astro build passes:** `cd frontend/astro && npm run build`
- [ ] **Legacy SPA build passes:** `cd frontend/main && npm run build`
- [ ] **Admin build passes:** `cd admin && npm run build`
- [ ] **Backend syntax check:** `cd backend && node --check src/index.js`
- [ ] Astro site redeployed (Vercel) and verified
- [ ] Legacy SPA redeployed (Vercel) and verified
- [ ] Backend redeployed (Render) and verified
- [ ] Admin redeployed (Vercel) and verified

### Post-deploy verification (run against live domain)

- [ ] `curl -s https://www.climbcruxpakistan.com/` contains the expected `<title>` and `<meta name="description">` (only **one** of each)
- [ ] `curl -s https://www.climbcruxpakistan.com/robots.txt` returns `Sitemap: https://www.climbcruxpakistan.com/sitemap.xml`
- [ ] `curl -s https://www.climbcruxpakistan.com/sitemap.xml` returns valid XML with `<lastmod>` on every URL
- [ ] `curl -s https://www.climbcruxpakistan.com/` contains exactly **one** `<script type="application/ld+json">` block and it validates (test with [Rich Results Test](https://search.google.com/test/rich-results))
- [ ] Meta keywords/geo/OG tags present: `curl -s https://www.climbcruxpakistan.com/ | grep -o '<meta name="keywords"[^>]*>'`
- [ ] No duplicate `<title>` / `<meta name="description">` tags on any checked page

### Content data (MongoDB) — only if copy changed

- [ ] Database content updated via admin panel (Sessions Manager → Private & Premium) or migration script
- [ ] Safety backup taken before any DB write: `cd backend && npm run db:backup -- --label before-<change>`
- [ ] Verified via live API: `curl -s https://climb-crux-backend.onrender.com/api/session-content`

## 4. Testing performed

<!-- e.g. unit tests, manual QA on mobile viewport, Lighthouse, etc. -->

- [ ] ...

## 5. Screenshots / previews (optional)

<!-- Add screenshots or a preview URL here -->

## 6. Checklist

- [ ] Code follows existing project conventions
- [ ] All affected deployments redeployed and verified live
- [ ] No secrets / credentials committed
- [ ] Backup taken for any DB-affecting change
