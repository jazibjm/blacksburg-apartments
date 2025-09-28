import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query('SELECT 1');
    console.log('✅ DB connected:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ DB connection error:', err);
    process.exit(1);
  }
})();
