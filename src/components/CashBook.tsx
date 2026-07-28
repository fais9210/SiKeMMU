import React, { useState } from 'react';
import {
  BookOpenCheck,
  PlusCircle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar,
  Download,
  Receipt,
  Tag,
} from 'lucide-react';
import { MadrasahInfo, RAPBMItem, Transaction } from '../types';
import { formatCurrency, getHijriDate } from '../utils/hijri';

interface CashBookProps {
  madrasah: MadrasahInfo;
  transactions: Transaction[];
  rapbmData: RAPBMItem[];
  onAddTransaction: (trx: Omit<Transaction, 'id'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCashflowPDF: () => void;
  isOpenModal: boolean;
  setIsOpenModal: (open: boolean) => void;
}

export const CashBook: React.FC<CashBookProps> = ({
  madrasah,
  transactions,
  rapbmData,
  onAddTransaction,
  onDeleteTransaction,
  onExportCashflowPDF,
  isOpenModal,
  setIsOpenModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // New Transaction Form State
  const [trxType, setTrxType] = useState<'IN' | 'OUT'>('OUT');
  const [dateGregorian, setDateGregorian] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedRapbmCode, setSelectedRapbmCode] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [recordedBy, setRecordedBy] = useState(madrasah.treasurerName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedHijri = getHijriDate(dateGregorian, madrasah.hijriOffsetDays);

  // Filter RAPBM options based on selected transaction type
  const availableRapbmItems = rapbmData.filter((item) =>
    trxType === 'IN' ? item.type === 'PENERIMAAN' : item.type === 'PENGELUARAN'
  );

  const handleRapbmCodeChange = (code: string) => {
    setSelectedRapbmCode(code);
    const item = rapbmData.find((r) => r.noKode === code);
    if (item) {
      setCategory(item.categoryName);
      setDescription(item.uraian);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        dateGregorian,
        dateHijri: calculatedHijri.formatted,
        type: trxType,
        rapbmCode: selectedRapbmCode || undefined,
        category: category || (trxType === 'IN' ? 'PENERIMAAN LAIN' : 'PENGELUARAN LAIN'),
        description,
        amount: Number(amount),
        recordedBy: recordedBy || madrasah.treasurerName,
        receiptNumber: `KW-MU22-${Math.floor(1000 + Math.random() * 9000)}`,
      });

      // Reset Form
      setDescription('');
      setAmount('');
      setSelectedRapbmCode('');
      setIsOpenModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      t.receiptNumber.toLowerCase().includes(term) ||
      t.recordedBy.toLowerCase().includes(term) ||
      t.dateGregorian.toLowerCase().includes(term) ||
      t.dateHijri.toLowerCase().includes(term) ||
      (t.rapbmCode && t.rapbmCode.toLowerCase().includes(term));
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Totals
  let totalIn = 0;
  let totalOut = 0;
  transactions.forEach((t) => {
    if (t.type === 'IN') totalIn += t.amount;
    if (t.type === 'OUT') totalOut += t.amount;
  });

  return (
    <div id="cashbook-container" className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <BookOpenCheck className="w-4 h-4" />
              <span>Buku Kas Umum Real-time</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Pencatatan Arus Kas & Transaksi Keuangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jurnal pengeluaran dan penerimaan dana real-time terintegrasi dengan kode RAPBM 1446-1447 H.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-export-cashflow-pdf"
              onClick={onExportCashflowPDF}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs transition flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Cetak Buku Kas PDF</span>
            </button>

            <button
              id="btn-open-modal-trx"
              onClick={() => setIsOpenModal(true)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Transaksi Kas</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari transaksi, ustadz/pencatat, tanggal, kwitansi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-4 h-4 flex items-center justify-center font-bold transition"
                title="Bersihkan pencarian"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterType === 'IN'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Penerimaan
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filterType === 'OUT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pengeluaran
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Menampilkan {filteredTransactions.length} Transaksi Real-time</span>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-700">Total Masuk: {formatCurrency(totalIn)}</span>
            <span className="text-rose-700">Total Keluar: {formatCurrency(totalOut)}</span>
            <span className="text-slate-900 font-bold">Saldo: {formatCurrency(totalIn - totalOut)}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau tambah transaksi baru.</p>
            </div>
          ) : (
            filteredTransactions.map((trx) => (
              <div
                key={trx.id}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`p-2.5 rounded-2xl mt-0.5 ${
                      trx.type === 'IN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {trx.type === 'IN' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{trx.description}</span>
                      {trx.rapbmCode && (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-200">
                          Kode RAPBM: {trx.rapbmCode}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {trx.dateHijri}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center text-slate-600">
                        <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {trx.category}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">{trx.receiptNumber}</span>
                      <span>&bull;</span>
                      <span className="text-slate-400">Pencatat: {trx.recordedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end space-x-4">
                  <div className="text-right">
                    <span
                      className={`text-base font-black ${
                        trx.type === 'IN' ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {trx.type === 'IN' ? '+' : '-'}{formatCurrency(trx.amount)}
                    </span>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {trx.type === 'IN' ? 'Penerimaan Kas' : 'Pengeluaran Kas'}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(trx.id)}
                    title="Hapus Transaksi"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Tambah Transaksi Kas Baru</h3>
                <p className="text-xs text-slate-500">Pencatatan jurnal penerimaan/pengeluaran kas real-time</p>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTrxType('OUT');
                    setSelectedRapbmCode('');
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition ${
                    trxType === 'OUT' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran Kas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrxType('IN');
                    setSelectedRapbmCode('');
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition ${
                    trxType === 'IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Penerimaan Kas
                </button>
              </div>

              {/* Date Masehi & Auto Hijri */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Masehi</label>
                  <input
                    type="date"
                    value={dateGregorian}
                    onChange={(e) => setDateGregorian(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Konversi Hijriyah</label>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 font-bold rounded-xl truncate">
                    {calculatedHijri.formatted}
                  </div>
                </div>
              </div>

              {/* Link RAPBM Code */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hubungkan dengan Kode RAPBM (Opsional)
                </label>
                <select
                  value={selectedRapbmCode}
                  onChange={(e) => handleRapbmCodeChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Tanpa Kode RAPBM (Lain-lain) --</option>
                  {availableRapbmItems.map((item) => (
                    <option key={item.id} value={item.noKode}>
                      {item.noKode} - {item.uraian} ({formatCurrency(item.jumlahAnggaran)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Transaksi</label>
                  <input
                    type="text"
                    placeholder="misal: BISYAROH, PEMELIHARAAN"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Nominal (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    required
                    min={1}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian / Keterangan Transaksi</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi detail penerimaan atau pengeluaran kas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Petugas / Recorded By */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Petugas / Bendahara Pencatat</label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Simpan...' : 'Simpan Transaksi'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
