const { Pool } = require('pg');

const connectionString = "postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("UPDATE users SET role = 'super_admin'");
    console.log(`Updated ${res.rowCount} users to super_admin.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
