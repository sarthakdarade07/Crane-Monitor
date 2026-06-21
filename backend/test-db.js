require('dotenv').config();
const { pool } = require('./db');

async function test() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables found:", res.rows.map(r => r.table_name));

    const countRes = await pool.query('SELECT COUNT(*) FROM readings');
    console.log("Readings count:", countRes.rows[0].count);
    
    // Test the problematic query
    const latestRes = await pool.query(`
      SELECT DISTINCT ON (crane_id) *
      FROM readings
      ORDER BY crane_id, ts DESC;
    `);
    console.log("Latest readings working!");

  } catch(e) {
    console.error("Test failed:", e);
  } finally {
    pool.end();
  }
}
test();
