const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS last_modified_by TEXT");
    console.log("Added last_modified_by to transactions");
  } catch (e) {
    console.log("Error transactions:", e.message);
  }
  
  try {
    await pool.query("ALTER TABLE events ADD COLUMN IF NOT EXISTS last_modified_by TEXT");
    console.log("Added last_modified_by to events");
  } catch (e) {
    console.log("Error events:", e.message);
  }
  
  try {
    await pool.query("ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_modified_by TEXT");
    console.log("Added last_modified_by to inventory");
  } catch (e) {
    console.log("Error inventory:", e.message);
  }
  
  pool.end();
}

run();
