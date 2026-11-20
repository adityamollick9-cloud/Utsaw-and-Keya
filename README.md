# Utsaw & Keya — Wedding Invitation, Backend API & Admin Dashboard

A full-stack wedding application ecosystem consisting of three decoupled components: a guest-facing wedding invitation website, a secure REST API connected to MongoDB Atlas, and a private React administration dashboard.

---

## 1. Project Overview & Architecture

The system is structured as three independent applications communicating over HTTP/REST:

```
                  ┌─────────────────────────────────────────┐
                  │       Guest Wedding Invitation          │
                  │   (Static HTML / CSS / JS / Audio)      │
                  └───────────────────┬─────────────────────┘
                                      │ Public HTTPS
                                      │ POST /api/rsvp
                                      │ POST /api/blessings
                                      ▼
┌──────────────────────┐        ┌───────────────────────────┐
│   Admin Dashboard    │        │        Backend API        │
│    (React + Vite)    ├───────►│     (Express.js + Node)   │
└──────────────────────┘        └─────────────┬─────────────┘
   Authenticated HTTPS                        │ Mongoose ODM
   JWT (Bearer Token)                         ▼
   /api/admin/*                 ┌───────────────────────────┐
                                │       MongoDB Atlas       │
                                │ (Wedding_Blessings DB)    │
                                └───────────────────────────┘
```

- **Guest Frontend (`frontend/`):** Public-facing interactive wedding invitation with story, events schedule, background music, RSVP form, and blessing message submission.
- **Backend API (`wedding-backend/`):** Express.js REST API. The only layer with access to MongoDB Atlas. Handles validation, rate limiting, duplicate submission prevention (idempotency), bcrypt password hashing, and JWT-authenticated administrator routes.
- **Admin Dashboard (`wedding-dashboard/`):** Private, password-protected React application for the wedding hosts to view live RSVP responses, ceremony breakdowns, private guest blessings, and download CSV exports.

---

## 2. Key Features

- **Guest RSVP & Ceremony Selection:** Guests can indicate attendance ("yes" or "no") and select specific wedding ceremonies (`haldi-ceremony`, `haldi-night-dinner`, `holy-matrimony`, `wedding-dinner`, `farewell`).
- **Private Blessings:** Messages written by guests are stored securely in MongoDB Atlas and are accessible only to authenticated administrators.
- **Duplicate Prevention:** Client-generated session IDs (`submissionId`) prevent accidental duplicate submissions on double-clicks or retries.
- **Multi-Admin Authentication:** Secure JWT authentication supporting multiple administrator accounts with bcrypt password hashing (10 salt rounds).
- **Real-Time Analytics Dashboard:**
  - Live KPI cards: Total submissions, attending count, declined count, total blessings.
  - Interactive charts: Attendance distribution donut chart, ceremony participation bar chart, and daily submission timeline.
  - Search & Filters: Search by name, email, or phone; filter by attendance and ceremony; sort by date.
  - CSV Export: One-click export of complete RSVP records and blessings to `.csv` files.
- **Security & Reliability:** Helmet security headers, CORS origin whitelisting, rate limiting on public endpoints and login, safe regex search sanitization, and graceful database teardown.

---

## 3. Technology Stack

| Component | Technologies |
|---|---|
| **Guest Frontend** | HTML5, CSS3, Vanilla JavaScript, Canvas particles, Web Audio API |
| **Backend API** | Node.js (ES Modules), Express.js, Mongoose, MongoDB Atlas, JWT, bcryptjs, Helmet, express-rate-limit, Morgan |
| **Admin Dashboard** | React 18, Vite, Tailwind CSS, Lucide React icons, Recharts |
| **Testing** | Node.js built-in test runner (`node:test`, `node:assert/strict`) |

---

## 4. Repository Structure

