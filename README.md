# VendorBridge Frontend

Frontend-only React/Vite implementation for the VendorBridge procurement hackathon project.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Backend integration

The UI is mock-powered by default so the screens work immediately.

1. Copy `.env.example` to `.env`
2. Set `VITE_USE_MOCKS=false`
3. Point `VITE_API_URL` to your backend, for example `http://localhost:3000/api`

## Screens included

- Login
- Registration
- Dashboard
- Vendors
- Create RFQ
- Submit Quotation
- Quotation Comparison
- Approval Workflow
- Purchase Order & Invoice
- Activity & Logs
- Reports & Analytics
- Account
- Settings & Team Management
