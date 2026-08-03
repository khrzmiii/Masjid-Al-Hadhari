const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.dzigxrpatdpddgrzylvq:Alhadhari2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres',
});

async function seedAccounts() {
  const accounts = [
    { code: 'INC-JUMAAT', name: 'Kutipan Tabung Jumaat', type: 'income' },
    { code: 'INC-SUMBANGAN', name: 'Sumbangan Awam (Bank)', type: 'income' },
    { code: 'INC-SEWA', name: 'Sewaan Fasiliti Masjid', type: 'income' },
    { code: 'EXP-UTILITI', name: 'Bil Utiliti (Air/Elektrik)', type: 'expense' },
    { code: 'EXP-SELENGGARA', name: 'Penyelenggaraan & Pembaikan', type: 'expense' },
    { code: 'EXP-PENCERAMAH', name: 'Saguhati Penceramah/Imam', type: 'expense' },
    { code: 'EXP-PROGRAM', name: 'Program & Aktiviti Masjid', type: 'expense' }
  ];

  try {
    for (const acc of accounts) {
      await pool.query(
        'INSERT INTO accounts (code, name, type) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
        [acc.code, acc.name, acc.type]
      );
    }
    console.log('Successfully seeded default accounts.');
  } catch (err) {
    console.error('Error seeding accounts:', err);
  } finally {
    pool.end();
  }
}

seedAccounts();
