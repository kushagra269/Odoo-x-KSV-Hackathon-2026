require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const logger     = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parser ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Global rate limiter ─────────────────────────────────────────────────────
// Stricter limiter for auth routes is applied inside auth/routes.js
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests, please try again later.' },
}));

// ─── Request logger (dev) ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'VendorBridge API', version: '1.0.0' });
});

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes (mounted as steps are completed) ─────────────────────────────
app.use('/api/auth',            require('./modules/auth/routes'));
app.use('/api/users',           require('./modules/users/routes'));
app.use('/api/vendors',         require('./modules/vendors/routes'));
app.use('/api/rfqs',            require('./modules/rfqs/routes'));
app.use('/api/quotations',      require('./modules/quotations/routes'));
app.use('/api/approvals',       require('./modules/approvals/routes'));
app.use('/api/purchase-orders', require('./modules/purchase-orders/routes'));
app.use('/api/invoices',        require('./modules/invoices/routes'));
app.use('/api/reports',         require('./modules/reports/routes'));
app.use('/api/activity',        require('./modules/activity/routes'));

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ─── Centralized error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
