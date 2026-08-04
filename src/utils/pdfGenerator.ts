import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MadrasahInfo, PayrollRecord, RAPBMItem, Transaction } from '../types';
import { formatCurrency, formatNumber, terbilang } from './hijri';

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
  const safeHijriStr = typeof hijriDateStr === 'string'
    ? hijriDateStr
    : (hijriDateStr && typeof hijriDateStr === 'object' && 'formatted' in hijriDateStr
        ? String((hijriDateStr as any).formatted)
        : String(hijriDateStr || ''));
  const dateText = safeHijriStr.includes(',') ? safeHijriStr : `${madrasah.kabupaten || 'Pasuruan'}, ${safeHijriStr}`;
  doc.text(dateText, 220, sigY);

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

  const safeHijriStr = typeof hijriDateStr === 'string'
    ? hijriDateStr
    : (hijriDateStr && typeof hijriDateStr === 'object' && 'formatted' in hijriDateStr
        ? String((hijriDateStr as any).formatted)
        : String(hijriDateStr || ''));

  doc.setFontSize(9);
  doc.text(`Karangmenggah, ${safeHijriStr}`, 140, finalY);

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

  const safeHijriStr = typeof hijriDateStr === 'string'
    ? hijriDateStr
    : (hijriDateStr && typeof hijriDateStr === 'object' && 'formatted' in hijriDateStr
        ? String((hijriDateStr as any).formatted)
        : String(hijriDateStr || ''));

  doc.setFont('helvetica', 'normal');
  doc.text(`Karangmenggah, ${safeHijriStr}`, 170, finalY + 15, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Pengurus Madrasah', 170, finalY + 20, { align: 'center' });
  doc.text(madrasah.pengurusName, 170, finalY + 45, { align: 'center' });
  doc.line(150, finalY + 46, 190, finalY + 46);

  doc.save(`Inventaris_Madrasah_${madrasah.tahunAjaranHijri.replace(/\s+/g, '_')}.pdf`);
}

export interface NotaPengeluaranDetail {
  noNota: string;
  tanggalGregorian?: string;
  tanggalHijri: string;
  penerima: string;
  posRapbmKode: string;
  posRapbmNama: string;
  keperluan: string;
  jumlah: number;
  tahunAjaran: string;
  catatan?: string;
}

