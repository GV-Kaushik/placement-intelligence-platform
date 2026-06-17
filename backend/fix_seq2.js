import pool from './config/db.js';

async function run() {
  try {
    await pool.query("SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));");
    console.log("Sequence fixed!");
  } catch (err) {
    console.error("DB ERROR:", err.message);
  } finally {
    pool.end();
  }
}
run();
