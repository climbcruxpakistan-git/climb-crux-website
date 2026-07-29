# 🧗 Climb Crux — Backend API

Express + MongoDB REST API powering the Climb Crux climbing platform. Handles content management, bookings, payments, authentication, email notifications, and image uploads.

---

## 🏃 Running Locally

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [MongoDB](https://www.mongodb.com/) instance (local or Atlas)

```bash
npm install
npm run dev   # starts with --watch for auto-reload
```

---

## 🔧 Environment Variables

Copy `.env` from the template below:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/climb-crux
JWT_SECRET=your-secret-key-change-in-production
ADMIN_EMAIL=admin@climbcrux.com
ADMIN_PASSWORD=your-admin-password

# CORS (set for production; localhost origins are auto-allowed)
FRONTEND_URL=https://climb-crux.vercel.app
ADMIN_URL=https://climb-crux-admin.vercel.app

# Email notifications (Gmail SMTP — optional)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
NOTIFICATION_EMAIL=admin@climbcrux.com

# Cloudinary (image uploads — optional)
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# DNS fallback (useful when ISP blocks mongodb.net)
DNS_SERVERS=8.8.8.8,1.1.1.1
```

> **For frontend & admin:** The `VITE_API_URL` env var in those projects should point to the backend URL (e.g. `http://localhost:4000/api` locally).

---

## 📦 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `node --watch src/index.js` | Start with hot-reload |
| `start` | `node src/index.js` | Production start |
| `seed` | `node src/seed.js --force` | Seed database with sample data |
| `db:backup` | `node src/backup.js` | Backup all collections to JSON |
| `db:restore` | `node src/restore.js` | Restore collections from JSON backup |

---

## 🗺️ Project Structure

```
backend/
├── src/
│   ├── index.js              # Express server setup, CORS, routes, error handling
│   ├── email.js              # Gmail SMTP notification sender
│   ├── seed.js               # Database seeder with sample data
│   ├── backup.js             # MongoDB → JSON backup utility
│   ├── restore.js            # JSON → MongoDB restore utility
│   ├── cleanup-payment-fields.js  # Data migration helper
│   ├── middleware/
│   │   ├── auth.js           # JWT verification middleware (GET=public, write=auth'd)
│   │   └── rateLimiter.js    # Tiered rate limiting (auth, booking, general API)
│   ├── models/               # Mongoose schemas (10 models)
│   └── routes/               # Express route handlers (11 route files)
├── backups/                  # Auto-generated DB backups
├── .env                      # Local environment variables (gitignored)
├── package.json
├── render.yaml               # Render deployment config
└── README.md                 # ← You are here
```

---

## 🔐 Authentication

The backend uses **JWT-based authentication** with a single admin account.

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| `POST` | `/api/auth/login` | No | Login with email & password, receive JWT |
| `GET` | `/api/auth/verify` | Yes (Bearer) | Check if token is still valid |

**Auth middleware behavior:**
- `GET` requests → always allowed (public read)
- `POST / PUT / PATCH / DELETE` → require `Authorization: Bearer <token>` header
- Tokens expire after 24 hours

---

## 📨 Email Notifications

When `GMAIL_EMAIL`, `GMAIL_APP_PASSWORD`, and `NOTIFICATION_EMAIL` are configured, the server sends email notifications for new bookings (with customer details and booking number). Emails include a styled HTML template with branding and a link to the admin dashboard.

---

## 🚢 Deployment

The project includes a [`render.yaml`](./render.yaml) for infrastructure-as-code deployment on [Render](https://render.com).

All variables listed in the **Environment Variables** section above should be set in the Render dashboard. `sync: false` variables need manual entry.

---

## 💾 Database Backup & Restore

```bash
# Create a timestamped JSON backup of all collections
npm run db:backup

# Restore from the latest backup
npm run db:restore
```

Backups are stored in `backups/` (gitignored from the main repo but tracked within the directory).

---

## 🌱 Seeding

The seed script populates the database with sample sessions, plans, team members, gallery items, and about content. Run it on a fresh database:

```bash
npm run seed -- --force
```

> ⚠️ This **deletes all existing data** before seeding. The `--force` flag is required as a safety measure.

---

## 🛡️ Rate Limiting

| Limiter | Endpoints | Window | Max Requests |
|---------|-----------|--------|--------------|
| `apiLimiter` | All `/api/*` | 15 minutes | 100 |
| `authLimiter` | `/api/auth/login` | 15 minutes | 10 |
| `bookingLimiter` | `/api/bookings` | 15 minutes | 20 |

---

## 🧪 Health Check

```
GET /api/health
```

Returns `{ status: "ok", db: "connected" | "disconnected" }`.