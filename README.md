<p align="center">
  <img src="static/assets/logo.png" width="90" />
</p>
<h1 align="center">VendorBridge</h1>
<p align="center">
  <strong>Procurement & Vendor Management ERP — End-to-end RFQ workflows, multi-step approvals,<br/>automated PO generation, and GST-compliant invoicing for modern procurement teams.</strong>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-14-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Knex.js-Migrations-E16426?style=flat-square" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens" />
  <img src="https://img.shields.io/badge/PDFKit-Invoices-CC0000?style=flat-square" />
</p>
<p align="center">
  <strong>Vendor Onboarding · RFQ Management · Quotation Comparison · Approval Workflows · Auto PO & Invoice</strong>
</p>

---
# Overview

A full-stack, modular Procurement ERP built from scratch. Replaces scattered spreadsheets, email threads, and manual approval chains with a centralized, real-time procurement platform — covering the complete cycle from vendor onboarding to invoice payment.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, modern React with hooks |
| State Management | Zustand | Lightweight, no boilerplate, token stored in memory |
| Server State | React Query | Caching, auto-refetch, optimistic updates |
| Forms | React Hook Form + Zod | Schema-based validation, instant field-level errors |
| HTTP Client | Axios | Interceptors for auth token + auto refresh |
| Backend | Node.js + Express | Modular, fast, widely supported |
| Validation | Zod | Same schemas enforced across all backend routes |
| Authentication | JWT (access + refresh) | Stateless, secure, dual-token pattern |
| Password Hashing | bcryptjs | Industry standard, salt rounds 12 |
| Database | PostgreSQL (local) | Relational, ACID compliant, production-grade |
| Query Builder | Knex.js | Migrations, seeds, raw SQL when needed |
| Logging | Winston | Structured logs, colorized in dev, JSON in prod |
| Security | Helmet + CORS + Rate Limiter | Headers, origin restriction, brute force protection |
| PDF Generation | PDFKit | Server-side invoice PDF with line items + GST breakdown |
| Email | Nodemailer + Ethereal | Invoice email with HTML template + test preview URL |

---

## Why PostgreSQL — Not Firebase or MongoDB

The entire procurement flow is built around **multi-step transactional logic** — every RFQ, quotation, approval, PO, and invoice is tightly linked and must stay consistent even if a step fails midway. This requires:

- **ACID transactions** — creating a PO auto-creates an invoice in the same transaction. If the invoice insert fails, the PO rolls back. No orphaned records.
- **Relational integrity** — foreign keys guarantee every quotation references a valid RFQ and vendor, every PO references an approved quotation, every invoice references a real PO.
- **Single source of truth** — approval status, PO status, and invoice status are never recomputed from history. They are updated atomically in place.
- **Complex joins** — the comparison view, approval chain, and dashboard stats all require multi-table joins that are trivial in PostgreSQL and painful in document stores.

---

## Database Design

```
users
  └── vendors (created_by → users.id)
  └── rfqs (created_by → users.id)
        └── rfq_line_items (rfq_id → rfqs.id)
        └── rfq_vendor_assignments (rfq_id → rfqs.id, vendor_id → vendors.id)
        └── rfq_attachments (rfq_id → rfqs.id)
  └── quotations (vendor_id → vendors.id, rfq_id → rfqs.id)
        └── quotation_line_items (quotation_id → quotations.id)
  └── approvals (quotation_id → quotations.id, rfq_id → rfqs.id, vendor_id → vendors.id)
        └── approval_steps (approval_id → approvals.id, approver_id → users.id)
  └── purchase_orders (approval_id → approvals.id, quotation_id → quotations.id)
  └── invoices (po_id → purchase_orders.id, vendor_id → vendors.id)
  └── activity_logs (performed_by → users.id)
```

### Key Tables

| Table | Purpose |
|---|---|
| `users` | UUID PK, role (admin / manager / procurement_officer / vendor), bcrypt hashed password |
| `vendors` | Master vendor registry — GST, category, status (active/pending/blocked), rating |
| `rfqs` | Request for Quotation header — auto-numbered RFQ-YYYY-NNNN, status flow |
| `rfq_line_items` | Line items per RFQ — item name, quantity, unit |
| `rfq_vendor_assignments` | Which vendors are invited to quote on which RFQ |
| `quotations` | Vendor quote — server-calculated subtotal, GST, grand total, auto-numbered QT-YYYY-NNNN |
| `quotation_line_items` | Per-item unit price, delivery days, total price |
| `approvals` | Approval workflow header — current step, overall status |
| `approval_steps` | L1 Review (manager) + L2 Approval (admin) with remarks and timestamps |
| `purchase_orders` | Auto-created on full approval — CGST/SGST split, auto-numbered PO-YYYY-NNNN |
| `invoices` | Auto-created alongside PO — due date, payment status, mark-paid |
| `activity_logs` | Audit trail for every action across all modules — JSONB metadata |

