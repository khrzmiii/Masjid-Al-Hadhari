import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function deleteSuperAdmin() {
  const db = await open({
    filename: path.join(__dirname, '..', 'masjid.db'),
    driver: sqlite3.Database
  });

  await db.run(`DELETE FROM users WHERE email = 'superadmin@alhadhari.com'`);
  console.log('Successfully deleted superadmin@alhadhari.com');
}

deleteSuperAdmin().catch(console.error);
