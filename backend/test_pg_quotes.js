const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres' });
pool.query('SELECT * FROM events WHERE status = "published" ORDER BY event_date ASC')
  .then(res => console.log(res.rows))
  .catch(err => console.log('ERROR:', err.message))
  .finally(() => pool.end());
