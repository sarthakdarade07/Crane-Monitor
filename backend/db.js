require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        crane_id VARCHAR(50),
        ts TIMESTAMPTZ,
        load_kg REAL,
        motor_temp_c REAL,
        vibration_mm_s REAL,
        status VARCHAR(50)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        crane_id VARCHAR(50),
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'viewer'
      );
    `);

    // Add is_blocked column if it doesn't exist
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
    `);

    // Seed admin user
    const { rows: adminRows } = await client.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminRows.length === 0) {
      console.log('Seeding admin user...');
      const adminHash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['admin', adminHash, 'admin']
      );
    }

    // Seed staff user
    const { rows: staffRows } = await client.query("SELECT * FROM users WHERE username = 'staff'");
    if (staffRows.length === 0) {
      console.log('Seeding staff user...');
      const staffHash = await bcrypt.hash('staff123', 10);
      await client.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['staff', staffHash, 'staff']
      );
    }

    // Check if readings table is empty
    const { rows } = await client.query('SELECT COUNT(*) FROM readings;');
    const count = parseInt(rows[0].count, 10);

    if (count === 0) {
      console.log('Database empty, seeding data...');
      const seedFilePath = path.join(__dirname, '../database/readings_seed.json');
      if (fs.existsSync(seedFilePath)) {
        const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));
        
        // Batch insert in chunks of 1000
        const chunkSize = 1000;
        for (let i = 0; i < seedData.length; i += chunkSize) {
          const chunk = seedData.slice(i, i + chunkSize);
          const values = [];
          const placeholders = [];
          let paramIndex = 1;

          chunk.forEach(record => {
            values.push(
              record.crane_id, 
              record.ts, 
              record.load_kg, 
              record.motor_temp_c, 
              record.vibration_mm_s, 
              record.status
            );
            placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          });

          const query = `
            INSERT INTO readings (crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status)
            VALUES ${placeholders.join(', ')}
          `;
          await client.query(query, values);
        }
        console.log(`Seeded ${seedData.length} records.`);
      } else {
        console.log('Seed file not found at:', seedFilePath);
      }
    } else {
      console.log(`Database already seeded with ${count} records.`);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database', e);
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDB,
};
