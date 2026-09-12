// knexfile.js
// Loads DATABASE_URL from database-tools/.env (or process env).
// Routes all queries to the 'jobtracker' schema inside the database.
require('dotenv').config();

const makeConfig = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, done) => {
      conn.query('SET search_path TO jobtracker', (err) => done(err, conn));
    },
  },
  migrations: {
    directory: __dirname + '/migrations',
    tableName: 'knex_migrations',
  },
};

module.exports = {
  development: { ...makeConfig },
  production: { ...makeConfig },
};