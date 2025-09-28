import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTable = `
CREATE TABLE IF NOT EXISTS apartments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rent TEXT,
  status TEXT
);
`;

(async () => {
  try {
    await pool.query(createTable);
    console.log('✅ Apartments table created or already exists.');
    process.exit(0);
  } catch (err) {
    console.error('❌ DB init error:', err);
    process.exit(1);
  }
})();