---

## Architecture — Backend Module Structure

Each feature is a self-contained module:

```
server/src/modules/
  auth/             → register, login, refresh token, logout
  users/            → get/update own profile
  vendors/          → vendor CRUD, status management, GST validation
  rfqs/             → RFQ creation with line items + vendor assignments, publish
  quotations/       → quote submission, server-side total calculation, submit flow
  approvals/        → initiate workflow, L1/L2 step approve/reject, auto-create PO
  purchase-orders/  → list and detail view, line items from approved quotation
  invoices/         → list, detail, mark-paid, PDF download, email via Nodemailer
  reports/          → dashboard stats, spending summary, vendor performance
  activity/         → paginated audit log with entity type filter
```

Every module follows the same pattern:

```
routes.js       → Express router, auth + role middleware chain
controller.js   → thin handler, calls DB directly, passes errors to next()
schema.js       → Zod validation schemas for all inputs
```

---

## Authentication Flow

- **Register** — first_name, last_name, email, password (min 8 chars, 1 uppercase, 1 number, 1 special char), role
- **Login** — bcrypt compare → issue JWT access token (15 min) + refresh token (7 days), both stateless JWTs
- **Every request** — Bearer token in Authorization header, verified by `auth` middleware → `req.user = { id, role }`
- **Role guard** — `requireRole('admin', 'manager')` middleware on sensitive routes
- **Token refresh** — Axios interceptor catches 401, calls `/auth/refresh`, retries original request silently
- **Security** — access token in Zustand memory only (never localStorage), rate limiter on auth routes (10 req / 15 min), bcrypt 12 rounds

---

## Core Procurement Flow

### Full Cycle

```
Vendor Onboarded
      │
      ▼
RFQ Created (Draft)
      │
      ▼
RFQ Published ──► Vendors Invited (rfq_vendor_assignments status = invited)
      │
      ▼
Vendors Submit Quotations ──► Totals Calculated Server-Side
      │                        subtotal = Σ(unit_price × qty)
      │                        gst_amount = subtotal × gst% / 100
      │                        grand_total = subtotal + gst_amount
      ▼
Quotation Comparison View
  (side-by-side: price, GST%, delivery days, vendor rating)
  Lowest price column highlighted green
      │
      ▼
Procurement Officer Selects Vendor ──► Initiates Approval Workflow
      │
      ▼
┌─────────────────────────────┐
│     APPROVAL WORKFLOW       │
│                             │
│  Step 1: Submitted ✓        │
│  Step 2: L1 Review          │ ◄── Manager approves/rejects
│  Step 3: L2 Approval        │ ◄── Admin approves/rejects
│  Step 4: Generate PO  ✓     │ ◄── Auto-triggered on full approval
└─────────────────────────────┘
      │
      ▼
Purchase Order Auto-Created
  po_number = PO-YYYY-NNNN
  CGST 9% + SGST 9% split from quotation subtotal
      │
      ▼
Invoice Auto-Created alongside PO
  invoice_number = INV-YYYY-NNNN
  due_date = po_date + 30 days
  status = pending_payment
      │
      ▼
Invoice → Download PDF / Email to Vendor / Mark as Paid
      │
      ▼
Activity Log Updated at Every Step
```

---

### RFQ Status Flow

```
Draft ──► Published ──► Closed
  │                       │
  └──► Cancelled          └── (after PO generated)
```

### Quotation Status Flow

```
Draft ──► Submitted ──► Selected ──► (PO Generated)
                   └──► Rejected
```

### Approval Status Flow

```
Pending ──► Step 2 (L1 Manager) ──► Step 3 (L2 Admin) ──► Approved ──► PO Auto-Created
                    │                        │
                    └── Rejected             └── Rejected
                         │                       │
                         └───────────────────────┘
                                    │
                              Approval Rejected
                          Quotation reverted to submitted
```

### Invoice Status Flow

