import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });

export async function initTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rapbm_items (
        id TEXT PRIMARY KEY,
        tahun_ajaran TEXT NOT NULL,
        type TEXT NOT NULL,
        category_code TEXT NOT NULL,
        category_name TEXT NOT NULL,
        no_urut TEXT NOT NULL,
        no_kode TEXT NOT NULL,
        uraian TEXT NOT NULL,
        jumlah_anggaran INTEGER NOT NULL DEFAULT 0,
        realita INTEGER NOT NULL DEFAULT 0,
        persentase INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        tahun_ajaran TEXT,
        date_gregorian TEXT NOT NULL,
        date_hijri TEXT NOT NULL,
        type TEXT NOT NULL,
        rapbm_code TEXT,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        recorded_by TEXT NOT NULL,
        receipt_number TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        nip_nu TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        jam_mengajar INTEGER NOT NULL DEFAULT 0,
        tarif_per_jam INTEGER NOT NULL DEFAULT 0,
        tunjangan_jabatan INTEGER NOT NULL DEFAULT 0,
        tunjangan_masa_kerja INTEGER NOT NULL DEFAULT 0,
        tunjangan_kehadiran INTEGER NOT NULL DEFAULT 0,
        potongan_infaq INTEGER NOT NULL DEFAULT 0,
        potongan_tabungan INTEGER NOT NULL DEFAULT 0,
        bank_account TEXT,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payroll_records (
        id TEXT PRIMARY KEY,
        tahun_ajaran TEXT,
        teacher_id TEXT NOT NULL,
        teacher_name TEXT NOT NULL,
        nip_nu TEXT NOT NULL,
        role TEXT NOT NULL,
        month_hijri TEXT NOT NULL,
        month_gregorian TEXT NOT NULL,
        date_generated_hijri TEXT NOT NULL,
        date_generated_gregorian TEXT NOT NULL,
        jam_mengajar INTEGER NOT NULL DEFAULT 0,
        bisyaroh_pokok INTEGER NOT NULL DEFAULT 0,
        tunjangan_guru INTEGER NOT NULL DEFAULT 0,
        tunjangan_lain INTEGER NOT NULL DEFAULT 0,
        total_gaji_kotor INTEGER NOT NULL DEFAULT 0,
        potongan_infaq INTEGER NOT NULL DEFAULT 0,
        potongan_tabungan INTEGER NOT NULL DEFAULT 0,
        potongan_lain INTEGER NOT NULL DEFAULT 0,
        total_potongan INTEGER NOT NULL DEFAULT 0,
        bisyaroh_bersih INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        nama_madrasah TEXT NOT NULL,
        alamat TEXT NOT NULL,
        rt_rw TEXT NOT NULL,
        desa_sampung TEXT NOT NULL,
        kecamatan TEXT NOT NULL,
        kabupaten TEXT NOT NULL,
        tahun_ajaran_hijri TEXT NOT NULL,
        pengurus_name TEXT NOT NULL,
        pengurus_title TEXT NOT NULL,
        headmaster_name TEXT NOT NULL,
        headmaster_title TEXT NOT NULL,
        treasurer_name TEXT NOT NULL,
        treasurer_title TEXT NOT NULL,
        hijri_offset_days INTEGER NOT NULL DEFAULT 0,
        logo_url TEXT
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        condition TEXT NOT NULL,
        acquisition_date TEXT,
        notes TEXT
      );
    `);
    console.log('PostgreSQL tables initialized successfully.');
  } catch (err) {
    console.error('Error auto-creating PostgreSQL tables:', err);
  }
}

