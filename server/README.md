# VendorBridge

Procurement & Vendor Management ERP — Odoo Hiring Hackathon

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| State | Zustand |
| Server state | React Query |
| Forms | React Hook Form + Zod |
| HTTP client | Axios |
| Backend | Node.js + Express |
| Validation | Zod |
| Auth | JWT (access 15m + refresh 7d) |
| Password | bcryptjs (rounds: 12) |
| Database | PostgreSQL |
| Query builder | Knex.js |
| Logging | Winston |
| Security | Helmet + CORS + Rate Limiter |

## Project Structure

```
vendorbridge/
├── client/        # React 18 + Vite frontend
├── server/        # Node.js + Express backend
│   ├── db/        # Knex migrations + seeds
│   └── src/
│       ├── config/       # db, logger
│       ├── middleware/   # authenticate, authorize, validate, errorHandler
│       └── modules/      # auth, vendors, rfqs, quotations, approvals, purchase-orders, invoices, reports, activity
└── package.json   # Root dev scripts
```

## Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd vendorbridge

# Root dev tooling
npm install

# Server dependencies
cd server && npm install
```

### 2. Create PostgreSQL database

```bash
psql -U postgres
CREATE DATABASE vendorbridge;
\q
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
# Edit server/.env with your DB credentials and JWT secrets
```

### 4. Run database migrations

```bash
cd server
npx knex migrate:latest
```

### 5. Seed development data

```bash
npx knex seed:run
```

### 6. Start development servers

```bash
# From root — starts both client and server
npm run dev

# Or separately:
npm run dev:server
npm run dev:client
```

Server runs on `http://localhost:3000`  
Client runs on `http://localhost:5173`

## API Base URL

```
http://localhost:3000/api
```

All responses follow this shape:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "...", "errors": [...] }
```

## User Roles

| Role | Permissions |
|---|---|
| `admin` | Full access |
| `procurement_officer` | Create RFQs, manage vendors, generate POs/invoices |
| `manager` | Approve/reject procurement workflows |
| `vendor` | Submit quotations, view own POs |

## Core Workflow

```
RFQ Created → Vendors Invited → Vendors Submit Quotes
→ Officer Compares Quotes → Approval Workflow (L1 + L2)
→ PO Auto-Generated → Invoice Auto-Generated
→ Invoice Emailed / Downloaded as PDF
→ All Actions Logged in Activity Logs
```

## Team

- [Add team members here]
