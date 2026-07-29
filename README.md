# 🧗 Climb Crux

> Rock climbing experiences on the Margalla Hills, Islamabad — from first-time belay to elite 7c+ sends.

Climb Crux is a full-stack web platform comprising a **public-facing website**, a **REST API backend**, and an **admin dashboard** for managing content, bookings, and payments.

---

## 🏗️ Monorepo Structure

```
├── frontend/main/       # Public website (React + Vite)
├── backend/             # API server (Express + MongoDB)
├── admin/               # Admin dashboard (React + Vite)
└── README.md            # ← You are here
```

| Directory | Description | Tech Stack |
|-----------|-------------|------------|
| [`frontend/main/`](./frontend/main/README.md) | Public-facing site: home, sessions, gallery, booking & payment flow | React 18, React Router, Vite |
| [`backend/`](./backend/README.md) | REST API: CRUD for all content, bookings, payments, auth, image uploads | Express, Mongoose, JWT, Cloudinary, Nodemailer |
| [`admin/`](./admin/README.md) | Admin dashboard: manage sessions, plans, team, gallery, bookings, payments | React 18, React Router, Vite |

---

## ✨ Features

- **Public Website** — 8 responsive pages with climbing-grade badges, session pricing, instructor profiles, filterable gallery, and a full booking → payment flow
- **Booking System** — customer booking with auto-generated booking numbers (`CCP-2026-XXXXX`), Bank Transfer / EasyPaisa payment methods, and payment verification workflow
- **Admin Dashboard** — CRUD for all content types, booking management with status/date filters, payment verification, revenue stats, and activity timeline
- **Email Notifications** — Gmail SMTP notifications for new bookings
- **Image Uploads** — Cloudinary integration for gallery and team photos
- **Rate Limiting** — Tiered rate limiting on auth, booking, and general API endpoints
- **JWT Authentication** — Single admin account with token-based auth for write operations (public GET routes remain open)

---

## 🚦 Quick Start

### 1. Clone & install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/main
npm install

# Install admin dashboard dependencies
cd ../../admin
npm install
```

### 2. Set up environment variables

Each subproject uses environment variables. See the individual READMEs for details.

### 3. Run locally

Open three terminals:

```bash
# Terminal 1 — Backend API
cd backend
npm run dev

# Terminal 2 — Public website
cd frontend/main
npm run dev

# Terminal 3 — Admin dashboard
cd admin
npm run dev
```

---

## 🚢 Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| **Backend API** | [Render](https://render.com) | See `backend/render.yaml` for infrastructure-as-code config |
| **Public website** | [Vercel](https://vercel.com) | See `frontend/main/vercel.json` |
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
| **Team** | `GET/POST /api/team`, `PUT/DELETE /api/team/:id` |
| **Gallery** | `GET/POST /api/gallery`, `PUT/DELETE /api/gallery/:id` |
| **Bookings** | `GET/POST /api/bookings`, `GET /api/bookings/by-number/:num`, `PATCH /api/bookings/:id/booking-status`, `PATCH /api/bookings/:id/payment-status`, `POST /api/bookings/:id/create-payment`, `DELETE /api/bookings/:id` |
| **About** | `GET/POST /api/about`, `PUT/DELETE /api/about/:id` |
| **Home Content** | `GET/POST /api/home`, `PUT/DELETE /api/home/:id` |
| **Session Content** | `GET/POST /api/session-content`, `PUT/DELETE /api/session-content/:id` |
| **Payments** | `GET /api/payments`, `POST /api/payments` |
| **Uploads** | `POST /api/uploads` (Cloudinary image upload) |
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
| `About` | `abouts` | `description`, `safetyItems` |
| `HomeContent` | `homecontents` | Sections for the home page |
| `SessionContent` | `sessioncontents` | Content blocks for the sessions page |
| `Photo` | `photos` | Cloudinary image references |

---

## 🎨 Design System

- **Colors**: Charcoal `#383839`, Orange `#f36f21`, Limestone `#f6f2e9`
- **Typography**: Oswald (headings/labels), Work Sans (body)
- **Components**: `Navbar`, `Footer`, `PageHeader`, `GradeBadge`, `CliffEdge` (section dividers), `PlaceholderPhoto`

---

## 📝 License

Private — all rights reserved. Climb Crux Pakistan.
