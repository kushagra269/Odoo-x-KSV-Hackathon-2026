require('dotenv').config();

/** @type {import('knex').Knex.Config} */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST     || 'localhost',
      port:     Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'vendorbridge',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASS     || 'postgres',
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
    // Log queries in development
    debug: false,
  },

  production: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST,
      port:     Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASS,
      ssl:      { rejectUnauthorized: false },
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
    pool: { min: 2, max: 10 },
  },
};