export function generateNotaPengeluaranPDF(
  madrasah: MadrasahInfo,
  nota: NotaPengeluaranDetail
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5',
  });

  // Outer Decorative Border
  doc.setLineWidth(0.8);
  doc.setDrawColor(16, 185, 129); // emerald-600
  doc.rect(5, 5, 200, 138);

  doc.setLineWidth(0.3);
  doc.setDrawColor(100, 100, 100);
  doc.rect(7, 7, 196, 134);

  // KOP Madrasah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(madrasah.namaMadrasah.toUpperCase(), 105, 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${madrasah.alamat}, Kec. ${madrasah.kecamatan}, Kab. ${madrasah.kabupaten}`, 105, 20, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(15, 23, 42);
  doc.line(12, 23, 198, 23);

  // Title: NOTA / BUKTI PENGELUARAN KAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('KWITANSI / NOTA BUKTI PENGELUARAN KAS', 105, 30, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Tahun Ajaran RAPBM: ${nota.tahunAjaran}`, 105, 34, { align: 'center' });

  // Receipt Meta Info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`No. Bukti Kas : ${nota.noNota}`, 12, 42);
  doc.text(`Tanggal : ${nota.tanggalGregorian || new Date().toISOString().split('T')[0]} (${nota.tanggalHijri})`, 198, 42, { align: 'right' });

  // Main Details Table / Box
  const rows = [
    ['Telah Dibayarkan Kepada', `: ${nota.penerima}`],
    ['Pos Anggaran RAPBM', `: [Kode ${nota.posRapbmKode}] ${nota.posRapbmNama}`],
    ['Uraian / Keperluan', `: ${nota.keperluan}`],
    ['Jumlah Uang', `: ${formatCurrency(nota.jumlah)}`],
    ['Terbilang', `: # ${terbilang(nota.jumlah)} #`],
  ];

  autoTable(doc, {
    startY: 46,
    margin: { left: 12, right: 12 },
    body: rows,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 142 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // Amount Highlight Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.rect(12, finalY, 75, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text(`Terbayar: ${formatCurrency(nota.jumlah)}`, 15, finalY + 6.5);

  // Signatures Section
  const sigY = finalY + 16;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  // Left: Yang Menerima
  doc.text('Yang Menerima / Hak', 30, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(nota.penerima, 30, sigY + 16, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(12, sigY + 17, 48, sigY + 17);

  // Center: Bendahara
  doc.setFont('helvetica', 'normal');
  doc.text('Bendahara Madrasah,', 105, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(madrasah.treasurerName, 105, sigY + 16, { align: 'center' });
  doc.line(87, sigY + 17, 123, sigY + 17);

  // Right: Mengetahui Kepala
  doc.setFont('helvetica', 'normal');
  doc.text(`Karangmenggah, ${nota.tanggalHijri}`, 180, sigY - 4, { align: 'center' });
  doc.text('Mengetahui, Kepala Madrasah', 180, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(madrasah.headmasterName, 180, sigY + 16, { align: 'center' });
  doc.line(162, sigY + 17, 198, sigY + 17);

  doc.save(`Nota_Pengeluaran_RAPBM_${nota.noNota.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Generates a batch PDF containing up to 4 receipts (Nota Pengeluaran) per A4 page (2x2 Grid).
 */
export function generateBatchNotaPengeluaranA4PDF(
  madrasah: MadrasahInfo,
  notaList: NotaPengeluaranDetail[]
) {
  if (!notaList || notaList.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardsPerPage = 4;
  const totalPages = Math.ceil(notaList.length / cardsPerPage);

  // Grid offsets for 2x2 grid on A4 Portrait (210mm x 297mm)
  const gridPositions = [
    { x: 6, y: 6 },     // Card 0: Top-Left
    { x: 108, y: 6 },   // Card 1: Top-Right
    { x: 6, y: 148 },   // Card 2: Bottom-Left
    { x: 108, y: 148 }, // Card 3: Bottom-Right
  ];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage();
    }

    // Cut guide dashed lines
    doc.setLineWidth(0.1);
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(105, 4, 105, 293); // Vertical center cut guide
    doc.line(4, 146, 206, 146); // Horizontal center cut guide
    doc.setLineDashPattern([], 0); // reset dash

    const pageItems = notaList.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);

    pageItems.forEach((nota, itemIdx) => {
      const pos = gridPositions[itemIdx];
      const x = pos.x;
      const y = pos.y;
      const cardW = 96;
      const cardH = 138;

      // Outer & Inner Card Borders
      doc.setLineWidth(0.5);
      doc.setDrawColor(16, 185, 129); // emerald-600
      doc.rect(x, y, cardW, cardH);

      doc.setLineWidth(0.2);
      doc.setDrawColor(210, 210, 210);
      doc.rect(x + 1, y + 1, cardW - 2, cardH - 2);

      // KOP Madrasah Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(madrasah.namaMadrasah.toUpperCase(), x + cardW / 2, y + 6, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(`${madrasah.alamat}, ${madrasah.kabupaten}`, x + cardW / 2, y + 10, { align: 'center' });

      doc.setLineWidth(0.4);
      doc.setDrawColor(15, 23, 42);
      doc.line(x + 4, y + 12, x + cardW - 4, y + 12);

      // Title: KWITANSI BUKTI PENGELUARAN KAS
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text('KWITANSI BUKTI PENGELUARAN KAS', x + cardW / 2, y + 16, { align: 'center' });

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`TA RAPBM: ${nota.tahunAjaran}`, x + cardW / 2, y + 19, { align: 'center' });

      // Receipt Meta Info
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`No: ${nota.noNota}`, x + 4, y + 23);
      doc.text(`Tgl: ${nota.tanggalGregorian || ''}`, x + cardW - 4, y + 23, { align: 'right' });

      doc.setLineWidth(0.2);
      doc.setDrawColor(220, 220, 220);
      doc.line(x + 4, y + 24.5, x + cardW - 4, y + 24.5);

      // Content Details
      doc.setFontSize(6.5);
      
      // Dibayarkan Kepada
      doc.setFont('helvetica', 'bold');
      doc.text('Dibayar Ke', x + 4, y + 29);
      doc.setFont('helvetica', 'normal');
      const recipientText = doc.splitTextToSize(`: ${nota.penerima}`, 68);
      doc.text(recipientText, x + 22, y + 29);

      const recipientH = (recipientText.length - 1) * 3;
      const posY = y + 33 + recipientH;

      // Pos RAPBM
      doc.setFont('helvetica', 'bold');
      doc.text('Pos RAPBM', x + 4, posY);
      doc.setFont('helvetica', 'normal');
      const posLines = doc.splitTextToSize(`: [Kode ${nota.posRapbmKode}] ${nota.posRapbmNama}`, 68);
      doc.text(posLines, x + 22, posY);

      const posH = (posLines.length - 1) * 3;
      const keperluanY = posY + 4 + posH;

      // Keperluan
      doc.setFont('helvetica', 'bold');
      doc.text('Keperluan', x + 4, keperluanY);
      doc.setFont('helvetica', 'normal');
      const keperluanLines = doc.splitTextToSize(`: ${nota.keperluan}`, 68);
      doc.text(keperluanLines, x + 22, keperluanY);

      // Terbayar Box
      const boxY = y + 68;
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(16, 185, 129);
      doc.rect(x + 4, boxY, cardW - 8, 7, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 95, 70);
      doc.text(`Terbayar: ${formatCurrency(nota.jumlah)}`, x + 6, boxY + 5);

      // Terbilang Text
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.8);
      doc.setTextColor(30, 41, 59);
      const terbilangLines = doc.splitTextToSize(`# ${terbilang(nota.jumlah)} #`, cardW - 8);
      doc.text(terbilangLines, x + 4, boxY + 11);

      // Signatures
      const sigY = y + 114;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);

      // Menerima
      doc.text('Yang Menerima,', x + 16, sigY, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(nota.penerima.slice(0, 16), x + 16, sigY + 12, { align: 'center' });
      doc.setLineWidth(0.2);
      doc.line(x + 4, sigY + 13, x + 28, sigY + 13);

      // Bendahara
      doc.setFont('helvetica', 'normal');
      doc.text('Bendahara,', x + cardW / 2, sigY, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(madrasah.treasurerName.slice(0, 16), x + cardW / 2, sigY + 12, { align: 'center' });
      doc.line(x + 36, sigY + 13, x + 60, sigY + 13);

      // Kepala
      doc.setFont('helvetica', 'normal');
      doc.text('Kepala Madrasah,', x + cardW - 16, sigY, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(madrasah.headmasterName.slice(0, 16), x + cardW - 16, sigY + 12, { align: 'center' });
      doc.line(x + cardW - 28, sigY + 13, x + cardW - 4, sigY + 13);
    });
  }

  doc.save(`Nota_Kolektif_RAPBM_${notaList.length}_Items_A4.pdf`);
}


