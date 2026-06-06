require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'vendorbridge',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'vendor123',
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
    pool: { min: 2, max: 10 },
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      ssl: { rejectUnauthorized: false },
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
    pool: { min: 2, max: 10 },
  },
};
