import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let pool: Pool | null = null;

export const getDb = async () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/masjid',
    });
  }

  // Wrapper to convert SQLite '?' to Postgres '$1, $2'
  const convertQuery = (sql: string) => {
    let count = 1;
    return sql.replace(/\?/g, () => `$${count++}`);
  };

  return {
    get: async (sql: string, params: any[] = []) => {
      const res = await pool!.query(convertQuery(sql), params);
      return res.rows[0];
    },
    all: async (sql: string, params: any[] = []) => {
      const res = await pool!.query(convertQuery(sql), params);
      return res.rows;
    },
    run: async (sql: string, params: any[] = []) => {
      const res = await pool!.query(convertQuery(sql), params);
      return res; // Minimal mock, might need to adjust if server.ts relies on 'lastID' etc.
    },
    exec: async (sql: string) => {
      await pool!.query(sql); // Exec usually doesn't have params
    }
  };
};
