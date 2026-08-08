const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'src', 'masjid.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE transactions ADD COLUMN last_modified_by TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('last_modified_by already exists in transactions');
      } else {
        console.error('Error adding last_modified_by to transactions:', err.message);
      }
    } else {
      console.log('Added last_modified_by to transactions');
    }
  });

  db.run("ALTER TABLE events ADD COLUMN last_modified_by TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('last_modified_by already exists in events');
      } else {
        console.error('Error adding last_modified_by to events:', err.message);
      }
    } else {
      console.log('Added last_modified_by to events');
    }
  });

  db.run("ALTER TABLE inventory ADD COLUMN last_modified_by TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('last_modified_by already exists in inventory');
      } else {
        console.error('Error adding last_modified_by to inventory:', err.message);
      }
    } else {
      console.log('Added last_modified_by to inventory');
    }
  });
});

db.close();
