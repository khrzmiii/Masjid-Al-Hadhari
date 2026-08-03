const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres',
});

async function setSuperAdmin() {
  try {
    const targetEmail = 'ahmdkhrzme3128@gmail.com';
    
    // Set ALL users to 'public' first to ensure ONLY ONE super_admin exists
    await pool.query('UPDATE users SET role = $1', ['public']);
    console.log('All users reset to public.');

    // Set the specific user to 'super_admin'
    const res = await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['super_admin', targetEmail]);
    
    if (res.rowCount > 0) {
      console.log(`Successfully set ${targetEmail} as SUPER ADMIN.`);
    } else {
      console.log(`User ${targetEmail} not found in the database. Please make sure you have registered/logged in at least once.`);
    }
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    pool.end();
  }
}

setSuperAdmin();
