// knexfile.js
// Loads DATABASE_URL from database-tools/.env (or process env).
require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: __dirname + '/migrations',
      tableName: 'knex_migrations',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: __dirname + '/migrations',
      tableName: 'knex_migrations',
    },
  },
};