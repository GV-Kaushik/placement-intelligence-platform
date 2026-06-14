import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

// Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDb = async () => {
  try {
    console.log('Starting database initialization...');

    // 1. Read DDL Schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema DDL from: ${schemaPath}`);
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    // 2. Execute Schema queries
    console.log('Executing schema DDL...');
    await pool.query(schemaSql);
    console.log('Database tables created successfully.');

    // 3. Read Seed file
    const seedPath = path.join(__dirname, 'seed.sql');
    console.log(`Reading seed data from: ${seedPath}`);
    const seedSql = await fs.readFile(seedPath, 'utf8');

    // 4. Execute Seed queries
    console.log('Inserting seed data...');
    await pool.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    console.error('\nPlease check:');
    console.error('1. Have you created the database "placementor_ai" in pgAdmin/PostgreSQL?');
    console.error('2. Is your PostgreSQL password correct in backend/.env?');
    console.error('3. Is your PostgreSQL service active on port 5432?');
  } finally {
    // Close the connection pool
    await pool.end();
    console.log('Database pool connection closed.');
  }
};

initDb();
