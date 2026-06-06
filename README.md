[README.md](https://github.com/user-attachments/files/28663991/README.md)
# VendorBridge

**Procurement & Vendor Management ERP** — Odoo Hiring Hackathon

VendorBridge digitizes and centralizes procurement operations — from vendor onboarding and RFQ creation through to approval workflows, purchase orders, and invoice generation — replacing manual procurement processes with structured, auditable workflows.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, modern React with hooks |
| State Management | Zustand | Lightweight, no boilerplate, token stored in memory |
| Server State | TanStack React Query | Caching, auto-refetch, optimistic updates |
| Forms | React Hook Form + Zod | Schema-based validation, instant field-level errors |
| HTTP Client | Axios | Interceptors for auth token injection |
| Backend | Node.js + Express | Modular, fast, widely supported |
| Validation | Zod | Same schemas shared across backend routes |
| Authentication | JWT (access token) | Stateless, secure |
| Password Hashing | bcryptjs | Industry standard, salt rounds 12 |
| Database | PostgreSQL | Relational, ACID compliant, production-grade |
| Query Builder | Knex.js | Migrations, seeds, raw SQL when needed |
| Logging | Winston | Structured logs, colorized in dev, JSON in prod |
| Security | Helmet + CORS + Rate Limiter | Security headers, origin restriction, brute force protection |

---

## Project Structure

```
vendorbridge/
├── server/                        # Node.js + Express backend
│   ├── app.js                     # Express app — all routes, middleware
│   ├── server.js                  # Entry point — listen + graceful shutdown
│   ├── db.js                      # Knex singleton instance
│   ├── knexfile.js                # Knex config (dev + prod)
│   ├── authenticate.js            # JWT verify middleware
│   ├── authorize.js               # RBAC middleware factory
│   ├── validate.js                # Zod validation middleware factory
│   ├── errorHandler.js            # Centralized error handler
│   ├── logger.js                  # Winston logger (dev: colorized, prod: JSON)
│   └── db/
│       └── seeds/
│           └── 01_seed_all.js     # Full demo dataset
│
├── frontend/                      # React 18 + Vite frontend
│   ├── src/
│   │   ├── App.jsx                # Routes + protected route wrapper
│   │   ├── api/
│   │   │   ├── http.js            # Axios instance + auth interceptor
│   │   │   ├── authApi.js
│   │   │   ├── vendorsApi.js
│   │   │   ├── rfqApi.js
│   │   │   ├── quotationsApi.js
│   │   │   ├── approvalsApi.js
│   │   │   ├── invoicesApi.js
│   │   │   ├── dashboardApi.js
│   │   │   ├── reportsApi.js
│   │   │   └── activityApi.js
│   │   ├── store/
│   │   │   ├── authStore.js       # Zustand — user, accessToken, isAuthenticated
│   │   │   └── uiStore.js         # Zustand — UI state (sidebar, toasts)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.jsx   # Main layout wrapper
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Topbar.jsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Field.jsx
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   ├── Stepper.jsx
│   │   │   │   ├── SurfaceCard.jsx
│   │   │   │   └── ToastViewport.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── dashboard/         # KPI cards, recent POs, spending chart
│   │   │   ├── vendors/           # Vendor list + add vendor
│   │   │   ├── rfqs/              # Create RFQ (3-step form)
│   │   │   ├── quotations/        # Submit quotation + comparison view
│   │   │   ├── approvals/         # Approval workflow stepper
│   │   │   ├── invoices/          # Invoice detail + mark paid + email
│   │   │   ├── reports/           # Charts + vendor performance table
│   │   │   ├── activity/          # Activity timeline + audit log
│   │   │   ├── account/           # User profile
│   │   │   └── settings/          # Placeholder settings page
│   │   └── utils/
│   │       ├── formatters.js      # Currency, date formatters
│   │       └── downloads.js       # PDF/CSV download helpers
│   └── vite.config.js
│
└── logs/                          # Winston log output (gitignored)
    ├── combined.log
    └── error.log
```

---

## Database Design

All tables use UUID primary keys generated by PostgreSQL's built-in `gen_random_uuid()`. Foreign keys enforce referential integrity. Indexes are created on every FK column and on high-frequency filter columns (`status`, `deadline`, `po_date`).

```
users
 ├── vendors          (created_by → users.id)
 ├── rfqs             (created_by → users.id)
 └── approvals        (initiated_by → users.id)
      └── approval_steps (approver_id → users.id)

rfqs
 ├── rfq_line_items         (rfq_id → rfqs.id, CASCADE)
 ├── rfq_vendor_assignments (rfq_id → rfqs.id, CASCADE)
 ├── rfq_attachments        (rfq_id → rfqs.id, CASCADE)
 └── quotations             (rfq_id → rfqs.id)
      └── quotation_line_items (quotation_id → quotations.id, CASCADE)
           └── rfq_line_items  (rfq_line_item_id → rfq_line_items.id)

quotations → approvals → purchase_orders → invoices
```

### Tables

| Table | Purpose |
|---|---|
| `users` | Accounts with roles: `admin`, `procurement_officer`, `manager`, `vendor` |
| `vendors` | Vendor registry — GST, category, status, rating |
| `rfqs` | Request for Quotation header — title, deadline, status |
| `rfq_line_items` | Products/services requested in an RFQ |
| `rfq_vendor_assignments` | Which vendors are invited to each RFQ |
| `rfq_attachments` | Files attached to an RFQ |
| `quotations` | Vendor's price response to an RFQ |
| `quotation_line_items` | Per-item pricing within a quotation |
| `approvals` | Approval workflow record for a selected quotation |
| `approval_steps` | Individual steps (L1 Review, L2 Approval) within an approval |
| `purchase_orders` | Auto-generated PO when all approval steps pass |
| `invoices` | Auto-generated invoice linked to each PO |
| `activity_logs` | Append-only audit trail for every state-changing action |

---

## Core Procurement Workflow

```
1. Procurement Officer creates an RFQ (line items + vendor assignments)
2. RFQ published → assigned vendors submit quotations
3. Officer views side-by-side quotation comparison, selects best vendor
4. Approval workflow initiates (L1 Review → L2 Approval)
5. All steps approved → Purchase Order auto-generated
6. Invoice auto-generated from the PO
7. Invoice downloaded as PDF, printed, or emailed to vendor
8. Every action logged to activity_logs for full audit trail
```

---

## User Roles

| Role | Permissions |
|---|---|
| `admin` | Full access — user management, vendor management, all modules |
| `procurement_officer` | Create RFQs, manage vendors, generate POs and invoices |
| `manager` | Approve or reject procurement steps, monitor workflows |
| `vendor` | Submit quotations, view assigned RFQs and own POs |

---

## API Reference

All endpoints are prefixed with `/api`. All responses follow the shape `{ success: true, data: ... }` or `{ success: false, error: "..." }`.

```
Auth
  POST   /api/auth/login
  POST   /api/auth/register

Vendors
  GET    /api/vendors                     ?status=&category=&search=
  POST   /api/vendors
  PATCH  /api/vendors/:id/status

RFQs
  GET    /api/rfqs
  POST   /api/rfqs

Quotations
  GET    /api/quotations                  ?rfq_id=
  POST   /api/quotations

Approvals
  GET    /api/approvals
  POST   /api/approvals/:id/steps/:stepId/approve
  POST   /api/approvals/:id/steps/:stepId/reject

Purchase Orders
  GET    /api/purchase-orders

Invoices
  GET    /api/invoices
  PATCH  /api/invoices/:id/mark-paid
  POST   /api/invoices/:id/email

Reports
  GET    /api/reports/dashboard-stats
  GET    /api/reports/spending-summary    ?month=YYYY-MM
  GET    /api/reports/vendor-performance  ?month=YYYY-MM
  GET    /api/reports/procurement-stats   ?month=YYYY-MM

Activity
  GET    /api/activity                    ?entity_type=

Health
  GET    /
  GET    /health
```

---

## Setup & Installation

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14 running locally
- Git

### 1. Clone the repository

```bash
git clone <repo-url>
cd vendorbridge
```

### 2. Create the database

```bash
psql -U postgres -c "CREATE DATABASE vendorbridge;"
```

### 3. Configure backend environment

```bash
cd server
cp .env.example .env
```

Open `server/.env` and set your values:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendorbridge
DB_USER=postgres
DB_PASS=your_postgres_password

JWT_ACCESS_SECRET=replace_with_a_long_random_string
JWT_ACCESS_EXPIRES=15m

CLIENT_URL=http://localhost:5173
```

### 4. Install backend dependencies

```bash
# still inside server/
npm install
```

### 5. Run migrations

```bash
npx knex migrate:latest
```

> Migrations run in numbered order and create all 13 tables with foreign keys, indexes, and PostgreSQL enum types.

### 6. Seed demo data

```bash
npm run seed
```

This loads 4 users, 5 vendors, 2 RFQs, 3 quotations, an in-progress approval, a completed PO, and a linked invoice.

### 7. Start the backend

```bash
npm run dev
# API running on http://localhost:3000
```

### 8. Install and start the frontend

```bash
cd ../frontend
npm install
npm run dev
# UI running on http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@vendorbridge.com | Admin@1234 |
| Procurement Officer | officer@vendorbridge.com | Officer@1234 |
| Manager (L1) | rahul@vendorbridge.com | Manager@1234 |
| Manager (L2) | priya@vendorbridge.com | Manager@1234 |

---

## Security

- Passwords hashed with bcryptjs — salt rounds 12, plaintext never stored or logged
- JWT access token lives in Zustand memory only — never written to `localStorage`
- Token injected into every request via Axios request interceptor
- Helmet.js sets security headers (`X-Frame-Options`, `CSP`, `HSTS`, etc.) on all responses
- CORS restricted to `http://localhost:5173` only
- Global rate limiter: 100 requests per 15 minutes per IP
- Zod schema validation on all POST/PATCH request bodies before any business logic runs
- PostgreSQL constraint errors (duplicate GST, duplicate email) caught and returned as clean 409 responses
- Passwords never returned in any API response — stripped before serialization

---
