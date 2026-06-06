const logger = require('./logger');

/**
 * Centralized error handler — must be the last app.use() in app.js.
 * Catches errors passed via next(err) from any route or middleware.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log full error internallly
  logger.error(`${req.method} ${req.path} → ${err.message}`, { stack: err.stack });

  // Knex / PostgreSQL constraint errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error:   'Duplicate entry — a record with this value already exists.',
      field:   err.constraint || null,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
    });
  }

  // JWT errors (also handled in auth middleware, but as a safety net)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired.' });
  }

  // Generic fallback
  const statusCode = err.statusCode || err.status || 500;
  const message    = statusCode < 500 ? err.message : 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    error:   message,
    // Only expose stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
