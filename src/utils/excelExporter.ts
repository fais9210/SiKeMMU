import * as XLSX from 'xlsx';
import { Transaction, StudentPayment, RAPBMItem, PayrollRecord, MadrasahInfo } from '../types';

/**
 * Export full Academic Year financial data into a multi-sheet Excel file (.xlsx)
 */
export function exportAcademicYearBackupExcel(
  madrasah: MadrasahInfo,
  tahunAjaran: string,
  transactions: Transaction[],
  payments: StudentPayment[],
  rapbmData: RAPBMItem[],
  payrolls: PayrollRecord[]
) {
  const workbook = XLSX.utils.book_new();

  // 1. Sheet: Transaksi Kas
  const trxHeader = [
    ['REKAPITULASI BUKU KAS UMUM'],
    [madrasah.namaMadrasah],
    [`Tahun Ajaran: ${tahunAjaran}`],
    [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    ['No', 'Tanggal Masehi', 'Tanggal Hijriah', 'Jenis', 'Kode RAPBM', 'Kategori', 'Uraian / Keterangan', 'No. Kwitansi', 'Pencatat', 'Jumlah (Rp)']
  ];

  let currentSaldo = 0;
  let totalMasuk = 0;
  let totalKeluar = 0;

  const trxRows = transactions.map((t, index) => {
    if (t.type === 'IN') {
      currentSaldo += t.amount;
      totalMasuk += t.amount;
    } else {
      currentSaldo -= t.amount;
      totalKeluar += t.amount;
    }
    return [
      index + 1,
      t.dateGregorian,
      t.dateHijri || '',
      t.type === 'IN' ? 'PENERIMAAN' : 'PENGELUARAN',
      t.rapbmCode || '-',
      t.category || '-',
      t.description,
      t.receiptNumber || '-',
      t.recordedBy || '-',
      t.amount
    ];
  });

  trxRows.push([]);
  trxRows.push(['', '', '', '', '', '', 'TOTAL PENERIMAAN', '', '', totalMasuk]);
  trxRows.push(['', '', '', '', '', '', 'TOTAL PENGELUARAN', '', '', totalKeluar]);
  trxRows.push(['', '', '', '', '', '', 'SALDO AKHIR', '', '', currentSaldo]);

  const trxSheet = XLSX.utils.aoa_to_sheet([...trxHeader, ...trxRows]);
  XLSX.utils.book_append_sheet(workbook, trxSheet, 'Transaksi Kas');

  // 2. Sheet: Syahriyah Siswa
  const syahriyahHeader = [
    ['REKAPITULASI PEMBAYARAN SYAHRIYAH & IURAN SISWA'],
    [madrasah.namaMadrasah],
    [`Tahun Ajaran: ${tahunAjaran}`],
    [],
    ['No', 'Nama Siswa', 'Kelas', 'Jenis Pembayaran', 'Bulan / Periode', 'Nominal (Rp)', 'Tanggal Masehi', 'Tanggal Hijriah', 'Pencatat', 'Catatan']
  ];

  const syahriyahRows = payments.map((p, index) => [
    index + 1,
    p.studentName,
    p.kelas,
    p.type,
    p.monthPeriod || '-',
    p.amount,
    p.dateGregorian,
    p.dateHijri || '-',
    p.recordedBy || '-',
    p.notes || '-'
  ]);

  const syahriyahSheet = XLSX.utils.aoa_to_sheet([...syahriyahHeader, ...syahriyahRows]);
  XLSX.utils.book_append_sheet(workbook, syahriyahSheet, 'Syahriyah Siswa');

  // 3. Sheet: RAPBM
  const rapbmHeader = [
    ['RENCANA ANGGARAN PENDAPATAN DAN BELANJA MADRASAH (RAPBM)'],
    [madrasah.namaMadrasah],
    [`Tahun Ajaran: ${tahunAjaran}`],
    [],
    ['No', 'Jenis', 'Kode Kat.', 'Kategori', 'No. Kode', 'Uraian Anggaran', 'Anggaran (Rp)', 'Realita (Rp)', 'Persentase (%)']
  ];

  const rapbmRows = rapbmData.map((r, index) => [
    index + 1,
    r.type,
    r.categoryCode,
    r.categoryName,
    r.noKode,
    r.uraian,
    r.jumlahAnggaran,
    r.realita,
    r.jumlahAnggaran > 0 ? Math.round((r.realita / r.jumlahAnggaran) * 100) : (r.realita > 0 ? 100 : 0)
  ]);

  const rapbmSheet = XLSX.utils.aoa_to_sheet([...rapbmHeader, ...rapbmRows]);
  XLSX.utils.book_append_sheet(workbook, rapbmSheet, 'Tabel RAPBM');

  // 4. Sheet: Gaji & Bisyaroh Guru
  if (payrolls && payrolls.length > 0) {
    const payrollHeader = [
      ['REKAPITULASI GAJI & BISYAROH GURU / STAF'],
      [madrasah.namaMadrasah],
      [`Tahun Ajaran: ${tahunAjaran}`],
      [],
      ['No', 'Nama Guru/Staf', 'NIP/NU', 'Jabatan', 'Bulan (Masehi)', 'Bulan (Hijriah)', 'Bisyaroh Pokok', 'Tunjangan Guru', 'Potongan', 'Gaji Bersih (Rp)', 'Status']
    ];

    const payrollRows = payrolls.map((pr, index) => [
      index + 1,
      pr.teacherName,
      pr.nipNu || '-',
      pr.role,
      pr.monthGregorian || '-',
      pr.monthHijri || '-',
      pr.bisyarohPokok,
      pr.tunjanganGuru,
      pr.totalPotongan,
      pr.bisyarohBersih,
      pr.status
    ]);

    const payrollSheet = XLSX.utils.aoa_to_sheet([...payrollHeader, ...payrollRows]);
    XLSX.utils.book_append_sheet(workbook, payrollSheet, 'Gaji & Bisyaroh');
  }

  // Export File
  const filename = `REKAP_KEUANGAN_MADRASAH_${tahunAjaran.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export filtered Cash Book transactions to Excel (.xlsx)
 */
export function exportFilteredTransactionsExcel(
  madrasah: MadrasahInfo,
  tahunAjaran: string,
  filterTitle: string,
  transactions: Transaction[]
) {
  const workbook = XLSX.utils.book_new();

  const header = [
    ['LAPORAN REKAPITULASI TRANSAKSI KAS'],
    [madrasah.namaMadrasah],
    [`Filter Periode: ${filterTitle}`],
    [`Tahun Ajaran: ${tahunAjaran}`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    ['No', 'Tanggal Masehi', 'Tanggal Hijriah', 'Jenis', 'Kode RAPBM', 'Kategori', 'Uraian Transaksi', 'No. Kwitansi', 'Pencatat', 'Jumlah (Rp)']
  ];

  let totalIn = 0;
  let totalOut = 0;

  const rows = transactions.map((t, index) => {
    if (t.type === 'IN') totalIn += t.amount;
    if (t.type === 'OUT') totalOut += t.amount;

    return [
      index + 1,
      t.dateGregorian,
      t.dateHijri || '',
      t.type === 'IN' ? 'PENERIMAAN' : 'PENGELUARAN',
      t.rapbmCode || '-',
      t.category || '-',
      t.description,
      t.receiptNumber || '-',
      t.recordedBy || '-',
      t.amount
    ];
  });

  rows.push([]);
  rows.push(['', '', '', '', '', '', 'TOTAL PENERIMAAN', '', '', totalIn]);
  rows.push(['', '', '', '', '', '', 'TOTAL PENGELUARAN', '', '', totalOut]);
  rows.push(['', '', '', '', '', '', 'SURPLUS / DEFISIT PERIODE', '', '', totalIn - totalOut]);

  const sheet = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Rekap Kas');

  const filename = `REKAP_KAS_${filterTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