```
pending_payment ──► paid
        │
        └──► overdue  (scheduled job / manual flag)
```

---

### Auto-Number Reference Format

All documents are auto-numbered with year + zero-padded sequence:

```
RFQ-2026-0001   → Request for Quotation
QT-2026-0001    → Quotation
PO-2026-0001    → Purchase Order
INV-2026-0001   → Invoice
```

Format: `<PREFIX>-<YYYY>-<NNNN>` — resets per prefix per year, padded to 4 digits.

---

## Features

### Authentication
- Register with role-based access (admin / manager / procurement_officer / vendor)
- Login with JWT dual-token pattern, access token in memory
- Password strength enforcement — uppercase, number, special character required
- Rate limiting on all auth routes — 10 attempts per 15 minutes

### Dashboard
- Live stat cards — Active RFQs, Pending Approvals, POs This Month (count + value), Overdue Invoices
- Recent purchase orders table (last 5)
- Monthly spending bar chart — last 6 months via Recharts
- Quick action buttons — New RFQ, Add Vendor, View Invoices
- All data from a single `/api/reports/dashboard-stats` call

### Vendor Management
- Full CRUD with GST number validation (Indian GST regex)
- Status management — Active / Pending / Blocked with tab filters and badge counts
- Search by vendor name, GST number, or contact name
- Per-vendor stats — total POs and total spend
- Activity logged on every create/update/status change

### RFQ Management
- Create with dynamic line items (item name, quantity, unit) and vendor assignment
- 3-step creation wizard — details → line items + vendors → attachments
- Auto-generated RFQ number on creation
- Publish flow — status changes to published, vendor assignments set to invited
- Detail view shows line items, assigned vendors, and their quote submission status

### Quotation Submission & Comparison
- Vendors fill unit prices and delivery days per line item
- **All totals calculated server-side** — subtotal, GST amount, grand total
- Vendor assignment status auto-updated to submitted on quote creation
- **Side-by-side comparison table** — Grand Total | GST% | Delivery Days | Vendor Rating | Payment Terms
- Lowest price column highlighted in green
- One click to select a vendor and initiate the approval workflow

### Approval Workflow
- Two-step workflow auto-assigned — L1 to first manager, L2 to admin
- 4-step visual stepper: Submitted → L1 Review → L2 Approval → Generate PO
- Approve/Reject buttons only visible to the assigned approver for the active step
- Approval remarks captured per step with timestamp
- On full approval: PO + Invoice auto-created in a single database transaction
- On any rejection: approval marked rejected, quotation reverted

### Purchase Orders
- Auto-created on full approval — never created manually
- GST split into CGST (9%) + SGST (9%) — Indian standard
- Linked to RFQ, quotation, vendor, and approval for full traceability
- Line items carried over from the approved quotation

### Invoices
- Auto-created alongside the PO
- Due date set to PO date + 30 days
- **PDF download** — professional layout with vendor info, line items, CGST/SGST breakdown, grand total
- **Email to vendor** — HTML email via Nodemailer, Ethereal test account, preview URL returned in response
- **Mark as Paid** — updates status and records paid_at timestamp
- Print support via `window.print()` with CSS media query hiding nav

### Reports & Analytics
- Monthly spending summary — last 6 months bar chart
- Vendor performance table — total POs, total spend, rating per vendor
- Procurement stats — total RFQs, POs, invoice value, active vendor count
- All data served from dedicated `/api/reports/*` endpoints

### Activity Logs
- Every action across all modules logged to `activity_logs` with entity type, entity ID, action description, and JSONB metadata
- Filter by entity type — RFQ, quotation, approval, invoice, vendor
- Timeline view with relative timestamps
- Paginated with load-more

---

## API Endpoints

### AUTH `/api/auth`
```
POST   /register        → Register new user
POST   /login           → Login, returns access + refresh JWT
POST   /refresh         → Refresh access token
POST   /logout          → Invalidate refresh token
```

### USERS `/api/users`
```
GET    /me              → Get own profile (no password)
PATCH  /me              → Update first_name, last_name, phone, country, photo
```

### VENDORS `/api/vendors`
```
GET    /                → List vendors (filter: status, category, search)
POST   /                → Create vendor [admin, procurement_officer]
GET    /:id             → Vendor detail with PO count + total spend
PATCH  /:id             → Update vendor [admin, procurement_officer]
PATCH  /:id/status      → Change status active/pending/blocked [admin, procurement_officer]
```

