const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres',
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        file_name TEXT,
        mime_type TEXT,
        data BYTEA,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('receipts table created.');

    await pool.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
    `);
    console.log('receipt_url added to transactions.');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