```text
Utsaw-and-Keya/
├── frontend/                     # Guest-facing invitation website
│   ├── index.html                # Main wedding invitation page & RSVP form
│   ├── config.js                 # Runtime backend API base URL configuration
│   └── a-thousand-years-*.mp3    # Background audio asset
│
├── wedding-backend/              # Express REST API
│   ├── server.js                 # Entry point & graceful shutdown handler
│   ├── package.json              # Backend dependencies and test scripts
│   ├── .env.example              # Template for environment variables
│   ├── src/
│   │   ├── app.js                # Express app, CORS, security & route mounting
│   │   ├── config/db.js          # MongoDB Atlas Mongoose connection
│   │   ├── models/               # Mongoose schemas (Rsvp, Blessing, Admin)
│   │   ├── controllers/          # Business logic (RSVP, Blessing, Admin)
│   │   ├── routes/               # API endpoints (/api/rsvp, /api/blessings, /api/admin)
│   │   ├── middleware/           # JWT auth, rate limiters, central error handler
│   │   ├── services/seedAdmin.js # Startup admin seeding service
│   │   └── utils/sanitize.js     # Regex sanitization for safe searches
│   ├── scripts/                  # Standalone administrative helper scripts
│   └── tests/                    # Automated test suites (30 tests)
│
├── wedding-dashboard/            # Private administrator React dashboard
│   ├── index.html                # HTML entry point
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS styling configuration
│   ├── vercel.json               # Vercel SPA routing rewrites
│   ├── package.json              # Dashboard dependencies and build scripts
│   ├── .env.example              # Template for dashboard environment variables
│   └── src/
│       ├── main.jsx              # React DOM render & AuthProvider wrapping
│       ├── App.jsx               # Main view switcher (Login vs Dashboard)
│       ├── context/AuthContext   # Authentication state & session storage
│       ├── layouts/              # Dashboard sidebar & top navigation layout
│       ├── pages/                # OverviewPage, RsvpsPage, BlessingsPage, LoginPage
│       └── services/api.js       # Fetch client with Bearer token injection
│
├── .gitignore                    # Global git ignore (ignores .env and node_modules)
└── README.md                     # Project documentation
```

---

## 5. Prerequisites & Local Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- A **MongoDB Atlas** cluster with database `Wedding_Blessings`

### 1. Clone the repository
```bash
git clone https://github.com/adityamollick9-cloud/Utsaw-and-Keya.git
cd Utsaw-and-Keya
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd wedding-backend && npm install

# Install dashboard dependencies
cd ../wedding-dashboard && npm install
cd ..
```

### 3. Configure Local Environment Variables
Create `.env` inside `wedding-backend/`:
```bash
cp wedding-backend/.env.example wedding-backend/.env
```
Fill in your local values in `wedding-backend/.env`:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.fdiflju.mongodb.net/Wedding_Blessings?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
SECOND_ADMIN_USERNAME=second_admin_username
SECOND_ADMIN_PASSWORD=second_admin_password
FRONTEND_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
DASHBOARD_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Create `.env` inside `wedding-dashboard/`:
```bash
cp wedding-dashboard/.env.example wedding-dashboard/.env
```
Set the API base URL:
```env
VITE_API_BASE_URL=http://localhost:5001
```

---

## 6. Running Locally (3 Terminal Tabs)

Open three terminal tabs in the project root:

### Terminal 1: Backend API
```bash
cd wedding-backend
npm start
```
- API Server runs at: `http://localhost:5001`
- Health check: `http://localhost:5001/api/health`
> *Note: Port `5001` is used to prevent port conflicts with macOS AirPlay/ControlCenter on port 5000.*

### Terminal 2: Admin Dashboard
```bash
cd wedding-dashboard
npm run dev
```
- Dashboard opens at: `http://localhost:5173`
- Sign in with the administrator credentials configured in `wedding-backend/.env`.

### Terminal 3: Guest Frontend
```bash
python3 -m http.server 5500 --directory frontend
```
*(Or use the VS Code Live Server extension on port 5500).*
- Open `http://localhost:5500` in your browser.
- Submissions will be sent to the backend at `http://localhost:5001/api/rsvp` and appear live in the dashboard.

---

## 7. Automated Tests

The backend includes 4 automated test suites covering 30 test cases:

```bash
cd wedding-backend

npm test                  # 12 Unit & integration tests (validation, auth, rate limiting)
npm run test:e2e          # 9 End-to-end tests (guest submit -> MongoDB Atlas -> dashboard)
npm run test:admin        # 5 Multi-admin login & permission tests
npm run test:resilience   # 4 Search sanitization & CastError resilience tests
```

---

## 8. Deployment Guide

