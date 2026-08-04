import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileCheck2,
  CheckCircle2,
  Receipt,
  Search,
  Building2,
  Calendar,
  User,
  DollarSign,
  FileText,
  HelpCircle,
  Download,
  Eye
} from 'lucide-react';
import { MadrasahInfo, RAPBMItem, Transaction } from '../types';
import { formatCurrency, formatNumber, getHijriDate, terbilang } from '../utils/hijri';
import { generateNotaPengeluaranPDF, NotaPengeluaranDetail } from '../utils/pdfGenerator';

interface NotaReceiptManagerProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  rapbmData: RAPBMItem[];
  transactions: Transaction[];
  onSelectYear?: (year: string) => void;
  availableYears?: string[];
}

export const NotaReceiptManager: React.FC<NotaReceiptManagerProps> = ({
  madrasah,
  selectedYear,
  rapbmData,
  transactions,
}) => {
  // Filter RAPBM Pengeluaran items for selected year
  const pengeluaranItems = rapbmData.filter(
    (item) => item.type === 'PENGELUARAN' && (item.tahunAjaran === selectedYear || !item.tahunAjaran)
  );

  // Filter Cashbook Expense transactions for selected year
  const expenseTrx = transactions.filter(
    (t) => t.type === 'OUT' && (t.tahunAjaran === selectedYear || !t.tahunAjaran)
  );

  const currentHijriObj = getHijriDate(new Date(), madrasah.hijriOffsetDays);

  // Active Selected Item State for Form
  const [selectedRapbmId, setSelectedRapbmId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form Fields State
  const [noNota, setNoNota] = useState<string>(`BKK-${Date.now().toString().slice(-6)}`);
  const [tanggalGregorian, setTanggalGregorian] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tanggalHijri, setTanggalHijri] = useState<string>(currentHijriObj.formatted);
  const [penerima, setPenerima] = useState<string>('');
  const [posKode, setPosKode] = useState<string>('1.1');
  const [posNama, setPosNama] = useState<string>('BISYAROH DAN TUNJANGAN - Bisyaroh Guru');
  const [keperluan, setKeperluan] = useState<string>('Biaya Pengeluaran Operasional RAPBM');
  const [jumlah, setJumlah] = useState<number>(0);

  // Update form fields when a RAPBM item is picked
  const handleSelectRapbmItem = (item: RAPBMItem) => {
    setSelectedRapbmId(item.id);
    setPosKode(item.noKode);
    setPosNama(`${item.categoryName} - ${item.uraian}`);
    setKeperluan(`Pengeluaran Kas Pos ${item.noKode}: ${item.uraian}`);
    // Default amount to realita if available, else jumlahAnggaran
    setJumlah(item.realita > 0 ? item.realita : item.jumlahAnggaran);
    if (!penerima) setPenerima(madrasah.treasurerName || 'Penerima / Rekanan');
    setNoNota(`BKK-${item.noKode.replace('.', '')}-${Date.now().toString().slice(-4)}`);
  };

  // Update date hijri automatically when gregorian date changes
  const handleDateChange = (val: string) => {
    setTanggalGregorian(val);
    if (val) {
      const hObj = getHijriDate(val, madrasah.hijriOffsetDays);
      setTanggalHijri(hObj.formatted);
    }
  };

  // Select first item on initial load if available
  useEffect(() => {
    if (pengeluaranItems.length > 0 && !selectedRapbmId) {
      handleSelectRapbmItem(pengeluaranItems[0]);
    }
  }, [pengeluaranItems]);

  const filteredPengeluaran = pengeluaranItems.filter(
    (item) =>
      item.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.noKode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintPDF = () => {
    const notaDetail: NotaPengeluaranDetail = {
      noNota,
      tanggalGregorian,
      tanggalHijri,
      penerima: penerima.trim() || 'Penerima',
      posRapbmKode: posKode,
      posRapbmNama: posNama,
      keperluan: keperluan.trim() || 'Pengeluaran Kas RAPBM',
      jumlah: Number(jumlah) || 0,
      tahunAjaran: selectedYear,
    };

    generateNotaPengeluaranPDF(madrasah, notaDetail);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-700/80 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Bukti Pengeluaran Kas Official
              </span>
              <span className="bg-amber-400 text-slate-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                TA {selectedYear}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center space-x-2">
              <Printer className="w-6 h-6 text-emerald-300" />
              <span>Cetak Nota & Kwitansi RAPBM</span>
            </h1>
            <p className="text-xs text-emerald-100 max-w-2xl">
              Modul pembuatan bukti pengeluaran kas (Kwitansi RAPBM) sah berbasis anggaran & realisasi tahun berjalan.
              Nota dapat langsung diunduh dalam format PDF A5 resmi lengkap dengan Terbilang dan Tanda Tangan KOP Madrasah.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-emerald-950/60 p-3 rounded-xl border border-emerald-700/40">
            <Receipt className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div className="text-xs">
              <p className="text-emerald-200">Total Pos Pengeluaran:</p>
              <p className="text-lg font-black text-amber-300">{pengeluaranItems.length} Pos RAPBM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Selection & Right Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of RAPBM Pengeluaran Items (4 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Pilih Pos Pengeluaran RAPBM</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Tahun Ajaran Aktif: <strong className="text-emerald-700">{selectedYear}</strong>
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-lg">
              {filteredPengeluaran.length} Items
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode atau Uraian RAPBM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Item List */}
          <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {filteredPengeluaran.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-400 text-xs">
                Tidak ada pos pengeluaran RAPBM yang cocok.
              </div>
            ) : (
              filteredPengeluaran.map((item) => {
                const isSelected = item.id === selectedRapbmId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRapbmItem(item)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        Kode {item.noKode}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                        {item.categoryName}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 leading-snug">{item.uraian}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        Realita: <strong className="text-slate-800">{formatCurrency(item.realita)}</strong>
                      </span>
                      <span className="text-slate-500">
                        Anggaran: <strong className="text-emerald-700">{formatCurrency(item.jumlahAnggaran)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Form Editor & Interactive Live Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Form Editor Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Form Isian Nota & Kwitansi RAPBM</span>
              </h2>
              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Nota (A5)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Bukti Kas / Nota *
                </label>
                <input
                  type="text"
                  value={noNota}
                  onChange={(e) => setNoNota(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Telah Dibayarkan Kepada *
                </label>
                <input
                  type="text"
                  placeholder="misal: Toko Kitab Barokah / Ustadz Mas'ud"
                  value={penerima}
                  onChange={(e) => setPenerima(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Transaksi Masehi
                </label>
                <input
                  type="date"
                  value={tanggalGregorian}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Hijriyah (Otomatis)
                </label>
                <input
                  type="text"
                  value={tanggalHijri}
                  onChange={(e) => setTanggalHijri(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode & Pos RAPBM
                </label>
                <input
                  type="text"
                  value={`[${posKode}] ${posNama}`}
                  onChange={(e) => setPosNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Pengeluaran (Rp) *
                </label>
                <input
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl font-extrabold text-emerald-900 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Uraian Detail Keperluan *
                </label>
                <textarea
                  rows={2}
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  placeholder="Keterangan lengkap penggunaan dana pengeluaran..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-amber-900 flex items-center space-x-1">
                <span>Terbilang Otomatis:</span>
              </p>
              <p className="font-extrabold italic text-amber-950 text-sm">
                "{terbilang(jumlah)}"
              </p>
            </div>
          </div>

          {/* Live Printable Preview Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-600/60 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center space-x-1">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Live Nota / Kwitansi RAPBM</span>
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
                Format Kwitansi Resmi A5
              </span>
            </div>

            {/* Paper Document Representation */}
            <div className="p-5 bg-gradient-to-b from-emerald-50/30 to-white border border-slate-300 rounded-xl shadow-inner text-slate-800 space-y-4 text-xs font-serif">
              {/* Kop Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                <h3 className="font-extrabold text-base tracking-wide text-slate-900 uppercase">
                  {madrasah.namaMadrasah}
                </h3>
                <p className="text-[11px] text-slate-600 font-sans">
                  {madrasah.alamat}, Kec. {madrasah.kecamatan}, Kab. {madrasah.kabupaten}
                </p>
              </div>

              {/* Title & Document Info */}
              <div className="text-center space-y-1">
                <h4 className="font-black text-sm text-emerald-800 tracking-wider uppercase underline decoration-emerald-500 font-sans">
                  KWITANSI / NOTA BUKTI PENGELUARAN KAS
                </h4>
                <p className="text-[10px] text-slate-500 font-sans font-semibold">
                  Tahun Ajaran RAPBM: {selectedYear}
                </p>
              </div>

              <div className="flex justify-between text-[11px] font-sans font-bold pt-1 border-b pb-2 text-slate-700">
                <span>No. Bukti Kas: <span className="text-emerald-900">{noNota}</span></span>
                <span>Tanggal: {tanggalGregorian} ({tanggalHijri})</span>
              </div>

              {/* Table Data */}
              <div className="space-y-2 font-sans text-xs">
                <div className="grid grid-cols-12 gap-1 py-1 border-b border-slate-200">
                  <span className="col-span-4 font-semibold text-slate-600">Telah Dibayarkan Kepada</span>
                  <span className="col-span-8 font-bold text-slate-900">: {penerima || '-'}</span>
                </div>
                <div className="grid grid-cols-12 gap-1 py-1 border-b border-slate-200">
                  <span className="col-span-4 font-semibold text-slate-600">Pos Anggaran RAPBM</span>
                  <span className="col-span-8 font-bold text-slate-900">: [{posKode}] {posNama}</span>
                </div>
                <div className="grid grid-cols-12 gap-1 py-1 border-b border-slate-200">
                  <span className="col-span-4 font-semibold text-slate-600">Uraian / Keperluan</span>
                  <span className="col-span-8 text-slate-900">: {keperluan || '-'}</span>
                </div>
                <div className="grid grid-cols-12 gap-1 py-1 border-b border-slate-200">
                  <span className="col-span-4 font-semibold text-slate-600">Jumlah Terbayar</span>
                  <span className="col-span-8 font-extrabold text-emerald-800 text-sm">: {formatCurrency(jumlah)}</span>
                </div>
                <div className="grid grid-cols-12 gap-1 py-1 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <span className="col-span-3 font-semibold text-emerald-900">Terbilang</span>
                  <span className="col-span-9 font-extrabold italic text-emerald-950">: # {terbilang(jumlah)} #</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-3 gap-2 text-center font-sans text-[11px]">
                <div>
                  <p className="text-slate-600">Yang Menerima / Hak,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline text-slate-900">{penerima || '( Penerima )'}</p>
                </div>
                <div>
                  <p className="text-slate-600">Bendahara Madrasah,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline text-slate-900">{madrasah.treasurerName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Karangmenggah, {tanggalHijri}</p>
                  <p className="text-slate-600 font-medium">Kepala Madrasah,</p>
                  <div className="h-10"></div>
                  <p className="font-bold underline text-slate-900">{madrasah.headmasterName}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handlePrintPDF}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Unduh PDF Kwitansi Nota (A5)</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
