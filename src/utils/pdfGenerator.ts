import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MadrasahInfo, PayrollRecord, RAPBMItem, Transaction } from '../types';
import { formatCurrency, formatNumber } from './hijri';

export function generateRAPBMPDF(
  madrasah: MadrasahInfo,
  rapbmData: RAPBMItem[],
  hijriDateStr: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header / Kop
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RENCANA ANGGARAN PENDAPATAN DAN BELANJA MADRASAH (RAPBM)', 148, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`TAHUN AJARAN : ${madrasah.tahunAjaranHijri}`, 148, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nama Madrasah : ${madrasah.namaMadrasah}`, 14, 28);
  doc.text(`Alamat              : ${madrasah.alamat}`, 14, 33);
  doc.text(`Kecamatan        : ${madrasah.kecamatan}`, 200, 28);
  doc.text(`Kabupaten        : ${madrasah.kabupaten}`, 200, 33);

  // Split RAPBM into Penerimaan and Pengeluaran
  const penerimaanList = rapbmData.filter((i) => i.type === 'PENERIMAAN');
  const pengeluaranList = rapbmData.filter((i) => i.type === 'PENGELUARAN');

  const maxRows = Math.max(penerimaanList.length, pengeluaranList.length);

  const tableRows: any[] = [];

  let totalInAnggaran = 0;
  let totalOutAnggaran = 0;
  let totalOutRealita = 0;

  penerimaanList.forEach((item) => (totalInAnggaran += item.jumlahAnggaran));
  pengeluaranList.forEach((item) => {
    totalOutAnggaran += item.jumlahAnggaran;
    totalOutRealita += item.realita;
  });

  for (let i = 0; i < maxRows; i++) {
    const p = penerimaanList[i];
    const k = pengeluaranList[i];

    tableRows.push([
      p ? p.categoryCode : '',
      p ? p.noKode : '',
      p ? p.uraian : '',
      p ? formatNumber(p.jumlahAnggaran) : '',
      k ? k.categoryCode : '',
      k ? k.noKode : '',
      k ? k.uraian : '',
      k ? formatNumber(k.jumlahAnggaran) : '',
      k ? formatNumber(k.realita) : '',
      k ? `${k.persentase}%` : '',
    ]);
  }

  // Add summary total row
  tableRows.push([
    '',
    '',
    'JUMLAH PENERIMAAN',
    formatNumber(totalInAnggaran),
    '',
    '',
    'JUMLAH PENGELUARAN',
    formatNumber(totalOutAnggaran),
    formatNumber(totalOutRealita),
    `${Math.round((totalOutRealita / (totalOutAnggaran || 1)) * 100)}%`,
  ]);

  autoTable(doc, {
    startY: 38,
    head: [
      [
        { content: 'PENERIMAAN', colSpan: 4, styles: { halign: 'center', fillColor: [30, 64, 128] } },
        { content: 'PENGELUARAN', colSpan: 6, styles: { halign: 'center', fillColor: [30, 64, 128] } },
      ],
      [
        'No',
        'Kode',
        'Uraian Penerimaan',
        'Jumlah (Rp)',
        'No',
        'Kode',
        'Uraian Pengeluaran',
        'Anggaran (Rp)',
        'Realita (Rp)',
        '% tase',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 64, 128],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 12 },
      2: { cellWidth: 65 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 10 },
      5: { halign: 'center', cellWidth: 12 },
      6: { cellWidth: 68 },
      7: { halign: 'right', cellWidth: 28 },
      8: { halign: 'right', cellWidth: 28 },
      9: { halign: 'center', cellWidth: 15 },
    },
  });

  // Signatures Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Check page overflow
  if (finalY > 165) {
    doc.addPage();
  }

  const sigY = finalY > 165 ? 20 : finalY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Date top right of signature
  doc.text(`Karangmenggah, ${hijriDateStr}`, 220, sigY);

  doc.text('Mengetahui,', 20, sigY + 5);
  doc.text('Pengurus', 20, sigY + 10);

  doc.text('Menyetujui,', 120, sigY + 5);
  doc.text('Kepala Madrasah', 120, sigY + 10);

  doc.text('Bendahara', 220, sigY + 10);

  // Names
  doc.setFont('helvetica', 'bold');
  doc.text(madrasah.pengurusName, 20, sigY + 30);
  doc.text(madrasah.headmasterName, 120, sigY + 30);
  doc.text(madrasah.treasurerName, 220, sigY + 30);

  doc.save(`RAPBM_${madrasah.tahunAjaranHijri.replace(/\s+/g, '_')}.pdf`);
}

