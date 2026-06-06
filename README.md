# VendorBridge
> Procurement & Vendor Management ERP — Odoo Hackathon 2025

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 + Vite | Fast dev server, modern React with hooks |
| State Management | Zustand | Lightweight, no boilerplate, token in memory |
| Server State | React Query | Caching, auto-refetch, optimistic updates |
| Forms | React Hook Form + Zod | Schema-based validation, instant field errors |
| HTTP Client | Axios | Interceptors for auth token + auto refresh |
| Backend | Node.js + Express | Modular, fast, widely supported |
| Validation | Zod | Same schemas shared across backend routes |
| Authentication | JWT (access + refresh) | Stateless, secure, dual-token pattern |
| Password Hashing | bcryptjs | Industry standard, salt rounds 12 |
| Database | PostgreSQL | Relational, ACID compliant, production-grade |
| Query Builder | Knex.js | Migrations, seeds, raw SQL when needed |
| Logging | Winston | Structured logs, colorized dev, JSON prod |
| Security | Helmet + CORS + Rate Limiter | Headers, origin restriction, brute force protection |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally
- Git

### 1. Clone & Install
```bash
git clone https://github.com/your-team/vendorbridge.git
cd vendorbridge
npm install              # root (installs concurrently)
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Database Setup
```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE vendorbridge;"
```

### 3. Environment Variables
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your DB credentials and JWT secrets

# Client
cp client/.env.example client/.env
# Edit if needed (default: VITE_API_URL=http://localhost:3000/api)
```

### 4. Run Migrations & Seeds
```bash
cd server
npm run migrate     # Creates all tables
npm run seed        # Populates test data
cd ..
```

### 5. Start Development
```bash
npm run dev         # Starts both client (5173) and server (3000)
```

Visit `http://localhost:5173`

### Test Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vendorbridge.com | Admin@123 |
| Procurement Officer | harshal@vendorbridge.com | Officer@123 |
| Manager | rahul@vendorbridge.com | Manager@123 |
| Vendor | infra@supplies.com | Vendor@123 |

---

## Project Structure
```
vendorbridge/
├── client/          # React 18 + Vite frontend
├── server/          # Node.js + Express API
│   ├── src/modules/ # Feature modules (vendors, rfqs, etc.)
│   ├── db/          # Migrations + Seeds
│   └── server.js
└── package.json     # Root scripts
```

---

## Team
- [Member 1] — Backend / Database
- [Member 2] — Frontend / UI
- [Member 3] — Integration / Testing

---

## Git Workflow
- `main` — production ready
- `dev` — active development  
- Feature branches: `feature/auth`, `feature/vendors`, etc.
- Commit format: `feat(module): description`
