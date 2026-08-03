import { getDb } from './db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const runMigrations = async () => {
  console.log('Starting SQLite database migrations...');
  
  try {
    const db = await getDb();
    
    // 1. Identity
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'public',
        auth_provider TEXT DEFAULT 'local',
        google_id TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Announcements & Content
    await db.exec(`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT DEFAULT 'normal',
        link TEXT,
        status TEXT DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Finance (Ledger, Transactions)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        account_code TEXT,
        amount NUMERIC NOT NULL,
        type TEXT NOT NULL,
        payment_method TEXT DEFAULT 'lain-lain',
        category TEXT DEFAULT 'lain-lain',
        description TEXT,
        status TEXT DEFAULT 'draft',
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(account_code) REFERENCES accounts(code)
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        file_name TEXT,
        mime_type TEXT,
        data BYTEA,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Events
    await db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        event_date TIMESTAMP NOT NULL,
        venue TEXT,
        status TEXT DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS event_participants (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(event_id, user_id)
      );
    `);

    // 5. Logistics (Inventory)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        item_name TEXT NOT NULL,
        quantity INT DEFAULT 0,
        condition TEXT DEFAULT 'baik',
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.exec(`
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
    `);

    // 6. Form Submissions (Public e-forms)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id TEXT PRIMARY KEY,
        form_type TEXT NOT NULL,
        submitter_name TEXT NOT NULL,
        submitter_email TEXT,
        submitter_phone TEXT,
        details TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed some initial data
    const existingCount = await db.get(`SELECT COUNT(*) as count FROM announcements`);
    if (existingCount.count === 0) {
      await db.run(`
        INSERT INTO announcements (id, title, message, severity, link) 
        VALUES (
          'a1', 
          'Gotong-Royong Perdana', 
          'Program Gotong-Royong membersihkan kawasan masjid akan diadakan pada hari Sabtu ini jam 8:00 pagi. Semua dijemput hadir.', 
          'important', 
          '/aktiviti'
        )
      `);
      console.log('Seeded initial announcement.');
    }

    const adminCount = await db.get(`SELECT COUNT(*) as count FROM users WHERE email = 'admin@alhadhari.com'`);
    if (adminCount.count === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.run(`
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (?, 'Pengerusi Masjid', 'admin@alhadhari.com', ?, 'admin')
      `, [randomUUID(), hash]);
      console.log('Seeded default admin user.');
    }

    const superAdminCount = await db.get(`SELECT COUNT(*) as count FROM users WHERE email = 'superadmin@alhadhari.com'`);
    if (superAdminCount.count === 0) {
      const hash = await bcrypt.hash('super123', 10);
      await db.run(`
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (?, 'Super Admin', 'superadmin@alhadhari.com', ?, 'super_admin')
      `, [randomUUID(), hash]);
      console.log('Seeded default super admin user.');
    }

    const accountsCount = await db.get(`SELECT COUNT(*) as count FROM accounts`);
    if (accountsCount.count === 0) {
      await db.run(`
        INSERT INTO accounts (code, name, type) VALUES
        ('IN-JUM', 'Kutipan Tabung Jumaat', 'income'),
        ('IN-AM', 'Sumbangan Am / Derma', 'income'),
        ('OUT-UTI', 'Perbelanjaan Utiliti (Air/Elektrik)', 'expense'),
        ('OUT-PENG', 'Perbelanjaan Pengurusan / Gaji', 'expense')
      `);
      console.log('Seeded default financial accounts.');
    }

    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Error running migrations:', err);
  }
};

runMigrations();
