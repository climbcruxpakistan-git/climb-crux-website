# 🧗 Climb Crux

> Rock climbing experiences on the Margalla Hills, Islamabad — from first-time belay to elite 7c+ sends.

Climb Crux is a full-stack web platform comprising **public-facing websites** (React SPA + Astro SSG), a **REST API backend**, and an **admin dashboard** for managing content, bookings, shop products, and payments.

---

## 🏗️ Monorepo Structure

```
├── frontend/main/       # Public website — React SPA (Vite)
├── frontend/astro/      # Public website — Astro SSG (Vercel)
├── backend/             # API server (Express + MongoDB)
├── admin/               # Admin dashboard (React + Vite)
└── README.md            # ← You are here
```

| Directory | Description | Tech Stack |
|-----------|-------------|------------|
| [`frontend/main/`](./frontend/main/README.md) | Public-facing site: home, sessions, gallery, booking & payment flow, shop | React 18, React Router, Vite |
| [`frontend/astro/`](./frontend/astro/README.md) | Astro SSG version of the public site: home, sessions, gallery, booking & payment flow, shop | Astro 4, React 18, Vercel adapter |
| [`backend/`](./backend/README.md) | REST API: CRUD for all content, bookings, payments, shop products & orders, auth, image uploads | Express, Mongoose, JWT, Cloudinary, Nodemailer |
| [`admin/`](./admin/README.md) | Admin dashboard: manage sessions, plans, team, gallery, photos, shop, bookings, payments | React 18, React Router, Vite |

---

## ✨ Features

- **Public Website** — responsive pages with climbing-grade badges, session pricing, instructor profiles, filterable gallery, and a full booking → payment flow
- **Shop** — product catalog (gear & apparel) with reviews, ordering via Bank Transfer / EasyPaisa, and order tracking
- **Booking System** — customer booking with auto-generated booking numbers (`CCP-2026-XXXXX`), Bank Transfer / EasyPaisa payment methods, and payment verification workflow
- **Admin Dashboard** — CRUD for all content types, booking management with status/date filters, payment verification, shop product & order management, revenue stats, and activity timeline
- **Email Notifications** — Gmail SMTP notifications for new bookings and payment confirmations
- **Image Uploads** — Cloudinary integration for gallery, team, and product photos
- **Rate Limiting** — Tiered rate limiting on auth, booking, and general API endpoints
- **JWT Authentication** — Single admin account with token-based auth for write operations (public GET routes remain open)

---

## 🚦 Quick Start

### 1. Clone & install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend (SPA) dependencies
cd ../frontend/main
npm install

# Install frontend (Astro) dependencies
cd ../frontend/astro
npm install

# Install admin dashboard dependencies
cd ../../admin
npm install
```

### 2. Set up environment variables

Each subproject uses environment variables. See the individual READMEs for details.

### 3. Run locally

Open three terminals (add a fourth for the Astro frontend if you're working on it):

```bash
# Terminal 1 — Backend API
cd backend
npm run dev

# Terminal 2 — Public website (SPA)
cd frontend/main
npm run dev

# Terminal 3 — Admin dashboard
cd admin
npm run dev

