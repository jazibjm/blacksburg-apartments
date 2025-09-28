// backend/src/services/testDb.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query('SELECT * FROM apartments');
    console.log('DB rows:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('DB error:', err);
    process.exit(1);
  }
})();
