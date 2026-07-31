import { pgTable, text, serial, integer, numeric, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

export const rapbmItems = pgTable('rapbm_items', {
  id: text('id').primaryKey(),
  tahunAjaran: text('tahun_ajaran').notNull(),
  type: text('type').notNull(), // 'PENERIMAAN' | 'PENGELUARAN'
  categoryCode: text('category_code').notNull(),
  categoryName: text('category_name').notNull(),
  noUrut: text('no_urut').notNull(),
  noKode: text('no_kode').notNull(),
  uraian: text('uraian').notNull(),
  jumlahAnggaran: integer('jumlah_anggaran').notNull().default(0),
  realita: integer('realita').notNull().default(0),
  persentase: integer('persentase').notNull().default(0),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  tahunAjaran: text('tahun_ajaran'),
  dateGregorian: text('date_gregorian').notNull(),
  dateHijri: text('date_hijri').notNull(),
  type: text('type').notNull(), // 'IN' | 'OUT'
  rapbmCode: text('rapbm_code'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull().default(0),
  recordedBy: text('recorded_by').notNull(),
  receiptNumber: text('receipt_number').notNull(),
});

export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  nipNu: text('nip_nu').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  jamMengajar: integer('jam_mengajar').notNull().default(0),
  tarifPerJam: integer('tarif_per_jam').notNull().default(0),
  tunjanganJabatan: integer('tunjangan_jabatan').notNull().default(0),
  tunjanganMasaKerja: integer('tunjangan_masa_kerja').notNull().default(0),
  tunjanganKehadiran: integer('tunjangan_kehadiran').notNull().default(0),
  potonganInfaq: integer('potongan_infaq').notNull().default(0),
  potonganTabungan: integer('potongan_tabungan').notNull().default(0),
  bankAccount: text('bank_account'),
  status: text('status').notNull(), // 'AKTIF' | 'CUTI' | 'NONAKTIF'
});

export const payrollRecords = pgTable('payroll_records', {
  id: text('id').primaryKey(),
  tahunAjaran: text('tahun_ajaran'),
  teacherId: text('teacher_id').notNull(),
  teacherName: text('teacher_name').notNull(),
  nipNu: text('nip_nu').notNull(),
  role: text('role').notNull(),
  monthHijri: text('month_hijri').notNull(),
  monthGregorian: text('month_gregorian').notNull(),
  dateGeneratedHijri: text('date_generated_hijri').notNull(),
  dateGeneratedGregorian: text('date_generated_gregorian').notNull(),
  jamMengajar: integer('jam_mengajar').notNull().default(0),
  bisyarohPokok: integer('bisyaroh_pokok').notNull().default(0),
  tunjanganGuru: integer('tunjangan_guru').notNull().default(0),
  tunjanganLain: integer('tunjangan_lain').notNull().default(0),
  totalGajiKotor: integer('total_gaji_kotor').notNull().default(0),
  potonganInfaq: integer('potongan_infaq').notNull().default(0),
  potonganTabungan: integer('potongan_tabungan').notNull().default(0),
  potonganLain: integer('potongan_lain').notNull().default(0),
  totalPotongan: integer('total_potongan').notNull().default(0),
  bisyarohBersih: integer('bisyaroh_bersih').notNull().default(0),
  status: text('status').notNull(), // 'DRAFT' | 'LUNAS' | 'TERTUNDA'
  notes: text('notes'),
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey(), // just use a constant string like 'app-settings'
  namaMadrasah: text('nama_madrasah').notNull(),
  alamat: text('alamat').notNull(),
  rtRw: text('rt_rw').notNull(),
  desaSampung: text('desa_sampung').notNull(),
  kecamatan: text('kecamatan').notNull(),
  kabupaten: text('kabupaten').notNull(),
  tahunAjaranHijri: text('tahun_ajaran_hijri').notNull(),
  pengurusName: text('pengurus_name').notNull(),
  pengurusTitle: text('pengurus_title').notNull(),
  headmasterName: text('headmaster_name').notNull(),
  headmasterTitle: text('headmaster_title').notNull(),
  treasurerName: text('treasurer_name').notNull(),
  treasurerTitle: text('treasurer_title').notNull(),
  hijriOffsetDays: integer('hijri_offset_days').notNull().default(0),
  logoUrl: text('logo_url'),
});

export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  quantity: integer('quantity').notNull().default(1),
  condition: text('condition').notNull(), // 'BAIK' | 'KURANG BAIK' | 'RUSAK BBERAT'
  acquisitionDate: text('acquisition_date'),
  notes: text('notes'),
});

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  ranting: text('ranting').notNull().default('A-22'),
  name: text('name').notNull(),
  gender: text('gender').notNull().default('L'), // 'L' | 'P'
  age: integer('age').notNull().default(9),
  kelas: text('kelas').notNull().default('Kelas 1'),
  status: text('status').notNull().default('AKTIF'),
});

export const studentPayments = pgTable('student_payments', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  tahunAjaran: text('tahun_ajaran').notNull(),
  kelas: text('kelas').notNull(),
  type: text('type').notNull(), // 'SYAHRIYAH' | 'IMDA' | 'IMNI'
  amount: integer('amount').notNull().default(0),
  dateGregorian: text('date_gregorian').notNull(),
  dateHijri: text('date_hijri').notNull(),
  monthPeriod: text('month_period'),
  recordedBy: text('recorded_by').default('Bendahara'),
  notes: text('notes'),
});