export function generateSlipGajiPDF(
  madrasah: MadrasahInfo,
  payroll: PayrollRecord
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  // Header Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(madrasah.namaMadrasah.toUpperCase(), 74, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${madrasah.alamat}, Kec. ${madrasah.kecamatan}, Kab. ${madrasah.kabupaten}`, 74, 16, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(10, 19, 138, 19);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SLIP BISYAROH GURU & STAF', 74, 25, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bulan: ${payroll.monthHijri} (${payroll.monthGregorian})`, 74, 29, { align: 'center' });

  // Teacher Info
  doc.setFontSize(8);
  doc.text(`Nama Ustadz/ah : ${payroll.teacherName}`, 12, 36);
  doc.text(`NIP / NUPTK     : ${payroll.nipNu}`, 12, 40);
  doc.text(`Jabatan / Tugas  : ${payroll.role}`, 12, 44);
  doc.text(`Jam Mengajar     : ${payroll.jamMengajar} Jam / Minggu`, 12, 48);

  doc.text(`No. Kwitansi      : PAY-${payroll.id}`, 95, 36);
  doc.text(`Tanggal Cetak   : ${payroll.dateGeneratedHijri}`, 95, 40);

  // Details Table
  const tableData: any[] = [
    ['1. Bisyaroh Pokok (Jam Mengajar)', formatCurrency(payroll.bisyarohPokok)],
    ['2. Tunjangan Jabatan & Kehadiran', formatCurrency(payroll.tunjanganGuru)],
    ['3. Tunjangan Lain-lain', formatCurrency(payroll.tunjanganLain)],
    [{ content: 'TOTAL BISYAROH KOTOR', styles: { fontStyle: 'bold' } }, { content: formatCurrency(payroll.totalGajiKotor), styles: { fontStyle: 'bold' } }],
    ['4. Potongan Infaq Syahriyah', formatCurrency(payroll.potonganInfaq)],
    ['5. Potongan Tabungan Guru', formatCurrency(payroll.potonganTabungan)],
    ['6. Potongan Lain-lain', formatCurrency(payroll.potonganLain)],
    [{ content: 'TOTAL POTONGAN', styles: { fontStyle: 'bold' } }, { content: formatCurrency(payroll.totalPotongan), styles: { fontStyle: 'bold' } }],
  ];

  autoTable(doc, {
    startY: 52,
    head: [['Rincian Bisyaroh & Tunjangan', 'Jumlah (Rp)']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [24, 80, 140], textColor: [255, 255, 255], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 88 },
      1: { halign: 'right', cellWidth: 38 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // Take Home Pay Highlights
  doc.setFillColor(235, 245, 255);
  doc.rect(10, finalY, 128, 8, 'F');
  doc.setLineWidth(0.2);
  doc.rect(10, finalY, 128, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL BISYAROH BERSIH (TAKE HOME PAY):', 14, finalY + 5.5);
  doc.text(formatCurrency(payroll.bisyarohBersih), 134, finalY + 5.5, { align: 'right' });

  // Signatures
  const sigY = finalY + 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.text(`Karangmenggah, ${payroll.dateGeneratedHijri}`, 95, sigY);
  doc.text('Penerima,', 15, sigY + 4);
  doc.text('Bendahara Madrasah,', 95, sigY + 4);

  doc.setFont('helvetica', 'bold');
  doc.text(payroll.teacherName, 15, sigY + 22);
  doc.text(madrasah.treasurerName, 95, sigY + 22);

  doc.save(`Slip_Bisyaroh_${payroll.teacherName.replace(/[^a-zA-Z0-9]/g, '_')}_${payroll.monthHijri.replace(/\s+/g, '_')}.pdf`);
}

export function generateCashFlowPDF(
  madrasah: MadrasahInfo,
  transactions: Transaction[],
  periodStr: string,
  hijriDateStr: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header / Kop
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(madrasah.namaMadrasah.toUpperCase(), 105, 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${madrasah.alamat}, Kec. ${madrasah.kecamatan}, Kab. ${madrasah.kabupaten}`, 105, 17, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(14, 20, 196, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUKU KAS UMUM / LAPORAN ARUS KAS REAL-TIME', 105, 27, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${periodStr}`, 105, 32, { align: 'center' });

  let totalIn = 0;
  let totalOut = 0;

  const rows: any[] = transactions.map((t) => {
    if (t.type === 'IN') totalIn += t.amount;
    if (t.type === 'OUT') totalOut += t.amount;

    return [
      t.dateHijri,
      t.receiptNumber,
      t.category,
      t.description,
      t.type === 'IN' ? formatNumber(t.amount) : '-',
      t.type === 'OUT' ? formatNumber(t.amount) : '-',
    ];
  });

  rows.push([
    '',
    '',
    'TOTAL ARUS KAS',
    '',
    formatNumber(totalIn),
    formatNumber(totalOut),
  ]);

  rows.push([
    '',
    '',
    'SALDO / SISA KAS',
    '',
    { content: formatNumber(totalIn - totalOut), colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
  ]);

  autoTable(doc, {
    startY: 37,
    head: [['Tanggal Hijriyah', 'No. Bukti', 'Kategori RAPBM', 'Uraian Transaksi', 'Penerimaan (Rp)', 'Pengeluaran (Rp)']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 128], textColor: [255, 255, 255], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 26 },
      2: { cellWidth: 38 },
      3: { cellWidth: 50 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(9);
  doc.text(`Karangmenggah, ${hijriDateStr}`, 140, finalY);

  doc.text('Mengetahui,', 20, finalY + 5);
  doc.text('Kepala Madrasah', 20, finalY + 10);

  doc.text('Bendahara Madrasah,', 140, finalY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(madrasah.headmasterName, 20, finalY + 30);
  doc.text(madrasah.treasurerName, 140, finalY + 30);

  doc.save(`Laporan_Buku_Kas_${periodStr.replace(/\s+/g, '_')}.pdf`);
}

export function generateInventoryPDF(
  madrasah: MadrasahInfo,
  inventoryData: any[],
  hijriDateStr: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header / Kop
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LAPORAN DATA INVENTARIS MADRASAH', 105, 14, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`TAHUN AJARAN : ${madrasah.tahunAjaranHijri}`, 105, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nama Madrasah : ${madrasah.namaMadrasah}`, 14, 28);
  doc.text(`Alamat              : ${madrasah.alamat}`, 14, 33);
  doc.text(`Kecamatan        : ${madrasah.kecamatan}`, 130, 28);
  doc.text(`Kabupaten        : ${madrasah.kabupaten}`, 130, 33);

  const tableRows: any[] = [];
  inventoryData.forEach((item, index) => {
    tableRows.push([
      index + 1,
      item.name,
      item.category,
      item.quantity,
      item.condition,
      item.acquisitionDate || '-',
      item.notes || '-',
    ]);
  });

  autoTable(doc, {
    startY: 40,
    head: [['No', 'Nama Barang', 'Kategori / Ruang', 'Jumlah', 'Kondisi', 'Tgl Diperoleh', 'Keterangan']],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 40;

  // Signatures
  doc.setFontSize(9);
  doc.text('Mengetahui,', 40, finalY + 15, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(madrasah.headmasterTitle, 40, finalY + 20, { align: 'center' });
  doc.text(madrasah.headmasterName, 40, finalY + 45, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 46, 60, finalY + 46);

  doc.setFont('helvetica', 'normal');
  doc.text(`Karangmenggah, ${hijriDateStr}`, 170, finalY + 15, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Pengurus Madrasah', 170, finalY + 20, { align: 'center' });
  doc.text(madrasah.pengurusName, 170, finalY + 45, { align: 'center' });
  doc.line(150, finalY + 46, 190, finalY + 46);

  doc.save(`Inventaris_Madrasah_${madrasah.tahunAjaranHijri.replace(/\s+/g, '_')}.pdf`);
}
