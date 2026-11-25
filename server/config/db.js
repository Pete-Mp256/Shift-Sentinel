const { Pool, types } = require('pg');
require('dotenv').config();

// DATE -> 'YYYY-MM-DD' string (the default JS Date shifts it by the server's UTC offset).
types.setTypeParser(types.builtins.DATE, (value) => value);
// NUMERIC -> number (values here are small: scores, temperatures, hours).
types.setTypeParser(types.builtins.NUMERIC, (value) => (value === null ? null : parseFloat(value)));

// Hosted databases (Neon, Render) give one DATABASE_URL and need SSL; local development uses the DB_* values.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        max: 5,
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = pool;
