# AS Social Studio – Backend API

A production-ready REST API for the AS Social Studio platform, built with **Node.js + Express**, deployed to **Netlify Functions**, and backed by **Firebase Firestore**.

---

## 📁 Folder Structure

```
as-social-studio-backend/
├── netlify/
│   └── functions/
│       └── api.js              ← Express app entry point (Netlify handler)
├── public/
│   └── index.html              ← Static landing page (Netlify publish dir)
├── src/
│   ├── config/
│   │   └── firebase.js         ← Firebase Admin SDK initialisation
│   ├── middleware/
│   │   ├── auth.js             ← JWT verification middleware
│   │   └── errorHandler.js     ← Global error handler
│   ├── routes/
│   │   ├── auth.js             ← POST /api/auth/login|register
│   │   ├── clients.js          ← CRUD /api/clients
│   │   ├── posts.js            ← CRUD /api/posts
│   │   ├── leads.js            ← CRUD /api/leads
│   │   └── dashboard.js        ← GET  /api/dashboard
│   └── validators/
│       ├── index.js            ← express-validator rule sets
│       └── validate.js         ← Validation result helper
├── .env.example
├── netlify.toml
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js ≥ 18
- A [Firebase project](https://console.firebase.google.com/) with Firestore enabled
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (optional for local dev)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `JWT_SECRET` | A long random string (use `openssl rand -hex 64`) |
| `JWT_EXPIRES_IN` | Token TTL – e.g. `7d`, `24h` |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (keep `\n` in the string) |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs |

#### Getting Firebase credentials

1. Firebase Console → Project Settings → **Service accounts**
2. Click **Generate new private key** → download JSON
3. Copy `project_id`, `client_email`, and `private_key` into your `.env`

> ⚠️ The private key contains newlines. When stored in a single `.env` line, replace real newlines with `\n` (the two characters backslash + n).

---

## 🔧 Local Development

```bash
# Option A – Netlify Dev (recommended, mirrors production exactly)
npx netlify dev

# Option B – Standalone Node server
node netlify/functions/api.js
```

The API will be available at `http://localhost:8888/api` (Netlify Dev) or `http://localhost:3000/api`.

Health check:
```
GET http://localhost:8888/api/health
```

---

## ☁️ Deploy to Netlify

### Via Netlify CLI

```bash
npx netlify login
npx netlify init       # link to a new or existing site
npx netlify deploy --prod
```

### Via GitHub integration

1. Push this repo to GitHub
2. In Netlify: **Add new site → Import from Git**
3. Build settings are auto-detected from `netlify.toml`
4. Add all environment variables in **Site Settings → Environment variables**

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require:

```
Authorization: Bearer <jwt_token>
```

---

### Auth

#### `POST /api/auth/register`

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "secret123",
  "role": "manager"           // optional: admin | manager | viewer
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "token": "eyJ...", "user": { "id": "...", "name": "...", "email": "...", "role": "..." } }
}
```

---

#### `POST /api/auth/login`

```json
{ "email": "joao@example.com", "password": "secret123" }
```

**Response 200:** same shape as register.

---

### Clients (🔒 protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/clients` | List clients (filters: `status`, `search`, `page`, `limit`) |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Get client by ID |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

**Client body fields:**
```json
{
  "name": "Acme Corp",          // required
  "email": "contact@acme.com",  // optional
  "phone": "+5511999999999",    // optional
  "industry": "E-commerce",     // optional
  "status": "active",           // active | inactive | prospect
  "notes": "VIP client"         // optional
}
```

---

### Posts (🔒 protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts` | List posts (filters: `clientId`, `platform`, `status`, `page`, `limit`) |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get post by ID |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |

**Post body fields:**
```json
{
  "title": "Black Friday Campaign",         // required
  "content": "Big discounts await...",      // required
  "clientId": "FIRESTORE_CLIENT_DOC_ID",   // required
  "platform": "instagram",                  // instagram | facebook | twitter | linkedin | tiktok | other
  "status": "draft",                        // draft | scheduled | published | rejected
  "scheduledAt": "2024-11-29T09:00:00Z",   // optional ISO date
  "tags": ["promo", "sale"]                 // optional array
}
```

---

### Leads (🔒 protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leads` | List leads (filters: `status`, `source`, `clientId`, `search`, `page`, `limit`) |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/:id` | Get lead by ID |
| PUT | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Delete lead |

**Lead body fields:**
```json
{
  "name": "Maria Oliveira",           // required
  "email": "maria@example.com",       // optional
  "phone": "+5511888888888",          // optional
  "source": "instagram",              // instagram | facebook | referral | website | other
  "status": "new",                    // new | contacted | qualified | converted | lost
  "clientId": "FIRESTORE_CLIENT_ID", // optional – linked client
  "value": 1500.00,                   // optional – estimated deal value
  "notes": "Interested in plan Pro"   // optional
}
```

---

### Dashboard (🔒 protected)

#### `GET /api/dashboard`

Returns aggregated KPIs in a single request:

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalClients": 24,
      "activeClients": 18,
      "inactiveClients": 3,
      "prospectClients": 3,
      "totalPosts": 142,
      "publishedPosts": 98,
      "scheduledPosts": 12,
      "draftPosts": 32,
      "totalLeads": 55,
      "newLeads": 10,
      "convertedLeads": 30,
      "lostLeads": 5,
      "conversionRate": 54.55,
      "totalLeadValue": 87500.00
    },
    "breakdowns": {
      "postsByPlatform": { "instagram": 60, "facebook": 40 },
      "leadsBySource":   { "instagram": 20, "referral": 15 }
    },
    "recent": {
      "clients": [...],
      "posts":   [...],
      "leads":   [...]
    },
    "monthlyTrend": [
      { "month": "Nov 2024", "count": 18 },
      { "month": "Dec 2024", "count": 27 }
    ],
    "generatedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

---

## 🛡️ Error Responses

All errors follow this shape:

```json
{
  "success": false,
  "message": "Human-readable description"
}
```

| Status | Meaning |
|--------|---------|
| 401 | Missing / invalid / expired token |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 422 | Validation failed (includes `errors` array) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## 🔥 Firestore Collections

| Collection | Description |
|------------|-------------|
| `users` | Registered users (passwords hashed with bcrypt) |
| `clients` | Social media clients |
| `posts` | Content posts linked to clients |
| `leads` | Sales leads / prospects |

---

## 🧪 Testing with curl

```bash
BASE=http://localhost:8888/api

# Register
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"test1234","role":"admin"}' | jq

# Login
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test1234"}' | jq -r '.data.token')

# Create client
curl -s -X POST $BASE/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme","email":"acme@test.com","status":"active"}' | jq

# Dashboard
curl -s $BASE/dashboard -H "Authorization: Bearer $TOKEN" | jq
```

---

## 📝 License

MIT – free to use and modify.
