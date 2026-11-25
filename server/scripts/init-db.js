// Creates every table in an EMPTY database and loads the demo data.
// Usage (from server/, with DATABASE_URL or DB_* set in .env): npm run db:init
// schema.sql drops and recreates all tables, so never run this against a database you want to keep.
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const FILES = ['schema.sql', 'seed.sql'];

async function main() {
  for (const file of FILES) {
    const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', file), 'utf8');
    await pool.query(sql);
    console.log(`Ran database/${file}`);
  }
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM shift_managers');
  console.log(`Done: ${rows[0].n} shift managers in the database.`);
}

main()
  .catch((err) => {
    console.error('Database setup failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