### A. Database — MongoDB Atlas
1. Ensure your MongoDB Atlas cluster has network access enabled for `0.0.0.0/0` (or Render's outbound IP addresses).
2. Create a database named `Wedding_Blessings`.
3. Create a Database User with read and write permissions.
4. Copy the connection string format:
   `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/Wedding_Blessings?retryWrites=true&w=majority&appName=Cluster0`

---

### B. Backend API — Render
1. Create a new **Web Service** on [Render](https://render.com) and connect your GitHub repository.
2. Configure the service settings:
   - **Root Directory:** `wedding-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Add the following **Environment Variables** in Render's dashboard:
   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your full MongoDB Atlas connection string |
   | `JWT_SECRET` | A strong, random secret key |
   | `ADMIN_USERNAME` | Administrator username |
   | `ADMIN_PASSWORD` | Administrator password |
   | `SECOND_ADMIN_USERNAME` | (Optional) Second administrator username |
   | `SECOND_ADMIN_PASSWORD` | (Optional) Second administrator password |
   | `FRONTEND_ORIGIN` | Your production frontend URL (e.g. `https://utsaw-keya.vercel.app`) |
   | `DASHBOARD_ORIGIN` | Your production dashboard URL (e.g. `https://utsaw-dashboard.vercel.app`) |
4. Deploy the service. Note your Render URL (e.g., `https://your-backend.onrender.com`).

---

### C. Admin Dashboard — Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure the project:
   - **Project Name:** e.g. `utsaw-dashboard`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click edit and select `wedding-dashboard`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. In **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | Your deployed Render backend URL (e.g. `https://your-backend.onrender.com`) |
4. Click **Deploy**. Vercel will build the React SPA with rewrite rules defined in [`wedding-dashboard/vercel.json`](file:///Users/adityamallickshiba/Documents/ACADEMIC/CODING/WEDS/wedding-dashboard/vercel.json).

---

### D. Guest Frontend — Vercel
1. In [`frontend/config.js`](file:///Users/adityamallickshiba/Documents/ACADEMIC/CODING/WEDS/frontend/config.js), set `window.RSVP_API_BASE` to your deployed Render URL:
   ```javascript
   window.RSVP_API_BASE = 'https://your-backend.onrender.com';
   ```
2. Import the same repository into Vercel as a second project:
   - **Project Name:** e.g. `utsaw-and-keya`
   - **Framework Preset:** `Other`
   - **Root Directory:** Click edit and select `frontend`
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty (static files served directly)
3. Click **Deploy**.
4. Copy the production URLs for both Frontend and Dashboard into your Render backend's `FRONTEND_ORIGIN` and `DASHBOARD_ORIGIN` environment variables to ensure CORS requests succeed.

---

## 9. API Reference Summary

### Public Endpoints (Guest Frontend)
- `POST /api/rsvp` — Submit RSVP and optional blessing.
  - Body: `{ submissionId, firstName, lastName, email, phone, attending: 'yes'|'no', events: [], blessing: '' }`
  - Response: `{ ok: true, success: true, message: '...', data: { id, firstName, attending } }`
- `POST /api/blessings` — Standalone blessing submission.
  - Body: `{ guestName, message }`
  - Response: `{ ok: true, success: true, message: '...' }`

### Protected Endpoints (Admin Dashboard — Header: `Authorization: Bearer <token>`)
- `POST /api/admin/login` — Authenticate admin (`{ username, password }`), returns JWT token.
- `GET /api/admin/me` — Verify current administrator session.
- `GET /api/admin/statistics` — Real-time summary metrics, event breakdown, and timeline.
- `GET /api/admin/rsvps` — Paginated, searchable, and filterable RSVP submissions.
- `GET /api/admin/rsvps/:id` — Single RSVP record details.
- `DELETE /api/admin/rsvps/:id` — Delete RSVP and associated blessing.
- `GET /api/admin/blessings` — Paginated private guest blessings.
- `DELETE /api/admin/blessings/:id` — Delete blessing.
- `GET /api/admin/export/rsvps` — Download all RSVPs as a `.csv` file.
- `GET /api/admin/export/blessings` — Download all blessings as a `.csv` file.
- `GET /api/health` — Public health check (`status`, `database`).
