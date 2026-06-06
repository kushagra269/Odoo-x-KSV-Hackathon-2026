require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/config/logger');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    // Test DB connection
    await db.raw('SELECT 1');
    logger.info('‚úÖ Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`Ì∫Ä VendorBridge API running on http://localhost:${PORT}`);
      logger.info(`Ì≥¶ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('‚ùå Failed to start server:', err);
    process.exit(1);
  }
};

start();
