# 🧗 Climb Crux — Admin Dashboard

React + Vite admin panel for managing Climb Crux website content, bookings, shop products & orders, and payments. Requires authentication via the backend API.

---

## 🏃 Running Locally

```bash
npm install
npm run dev
```

> **Note:** The admin dashboard expects the backend API to be running. See [`../../backend/README.md`](../../backend/README.md) for backend setup.

---

## 🔧 Configuration

The admin dashboard reads the API base URL from an environment variable:

```bash
# .env in the admin/ directory
VITE_API_URL=https://climb-crux-backend.onrender.com/api
```

If `VITE_API_URL` is not set, the dashboard falls back to `/api` in development (Vite proxies to the backend) or `https://climb-crux-backend.onrender.com/api` in production.

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
admin/
├── src/
│   ├── main.jsx               # Entry point, routes, providers
│   ├── admin.css              # All admin styles
│   ├── AuthContext.jsx         # JWT auth state management
│   ├── store.js               # API helper functions (CRUD calls)
│   ├── components/
│   │   ├── AdminLayout.jsx    # Sidebar nav + header layout
│   │   ├── Modal.jsx          # Reusable modal overlay
│   │   ├── ProtectedRoute.jsx # Auth guard component
│   │   └── Toast.jsx          # Toast notification system
│   └── pages/
│       ├── Login.jsx
│       ├── Dashboard.jsx
│       ├── HomeManager.jsx
│       ├── SessionsManager.jsx
│       ├── PrivatePremiumManager.jsx
│       ├── TeamManager.jsx
│       ├── GalleryManager.jsx
│       ├── PhotosManager.jsx
│       ├── ShopManager.jsx
│       ├── AboutManager.jsx
│       └── BookingsManager.jsx
├── .env                       # Local env vars (gitignored)
├── package.json
├── vercel.json                # Vercel deployment config
└── README.md                  # ← You are here
```

---

## 🚀 Features

### 📊 Dashboard
- Stats cards: total sessions, team members, gallery photos, bookings
- Recent bookings list with status badges
- Recent activity feed

### 🧗 Sessions Management
- CRUD for public session listings (date, time, spots availability)
- Visual badges for spot availability

### 💎 Plans Management
- CRUD for private & premium pricing plans
- Toggle featured plan with highlight styling
- Feature list management

### 👥 Team Management
- CRUD for instructor profiles
- Fields: name, role, bio, experience, certifications, specialties
- Social media links (Instagram, Facebook)

### 🖼️ Gallery Management
- CRUD for gallery items with category grouping
- Category filter pills for easy organization
- Image association via Cloudinary

### 📸 Photos Management
- Upload and manage gallery photos
- Cloudinary integration for image hosting

### 🛒 Shop Management
- **Products**: full CRUD with tabbed editor (General, Pricing, Inventory, Images, Variants, Specifications, Features, Shipping, SEO, Publish)
- Search, filters (category, brand, stock, status, price range), and sorting
- Image upload to Cloudinary (featured + gallery images)
- **Orders**: order list with status & payment badges, detail modal, status/payment updates, delete orders
- Stats: total orders, pending, paid revenue

### ℹ️ About Page Management
- Edit the about page description
- Manage safety highlights with title + description pairs

### 🏠 Home Page Management
- Edit home page content sections (hero, path split, trust strip, gallery teaser)

### 📋 Bookings Management
- **Full CRUD**: create, edit, view, delete bookings
- **Booking status filters**: pending payment, pending verification, confirmed, cancelled
- **Payment status filters**: pending, verification required, paid, failed
- **Date range filters**: today, this week, this month, or custom date range
- **Quick actions**: confirm/cancel booking, mark payment as paid/failed, all from the table
- **Detail modal**: booking timeline, payment details with bank/EasyPaisa account info
- **Stats cards**: total bookings, paid bookings, pending payments, revenue (filtered by date range)

---

## 📄 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Admin authentication |
| `/dashboard` | Dashboard | Analytics overview |
| `/home` | Home Manager | Edit home page content |
| `/sessions` | Sessions Manager | Manage public sessions & session content |
| `/private-premium` | Premium Manager | Manage plans & pricing |
| `/team` | Team Manager | Manage instructor profiles |
| `/gallery` | Gallery Manager | Manage gallery items |
| `/photos` | Photos Manager | Upload & manage photos |
| `/shop` | Shop Manager | Manage products & orders |
| `/about` | About Manager | Edit about page |
| `/bookings` | Bookings Manager | Manage bookings & payments |

All routes except `/login` are protected behind JWT authentication. Unauthenticated users are redirected to `/login`.

---

## 🚢 Deployment

The admin dashboard is configured for [Vercel](https://vercel.com) deployment via `vercel.json`:

```bash
npm run build
vercel --prod
```

Make sure to set `VITE_API_URL` as an environment variable in your Vercel project settings pointing to your deployed backend API.
