const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres' });
const JWT_SECRET = process.env.JWT_SECRET || 'rahsia_masjid_123';

async function run() {
  const userRes = await pool.query("SELECT * FROM users WHERE role = 'super_admin' LIMIT 1");
  const user = userRes.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://masjid-al-hadhari.onrender.com/api/v1/admin/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      title: 'KENDURI ARWAH & KENDURI KESYUKURAN',
      description: 'Muslimin & Muslimat dijemput hadir untuk bersama-sama mengimarahkan majlis ini dengan bacaan doa, tahlil, dan menikmati jamuan yang disediakan.',
      image_url: '/uploads/some-fake-url.jpeg',
      event_date: '2026-08-08T18:30',
      venue: 'Masjid Al-Hadhari, Kg.Masolog'
    })
  });
  console.log('STATUS:', res.status);
  const data = await res.text();
  console.log('RESPONSE:', data);
  process.exit(0);
}
run();
