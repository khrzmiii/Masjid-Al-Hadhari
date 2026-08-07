const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres' });
const JWT_SECRET = process.env.JWT_SECRET || 'rahsia_masjid_123';
const fs = require('fs');
const FormData = require('form-data');

async function run() {
  const userRes = await pool.query("SELECT * FROM users WHERE role = 'super_admin' LIMIT 1");
  const user = userRes.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

  const fetch = (await import('node-fetch')).default;
  const formData = new FormData();
  fs.writeFileSync('test.jpg', 'fake image content');
  formData.append('image', fs.createReadStream('test.jpg'));

  const res = await fetch('https://masjid-al-hadhari.onrender.com/api/v1/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      ...formData.getHeaders()
    },
    body: formData
  });
  console.log('UPLOAD STATUS:', res.status);
  const data = await res.text();
  console.log('UPLOAD RESPONSE:', data);
  process.exit(0);
}
run();