# Optional — Public website (Astro)
cd frontend/astro
npm run dev
```

---

## 🚢 Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| **Backend API** | [Render](https://render.com) | See `backend/render.yaml` for infrastructure-as-code config |
| **Public website (SPA)** | [Vercel](https://vercel.com) | See `frontend/main/vercel.json` |
| **Public website (Astro)** | [Vercel](https://vercel.com) | See `frontend/astro/vercel.json` + `astro.config.mjs` |
| **Admin dashboard** | [Vercel](https://vercel.com) | See `admin/vercel.json` |
| **Database** | MongoDB Atlas | Connection string passed via `MONGODB_URI` env var |
| **Image storage** | Cloudinary | Uploads via backend proxy route |

---

## 🔐 Environment Variables Overview

Backend (`backend/.env`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing admin auth tokens |
| `ADMIN_EMAIL` | ✅ | Admin login email |
| `ADMIN_PASSWORD` | ✅ | Admin login password |
| `FRONTEND_URL` | — | CORS origin for the public site |
| `ADMIN_URL` | — | CORS origin for the admin dashboard |
| `GMAIL_EMAIL` | — | Gmail address for SMTP notifications |
| `GMAIL_APP_PASSWORD` | — | Gmail app password |
| `NOTIFICATION_EMAIL` | — | Where to send admin notifications |
| `CLOUDINARY_*` | — | Cloudinary credentials for image uploads |
| `DNS_SERVERS` | — | Custom DNS (fallback if `mongodb.net` is blocked) |

---

## 🗄️ API Endpoints

All API routes are prefixed with `/api`. Public read routes are open; write routes require a JWT Bearer token.

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /api/auth/login`, `GET /api/auth/verify` |
| **Sessions** | `GET/POST /api/sessions`, `PUT/DELETE /api/sessions/:id` |
| **Plans** | `GET/POST /api/plans`, `PUT/DELETE /api/plans/:id` |
| **Team** | `GET/POST /api/team`, `GET /api/team/:id`, `PUT/DELETE /api/team/:id` |
| **Gallery** | `GET/POST /api/gallery`, `PUT/DELETE /api/gallery/:id` |
| **Bookings** | `GET/POST /api/bookings`, `GET /api/bookings/by-number/:num`, `GET/PUT /api/bookings/:id`, `PATCH /api/bookings/:id/booking-status`, `PATCH /api/bookings/:id/payment-status`, `POST /api/bookings/:id/create-payment`, `DELETE /api/bookings/:id` |
| **About** | `GET/PUT /api/about` |
| **Home Content** | `GET/PUT /api/home` |
| **Session Content** | `GET/PUT /api/session-content` |
| **Payments** | `GET /api/payments/pending`, `POST /api/payments/verify` |
| **Products** | `GET/POST /api/products`, `GET /api/products/:id` (by slug or `_id`), `PUT/DELETE /api/products/:id` |
| **Product Orders** | `POST /api/products/order`, `GET /api/products/orders`, `PATCH /api/products/orders/:id/status`, `PATCH /api/products/orders/:id/payment`, `DELETE /api/products/orders/:id` |
| **Product Reviews** | `GET/POST /api/products/:productId/reviews` |
| **Uploads** | `GET/POST /api/uploads` (Cloudinary image upload), `PUT/DELETE /api/uploads/:id` |
| **Health** | `GET /api/health` |

---

## 📁 Database Models (MongoDB / Mongoose)

| Model | Collection | Key Fields |
|-------|-----------|------------|
| `Session` | `sessions` | `date`, `time`, `spots` |
| `Plan` | `plans` | `type`, `grade`, `title`, `price`, `features`, `featured` |
| `TeamMember` | `teammembers` | `name`, `role`, `bio`, `experience`, `certifications`, `specialties`, `photo` |
| `GalleryItem` | `galleryitems` | `tag`, `cat`, `image` |
| `Booking` | `bookings` | `booking_number`, `customer_name/email/phone`, `session_id`, `date`, `participants`, `amount`, `booking_status`, `payment_status/method` |
| `Payment` | `payments` | `booking_id`, `method`, `status`, `payer_name/bank/phone`, `metadata` |
| `Product` | `products` | `name`, `slug`, `price`, `images`, `stock`, `variants`, `specifications`, `features`, `faqs`, `seo`, `status`, `featured` |
| `ProductOrder` | `productorders` | `order_number`, `product`, `customer`, `quantity`, `total_amount`, `status`, `payment_status/method` |
| `Review` | `reviews` | `product`, `customer_name`, `rating`, `title`, `comment`, `photos` |
| `About` | `abouts` | `description`, `safetyItems` |
| `HomeContent` | `homecontents` | Sections for the home page |
| `SessionContent` | `sessioncontents` | Content blocks for the sessions, pricing, and private-premium pages |
| `Photo` | `photos` | Cloudinary image references |

---

## 🎨 Design System

- **Colors**: Charcoal `#383839`, Orange `#f36f21`, Limestone `#f6f2e9`
- **Typography**: Oswald (headings/labels), Work Sans (body)
- **Components**: `Navbar`, `Footer`, `PageHeader`, `GradeBadge`, `CliffEdge` (section dividers), `PlaceholderPhoto`

---

## 📝 License

Private — all rights reserved. Climb Crux Pakistan.
