# 🧗 Climb Crux — Public Website (Astro)

Astro + React frontend for the Climb Crux climbing platform. Hybrid output: statically generated pages (SSG) with React islands for speed and SEO, plus on-demand serverless rendering for the booking flow and shop/team detail pages so any booking number or newly added product works without a redeploy. Built around the brand's charcoal/orange mark and the limestone of Margalla Hills. Includes the full booking → payment flow and a shop with product ordering and reviews.

---

## 🏃 Running Locally

```bash
npm install
npm run dev
```

> **Note:** The site fetches from the deployed backend API (`https://climb-crux-backend.onrender.com/api`) by default. To point at a local backend, set `VITE_API_URL=http://localhost:4000/api` in a `.env` file (or your shell).

---

## 🔧 Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `https://climb-crux-backend.onrender.com/api` | Backend API base URL |

The site URL is set in `astro.config.mjs` (`site: 'https://climbcruxpakistan.com'`).

---

## 📦 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `astro dev` | Start dev server |
| `build` | `astro build && node scripts/generate-sitemap.mjs` | Build for production + generate `sitemap.xml` |
| `preview` | `astro preview` | Preview production build locally |

---

## 🗺️ Project Structure

```
frontend/astro/
├── src/
│   ├── components/
│   │   ├── astro/            # Astro components (Navbar, Footer, GradeBadge, CliffEdge, PageHeader, PlaceholderPhoto)
│   │   └── react/            # React islands (Shop, ProductDetail, Gallery, BookNow, PaymentPage, confirmation pages, NavToggle, InstructorProfile)
│   ├── layouts/
│   │   └── MainLayout.astro  # Shared layout
│   ├── lib/
│   │   └── api.js            # API client (works at build time + client-side)
│   ├── pages/                # Astro routes (see table below)
│   ├── styles/               # Page + shared styles
│   └── env.d.ts
├── scripts/
│   └── generate-sitemap.mjs  # Post-build sitemap generator
├── public/
│   └── robots.txt
├── astro.config.mjs          # Astro + React + Vercel adapter config
├── tsconfig.json
├── vercel.json
├── package.json
└── README.md                 # ← You are here
```

---

## 📄 Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Home: hero, path split, gallery teaser |
| `/sessions` | Public session details, schedule, pricing, booking form, FAQ |
| `/private-premium` | Private & premium tiers, customization, CTA |
| `/about` | About the company, mission, safety approach |
| `/our-team` | Instructor profiles grid |
| `/our-team/:id` | Individual instructor detail page |
| `/gallery` | Filterable photo grid by category |
| `/shop` | Product catalog with categories & search |
| `/shop/:id` | Product detail, reviews, and ordering |
| `/book-now` | Booking form with session selection, date picker, participant count |
| `/booking/:bookingNumber/payment` | Payment method selection (Bank Transfer / EasyPaisa) |
| `/booking/:bookingNumber/bank-transfer-confirmation` | Bank transfer confirmation with account details |
| `/booking/:bookingNumber/easypaisa-confirmation` | EasyPaisa confirmation with account details |
| `/404` | Custom 404 page |

---

## ✨ Features

- **SSG** — statically generated pages for fast, SEO-friendly delivery via Vercel
- **React islands** — interactive components (shop, booking & payment flow, gallery, nav toggle)
- **Sitemap generation** — `sitemap.xml` built automatically after each build
- **Web Analytics** — Vercel Web Analytics enabled in `astro.config.mjs`
- **Booking & Payment Flow** — Book Now → Payment Page → Bank Transfer / EasyPaisa confirmation
- **Shop** — product catalog, detail pages with reviews, and ordering with payment selection
- **Shared Components** — `Navbar`, `Footer`, `GradeBadge`, `CliffEdge`, `PageHeader`, `PlaceholderPhoto`

---

## 🎨 Design System

- **Colors**: Charcoal `#383839`, Orange `#f36f21`, Limestone `#f6f2e9`
- **Typography**: Oswald (condensed, industrial) for headings/labels, Work Sans for body copy

---

## 🚢 Deployment

The site is configured for [Vercel](https://vercel.com) with the `@astrojs/vercel` static adapter:

```bash
npm run build
vercel --prod
```

Set `VITE_API_URL` in your Vercel project settings if the backend URL ever changes.