### RFQs `/api/rfqs`
```
GET    /                → List RFQs (filter: status, created_by, pagination)
POST   /                → Create RFQ with line items + vendor assignments [admin, procurement_officer]
GET    /:id             → RFQ detail with line items + vendor assignments
PATCH  /:id             → Update draft RFQ [admin, procurement_officer]
POST   /:id/publish     → Publish RFQ, invite assigned vendors [admin, procurement_officer]
```

### QUOTATIONS `/api/quotations`
```
GET    /                → List quotations (filter: rfq_id, vendor_id)
POST   /                → Submit quotation with server-side total calculation
GET    /:id             → Quotation detail with line items + vendor + RFQ info
PATCH  /:id             → Update draft quotation
POST   /:id/submit      → Submit quotation (draft → submitted)
```

### APPROVALS `/api/approvals`
```
GET    /                → List all approvals with quotation + vendor + RFQ joined
POST   /                → Initiate approval workflow [admin, procurement_officer, manager]
GET    /:id             → Approval detail with steps + approver info + line items
POST   /:id/steps/:stepId/approve  → Approve a step [admin, manager]
POST   /:id/steps/:stepId/reject   → Reject a step [admin, manager]
```

### PURCHASE ORDERS `/api/purchase-orders`
```
GET    /                → List POs with vendor + RFQ + invoice joined (filter: status)
GET    /:id             → PO detail with line items + vendor + invoice
```

### INVOICES `/api/invoices`
```
GET    /                → List invoices with vendor + PO joined (filter: status)
GET    /:id             → Invoice detail with full line items
PATCH  /:id/mark-paid   → Mark invoice as paid [admin, procurement_officer, manager]
GET    /:id/pdf         → Download invoice as PDF (streamed)
POST   /:id/email       → Email invoice to vendor via Nodemailer
```

### REPORTS `/api/reports`
```
GET    /dashboard-stats     → Stat cards + recent POs for dashboard
GET    /spending-summary    → Monthly spending last 6 months
GET    /vendor-performance  → Per-vendor PO count, spend, rating
GET    /procurement-stats   → Total RFQs, POs, invoice value, active vendors
```

### ACTIVITY `/api/activity`
```
GET    /                → Paginated activity logs (filter: entity_type)
```

---

## Setup & Installation

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14 running locally
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yuggandhii/vendorbridge.git
cd vendorbridge
```

### 2. Setup Backend
```bash
cd server
cp .env.example .env
```

Open `.env` and configure:
```env
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendorbridge
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

```bash
npm install
```

### 3. Create Database
```bash
psql -U postgres -c "CREATE DATABASE vendorbridge;"
```

### 4. Run Migrations
```bash
npm run migrate
```

### 5. Run Seeds (demo data)
```bash
npm run seed
```

### 6. Start Backend
```bash
npm run dev
# Running on http://localhost:3000
```

