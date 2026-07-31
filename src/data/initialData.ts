import { MadrasahInfo, RAPBMItem, Teacher, Transaction, PayrollRecord } from '../types';

export const initialMadrasahInfo: MadrasahInfo = {
  namaMadrasah: 'Madrasah Miftahul Ulum A-22 Karangnongko',
  alamat: 'Karangnongko 02/06 Karangmenggah',
  rtRw: '02/06',
  desaSampung: 'Karangmenggah',
  kecamatan: 'Wonorejo',
  kabupaten: 'Pasuruan',
  tahunAjaranHijri: '1446 - 1447 H.',
  pengurusName: "ABDULLOH ASY'ARI",
  pengurusTitle: 'Pengurus Madrasah',
  headmasterName: "M. MAS'UD",
  headmasterTitle: 'Kepala Madrasah',
  treasurerName: 'M. YUNUS',
  treasurerTitle: 'Bendahara Madrasah',
  hijriOffsetDays: 0,
};

export const baseRAPBMSkeleton = [
  // PENERIMAAN
  { type: 'PENERIMAAN', categoryCode: 'I', categoryName: 'SISA TAHUN LALU', noUrut: 'I', noKode: '1', uraian: 'SISA TAHUN LALU', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'II', categoryName: 'PENDAPATAN RUTIN', noUrut: 'II', noKode: '2.1', uraian: 'Uang Syahriyah', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'III', categoryName: 'BANTUAN PEMERINTAH', noUrut: 'III', noKode: '3.1', uraian: 'BPPDGS Prov & Kab', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'IV', categoryName: 'BANTUAN LAIN', noUrut: 'IV', noKode: '4.1', uraian: 'Dansos', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'IV', categoryName: 'BANTUAN LAIN', noUrut: 'IV', noKode: '4.2', uraian: 'Sawah yang disewakan', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'V', categoryName: 'PENDAPATAN ASLI MADRASAH', noUrut: 'V', noKode: '5.1', uraian: 'Ziaroh', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'V', categoryName: 'PENDAPATAN ASLI MADRASAH', noUrut: 'V', noKode: '5.2', uraian: 'Hasil tabungan', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'V', categoryName: 'PENDAPATAN ASLI MADRASAH', noUrut: 'V', noKode: '5.3', uraian: 'Hasil Kitab', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'V', categoryName: 'PENDAPATAN ASLI MADRASAH', noUrut: 'V', noKode: '5.4', uraian: 'Hasil seragam murid', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'V', categoryName: 'PENDAPATAN ASLI MADRASAH', noUrut: 'V', noKode: '5.5', uraian: 'Pendaftaran murid baru', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'V', categoryName: 'PENDAPATAN ASLI MADRASAH', noUrut: 'V', noKode: '5.6', uraian: 'Hasil parkir volly ikhtibar', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'VI', categoryName: 'PENDAPATAN IKHTIBAR', noUrut: 'VI', noKode: '6.1', uraian: 'Iuran wali murid', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'VI', categoryName: 'PENDAPATAN IKHTIBAR', noUrut: 'VI', noKode: '6.2', uraian: 'Donatur alumni & panitia', jumlahAnggaran: 0 },
  { type: 'PENERIMAAN', categoryCode: 'VI', categoryName: 'PENDAPATAN IKHTIBAR', noUrut: 'VI', noKode: '6.3', uraian: "Sumbangan dari jam'iyyah", jumlahAnggaran: 0 },

  // PENGELUARAN
  { type: 'PENGELUARAN', categoryCode: 'I', categoryName: 'BISYAROH DAN TUNJANGAN', noUrut: 'I', noKode: '1.1', uraian: 'Bisyaroh Guru', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'I', categoryName: 'BISYAROH DAN TUNJANGAN', noUrut: 'I', noKode: '1.2', uraian: 'Tunjangan guru', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'I', categoryName: 'BISYAROH DAN TUNJANGAN', noUrut: 'I', noKode: '1.3', uraian: 'Bisyaroh TU', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'I', categoryName: 'BISYAROH DAN TUNJANGAN', noUrut: 'I', noKode: '1.4', uraian: 'Subsidi Syahriyah Murid / Beasiswa', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.1', uraian: 'Dampar dan bangku', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.2', uraian: 'Pembayaran listrik, Internet dll', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.3', uraian: 'Pengecatan dan perbaikan gedung', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.4', uraian: 'Perawatan komputer / printer', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.5', uraian: 'Pembelian lampu', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.6', uraian: 'Papan tulis', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.7', uraian: 'Tempat sampah dan sapu', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.8', uraian: 'Perbaikan atap & jendela', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.9', uraian: 'Pembelian kipas', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'II', categoryName: 'BIAYA PEMELIHARAAN', noUrut: 'II', noKode: '2.10', uraian: 'Perawatan kamar mandi', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.1', uraian: 'Banner jadwal dan kalender pendidikan', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.2', uraian: 'Kertas Bufallo', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.3', uraian: 'Kertas HVS', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.4', uraian: 'Isolasi staples dll', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.5', uraian: 'Kapur tulis', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.6', uraian: 'Fotokopi dan penjilidan', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.7', uraian: 'Ballpoint dan Spidol', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.8', uraian: 'Penghapus Papan tulis dan Taplak meja', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.9', uraian: 'Proposal, SPJ dan MoU BPPDGS', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'III', categoryName: 'BELANJA ATK', noUrut: 'III', noKode: '3.10', uraian: 'Tinta Printer', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.1', uraian: 'Rapim', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.2', uraian: 'Pelaksanaan KMGF', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.3', uraian: 'Muammar', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.4', uraian: 'Rapat Internal Guru', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.5', uraian: 'Konsumsi GT PPS', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.6', uraian: 'Akreditasi', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.7', uraian: "Kegiatan Musyawaroh Kelas, Pembinaan Baca Kitab, Al-Qur'an dll", jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.8', uraian: 'Tamrin, Pra Imni, Imda dll', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.9', uraian: 'Rapat Koordinasi', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'IV', categoryName: 'PENGEMBANGAN PENDIDIK DAN TENAGA PENDIDIKAN', noUrut: 'IV', noKode: '4.10', uraian: 'PHBI', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'V', categoryName: 'HAFLAH DAN LAIN-LAIN', noUrut: 'V', noKode: '5.1', uraian: 'Seragam guru dan panitia', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'V', categoryName: 'HAFLAH DAN LAIN-LAIN', noUrut: 'V', noKode: '5.2', uraian: 'Haflatul ikhtibar', jumlahAnggaran: 0 },
  { type: 'PENGELUARAN', categoryCode: 'V', categoryName: 'HAFLAH DAN LAIN-LAIN', noUrut: 'V', noKode: '5.3', uraian: 'Pengeluaran insidentil', jumlahAnggaran: 0 },
];

export function getDefaultRAPBMForYear(tahunAjaran: string): RAPBMItem[] {
  return baseRAPBMSkeleton.map((item, idx) => {
    const isIncome = item.type === 'PENERIMAAN';
    return {
      id: `rapbm-${tahunAjaran.replace(/[^a-zA-Z0-9]/g, '')}-${idx}`,
      tahunAjaran,
      type: item.type as 'PENERIMAAN' | 'PENGELUARAN',
      categoryCode: item.categoryCode,
      categoryName: item.categoryName,
      noUrut: item.noUrut,
      noKode: item.noKode,
      uraian: item.uraian,
      jumlahAnggaran: item.jumlahAnggaran,
      realita: isIncome ? item.jumlahAnggaran : 0,
      persentase: isIncome ? 100 : 0,
    };
  });
}

// Initial Data with multiple years populated
export const initialRAPBMData: RAPBMItem[] = getDefaultRAPBMForYear('1446 - 1447 H.').map((item) => {
  let anggaran = 0;
  let realita = 0;

  if (item.type === 'PENERIMAAN') {
    switch (item.uraian) {
      case 'SISA TAHUN LALU': anggaran = 1025500; break;
      case 'Uang Syahriyah': anggaran = 10560000; break;
      case 'Dansos': anggaran = 220000; break;
      case 'Sawah yang disewakan': anggaran = 1000000; break;
      case 'Hasil Kitab': anggaran = 1500000; break;
      case 'Hasil seragam murid': anggaran = 850000; break;
      case 'Pendaftaran murid baru': anggaran = 800000; break;
      case 'Iuran wali murid': anggaran = 4500000; break;
      case 'Donatur alumni & panitia': anggaran = 4000000; break;
      case "Sumbangan dari jam'iyyah": anggaran = 1500000; break;
    }
    realita = anggaran; // For PENERIMAAN, realita is usually equal to anggaran initially or matches it.
  } else if (item.type === 'PENGELUARAN') {
    switch (item.uraian) {
      case 'Bisyaroh Guru': anggaran = 10589000; realita = 6533500; break;
      case 'Tunjangan guru': anggaran = 3240000; realita = 1890000; break;
      case 'Bisyaroh TU': anggaran = 1200000; realita = 800000; break;
      case 'Subsidi Syahriyah Murid / Beasiswa': anggaran = 1200000; realita = 1200000; break;
      case 'Pembayaran listrik, Internet dll': anggaran = 600000; realita = 600000; break;
      case 'Perawatan komputer / printer': anggaran = 1000000; realita = 2000000; break;
      case 'Pembelian lampu': anggaran = 700000; realita = 450000; break;
      case 'Tempat sampah dan sapu': anggaran = 350000; realita = 350000; break;
      case 'Pembelian kipas': anggaran = 500000; realita = 350000; break;
      case 'Banner jadwal dan kalender pendidikan': anggaran = 400000; realita = 400000; break;
      case 'Kertas Bufallo': anggaran = 90000; realita = 90000; break;
      case 'Kertas HVS': anggaran = 200000; realita = 138500; break;
      case 'Isolasi staples dll': anggaran = 200000; realita = 157500; break;
      case 'Kapur tulis': anggaran = 250000; realita = 250000; break;
      case 'Fotokopi dan penjilidan': anggaran = 300000; realita = 120000; break;
      case 'Ballpoint dan Spidol': anggaran = 50000; realita = 50000; break;
      case 'Penghapus Papan tulis dan Taplak meja': anggaran = 60000; realita = 60000; break;
      case 'Tinta Printer': anggaran = 200000; realita = 200000; break;
      case 'Rapim': anggaran = 50000; realita = 50000; break;
      case 'Pelaksanaan KMGF': anggaran = 500000; realita = 500000; break;
      case 'Muammar': anggaran = 500000; realita = 275000; break;
      case 'Rapat Internal Guru': anggaran = 500000; realita = 500000; break;
      case 'Tamrin, Pra Imni, Imda dll': anggaran = 500000; realita = 350000; break;
      case 'Rapat Koordinasi': anggaran = 90000; realita = 90000; break;
      case 'Haflatul ikhtibar': anggaran = 2750000; realita = 2750000; break;
    }
  }

  const persentase = anggaran > 0 ? Math.round((realita / anggaran) * 100) : 0;

  return {
    ...item,
    jumlahAnggaran: anggaran,
    realita: realita,
    persentase: persentase,
  };
});

export const initialTeachers: Teacher[] = [];

export const initialTransactions: Transaction[] = [];

export const initialPayrolls: PayrollRecord[] = [];

export const initialStudents = [
  { id: '1446003540', ranting: 'A-22', name: 'ABDUL FATIR', gender: 'L', age: 9, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446001007', ranting: 'A-22', name: 'ACHMAD ROYYAN FIRDAUS', gender: 'L', age: 9, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446001004', ranting: 'A-22', name: 'AHMAD UBAIDILLAH', gender: 'L', age: 9, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446001010', ranting: 'A-22', name: 'M DIMAZ SABILILLAH', gender: 'L', age: 10, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446002751', ranting: 'A-22', name: 'M FAHRI ZAFRAN KHOIRI', gender: 'L', age: 9, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446001009', ranting: 'A-22', name: 'M RAFA AZKA MAULANA', gender: 'L', age: 9, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446001005', ranting: 'A-22', name: 'MUHAMMAD NAJIYULLOH', gender: 'L', age: 10, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446002708', ranting: 'A-22', name: 'MUHAMMAD NAUFAL AZKA AIFARO', gender: 'L', age: 8, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446001006', ranting: 'A-22', name: 'MUHAMMAD RAFIF SAVA', gender: 'L', age: 8, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446005460', ranting: 'A-22', name: 'NUR MUHAMMAD FACHRICHUZ ZULKARNAIN', gender: 'L', age: 8, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1447002364', ranting: 'A-22', name: 'FATIMAH SHAKILA KHAIRINA', gender: 'P', age: 8, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1447002368', ranting: 'A-22', name: 'INDAH NUR AINI', gender: 'P', age: 8, kelas: 'Kelas 2', status: 'AKTIF' },
  { id: '1446001012', ranting: 'A-22', name: 'AHMAD BADAWI', gender: 'L', age: 7, kelas: 'Kelas 1', status: 'AKTIF' },
  { id: '1446001015', ranting: 'A-22', name: 'AISYAH AZ-ZAHRA', gender: 'P', age: 7, kelas: 'Kelas 1', status: 'AKTIF' },
  { id: '1446001020', ranting: 'A-22', name: 'MUHAMMAD AL-FATIH', gender: 'L', age: 11, kelas: 'Kelas 4', status: 'AKTIF' },
  { id: '1446001025', ranting: 'A-22', name: 'ZAHRA AMIRA', gender: 'P', age: 12, kelas: 'Kelas 5', status: 'AKTIF' },
];

