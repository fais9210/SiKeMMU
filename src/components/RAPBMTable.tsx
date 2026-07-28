import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Edit2,
  Check,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import { MadrasahInfo, RAPBMItem } from '../types';
import { formatCurrency, formatNumber } from '../utils/hijri';

interface RAPBMTableProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  availableYears: string[];
  onSelectYear: (year: string) => void;
  onAddNewYear: (newYear: string) => void;
  rapbmData: RAPBMItem[];
  onUpdateItem: (id: string, jumlahAnggaran: number, realita: number, uraian?: string) => Promise<void>;
  onExportPDF: () => void;
}

export const RAPBMTable: React.FC<RAPBMTableProps> = ({
  madrasah,
  selectedYear,
  availableYears,
  onSelectYear,
  onAddNewYear,
  rapbmData,
  onUpdateItem,
  onExportPDF,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUraian, setEditUraian] = useState<string>('');
  const [editAnggaran, setEditAnggaran] = useState<number>(0);
  const [editRealita, setEditRealita] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const totalInAnggaran = rapbmData
    .filter((i) => i.type === 'PENERIMAAN')
    .reduce((sum, item) => sum + (item.jumlahAnggaran || item.realita || 0), 0);

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
              onClick={onExportPDF}
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

          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Klik ikon pensil <Edit2 className="w-3 h-3 inline text-slate-400" /> pada baris untuk mengubah nilai Anggaran / Realita</span>
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
              <col className="w-16" />
              <col className="w-auto" />
              <col className="w-36" />

              {/* PENGELUARAN COLUMNS */}
              <col className="w-12" />
              <col className="w-16" />
              <col className="w-auto" />
              <col className="w-36" />
              <col className="w-36" />
              <col className="w-20" />
            </colgroup>
            <thead>
              {/* Super Header */}
              <tr className="bg-emerald-900 text-white font-bold uppercase tracking-wider text-center">
                <th colSpan={4} className="py-2.5 px-3 border-r border-emerald-800">
                  PENERIMAAN
                </th>
                <th colSpan={6} className="py-2.5 px-3">
                  PENGELUARAN
                </th>
              </tr>
              {/* Sub Header */}
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                {/* Penerimaan */}
                <th className="py-2.5 px-2 text-center border-r whitespace-nowrap">No</th>
                <th className="py-2.5 px-2 text-center border-r whitespace-nowrap">Kode</th>
                <th className="py-2.5 px-3 border-r">Uraian</th>
                <th className="py-2.5 px-3 text-right border-r whitespace-nowrap">Jumlah (Rp)</th>

                {/* Pengeluaran */}
                <th className="py-2.5 px-2 text-center border-r whitespace-nowrap">No</th>
                <th className="py-2.5 px-2 text-center border-r whitespace-nowrap">Kode</th>
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
                  <tr key={p?.id || k?.id || idx} className="hover:bg-slate-50 transition">
                    {/* PENERIMAAN CELLS */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r bg-slate-50/50 whitespace-nowrap">
                      {p ? p.categoryCode : ''}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 border-r font-mono whitespace-nowrap">
                      {p ? p.noKode : ''}
                    </td>
                    <td className="py-2.5 px-3 border-r font-medium leading-relaxed">
                      {p ? (
                        editingId === p.id ? (
                          <textarea
                            rows={2}
                            value={editUraian}
                            onChange={(e) => setEditUraian(e.target.value)}
                            className="w-full p-1 border border-emerald-400 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                            placeholder="Uraian penerimaan"
                          />
                        ) : (
                          <div className="flex items-start justify-between group gap-2">
                            <span className="whitespace-normal break-words">{p.uraian}</span>
                            <button
                              onClick={() => startEdit(p)}
                              title="Edit Penerimaan"
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition text-slate-500 flex-shrink-0 mt-0.5"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      ) : ''}
                    </td>
                    <td className="py-2.5 px-3 text-right border-r font-semibold text-emerald-800 whitespace-nowrap">
                      {p ? (
                        editingId === p.id ? (
                          <div className="flex items-center space-x-1 justify-end">
                            <input
                              type="number"
                              value={editAnggaran}
                              onChange={(e) => setEditAnggaran(Number(e.target.value))}
                              className="w-24 p-1 border border-emerald-400 rounded text-right text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleSave(p.id)}
                              disabled={isSubmitting}
                              title="Simpan"
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition flex-shrink-0 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={isSubmitting}
                              title="Batal"
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition flex-shrink-0 shadow-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          formatNumber(p.jumlahAnggaran)
                        )
                      ) : ''}
                    </td>

                    {/* PENGELUARAN CELLS */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r bg-slate-50/50 whitespace-nowrap">
                      {k ? k.categoryCode : ''}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 border-r font-mono whitespace-nowrap">
                      {k ? k.noKode : ''}
                    </td>
                    <td className="py-2.5 px-3 border-r font-medium leading-relaxed">
                      {k ? (
                        editingId === k.id ? (
                          <textarea
                            rows={2}
                            value={editUraian}
                            onChange={(e) => setEditUraian(e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                            placeholder="Uraian pengeluaran"
                          />
                        ) : (
                          <div className="flex items-start justify-between group gap-2">
                            <span className="whitespace-normal break-words">{k.uraian}</span>
                            <button
                              onClick={() => startEdit(k)}
                              title="Edit Pengeluaran"
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition text-slate-500 flex-shrink-0 mt-0.5"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      ) : ''}
                    </td>

                    <td className="py-2 px-3 text-right border-r font-semibold">
                      {k ? (
                        editingId === k.id ? (
                          <input
                            type="number"
                            value={editAnggaran}
                            onChange={(e) => setEditAnggaran(Number(e.target.value))}
                            className="w-20 p-1 border border-slate-300 rounded text-right text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 block ml-auto"
                          />
                        ) : (
                          formatNumber(k.jumlahAnggaran)
                        )
                      ) : ''}
                    </td>

                    <td className="py-2 px-3 text-right border-r font-semibold text-amber-700">
                      {k ? (
                        editingId === k.id ? (
                          <div className="flex items-center space-x-1 justify-end">
                            <input
                              type="number"
                              value={editRealita}
                              onChange={(e) => setEditRealita(Number(e.target.value))}
                              className="w-20 p-1 border border-amber-400 rounded text-right text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleSave(k.id)}
                              disabled={isSubmitting}
                              title="Simpan"
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition flex-shrink-0 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={isSubmitting}
                              title="Batal"
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition flex-shrink-0 shadow-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          formatNumber(k.realita)
                        )
                      ) : ''}
                    </td>

                    <td className="py-2 px-2 text-center font-bold">
                      {k ? (
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
                      ) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* TOTAL FOOTER ROW */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-xs">
                <td colSpan={2} className="py-3 px-3 text-center border-r border-slate-700">TOTAL</td>
                <td className="py-3 px-3 border-r border-slate-700">JUMLAH PENERIMAAN</td>
                <td className="py-3 px-3 text-right border-r border-slate-700 text-emerald-300 text-sm">
                  {formatCurrency(totalInAnggaran)}
                </td>

                <td colSpan={2} className="py-3 px-3 text-center border-r border-slate-700">TOTAL</td>
                <td className="py-3 px-3 border-r border-slate-700">JUMLAH PENGELUARAN</td>
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
          Lembar Pengesahan Pejabat Madrasah (Dokumen RAPBM 1446-1447 H)
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
              <span className="text-slate-400 block font-medium">Pasuruan, 10 Ramadhan 1447 H</span>
              <span className="font-bold text-slate-800">Bendahara Madrasah</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 underline text-sm">{madrasah.treasurerName}</p>
              <p className="text-[11px] text-slate-500">{madrasah.treasurerTitle}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
