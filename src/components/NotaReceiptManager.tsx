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
  Eye,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Scissors
} from 'lucide-react';
import { MadrasahInfo, RAPBMItem, Transaction } from '../types';
import { formatCurrency, formatNumber, getHijriDate, terbilang } from '../utils/hijri';
import {
  generateNotaPengeluaranPDF,
  generateBatchNotaPengeluaranA4PDF,
  NotaPengeluaranDetail
} from '../utils/pdfGenerator';

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
  // Mode selection: 'single' (A5) or 'collective' (A4 - 4 up)
  const [printMode, setPrintMode] = useState<'single' | 'collective'>('collective');

  // Filter RAPBM Pengeluaran items for selected year
  const pengeluaranItems = rapbmData.filter(
    (item) => item.type === 'PENGELUARAN' && (item.tahunAjaran === selectedYear || !item.tahunAjaran)
  );

  const currentHijriObj = getHijriDate(new Date(), madrasah.hijriOffsetDays);

  // Active Selected Item State for Single Form Mode
  const [selectedRapbmId, setSelectedRapbmId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Batch selection IDs for collective printing
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);

  // Form Fields State for Single Mode
  const [noNota, setNoNota] = useState<string>(`BKK-${Date.now().toString().slice(-6)}`);
  const [tanggalGregorian, setTanggalGregorian] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tanggalHijri, setTanggalHijri] = useState<string>(currentHijriObj.formatted);
  const [penerima, setPenerima] = useState<string>('');
  const [posKode, setPosKode] = useState<string>('1.1');
  const [posNama, setPosNama] = useState<string>('BISYAROH DAN TUNJANGAN - Bisyaroh Guru');
  const [keperluan, setKeperluan] = useState<string>('Biaya Pengeluaran Operasional RAPBM');
  const [jumlah, setJumlah] = useState<number>(0);

  // Global settings for Collective Mode
  const [globalPenerima, setGlobalPenerima] = useState<string>(madrasah.treasurerName || 'Penerima / Rekanan');
  const [globalTanggalGregorian, setGlobalTanggalGregorian] = useState<string>(new Date().toISOString().split('T')[0]);
  const [globalTanggalHijri, setGlobalTanggalHijri] = useState<string>(currentHijriObj.formatted);

  // Update single form fields when a RAPBM item is picked
  const handleSelectRapbmItem = (item: RAPBMItem) => {
    setSelectedRapbmId(item.id);
    setPosKode(item.noKode);
    setPosNama(`${item.categoryName} - ${item.uraian}`);
    setKeperluan(`Pengeluaran Kas Pos ${item.noKode}: ${item.uraian}`);
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

  const handleGlobalDateChange = (val: string) => {
    setGlobalTanggalGregorian(val);
    if (val) {
      const hObj = getHijriDate(val, madrasah.hijriOffsetDays);
      setGlobalTanggalHijri(hObj.formatted);
    }
  };

  // Select first item on initial load and select all for batch
  useEffect(() => {
    if (pengeluaranItems.length > 0) {
      if (!selectedRapbmId) {
        handleSelectRapbmItem(pengeluaranItems[0]);
      }
      if (batchSelectedIds.length === 0) {
        setBatchSelectedIds(pengeluaranItems.map((i) => i.id));
      }
    }
  }, [pengeluaranItems]);

  const filteredPengeluaran = pengeluaranItems.filter(
    (item) =>
      item.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.noKode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleBatchSelect = (id: string) => {
    setBatchSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllBatch = () => {
    setBatchSelectedIds(filteredPengeluaran.map((i) => i.id));
  };

  const handleDeselectAllBatch = () => {
    setBatchSelectedIds([]);
  };

  const handlePrintSinglePDF = () => {
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

  const handlePrintCollectivePDF = () => {
    const selectedItems = pengeluaranItems.filter((i) => batchSelectedIds.includes(i.id));
    if (selectedItems.length === 0) return;

    const notaList: NotaPengeluaranDetail[] = selectedItems.map((item, idx) => ({
      noNota: `BKK-${item.noKode.replace('.', '')}-${(idx + 1).toString().padStart(3, '0')}`,
      tanggalGregorian: globalTanggalGregorian,
      tanggalHijri: globalTanggalHijri,
      penerima: globalPenerima.trim() || 'Penerima / Hak',
      posRapbmKode: item.noKode,
      posRapbmNama: `${item.categoryName} - ${item.uraian}`,
      keperluan: `Pengeluaran Kas Pos ${item.noKode}: ${item.uraian}`,
      jumlah: item.realita > 0 ? item.realita : item.jumlahAnggaran,
      tahunAjaran: selectedYear,
    }));

    generateBatchNotaPengeluaranA4PDF(madrasah, notaList);
  };

  // Selected batch items array
  const selectedBatchItems = pengeluaranItems.filter((i) => batchSelectedIds.includes(i.id));
  const totalA4Pages = Math.ceil(selectedBatchItems.length / 4);

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
              Modul pembuatan bukti pengeluaran kas (Kwitansi RAPBM) sah. Mendukung pencetakan satuan (Kertas A5) maupun{' '}
              <strong className="text-amber-300 underline underline-offset-2">pencetakan kolektif 4 nota sekaligus dalam 1 lembar kertas A4</strong>.
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

      {/* Printing Mode Toggle Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setPrintMode('collective')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-2 cursor-pointer ${
              printMode === 'collective'
                ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>Cetak Kolektif (4 Nota / Lembar A4)</span>
            <span className="bg-amber-400 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-black ml-1">
              Rekomendasi
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPrintMode('single')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-2 cursor-pointer ${
              printMode === 'single'
                ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Cetak Satuan (1 Nota / Lembar A5)</span>
          </button>
        </div>

        {printMode === 'collective' && (
          <div className="hidden md:flex items-center space-x-2 text-xs font-bold text-slate-700 pr-3">
            <Scissors className="w-4 h-4 text-emerald-600" />
            <span>Format Hemat Hemat Kertas: 2 x 2 Grid Grid Cut-Line</span>
          </div>
        )}
      </div>

      {/* Main Mode Content */}
      {printMode === 'collective' ? (
        /* ==================== COLLECTIVE BATCH MODE (4 NOTA PER A4 PAGE) ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Batch Item Checkbox Selector (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Pos RAPBM untuk Cetak Kolektif</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Pilih beberapa pos pengeluaran untuk disatukan dalam kertas A4
                </p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-1 rounded-lg">
                {batchSelectedIds.length} Terpilih
              </span>
            </div>

            {/* Controls: Search + Select All / Deselect All */}
            <div className="space-y-2">
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

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleSelectAllBatch}
                  className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pilih Semua ({filteredPengeluaran.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllBatch}
                  className="text-slate-500 hover:text-rose-600 font-medium flex items-center space-x-1"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Batal Pilih Semua</span>
                </button>
              </div>
            </div>

            {/* Item Checklist List */}
            <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
              {filteredPengeluaran.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-400 text-xs">
                  Tidak ada pos pengeluaran RAPBM yang cocok.
                </div>
              ) : (
                filteredPengeluaran.map((item) => {
                  const isChecked = batchSelectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleBatchSelect(item.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                        isChecked
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span className="font-extrabold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded text-[11px]">
                            Kode {item.noKode}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                          {item.categoryName}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 leading-snug pl-6">{item.uraian}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] pl-6">
                        <span className="text-slate-500">
                          Realisasi: <strong className="text-slate-800">{formatCurrency(item.realita)}</strong>
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

          {/* Right Column: Global Settings & Live A4 4-Up Layout Preview (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Global Settings & Action Box */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Nota Kolektif A4</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-lg">
                    {selectedBatchItems.length} Nota ({totalA4Pages} Kertas A4)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Penerima / Rekanan Kolektif
                  </label>
                  <input
                    type="text"
                    value={globalPenerima}
                    onChange={(e) => setGlobalPenerima(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Transaksi (Masehi)
                  </label>
                  <input
                    type="date"
                    value={globalTanggalGregorian}
                    onChange={(e) => handleGlobalDateChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Hijriyah (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={globalTanggalHijri}
                    onChange={(e) => setGlobalTanggalHijri(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-800"
                  />
                </div>
              </div>

              {/* Main Download Button */}
              <button
                type="button"
                disabled={selectedBatchItems.length === 0}
                onClick={handlePrintCollectivePDF}
                className={`w-full py-3.5 px-6 font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer ${
                  selectedBatchItems.length > 0
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Printer className="w-5 h-5 text-amber-300" />
                <span>
                  Cetak / Unduh PDF Kolektif ({selectedBatchItems.length} Nota dalam {totalA4Pages} Lembar A4)
                </span>
              </button>
            </div>

            {/* Interactive Preview of A4 Sheet 2x2 Layout */}
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-600/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Simulasi Visual Lembar Kertas A4 (2x2 Grid)</span>
                </span>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
                  Format Kertas A4 Portrait
                </span>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl flex justify-center">
                {/* Visual A4 Sheet Container */}
                <div className="w-full max-w-md bg-white border-2 border-slate-300 shadow-xl rounded-sm p-3 relative aspect-[1/1.414] flex flex-col justify-between">
                  {/* Dashed Cut Line overlay */}
                  <div className="absolute inset-0 border-r border-b border-dashed border-slate-400 pointer-events-none style-cut-lines" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%' }}></div>

                  {selectedBatchItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic text-center p-6">
                      Belum ada pos pengeluaran yang dipilih.
                      <br />
                      Silakan centang pos RAPBM di sebelah kiri.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const item = selectedBatchItems[slotIdx];
                        return (
                          <div
                            key={slotIdx}
                            className={`border border-emerald-500 rounded p-2 text-[9px] flex flex-col justify-between bg-emerald-50/30 ${
                              !item ? 'opacity-30 border-dashed border-slate-300 bg-slate-50' : ''
                            }`}
                          >
                            {item ? (
                              <>
                                <div className="text-center border-b border-slate-800 pb-1">
                                  <p className="font-extrabold text-[8px] text-slate-900 uppercase truncate">
                                    {madrasah.namaMadrasah}
                                  </p>
                                  <p className="font-bold text-[7px] text-emerald-800">KWITANSI PENGELUARAN KAS</p>
                                </div>
                                <div className="space-y-0.5 my-1">
                                  <p className="font-bold text-slate-800 truncate">
                                    Kode {item.noKode}: {item.uraian}
                                  </p>
                                  <p className="text-slate-600 truncate">Dibayar Ke: {globalPenerima}</p>
                                  <p className="font-extrabold text-emerald-800 text-[10px]">
                                    {formatCurrency(item.realita > 0 ? item.realita : item.jumlahAnggaran)}
                                  </p>
                                </div>
                                <div className="border-t pt-0.5 flex justify-between text-[7px] text-slate-500">
                                  <span>Ttd Bendahara</span>
                                  <span>Ttd Kepala</span>
                                </div>
                              </>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 text-[8px]">
                                Pos Kosong
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {selectedBatchItems.length > 4 && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between font-medium">
                  <span>
                    💡 Total {selectedBatchItems.length} nota akan otomatis dibagi ke dalam{' '}
                    <strong>{totalA4Pages} halaman A4</strong> (masing-masing 4 nota per halaman).
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* ==================== SINGLE ITEM MODE (1 NOTA PER A5 PAGE) ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: List of RAPBM Pengeluaran Items (5 Cols) */}
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
                  onClick={handlePrintSinglePDF}
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
                  onClick={handlePrintSinglePDF}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Unduh PDF Kwitansi Nota (A5)</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

