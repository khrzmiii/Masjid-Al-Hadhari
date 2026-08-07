const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres' });
async function test() {
  try {
    const id = require('crypto').randomUUID();
    await pool.query('INSERT INTO events (id, title, description, image_url, event_date, venue) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, 'Test Event', null, null, '2026-08-07T12:00', null]
    );
    console.log('Insert success');
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
  } catch(e) { console.error('Insert failed:', e.message); }
  
  try {
    const id = require('crypto').randomUUID();
    await pool.query('INSERT INTO inventory_loans (id, inventory_id, borrower_name, borrower_phone, quantity) VALUES ($1, $2, $3, $4, $5)',
      [id, '1', 'Test Borrower', null, 1] // assumes inventory_id '1' exists. If not, it will throw FK error, which is expected.
    );
    console.log('Loan success');
  } catch(e) { console.error('Loan failed:', e.message); }

  process.exit(0);
}
test();
