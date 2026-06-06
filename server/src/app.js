const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS — only allow Vite dev server
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter (100 req / 15 min)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// Request logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'VendorBridge API is running', env: process.env.NODE_ENV });
});

// ── Routes (uncomment as each step is completed) ──
app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/users', require('./modules/users/routes'));
app.use('/api/vendors', require('./modules/vendors/routes'));
app.use('/api/rfqs', require('./modules/rfqs/routes'));
app.use('/api/quotations', require('./modules/quotations/routes'));
app.use('/api/approvals', require('./modules/approvals/routes'));
app.use('/api/purchase-orders', require('./modules/purchase-orders/routes'));
app.use('/api/invoices', require('./modules/invoices/routes'));
app.use('/api/reports', require('./modules/reports/routes'));
app.use('/api/activity', require('./modules/activity/routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
