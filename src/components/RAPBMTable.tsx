import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Edit2,
  Check,
  X,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  PlusCircle,
  Trash2,
  Printer,
} from 'lucide-react';
import { MadrasahInfo, RAPBMItem } from '../types';
import { formatCurrency, formatNumber, getHijriDate } from '../utils/hijri';
import { generateNotaPengeluaranPDF } from '../utils/pdfGenerator';

interface InlineNumberCellProps {
  value: number;
  onSave: (newVal: number) => void;
  className?: string;
  isCurrencyColor?: string;
}

const InlineNumberCell: React.FC<InlineNumberCellProps> = ({
  value,
  onSave,
  className = '',
  isCurrencyColor = 'text-slate-900',
}) => {
  const [val, setVal] = useState<string>(value !== undefined && value !== null ? value.toString() : '0');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setVal(value !== undefined && value !== null ? value.toString() : '0');
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const num = Number(val);
    if (!isNaN(num) && num !== value) {
      onSave(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="number"
      value={val}
      onFocus={(e) => {
        setIsFocused(true);
        e.target.select();
      }}
      onClick={(e) => {
        if (!isFocused) {
          e.currentTarget.select();
        }
      }}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-full py-1 px-2 border border-slate-300 hover:border-emerald-500 focus:border-emerald-600 rounded-lg text-right text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold transition shadow-2xs ${isCurrencyColor} ${className}`}
    />
  );
};

interface InlineTextCellProps {
  value: string;
  onSave: (newVal: string) => void;
  className?: string;
}

const InlineTextCell: React.FC<InlineTextCellProps> = ({
  value,
  onSave,
  className = '',
}) => {
  const [val, setVal] = useState<string>(value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setVal(value || '');
    }
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    if (val.trim() !== '' && val !== value) {
      onSave(val.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={val}
      onFocus={(e) => {
        setIsFocused(true);
      }}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-full py-1 px-2 border border-slate-300 hover:border-emerald-500 focus:border-emerald-600 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition shadow-2xs ${className}`}
    />
  );
};

interface RAPBMTableProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  availableYears: string[];
  onSelectYear: (year: string) => void;
  onAddNewYear: (newYear: string) => void;
  rapbmData: RAPBMItem[];
  onUpdateItem: (id: string, jumlahAnggaran: number, realita: number, uraian?: string, noKode?: string, categoryName?: string) => Promise<void>;
  onAddItem?: (item: Omit<RAPBMItem, 'id'>) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  onExportPDF: (customTanggal?: string) => void;
}

