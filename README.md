# Marichin Homestay — Full-Stack Application

A production-grade, eco-luxury homestay booking and hospitality management platform for **Marichin Homestay**, nestled in Kushalnagar, Coorg (Kodagu), Karnataka.

Built with **React (Vite) + Tailwind CSS** on the frontend, and a secure **Node.js + Express + MongoDB (Mongoose)** backend API.

---

## 🏗️ Project Architecture

```
homestayswebsite/
├── client/                     # React (Vite) + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/         # Navbar, Footer, BookingBar, Chatbot, WhatsApp, etc.
│   │   ├── context/            # AdminContext, BookingContext, LanguageContext
│   │   ├── pages/              # Home, Rooms, Dining, Booking, Experiences, Admin, etc.
│   │   ├── services/           # api.js (unified HTTP helper with fallback)
│   │   └── data/               # homestayData.js
│   ├── .env.example
│   └── vite.config.js          # Proxies /api and /uploads to backend port 5000
│
├── server/                     # Node.js + Express + MongoDB backend
│   ├── config/                 # db.js (MongoDB connection + in-memory dev fallback)
│   ├── controllers/            # authController, publicController, adminController
│   ├── middleware/             # auth (JWT), rateLimiter, validator, upload, errorHandler
│   ├── models/                 # Mongoose models with timestamps & indexes
│   ├── routes/                 # authRoutes, publicRoutes, adminRoutes
│   ├── seed/                   # seed.js (idempotent database seeder)
│   ├── uploads/                # Static image upload directory (/uploads)
│   ├── utils/                  # jwt.js, email.js (nodemailer)
│   ├── test/                   # test-suite.js (automated verification)
│   └── server.js               # Express application entry point
│
└── package.json                # Monorepo scripts (concurrently dev runner)
```

---

## 🍃 MongoDB Setup (MongoDB Atlas & Local)

### Option A: MongoDB Atlas (Recommended for Cloud / Production)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g. M0 tier).
3. Under **Security → Database Access**, create a user (e.g. `marichin_admin`) with a secure password.
4. Under **Security → Network Access**, add your current IP address (or `0.0.0.0/0` for universal dev access).
5. In your cluster dashboard, click **Connect → Drivers → Node.js** and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/marichin_homestay?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB
If you have MongoDB Community Server installed locally on port `27017`:
```
mongodb://127.0.0.1:27017/marichin_homestay
```

*(Note: In local development, if neither is configured, the server includes a zero-config in-memory fallback that starts automatically.)*

---

## ⚙️ Environment Configuration

Copy the example environment file into `server/.env`:

```bash
cd server
cp .env.example .env
```

Fill in your configuration:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=replace_with_random_string_at_least_32_chars_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

# Default Seed Admin Credentials
ADMIN_EMAIL=admin@marichinhomestay.com
ADMIN_PASSWORD=replace_with_a_strong_password

# Optional: Nodemailer SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
WHATSAPP_NUMBER=+91XXXXXXXXXX
```

---

## 🌱 Database Seeding

Run the seed script to populate admin accounts, real rooms, packages, dining menu, reviews, and gallery:

```bash
# From homestayswebsite directory
npm run seed

# Or directly in server directory
cd server
npm run seed
```

The seed script is **safe to run multiple times** (idempotent, uses upserts).

**Default Seed Users:**
- **Administrator:** Configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`
- **Staff / Concierge:** `staff@marichinhomestay.com` (Initial password set during setup)

---

## 🚀 Running the Application

### Start Both Server & Client Together (Recommended)
From the project root:
```bash
npm run dev
```
- **Public Guest Website:** [http://localhost:3000](http://localhost:3000)
- **Admin Management Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Backend API Server:** [http://localhost:5000/api](http://localhost:5000/api)

### Running Separately
```bash
# Terminal 1 - Backend Server
cd server
npm run dev

# Terminal 2 - Frontend Client
cd client
npm run dev
```

---

## 🧪 Automated Testing & Quality Checks

Run the end-to-end backend verification test suite:

```bash
cd server
node test/test-suite.js
```

This verifies:
- ✅ Double-booking prevention (overlapping dates for same room rejected with `400 Bad Request`)
- ✅ Server-side price & tax calculation (client prices are never trusted)
- ✅ Promo code validation & discounts (`MISTDIRECT` 15%, invalid codes rejected)
- ✅ Authentication security (unauthorized access to `/api/admin/*` returns `401 Unauthorized`)
- ✅ Role-based authorization (`admin` vs `staff`)
- ✅ File upload validation (only `.jpg`, `.png`, `.webp` accepted; others rejected with `400 Bad Request`)
- ✅ Contact inquiries, reviews, and newsletter subscriptions

---

## 🔒 Security Features
- **Helmet**: Secures HTTP headers.
- **Express Rate Limiting**: Stricter rate limits on authentication (15/15min) and booking creation (20/hr).
- **CORS Protection**: Restricted to `CLIENT_URL`.
- **JWT in httpOnly Cookie**: Prevents XSS token theft, with Bearer header fallback.
- **Input Validation & Sanitization**: `express-validator` strips malicious inputs on all writes.
- **No Production Leaks**: Stack traces are hidden in production error responses.
