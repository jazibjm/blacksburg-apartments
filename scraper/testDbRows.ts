// scraper/src/testDbRows.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const res = await pool.query('SELECT * FROM apartments');
  console.log('Current apartments:', res.rows);
  process.exit(0);
})();
