import pool from './db.ts';

async function createApartmentsTable() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS apartments;
      CREATE TABLE apartments (
        id SERIAL PRIMARY KEY,
        name TEXT,
        address TEXT,
        price TEXT,
        beds TEXT,
        amenities TEXT,
        image_url TEXT,
        url TEXT UNIQUE
      );
    `);
    console.log('✅ Apartments table created successfully!');
  } catch (err) {
    console.error('❌ Table creation error:', err);
  } finally {
    await pool.end();
  }
}

createApartmentsTable();
