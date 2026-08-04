const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres' });
pool.query(`
CREATE TABLE IF NOT EXISTS inventory_loans (
    id TEXT PRIMARY KEY,
    inventory_id TEXT NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_phone TEXT,
    quantity INT NOT NULL,
    status TEXT DEFAULT 'dipinjam',
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);
`).then(() => {
    console.log('Table created');
    pool.end();
}).catch(console.error);
