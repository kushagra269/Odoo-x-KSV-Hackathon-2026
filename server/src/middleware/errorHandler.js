const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  // Knex / PostgreSQL known errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
      field: err.detail,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
