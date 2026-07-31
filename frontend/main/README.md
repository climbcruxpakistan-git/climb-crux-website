# 🧗 Climb Crux — Public Website (React SPA)

React + Vite frontend for the Climb Crux climbing platform. Built around the brand's charcoal/orange mark and the limestone of Margalla Hills. Includes a full booking → payment flow and a shop with product ordering and reviews.

---

## 🏃 Running Locally

```bash
npm install
npm run dev
```

> **Note:** The website expects the backend API to be running. See [`../../backend/README.md`](../../backend/README.md) for backend setup. Vite proxies `/api` to `http://localhost:4000` in development.

---

## 🔧 Configuration

The website reads the API base URL from an environment variable:

```bash
# .env in the frontend/main/ directory
VITE_API_URL=https://climb-crux-backend.onrender.com/api
```

If `VITE_API_URL` is not set, it defaults to `/api` for local development (proxied to `localhost:4000`) or `https://climb-crux-backend.onrender.com/api` in production.

---

## 📦 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server |
| `build` | `vite build` | Build for production |
| `preview` | `vite preview` | Preview production build locally |

---

## 🗺️ Project Structure

```
frontend/main/
├── src/
│   ├── main.jsx               # Entry point, routes, GA4 pageview tracking
│   ├── api.js                 # API client functions
│   ├── index.css              # Global styles & variables
│   ├── layout.css             # Layout & grid styles
│   ├── shared.css             # Shared component styles
│   ├── components/
│   │   ├── Navbar.jsx         # Top navigation bar
│   │   ├── Footer.jsx         # Footer with contact & social links
│   │   ├── Layout.jsx         # Shared layout wrapper
│   │   ├── PageHeader.jsx     # Reusable page header component
│   │   ├── GradeBadge.jsx     # Climbing grade badge (e.g. 5.7 · Beginner)
│   │   ├── CliffEdge.jsx      # Jagged section divider
│   │   └── PlaceholderPhoto.jsx  # Placeholder image placeholder
│   └── pages/
│       ├── Home.jsx / Home.css
│       ├── Sessions.jsx / Sessions.css
│       ├── PrivatePremium.jsx / PrivatePremium.css
│       ├── About.jsx
│       ├── OurTeam.jsx / OurTeam.css
│       ├── InstructorProfile.jsx
│       ├── Gallery.jsx / Gallery.css
│       ├── Shop.jsx / Shop.css
│       ├── ProductDetail.jsx / ProductDetail.css
│       ├── BookNow.jsx
│       ├── PaymentPage.jsx
│       ├── BankTransferConfirmation.jsx
│       └── EasyPaisaConfirmation.jsx
├── public/                    # Static assets (images, sitemap, robots.txt)
├── .env                      # Local env vars (gitignored)
├── index.html
├── package.json
├── vercel.json
└── README.md                 # ← You are here
```

---

## 📄 Pages & Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `Home.jsx` | Hero, path split, trust strip, gallery teaser |
| `/sessions` | `Sessions.jsx` | Public session details, schedule, pricing, booking form, FAQ |
| `/private-premium` | `PrivatePremium.jsx` | Private & premium tiers, customization, CTA |
| `/about` | `About.jsx` | About the company, mission, safety approach |
| `/our-team` | `OurTeam.jsx` | Instructor profiles grid |
| `/our-team/:id` | `InstructorProfile.jsx` | Individual instructor detail page |
| `/gallery` | `Gallery.jsx` | Filterable photo grid by category |
| `/shop` | `Shop.jsx` | Product catalog with categories & search |
| `/shop/:id` | `ProductDetail.jsx` | Product detail, reviews, and ordering |
| `/book-now` | `BookNow.jsx` | Booking form with session selection, date picker, participant count |
| `/booking/:bookingNumber/payment` | `PaymentPage.jsx` | Payment method selection (Bank Transfer / EasyPaisa) |
| `/booking/:bookingNumber/bank-transfer-confirmation` | `BankTransferConfirmation.jsx` | Bank transfer confirmation with account details |
| `/booking/:bookingNumber/easypaisa-confirmation` | `EasyPaisaConfirmation.jsx` | EasyPaisa confirmation with account details |

---

## ✨ Features

### Booking & Payment Flow

1. **Book Now** → Fill in name, email, phone, select session type, date, and participants
2. **Payment Page** → Choose between Bank Transfer or EasyPaisa
3. **Confirmation** → View account details and submit payment confirmation

### Shop
- Product catalog (gear & apparel) with category filtering and search
- Product detail pages with specs, features, FAQs, shipping & warranty info
- Customer reviews with ratings, average score, and rating distribution
- Order form with Bank Transfer / EasyPaisa payment selection

### Gallery
- Filterable photo grid by category (Public Sessions, Private Sessions, High Grade Rock Climbing)
- Dynamically loaded from the backend API

### Team Profiles
- Instructor grid on the team page
- Individual profile pages with bio, experience, certifications, and social links

### Shared Components
- **Navbar** — responsive navigation with mobile hamburger menu
- **Footer** — contact info, social links, site map
- **GradeBadge** — orange climbing-grade badge (e.g. `5.7 · Beginner Friendly`)
- **CliffEdge** — jagged section divider echoing the logo's cliff silhouette
- **PageHeader** — consistent page title header
- **PlaceholderPhoto** — gray/orange placeholder for future photos

---

## 🎨 Design System

- **Colors**: Charcoal `#383839`, Orange `#f36f21`, Limestone `#f6f2e9`
- **Typography**: Oswald (condensed, industrial) for headings/labels, Work Sans for body copy
- **Components**: `Navbar`, `Footer`, `PageHeader`, `GradeBadge`, `CliffEdge`, `PlaceholderPhoto`

---

## 📊 Analytics

GA4 tracking (`G-QTTHTK67QR`) is included in `index.html` and re-fired on client-side route changes via `main.jsx`.

---

## 🚢 Deployment

The website is configured for [Vercel](https://vercel.com) deployment via `vercel.json`:

```bash
npm run build
vercel --prod
```

Make sure to set `VITE_API_URL` as an environment variable in your Vercel project settings pointing to your deployed backend API.