### 7. Setup Frontend
```bash
cd ../client
npm install
npm run dev
# Running on http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@vendorbridge.com | Password1@ | Full access — all modules including approvals |
| Procurement Officer | procurement@vendorbridge.com | Password1@ | Vendors, RFQs, comparison, invoices |
| Manager | manager@vendorbridge.com | Password1@ | Approve/reject workflow steps, reports |
| Vendor | vendor@vendorbridge.com | Password1@ | Submit quotations only |

---

## Project Structure

```
vendorbridge/
├── client/                          # React 18 + Vite frontend
│   ├── src/
│   │   ├── api/                     # Axios instance + per-module API functions
│   │   ├── components/              # Shared UI — Button, Badge, Table, Modal, Stepper, StatCard
│   │   ├── pages/
│   │   │   ├── auth/                # Login, Register
│   │   │   ├── dashboard/           # Stats cards + spending chart
│   │   │   ├── vendors/             # Vendor list + add modal
│   │   │   ├── rfqs/                # RFQ list + 3-step create wizard
│   │   │   ├── quotations/          # Submit quotation + comparison view
│   │   │   ├── approvals/           # Approval workflow stepper
│   │   │   ├── purchase-orders/     # PO list
│   │   │   ├── invoices/            # Invoice detail + PDF + email
│   │   │   ├── reports/             # Analytics charts
│   │   │   └── activity/            # Activity log timeline
│   │   ├── store/                   # Zustand — auth store (token in memory)
│   │   ├── hooks/                   # Custom React Query hooks per module
│   │   └── App.jsx                  # Routes with ProtectedRoute + role guards
│   └── index.html
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # Knex PostgreSQL connection
│   │   │   └── logger.js            # Winston logger
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verify + requireRole guard
│   │   │   ├── validate.js          # Zod schema middleware
│   │   │   └── errorHandler.js      # Global error handler
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── vendors/
│   │       ├── rfqs/
│   │       ├── quotations/
│   │       ├── approvals/
│   │       ├── purchase-orders/
│   │       ├── invoices/
│   │       ├── reports/
│   │       └── activity/
│   └── app.js
│
├── db/
│   ├── migrations/                  # 13 Knex migrations
│   └── seeds/                       # Full demo seed — users, vendors, RFQs, quotations, approval, PO, invoice
│
├── .env.example
├── knexfile.js
└── package.json
```

---

## Git Workflow

```
main      ← production ready, final hackathon submission
dev       ← active development branch
feature/* ← individual features merged into dev via PR
```

Commit convention used throughout:

```
feat(vendors): add GST validation and status filter
feat(approvals): auto-create PO on full approval
fix(quotations): server-side total rounding
chore(db): add index on activity_logs entity_type
docs(readme): add full API reference
refactor(auth): extract requireRole to separate middleware
```

---

## Security Highlights

- Passwords hashed with **bcrypt** (salt rounds 12) — plaintext never stored or logged
- JWT access token lives in **Zustand memory only** — never localStorage, never sessionStorage
- **Rate limiter** on auth routes — 10 requests per 15 minutes per IP
- **Helmet.js** security headers on all responses (XSS, CSRF, clickjacking protection)
- **CORS** restricted to `http://localhost:5173` only
- All inputs validated with **Zod** before any DB query runs
- Passwords never returned in any API response — explicitly excluded in every select
- **Role-based access** enforced server-side on every sensitive route — frontend role checks are UI-only
- SQL injection impossible — all queries use **Knex parameterized bindings**
- Approval step actions verify `req.user.id === step.approver_id` — cannot approve another user's step

---

## Key Design Decisions

**Why totals are calculated server-side**: Unit prices and quantities come from the client but grand totals, GST amounts, and subtotals are always computed on the server. This prevents price manipulation where a malicious client could submit a ₹0 grand total for a ₹2,50,000 order.

**Why PO and Invoice are auto-created**: Once an approval is fully approved there is no ambiguity — a PO must exist. Making it automatic inside the same database transaction as the final approval step ensures the system is never in an inconsistent state (approval approved but no PO).

**Why approval steps use a separate table**: Having `approval_steps` as rows (not columns on `approvals`) means the number of steps can change without a schema migration, each step has its own timestamps and remarks, and querying "which approvals need my action" is a simple `WHERE approver_id = ? AND status = 'pending'`.

**Why activity logs use JSONB metadata**: Different actions have different context — a vendor status change logs old and new status, a PO creation logs PO number and amount, a quotation submission logs grand total. JSONB lets each log entry carry whatever metadata is relevant without requiring separate columns for every event type.
## 👨‍💻 Contributors

<p align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <img src="https://avatars.githubusercontent.com/yuggandhii?s=120" width="100px;" height="100px;" style="border-radius:50%" alt="Yug"/><br/>
        <strong>🗄️ Backend & Database</strong><br/>
        <strong>Yug Gandhi</strong><br/>
        <a href="https://github.com/yuggandhii">🌐 GitHub</a>
      </td>
      <td align="center" width="33%">
        <img src="https://avatars.githubusercontent.com/kushagra269?s=120" width="100px;" height="100px;" style="border-radius:50%" alt="Kushagra"/><br/>
        <strong>🎨 Frontend & React Vite</strong><br/>
        <strong>Kushagra Mali</strong><br/>
        <a href="https://github.com/kushagra269">🌐 GitHub</a>
      </td>
      <td align="center" width="33%">
        <img src="https://avatars.githubusercontent.com/Chaos05811?s=120" width="100px;" height="100px;" style="border-radius:50%" alt="Jaypalsinh"/><br/>
        <strong>🔗 Routes & Integrations</strong><br/>
        <strong>Jaypalsinh Chavda</strong><br/>
        <a href="https://github.com/Chaos05811">🌐 GitHub</a>
      </td>
    </tr>
  </table>
</p>
