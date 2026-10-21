import { getDb } from './db';

async function run() {
  const db = await getDb();
  console.log('Opened database.');
  
  try {
    await db.run(`ALTER TABLE transactions ADD COLUMN updated_at TIMESTAMP`);
    console.log('Successfully added updated_at to transactions table.');
  } catch (err: any) {
    if (String(err).includes('duplicate column name') || String(err).includes('already exists')) {
      console.log('updated_at column already exists in transactions table.');
    } else {
      console.error('Error adding updated_at to transactions table:', err);
    }
  }

  // Assuming getDb() returns a pool or client, wait a moment before exiting if needed, or if SQLite, db.close() isn't strictly exported on getDb wrapper.
  console.log('Migration finished. Exiting...');
  process.exit(0);
}

run().catch(console.error);
