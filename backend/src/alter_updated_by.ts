import { getDb } from './db';

const alterTables = async () => {
  console.log('Adding updated_by column to existing tables...');
  try {
    const db = await getDb();
    
    // Attempt to add column to events
    try {
      await db.exec(`ALTER TABLE events ADD COLUMN updated_by TEXT;`);
      console.log('Added updated_by to events');
    } catch (e: any) {
      console.log('Notice for events:', e.message);
    }

    // Attempt to add column to transactions
    try {
      await db.exec(`ALTER TABLE transactions ADD COLUMN updated_by TEXT;`);
      console.log('Added updated_by to transactions');
    } catch (e: any) {
      console.log('Notice for transactions:', e.message);
    }

    // Attempt to add column to inventory
    try {
      await db.exec(`ALTER TABLE inventory ADD COLUMN updated_by TEXT;`);
      console.log('Added updated_by to inventory');
    } catch (e: any) {
      console.log('Notice for inventory:', e.message);
    }

    // Attempt to add column to inventory_loans
    try {
      await db.exec(`ALTER TABLE inventory_loans ADD COLUMN updated_by TEXT;`);
      console.log('Added updated_by to inventory_loans');
    } catch (e: any) {
      console.log('Notice for inventory_loans:', e.message);
    }

    console.log('Alteration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
};

alterTables();
