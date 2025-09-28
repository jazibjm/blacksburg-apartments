import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';


const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS apartments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        rent TEXT,
        status TEXT
      );
    `);

    // Insert a test row
    await pool.query(
      "INSERT INTO apartments (name, rent, status) VALUES ('Test Apartment', '$1200', 'Available')"
    );

    console.log('✅ Test row inserted successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ DB insert error:', err);
    process.exit(1);
  }
})();
