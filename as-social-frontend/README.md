# AS Social Studio – Frontend

A production-ready React (Vite) dashboard for the **AS Social Studio** platform.  
Dark editorial design with full CRUD for Clients, Posts, and Leads, plus real-time KPI charts.

---

## 🗂 Folder Structure

```
as-social-studio-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx        ← Shell: Sidebar + Topbar + <Outlet>
│   │   │   ├── Sidebar.jsx       ← Nav links, user info, logo
│   │   │   └── Topbar.jsx        ← Page title, search, notifications
│   │   ├── ui/
│   │   │   ├── Badge.jsx         ← Coloured status chip
│   │   │   ├── ConfirmDialog.jsx ← Delete confirmation modal
│   │   │   ├── Modal.jsx         ← Generic modal wrapper
│   │   │   ├── PageHeader.jsx    ← Title + action button row
│   │   │   ├── StatCard.jsx      ← KPI metric card
│   │   │   └── Table.jsx         ← Sortable data table with skeleton
│   │   └── ProtectedRoute.jsx    ← Auth gate
│   ├── context/
│   │   ├── AuthContext.jsx       ← JWT state, login/logout
│   │   └── ToastContext.jsx      ← In-app notification system
│   ├── hooks/
│   │   └── useApi.js             ← Generic fetch hook
│   ├── pages/
│   │   ├── Dashboard.jsx         ← Home with charts + recent activity
│   │   ├── Clients.jsx           ← CRUD table + form modal
│   │   ├── Posts.jsx             ← CRUD table + form modal
│   │   ├── Leads.jsx             ← CRUD table + form modal
│   │   ├── KPIs.jsx              ← Charts & analytics page
│   │   ├── Settings.jsx          ← Profile, password, notifications
│   │   └── Login.jsx             ← Auth (login + register)
│   ├── services/
│   │   └── api.js                ← All backend calls via axios
│   ├── styles/
│   │   └── globals.css           ← Tailwind + custom classes
│   └── utils/
│       └── helpers.js            ← Formatters, constants, color maps
├── .env.example
├── index.html
├── netlify.toml
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API URL

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:8888/api   # local backend
# or
VITE_API_URL=https://your-backend.netlify.app/api   # production
```

### 3. Run the dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## 🏗 Build for Production

```bash
npm run build      # outputs to /dist
npm run preview    # local preview of /dist
```

---

## ☁️ Deploy to Netlify

### Via CLI

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

### Via GitHub

1. Push to GitHub
2. In Netlify: **Add new site → Import from Git**
3. Build command: `npm run build`  |  Publish dir: `dist`
4. Add `VITE_API_URL` in **Site settings → Environment variables**

> The included `netlify.toml` handles the SPA redirect rule automatically.

---

## 📡 Backend Endpoints Used

| Feature    | Endpoints |
|------------|-----------|
| Auth       | `POST /auth/login`, `POST /auth/register` |
| Clients    | `GET/POST /clients`, `PUT/DELETE /clients/:id` |
| Posts      | `GET/POST /posts`, `PUT/DELETE /posts/:id` |
| Leads      | `GET/POST /leads`, `PUT/DELETE /leads/:id` |
| Dashboard  | `GET /dashboard` |

All requests include `Authorization: Bearer <token>` automatically via the Axios interceptor in `src/services/api.js`.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#080c14` |
| Card | `#0d1221` |
| Border | `#1e2a3a` |
| Brand | `#6366f1` |
| Font (body) | DM Sans |
| Font (display) | Syne |
| Font (mono) | DM Mono |

All design tokens live in `tailwind.config.js` and `src/styles/globals.css`.

---

## 🔑 Auth Flow

1. User submits login form → `POST /api/auth/login`
2. JWT token stored in `localStorage`
3. `AuthContext` exposes `{ user, isAuthenticated, login, logout }`
4. `ProtectedRoute` redirects to `/login` if no token
5. Axios interceptor auto-attaches header + redirects on 401

---

## 🧩 Adding a New Page

1. Create `src/pages/MyPage.jsx`
2. Add a route in `src/App.jsx` inside the `<ProtectedRoute>` block
3. Add a nav item in `src/components/layout/Sidebar.jsx`
4. Add a title in `src/components/layout/Topbar.jsx`

---

## 📝 License

MIT
