import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

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