export const RAPBMTable: React.FC<RAPBMTableProps> = ({
  madrasah,
  selectedYear,
  availableYears,
  onSelectYear,
  onAddNewYear,
  rapbmData,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onExportPDF,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directEditMode, setDirectEditMode] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUraian, setEditUraian] = useState<string>('');
  const [editAnggaran, setEditAnggaran] = useState<number>(0);
  const [editRealita, setEditRealita] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Add Item RAPBM State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PENERIMAAN' | 'PENGELUARAN'>('PENERIMAAN');
  const [newKode, setNewKode] = useState('');
  const [newUraian, setNewUraian] = useState('');
  const [newAnggaran, setNewAnggaran] = useState<number | ''>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Modal Full Edit Item State
  const [fullEditItem, setFullEditItem] = useState<RAPBMItem | null>(null);
  const [fullEditKode, setFullEditKode] = useState('');
  const [fullEditCategory, setFullEditCategory] = useState('');
  const [fullEditUraian, setFullEditUraian] = useState('');
  const [fullEditAnggaran, setFullEditAnggaran] = useState<number>(0);
  const [fullEditRealita, setFullEditRealita] = useState<number>(0);

  const openFullEditModal = (item: RAPBMItem) => {
    setFullEditItem(item);
    setFullEditKode(item.noKode);
    setFullEditCategory(item.categoryName);
    setFullEditUraian(item.uraian);
    setFullEditAnggaran(item.jumlahAnggaran);
    setFullEditRealita(item.realita);
  };

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullEditItem) return;
    setIsSubmitting(true);
    try {
      await onUpdateItem(
        fullEditItem.id,
        fullEditAnggaran,
        fullEditRealita,
        fullEditUraian,
        fullEditKode,
        fullEditCategory
      );
      setFullEditItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddItemModal = (type: 'PENERIMAAN' | 'PENGELUARAN') => {
    setModalType(type);
    setNewKode('');
    setNewUraian('');
    setNewAnggaran('');
    setNewCategoryName('');
    setIsModalOpen(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUraian.trim() || !onAddItem) return;

    setIsSubmittingNew(true);
    try {
      await onAddItem({
        tahunAjaran: selectedYear,
        type: modalType,
        categoryCode: 'LAIN',
        categoryName: newCategoryName.trim() || (modalType === 'PENERIMAAN' ? 'PENDAPATAN LAIN' : 'PENGELUARAN LAIN'),
        noUrut: '1',
        noKode: newKode.trim() || `${modalType === 'PENERIMAAN' ? 'P' : 'K'}-${rapbmData.length + 1}`,
        uraian: newUraian.trim(),
        jumlahAnggaran: Number(newAnggaran) || 0,
        realita: 0,
        persentase: 100,
      });

      setIsModalOpen(false);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleDirectPrintNota = (item: RAPBMItem) => {
    const hijriObj = getHijriDate(new Date(), madrasah.hijriOffsetDays);
    generateNotaPengeluaranPDF(madrasah, {
      noNota: `BKK-${item.noKode.replace('.', '')}-${Date.now().toString().slice(-4)}`,
      tanggalGregorian: new Date().toISOString().split('T')[0],
      tanggalHijri: hijriObj.formatted,
      penerima: madrasah.treasurerName || 'Penerima / Hak',
      posRapbmKode: item.noKode,
      posRapbmNama: `${item.categoryName} - ${item.uraian}`,
      keperluan: `Pengeluaran Kas RAPBM [Pos Kode ${item.noKode}]: ${item.uraian}`,
      jumlah: item.realita > 0 ? item.realita : item.jumlahAnggaran,
      tahunAjaran: selectedYear,
    });
  };

  // Editable Tanggal Pengesahan - Defaults to today's date format
  const defaultTanggalPengesahan = `${madrasah.kabupaten || 'Pasuruan'}, ${getHijriDate(new Date(), madrasah.hijriOffsetDays).formatted}`;
  const [tanggalPengesahan, setTanggalPengesahan] = useState<string>(() => {
    return localStorage.getItem('rapbm_tanggal_pengesahan') || defaultTanggalPengesahan;
  });
  const [isEditingTanggal, setIsEditingTanggal] = useState(false);

  const sortByKode = (a: RAPBMItem, b: RAPBMItem) => {
    const catComp = (a.categoryCode || '').localeCompare(b.categoryCode || '', undefined, { numeric: true });
    if (catComp !== 0) return catComp;
    return (a.noKode || '').localeCompare(b.noKode || '', undefined, { numeric: true });
  };

  const penerimaanList = rapbmData
    .filter((i) => i.type === 'PENERIMAAN' && i.uraian.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(sortByKode);

  const pengeluaranList = rapbmData
    .filter((i) => i.type === 'PENGELUARAN' && i.uraian.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(sortByKode);

  const maxRows = Math.max(penerimaanList.length, pengeluaranList.length);

  // Totals
  const totalInRealita = rapbmData
    .filter((i) => i.type === 'PENERIMAAN')
    .reduce((sum, item) => sum + (item.realita > 0 ? item.realita : (item.jumlahAnggaran || 0)), 0);

  const totalOutAnggaran = rapbmData
    .filter((i) => i.type === 'PENGELUARAN')
    .reduce((sum, item) => sum + (item.jumlahAnggaran || 0), 0);

  const totalOutRealita = rapbmData
    .filter((i) => i.type === 'PENGELUARAN')
    .reduce((sum, item) => sum + (item.realita || 0), 0);

  const totalPercentage = Math.round((totalOutRealita / (totalOutAnggaran || 1)) * 100);

  const startEdit = (item: RAPBMItem) => {
    setEditingId(item.id);
    setEditUraian(item.uraian);
    setEditAnggaran(item.jumlahAnggaran);
    setEditRealita(item.realita);
  };

  const handleSave = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onUpdateItem(id, editAnggaran, editRealita, editUraian);
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="rapbm-table-container" className="space-y-6">
      
      {/* Document Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Dokumen Resmi Madrasah</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              RENCANA ANGGARAN PENDAPATAN DAN BELANJA MADRASAH (RAPBM)
            </h2>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-slate-500 font-medium">
                Tahun Ajaran Aktif:
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                TA {selectedYear}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-export-rapbm-pdf-main"
              onClick={() => onExportPDF(tanggalPengesahan)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition flex items-center space-x-2 text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Cetak RAPBM PDF ({selectedYear})</span>
            </button>
          </div>
        </div>

        {/* Year Selector Toolbar Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950">Pilih / Ganti Tahun RAPBM:</span>
            <select
              id="rapbm-page-year-select"
              value={selectedYear}
              onChange={(e) => {
                if (e.target.value === 'ADD_NEW') {
                  onAddNewYear('');
                } else {
                  onSelectYear(e.target.value);
                }
              }}
              className="bg-white border border-emerald-300 font-bold text-xs text-emerald-900 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  TA {y}
                </option>
              ))}
              <option value="ADD_NEW" className="text-emerald-700 font-bold">
                + Tambah Tahun Ajaran Baru...
              </option>
            </select>
          </div>

          <button
            onClick={() => onAddNewYear('')}
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1"
          >
            <span>+ Buat RAPBM Tahun Baru</span>
          </button>
        </div>

        {/* Institution Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <div>
            <span className="text-slate-400 block font-medium">Nama Madrasah</span>
            <span className="font-bold text-slate-800">{madrasah.namaMadrasah}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Alamat</span>
            <span className="font-bold text-slate-800">{madrasah.alamat}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Kecamatan</span>
            <span className="font-bold text-slate-800">{madrasah.kecamatan}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Kabupaten</span>
            <span className="font-bold text-slate-800">{madrasah.kabupaten}</span>
          </div>
        </div>

        {/* Search & Tool Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari uraian anggaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setDirectEditMode(!directEditMode)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer border ${
                directEditMode
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{directEditMode ? 'Mode Edit Langsung: AKTIF' : 'Mode Edit Langsung: NONAKTIF'}</span>
            </button>

            <span className="text-slate-500 hidden md:flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {directEditMode
                  ? 'Ubah angka/uraian secara langsung pada tabel, tersimpan otomatis saat Enter atau pindah kolom.'
                  : 'Klik ikon pensil atau sel untuk mengedit data.'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Table matching scanned document */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Mobile horizontal scroll hint */}
        <div className="lg:hidden flex items-center justify-between px-3.5 py-2 bg-amber-50 text-amber-900 text-[11px] font-semibold border-b border-amber-200/80">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Geser tabel ke kanan/kiri untuk melihat seluruh kolom Penerimaan & Pengeluaran</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
            <colgroup>
              {/* PENERIMAAN COLUMNS */}
              <col className="w-12" />
              <col className="w-auto" />
              <col className="w-36" />

              {/* PENGELUARAN COLUMNS */}
              <col className="w-12" />
              <col className="w-auto" />
              <col className="w-36" />
              <col className="w-36" />
              <col className="w-20" />
            </colgroup>
            <thead>
              {/* Super Header */}
              <tr className="bg-emerald-900 text-white font-bold uppercase tracking-wider text-center">
                <th colSpan={3} className="py-2.5 px-3 border-r border-emerald-800">
                  <div className="flex items-center justify-between px-2">
                    <span>PENERIMAAN</span>
                    <button
                      type="button"
                      onClick={() => openAddItemModal('PENERIMAAN')}
                      className="text-xs bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded-lg text-white font-medium flex items-center space-x-1 transition cursor-pointer normal-case"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Tambah Item Penerimaan</span>
                    </button>
                  </div>
                </th>
                <th colSpan={5} className="py-2.5 px-3">
                  <div className="flex items-center justify-between px-2">
                    <span>PENGELUARAN</span>
                    <button
                      type="button"
                      onClick={() => openAddItemModal('PENGELUARAN')}
                      className="text-xs bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded-lg text-white font-medium flex items-center space-x-1 transition cursor-pointer normal-case"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Tambah Item Pengeluaran</span>
                    </button>
                  </div>
                </th>
              </tr>
              {/* Sub Header */}
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                {/* Penerimaan */}
                <th className="py-2.5 px-2 text-center border-r whitespace-nowrap">No</th>
                <th className="py-2.5 px-3 border-r">Uraian</th>
                <th className="py-2.5 px-3 text-right border-r whitespace-nowrap">Jumlah (Rp)</th>

                {/* Pengeluaran */}
                <th className="py-2.5 px-2 text-center border-r whitespace-nowrap">No</th>
                <th className="py-2.5 px-3 border-r">Uraian</th>
                <th className="py-2.5 px-3 text-right border-r whitespace-nowrap">Anggaran (Rp)</th>
                <th className="py-2.5 px-3 text-right border-r whitespace-nowrap">Realita (Rp)</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">% tase</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {Array.from({ length: maxRows }).map((_, idx) => {
                const p = penerimaanList[idx];
                const k = pengeluaranList[idx];

                return (
                  <tr key={`row-${idx}-${p ? p.id : 'nop'}-${k ? k.id : 'nok'}`} className="hover:bg-slate-50 transition">
                    {/* PENERIMAAN CELLS */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r bg-slate-50/50 whitespace-nowrap">
                      {p ? p.categoryCode : ''}
                    </td>
                    <td className="py-2 px-2 border-r font-medium leading-relaxed">
                      {p ? (
                        <div className="space-y-1">
                          {directEditMode ? (
                            <InlineTextCell
                              value={p.uraian}
                              onSave={(val) => onUpdateItem(p.id, p.jumlahAnggaran, p.realita, val)}
                            />
                          ) : editingId === p.id ? (
                            <textarea
                              rows={2}
                              value={editUraian}
                              onChange={(e) => setEditUraian(e.target.value)}
                              className="w-full p-1 border border-emerald-400 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                              placeholder="Uraian penerimaan"
                            />
                          ) : (
                            <div
                              onClick={() => startEdit(p)}
                              className="flex items-start justify-between group gap-2 cursor-pointer hover:text-emerald-700 py-0.5 px-1"
                            >
                              <span className="whitespace-normal break-words">{p.uraian}</span>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openFullEditModal(p); }}
                                  title="Edit Detail Item"
                                  className="p-1 hover:bg-slate-200 rounded text-slate-600"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                {onDeleteItem && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); if (confirm(`Hapus item penerimaan "${p.uraian}"?`)) onDeleteItem(p.id); }}
                                    title="Hapus Item"
                                    className="p-1 hover:bg-rose-100 rounded text-rose-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {(p.noKode === '2.1' || p.uraian.toLowerCase().includes('syahri')) ? (
                            <div className="flex items-center mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shadow-2xs" title="Realita otomatis disinkronkan dengan total Pembayaran Syahriah santri tahun ini">
                                ⚡ Sync Syahriah
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-300 shadow-2xs" title="Realita otomatis dicatat dari transaksi Buku Kas Real-time tahun ini">
                                ⚡ Sync Buku Kas
                              </span>
                            </div>
                          )}
                        </div>
                      ) : ''}
                    </td>
                    <td className="py-2 px-2 text-right border-r font-semibold text-emerald-800 whitespace-nowrap">
                      {p ? (
                        directEditMode ? (
                          <InlineNumberCell
                            value={p.realita > 0 ? p.realita : p.jumlahAnggaran}
                            isCurrencyColor="text-emerald-800"
                            onSave={(val) => onUpdateItem(p.id, val, val, p.uraian)}
                          />
                        ) : editingId === p.id ? (
                          <div className="flex items-center space-x-1 justify-end">
                            <input
                              type="number"
                              value={editAnggaran}
                              onChange={(e) => {
                                setEditAnggaran(Number(e.target.value));
                                setEditRealita(Number(e.target.value));
                              }}
                              className="w-24 p-1 border border-emerald-400 rounded text-right text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSave(p.id)}
                              disabled={isSubmitting}
                              title="Simpan"
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition flex-shrink-0 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={isSubmitting}
                              title="Batal"
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition flex-shrink-0 shadow-xs cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => startEdit(p)} className="cursor-pointer hover:text-emerald-900 py-0.5 px-1 font-bold">
                            {formatNumber(p.realita > 0 ? p.realita : p.jumlahAnggaran)}
                          </div>
                        )
                      ) : ''}
                    </td>

                    {/* PENGELUARAN CELLS */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r bg-slate-50/50 whitespace-nowrap">
                      {k ? k.categoryCode : ''}
                    </td>
                    <td className="py-2 px-2 border-r font-medium leading-relaxed">
                      {k ? (
                        <div className="space-y-1">
                          {directEditMode ? (
                            <InlineTextCell
                              value={k.uraian}
                              onSave={(val) => onUpdateItem(k.id, k.jumlahAnggaran, k.realita, val)}
                            />
                          ) : editingId === k.id ? (
                            <textarea
                              rows={2}
                              value={editUraian}
                              onChange={(e) => setEditUraian(e.target.value)}
                              className="w-full p-1 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                              placeholder="Uraian pengeluaran"
                            />
                          ) : (
                            <div
                              onClick={() => startEdit(k)}
                              className="flex items-start justify-between group gap-2 cursor-pointer hover:text-emerald-700 py-0.5 px-1"
                            >
                              <span className="whitespace-normal break-words">{k.uraian}</span>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openFullEditModal(k); }}
                                  title="Edit Detail Item"
                                  className="p-1 hover:bg-slate-200 rounded text-slate-600"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                {onDeleteItem && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); if (confirm(`Hapus item pengeluaran "${k.uraian}"?`)) onDeleteItem(k.id); }}
                                    title="Hapus Item"
                                    className="p-1 hover:bg-rose-100 rounded text-rose-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {(k.noKode === '1.1' || k.uraian.toLowerCase().includes('bisyaroh guru')) ? (
                            <div className="flex items-center mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-2xs" title="Realita otomatis disinkronkan dengan total Slip Gaji Guru tahun ini">
                                ⚡ Sync Slip Gaji
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-300 shadow-2xs" title="Realita otomatis dicatat dari transaksi Buku Kas Real-time tahun ini">
                                ⚡ Sync Buku Kas
                              </span>
                            </div>
                          )}
                        </div>
                      ) : ''}
                    </td>

                    <td className="py-2 px-2 text-right border-r font-semibold">
                      {k ? (
                        directEditMode ? (
                          <InlineNumberCell
                            value={k.jumlahAnggaran}
                            onSave={(val) => onUpdateItem(k.id, val, k.realita, k.uraian)}
                          />
                        ) : editingId === k.id ? (
                          <input
                            type="number"
                            value={editAnggaran}
                            onChange={(e) => setEditAnggaran(Number(e.target.value))}
                            className="w-20 p-1 border border-slate-300 rounded text-right text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 block ml-auto"
                          />
                        ) : (
                          <div onClick={() => startEdit(k)} className="cursor-pointer hover:text-emerald-900 py-0.5 px-1">
                            {formatNumber(k.jumlahAnggaran)}
                          </div>
                        )
                      ) : ''}
                    </td>

                    <td className="py-2 px-2 text-right border-r font-semibold text-amber-700">
                      {k ? (
                        directEditMode ? (
                          <InlineNumberCell
                            value={k.realita}
                            isCurrencyColor="text-amber-700"
                            onSave={(val) => onUpdateItem(k.id, k.jumlahAnggaran, val, k.uraian)}
                          />
                        ) : editingId === k.id ? (
                          <div className="flex items-center space-x-1 justify-end">
                            <input
                              type="number"
                              value={editRealita}
                              onChange={(e) => setEditRealita(Number(e.target.value))}
                              className="w-20 p-1 border border-amber-400 rounded text-right text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSave(k.id)}
                              disabled={isSubmitting}
                              title="Simpan"
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition flex-shrink-0 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={isSubmitting}
                              title="Batal"
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition flex-shrink-0 shadow-xs cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => startEdit(k)} className="cursor-pointer hover:text-amber-900 py-0.5 px-1">
                            {formatNumber(k.realita)}
                          </div>
                        )
                      ) : ''}
                    </td>

                    <td className="py-2 px-2 text-center font-bold">
                      {k ? (
                        <div className="flex items-center justify-center space-x-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              k.persentase >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : k.persentase >= 70
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {k.persentase}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDirectPrintNota(k)}
                            title="Cetak Kwitansi / Nota Bukti Pengeluaran Kas RAPBM"
                            className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* TOTAL FOOTER ROW */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-xs">
                <td className="py-3 px-2 text-center border-r border-slate-700">TOTAL</td>
                <td className="py-3 px-3 border-r border-slate-700 font-bold">JUMLAH PENERIMAAN</td>
                <td className="py-3 px-3 text-right border-r border-slate-700 text-emerald-300 text-sm">
                  {formatCurrency(totalInRealita)}
                </td>

                <td className="py-3 px-2 text-center border-r border-slate-700">TOTAL</td>
                <td className="py-3 px-3 border-r border-slate-700 font-bold">JUMLAH PENGELUARAN</td>
                <td className="py-3 px-3 text-right border-r border-slate-700 text-amber-200 text-sm">
                  {formatCurrency(totalOutAnggaran)}
                </td>
                <td className="py-3 px-3 text-right border-r border-slate-700 text-emerald-300 text-sm">
                  {formatCurrency(totalOutRealita)}
                </td>
                <td className="py-3 px-2 text-center text-amber-300 font-bold text-sm">
                  {totalPercentage}%
                </td>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>

      {/* Official Signatures Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-4">
          Lembar Pengesahan Pejabat Madrasah (Dokumen RAPBM {selectedYear})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-slate-400 block font-medium">Mengetahui,</span>
              <span className="font-bold text-slate-800">Pengurus Madrasah</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 underline text-sm">{madrasah.pengurusName}</p>
              <p className="text-[11px] text-slate-500">{madrasah.pengurusTitle}</p>
            </div>
          </div>

          <div className="space-y-12 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-slate-400 block font-medium">Menyetujui,</span>
              <span className="font-bold text-slate-800">Kepala Madrasah</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 underline text-sm">{madrasah.headmasterName}</p>
              <p className="text-[11px] text-slate-500">{madrasah.headmasterTitle}</p>
            </div>
          </div>

          <div className="space-y-12 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              {isEditingTanggal ? (
                <div className="flex items-center gap-1 justify-center mb-1">
                  <input
                    type="text"
                    value={tanggalPengesahan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTanggalPengesahan(val);
                      localStorage.setItem('rapbm_tanggal_pengesahan', val);
                    }}
                    className="px-2 py-1 text-xs border border-emerald-400 rounded bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-[210px] text-center shadow-xs"
                    placeholder="Pasuruan, 10 Ramadhan 1447 H"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingTanggal(false)}
                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition flex-shrink-0"
                    title="Simpan Tanggal"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-slate-600 font-semibold">{tanggalPengesahan}</span>
                  <button
                    onClick={() => setIsEditingTanggal(true)}
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded transition"
                    title="Edit Tanggal Pengesahan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span className="font-bold text-slate-800">Bendahara Madrasah</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 underline text-sm">{madrasah.treasurerName}</p>
              <p className="text-[11px] text-slate-500">{madrasah.treasurerTitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New RAPBM Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Tambah Item {modalType === 'PENERIMAAN' ? 'Penerimaan' : 'Pengeluaran'} RAPBM
                </h3>
                <p className="text-xs text-slate-500">
                  Tahun Ajaran Aktif: <span className="font-bold text-emerald-700">TA {selectedYear}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Item RAPBM</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl font-bold">
                  <button
                    type="button"
                    onClick={() => setModalType('PENERIMAAN')}
                    className={`py-1.5 rounded-lg text-xs transition ${
                      modalType === 'PENERIMAAN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Penerimaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('PENGELUARAN')}
                    className={`py-1.5 rounded-lg text-xs transition ${
                      modalType === 'PENGELUARAN' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Group (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: PENDAPATAN LAIN, KEGIATAN SISWA"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama / Uraian Anggaran *
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi detail item penerimaan atau pengeluaran..."
                  value={newUraian}
                  onChange={(e) => setNewUraian(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rencana Jumlah Anggaran (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newAnggaran}
                  onChange={(e) => setNewAnggaran(e.target.value ? Number(e.target.value) : '')}
                  min={0}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !newUraian.trim()}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition shadow-sm disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Menyimpan...' : 'Simpan Item RAPBM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Item RAPBM */}
      {fullEditItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-100 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  Edit Item RAPBM ({fullEditItem.type})
                </h3>
                <p className="text-xs text-emerald-300">
                  TA {selectedYear}
                </p>
              </div>
              <button
                onClick={() => setFullEditItem(null)}
                className="p-1 text-emerald-300 hover:text-white rounded"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori / Group
                </label>
                <input
                  type="text"
                  value={fullEditCategory}
                  onChange={(e) => setFullEditCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama / Uraian Anggaran *
                </label>
                <textarea
                  rows={2}
                  value={fullEditUraian}
                  onChange={(e) => setFullEditUraian(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Anggaran (Rp)
                  </label>
                  <input
                    type="number"
                    value={fullEditAnggaran}
                    onChange={(e) => setFullEditAnggaran(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Realita (Rp)
                  </label>
                  <input
                    type="number"
                    value={fullEditRealita}
                    onChange={(e) => setFullEditRealita(Number(e.target.value))}
                    min={0}
                    disabled={
                      (fullEditItem.type === 'PENGELUARAN' && (fullEditItem.noKode === '1.1' || fullEditItem.uraian.toLowerCase().includes('bisyaroh guru'))) ||
                      (fullEditItem.type === 'PENERIMAAN' && (fullEditItem.noKode === '2.1' || fullEditItem.uraian.toLowerCase().includes('uang syahriyah')))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-amber-800 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:bg-slate-100"
                  />
                  {(fullEditItem.type === 'PENGELUARAN' && (fullEditItem.noKode === '1.1' || fullEditItem.uraian.toLowerCase().includes('bisyaroh guru'))) ? (
                    <p className="text-[10px] text-amber-700 mt-1 italic font-medium">
                      * Realita otomatis di-sync dari module Slip Gaji Guru TA {selectedYear}.
                    </p>
                  ) : (fullEditItem.type === 'PENERIMAAN' && (fullEditItem.noKode === '2.1' || fullEditItem.uraian.toLowerCase().includes('syahri'))) ? (
                    <p className="text-[10px] text-emerald-700 mt-1 italic font-medium">
                      * Realita otomatis di-sync dari module Pembayaran Syahriah Santri TA {selectedYear}.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1 italic font-medium">
                      * Realita otomatis dicatat dari transaksi Buku Kas Real-time TA {selectedYear}.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setFullEditItem(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !fullEditUraian.trim()}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
