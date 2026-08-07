const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres' });

async function migrateAccounts() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Insert the two new accounts
    await client.query(`
      INSERT INTO accounts (code, name, type) 
      VALUES ('BANK', 'Duit Dalam Bank', 'both'), ('TUNAI', 'Pegangan (Tunai)', 'both')
      ON CONFLICT (code) DO NOTHING;
    `);

    // 2. Update existing transactions to use 'BANK' (just as a default so we can safely delete old accounts)
    await client.query(`
      UPDATE transactions SET account_code = 'BANK' WHERE account_code NOT IN ('BANK', 'TUNAI');
    `);

    // 3. Delete old accounts
    await client.query(`
      DELETE FROM accounts WHERE code NOT IN ('BANK', 'TUNAI');
    `);

    await client.query('COMMIT');
    console.log('Successfully migrated accounts!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.log('ERROR:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrateAccounts();
