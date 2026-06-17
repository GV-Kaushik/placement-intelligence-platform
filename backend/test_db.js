import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    // get user
    const userRes = await pool.query("SELECT id FROM users LIMIT 1");
    const userId = userRes.rows[0].id;

    // company
    const companyRes = await pool.query("SELECT id FROM companies WHERE name ILIKE 'Oracle'");
    let compId;
    if (companyRes.rows.length > 0) {
      compId = companyRes.rows[0].id;
    } else {
      const newComp = await pool.query("INSERT INTO companies (name) VALUES ('Oracle') RETURNING id");
      compId = newComp.rows[0].id;
    }

    const rounds = JSON.stringify([{"round_name":"OA", "content":"good"}]);
    const questions = '[]';

    const insertQuery = `
      INSERT INTO experiences 
        (user_id, company_id, role, result, rounds, questions)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const res = await pool.query(insertQuery, [userId, compId, 'SDE', 'Selected', rounds, questions]);
    console.log("SUCCESS:", res.rows);
  } catch (err) {
    console.error("DB ERROR:", err.message);
  } finally {
    pool.end();
  }
}
run();
