export type TransactionType = 'IN' | 'OUT';

export interface RAPBMItem {
  id: string;
  tahunAjaran: string; // e.g. "1446 - 1447 H."
  type: 'PENERIMAAN' | 'PENGELUARAN';
  categoryCode: string; // e.g. "I", "II", "III", "IV", "V", "VI"
  categoryName: string; // e.g. "PENDAPATAN RUTIN", "BISYAROH DAN TUNJANGAN"
  noUrut: string;
  noKode: string; // e.g. "1.1", "2.1"
  uraian: string;
  jumlahAnggaran: number; // Planned budget
  realita: number; // Actual spent/received
  persentase: number; // % tase
}

export interface Transaction {
  id: string;
  tahunAjaran?: string; // e.g. "1446 - 1447 H."
  dateGregorian: string; // YYYY-MM-DD
  dateHijri: string; // e.g. "10 Ramadhan 1447 H"
  type: TransactionType;
  rapbmCode?: string; // Links to RAPBM noKode (e.g., "1.1", "2.1")
  category: string;
  description: string;
  amount: number;
  recordedBy: string;
  receiptNumber: string;
}

export interface Teacher {
  id: string;
  nipNu: string;
  name: string;
  role: string; // e.g., "Guru Kelas", "Guru Al-Qur'an", "Staf TU", "Kepala Madrasah"
  jamMengajar: number; // Hours per week
  tarifPerJam: number; // e.g. Rp 25.000
  tunjanganJabatan: number;
  tunjanganMasaKerja: number;
  tunjanganKehadiran: number;
  potonganInfaq: number;
  potonganTabungan: number;
  bankAccount?: string;
  status: 'AKTIF' | 'CUTI' | 'NONAKTIF';
}

export interface PayrollRecord {
  id: string;
  tahunAjaran?: string; // e.g. "1446 - 1447 H."
  teacherId: string;
  teacherName: string;
  nipNu: string;
  role: string;
  monthHijri: string; // e.g., "Ramadhan 1447 H"
  monthGregorian: string; // e.g., "Maret 2026"
  dateGeneratedHijri: string; // e.g. "10 Ramadhan 1447 H"
  dateGeneratedGregorian: string;
  jamMengajar: number;
  bisyarohPokok: number; // jamMengajar * tarif
  tunjanganGuru: number; // Jabatan + Masa Kerja + Kehadiran
  tunjanganLain: number;
  totalGajiKotor: number;
  potonganInfaq: number;
  potonganTabungan: number;
  potonganLain: number;
  totalPotongan: number;
  bisyarohBersih: number; // Gaji Bersih
  status: 'DRAFT' | 'LUNAS' | 'TERTUNDA';
  notes?: string;
}

export interface MadrasahInfo {
  namaMadrasah: string;
  alamat: string;
  rtRw: string;
  desaSampung: string;
  kecamatan: string;
  kabupaten: string;
  tahunAjaranHijri: string;
  pengurusName: string;
  pengurusTitle: string;
  headmasterName: string;
  headmasterTitle: string;
  treasurerName: string;
  treasurerTitle: string;
  hijriOffsetDays: number; // Custom offset +/- 2 days
  logoUrl?: string;
}

export interface HijriDateObj {
  day: number;
  monthName: string;
  monthIndex: number;
  year: number;
  dayName: string;
  formatted: string; // "10 Ramadhan 1447 H"
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'BAIK' | 'KURANG BAIK' | 'RUSAK BERAT';
  acquisitionDate?: string;
  notes?: string;
}
