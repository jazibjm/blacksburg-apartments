import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTable = `
CREATE TABLE IF NOT EXISTS apartments (
  id SERIAL PRIMARY KEY
);

ALTER TABLE apartments ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS beds TEXT;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS amenities TEXT;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS summary TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS apartments_url_unique ON apartments (url);
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
