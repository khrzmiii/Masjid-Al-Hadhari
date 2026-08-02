const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'masjid.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_loans (
      id TEXT PRIMARY KEY,
      inventory_id TEXT NOT NULL,
      borrower_name TEXT NOT NULL,
      borrower_phone TEXT,
      quantity INTEGER NOT NULL,
      borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      return_date DATETIME,
      status TEXT DEFAULT 'dipinjam',
      FOREIGN KEY (inventory_id) REFERENCES inventory(id)
    )
  `);
  console.log("Table inventory_loans created successfully.");
});

db.close();
