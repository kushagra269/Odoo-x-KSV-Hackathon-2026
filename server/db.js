const knex = require('knex');
const knexConfig = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexConfig[env];

const db = knex(config);

// Verify connection on startup
db.raw('SELECT 1')
  .then(() => {
    const logger = require('./logger');
    logger.info(`Database connected [${env}] → ${config.connection.database}@${config.connection.host}:${config.connection.port}`);
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = db;
