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
  FileSpreadsheet,
  CalendarDays,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { MadrasahInfo, RAPBMItem, Transaction, StudentPayment, PayrollRecord } from '../types';
import { formatCurrency, getHijriDate } from '../utils/hijri';
import { exportAcademicYearBackupExcel, exportFilteredTransactionsExcel } from '../utils/excelExporter';

interface CashBookProps {
  madrasah: MadrasahInfo;
  transactions: Transaction[];
  rapbmData: RAPBMItem[];
  studentPayments?: StudentPayment[];
  payrolls?: PayrollRecord[];
  selectedYear?: string;
  availableYears?: string[];
  onSelectYear?: (year: string) => void;
  onAddTransaction: (trx: Omit<Transaction, 'id'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onDeleteAllTransactions?: () => Promise<void>;
  onAddRapbmItem?: (item: Omit<RAPBMItem, 'id'>) => Promise<void>;
  onExportCashflowPDF: () => void;
  isOpenModal: boolean;
  setIsOpenModal: (open: boolean) => void;
}

export const CashBook: React.FC<CashBookProps> = ({
  madrasah,
  transactions,
  rapbmData,
  studentPayments = [],
  payrolls = [],
  selectedYear,
  availableYears,
  onSelectYear,
  onAddTransaction,
  onDeleteTransaction,
  onDeleteAllTransactions,
  onAddRapbmItem,
  onExportCashflowPDF,
  isOpenModal,
  setIsOpenModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Filter transactions for current selected year
  const currentYearTransactions = transactions.filter((t) => {
    if (!selectedYear) return true;
    return t.tahunAjaran === selectedYear || (!t.tahunAjaran && selectedYear === '1446 - 1447 H.');
  });

  // Time Period Filter State
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  // Backup & Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Helper for Week Range
  const getWeekRange = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMon));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  };

  const weekRange = getWeekRange(filterDate);

  // Time Filtered Transactions
  const timeFilteredTransactions = currentYearTransactions.filter((t) => {
    if (!t.dateGregorian) return true;
    if (timeFilter === 'TODAY') {
      return t.dateGregorian === filterDate;
    }
    if (timeFilter === 'WEEK') {
      return t.dateGregorian >= weekRange.start && t.dateGregorian <= weekRange.end;
    }
    if (timeFilter === 'MONTH') {
      return t.dateGregorian.startsWith(filterMonth);
    }
    if (timeFilter === 'CUSTOM') {
      return t.dateGregorian >= customStart && t.dateGregorian <= customEnd;
    }
    return true;
  });

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Add RAPBM Item State
  const [isAddingNewRapbm, setIsAddingNewRapbm] = useState(false);
  const [newKodeRapbm, setNewKodeRapbm] = useState('');
  const [newUraianRapbm, setNewUraianRapbm] = useState('');
  const [newCatNameRapbm, setNewCatNameRapbm] = useState('');

  const calculatedHijri = getHijriDate(dateGregorian, madrasah.hijriOffsetDays);

  // Filter RAPBM options based on selected transaction type & active year
  const availableRapbmItems = rapbmData.filter((item) => {
    const isYearMatch = !selectedYear || item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.');
    const isTypeMatch = trxType === 'IN' ? item.type === 'PENERIMAAN' : item.type === 'PENGELUARAN';
    return isYearMatch && isTypeMatch;
  });

  const handleCreateNewRapbmItem = async () => {
    if (!newUraianRapbm.trim()) return;
    const kode = newKodeRapbm.trim() || `${trxType === 'IN' ? 'P' : 'K'}-${availableRapbmItems.length + 1}`;
    const catName = newCatNameRapbm.trim() || (trxType === 'IN' ? 'PENERIMAAN LAIN' : 'PENGELUARAN LAIN');

    if (onAddRapbmItem) {
      await onAddRapbmItem({
        tahunAjaran: selectedYear || madrasah.activeYear || '1446 - 1447 H.',
        type: trxType === 'IN' ? 'PENERIMAAN' : 'PENGELUARAN',
        categoryCode: 'LAIN',
        categoryName: catName,
        noUrut: String(availableRapbmItems.length + 1),
        noKode: kode,
        uraian: newUraianRapbm.trim(),
        jumlahAnggaran: 0,
        realita: 0,
        persentase: 100,
      });
    }

    setSelectedRapbmCode(kode);
    setCategory(catName);
    setDescription(newUraianRapbm.trim());

    // Reset quick add form
    setNewKodeRapbm('');
    setNewUraianRapbm('');
    setNewCatNameRapbm('');
    setIsAddingNewRapbm(false);
  };

  const handleTypeSwitch = (type: 'IN' | 'OUT') => {
    setTrxType(type);
    setSelectedRapbmCode('');
    setCategory(type === 'IN' ? 'PENDAPATAN RUTIN' : 'PENGELUARAN LAIN');
    setDescription('');
    setSuccessMessage(null);
  };

  React.useEffect(() => {
    if (isOpenModal) {
      if (!selectedRapbmCode) {
        if (trxType === 'OUT' && (!category || category.toUpperCase().includes('PENDAPATAN'))) {
          setCategory('PENGELUARAN LAIN');
        } else if (
          trxType === 'IN' &&
          (!category ||
            category.toUpperCase().includes('PENGELUARAN') ||
            category.toUpperCase().includes('BISYAROH') ||
            category.toUpperCase().includes('BIAYA'))
        ) {
          setCategory('PENDAPATAN RUTIN');
        }
      }
    }
  }, [isOpenModal, trxType]);

  const handleRapbmCodeChange = (val: string) => {
    setSelectedRapbmCode(val);
    if (!val) {
      setCategory(trxType === 'IN' ? 'PENDAPATAN RUTIN' : 'PENGELUARAN LAIN');
      setDescription('');
      return;
    }
    const item = availableRapbmItems.find(
      (r) => r.uraian === val || r.noKode === val || r.id === val
    );
    if (item) {
      setCategory(item.categoryName);
      setDescription(item.uraian);
    } else {
      setDescription(val);
    }
  };

  const saveTransaction = async (keepOpen: boolean) => {
    if (!description || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        dateGregorian,
        dateHijri: calculatedHijri.formatted,
        tahunAjaran: selectedYear || madrasah.activeYear || '1446 - 1447 H.',
        type: trxType,
        rapbmCode: selectedRapbmCode || undefined,
        category: category || (trxType === 'IN' ? 'PENERIMAAN LAIN' : 'PENGELUARAN LAIN'),
        description,
        amount: Number(amount),
        recordedBy: recordedBy || madrasah.treasurerName,
        receiptNumber: `KW-MU22-${Math.floor(1000 + Math.random() * 9000)}`,
      });

      const savedDesc = description;
      const savedAmount = amount;

      // Reset form fields for repeated input
      setDescription('');
      setAmount('');
      setSelectedRapbmCode('');

      if (keepOpen) {
        setSuccessMessage(`✓ Transaksi "${savedDesc}" (${formatCurrency(Number(savedAmount))}) berhasil disimpan! Siap input data berikutnya.`);
      } else {
        setSuccessMessage(null);
        setIsOpenModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTransaction(false);
  };

  // Period Title Label
  const getFilterTitle = () => {
    if (timeFilter === 'TODAY') return `Harian (${filterDate})`;
    if (timeFilter === 'WEEK') return `Mingguan (${weekRange.start} s/d ${weekRange.end})`;
    if (timeFilter === 'MONTH') {
      const [y, m] = filterMonth.split('-');
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `Bulanan (${monthNames[parseInt(m, 10) - 1] || m} ${y})`;
    }
    if (timeFilter === 'CUSTOM') return `Rentang (${customStart} s/d ${customEnd})`;
    return `Tahun Ajaran ${selectedYear || 'Semua'}`;
  };

  const filteredTransactions = timeFilteredTransactions.filter((t) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (t.description || '').toLowerCase().includes(term) ||
      (t.category || '').toLowerCase().includes(term) ||
      (t.receiptNumber || '').toLowerCase().includes(term) ||
      (t.recordedBy || '').toLowerCase().includes(term) ||
      (t.dateGregorian || '').toLowerCase().includes(term) ||
      (t.dateHijri || '').toLowerCase().includes(term) ||
      (t.rapbmCode && String(t.rapbmCode).toLowerCase().includes(term));
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Period Totals
  let periodIn = 0;
  let periodOut = 0;
  timeFilteredTransactions.forEach((t) => {
    if (t.type === 'IN') periodIn += t.amount;
    if (t.type === 'OUT') periodOut += t.amount;
  });

  // Full Year Totals
  let totalIn = 0;
  let totalOut = 0;
  currentYearTransactions.forEach((t) => {
    if (t.type === 'IN') totalIn += t.amount;
    if (t.type === 'OUT') totalOut += t.amount;
  });

  // Export Handlers
  const handleExportFilteredExcel = () => {
    exportFilteredTransactionsExcel(
      madrasah,
      selectedYear || madrasah.activeYear || '1446 - 1447 H.',
      getFilterTitle(),
      timeFilteredTransactions
    );
  };

  const handleExportBackupExcel = () => {
    const yr = selectedYear || madrasah.activeYear || '1446 - 1447 H.';
    exportAcademicYearBackupExcel(
      madrasah,
      yr,
      currentYearTransactions,
      studentPayments.filter((p) => !selectedYear || p.tahunAjaran === yr || (!p.tahunAjaran && yr === '1446 - 1447 H.')),
      rapbmData.filter((r) => !selectedYear || r.tahunAjaran === yr || (!r.tahunAjaran && yr === '1446 - 1447 H.')),
      payrolls.filter((pr) => !selectedYear || pr.tahunAjaran === yr || (!pr.tahunAjaran && yr === '1446 - 1447 H.'))
    );
  };

  return (
    <div id="cashbook-container" className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <BookOpenCheck className="w-4 h-4" />
              <span>Buku Kas Umum Real-time</span>
              {selectedYear && (
                <span className="ml-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300 normal-case tracking-normal">
                  Tahun Ajaran: {selectedYear}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Pencatatan Arus Kas & Transaksi Keuangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jurnal pengeluaran & penerimaan dana terintegrasi dengan RAPBM Tahun Ajaran {selectedYear || madrasah.activeYear || '1446 - 1447 H.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportBackupExcel}
              className="px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm"
              title="Unduh seluruh rekap transaksi kas, syahriyah, RAPBM & gaji dalam format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Download Excel Backup</span>
            </button>

            {onDeleteAllTransactions && currentYearTransactions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5"
                title={`Hapus / Reset semua data transaksi Tahun Ajaran ${selectedYear || 'aktif'}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Data Tahun Ini</span>
              </button>
            )}

            <button
              id="btn-export-cashflow-pdf"
              onClick={onExportCashflowPDF}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs transition flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Cetak Buku Kas PDF</span>
            </button>

            <button
              id="btn-open-modal-trx"
              onClick={() => {
                setSuccessMessage(null);
                setIsOpenModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Transaksi Kas</span>
            </button>
          </div>
        </div>

        {/* Time Period Filter Bar (Harian, Mingguan, Bulanan, Custom) */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="flex items-center font-bold text-slate-700 mr-2">
                <CalendarDays className="w-4 h-4 mr-1 text-emerald-700" />
                Periode Rekap:
              </span>
              <button
                type="button"
                onClick={() => setTimeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeFilter === 'ALL'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Semua ({selectedYear || 'TA'})
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('TODAY')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeFilter === 'TODAY'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('WEEK')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeFilter === 'WEEK'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('MONTH')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeFilter === 'MONTH'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('CUSTOM')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeFilter === 'CUSTOM'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Rentang Tanggal
              </button>
            </div>

            {/* Export Filtered Excel Button */}
            <button
              type="button"
              onClick={handleExportFilteredExcel}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Excel ({getFilterTitle()})</span>
            </button>
          </div>

          {/* Time Picker Controls */}
          {timeFilter === 'TODAY' && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 font-medium">Pilih Tanggal:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
              />
            </div>
          )}

          {timeFilter === 'WEEK' && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 font-medium">Pilih Tanggal Acuan Minggu:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
              />
              <span className="text-slate-500 italic">
                (Rentang: {weekRange.start} s/d {weekRange.end})
              </span>
            </div>
          )}

          {timeFilter === 'MONTH' && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 font-medium">Pilih Bulan & Tahun:</span>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
              />
            </div>
          )}

          {timeFilter === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">Dari:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
              />
              <span className="text-slate-600 font-medium">Sampai:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Search & Type Filter Bar */}
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
              Semua Jenis
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
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-700">
          <div className="flex items-center space-x-2">
            <span>Menampilkan {filteredTransactions.length} Transaksi ({getFilterTitle()})</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Masuk: {formatCurrency(periodIn)}
            </span>
            <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              Keluar: {formatCurrency(periodOut)}
            </span>
            <span className="text-slate-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-300">
              Saldo Periode: {formatCurrency(periodIn - periodOut)}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau rentang periode tanggal.</p>
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
                        {trx.dateGregorian} ({trx.dateHijri})
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

      {/* Backup & Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Reset Data & Unduh Backup</h3>
                  <p className="text-xs text-slate-500">Tahun Ajaran {selectedYear || madrasah.activeYear || '1446 - 1447 H.'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 font-medium">
                ⚠️ <strong>Penting:</strong> Sebelum melakukan reset data atau pergantian tahun ajaran, Anda disarankan untuk mengunduh seluruh rekapitulasi data keuangan ke dalam file Excel (.xlsx) sebagai arsip permanen.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800">Ringkasan Data Yang Akan Dibersihkan:</div>
                <div className="flex justify-between text-slate-700">
                  <span>• Total Transaksi Kas:</span>
                  <span className="font-bold">{currentYearTransactions.length} Record</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>• Total Pembayaran Syahriyah:</span>
                  <span className="font-bold">{studentPayments.length} Record</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>• Realita & Anggaran RAPBM:</span>
                  <span className="font-bold">Akan Dikembalikan ke 0</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={handleExportBackupExcel}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>1. Unduh Rekap Lengkap (Excel .xlsx)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (
                    confirm(
                      `Konfirmasi Terakhir:\nApakah Anda BENAR-BENAR yakin ingin menghapus SEMUA data transaksi, syahriyah, dan slip gaji untuk Tahun Ajaran ${
                        selectedYear || 'aktif'
                      }?`
                    )
                  ) {
                    if (onDeleteAllTransactions) {
                      await onDeleteAllTransactions();
                    }
                    setIsResetModalOpen(false);
                  }
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>2. Lanjutkan Hapus / Reset Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 font-medium text-xs text-center mt-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => {
                  setIsOpenModal(false);
                  setSuccessMessage(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                &times;
              </button>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-sm"
                >
                  &times;
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('OUT')}
                  className={`py-2 rounded-lg font-bold text-xs transition ${
                    trxType === 'OUT' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran Kas
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('IN')}
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

              {/* Link RAPBM Item */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Pilih Uraian RAPBM Terkait (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewRapbm(!isAddingNewRapbm)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center space-x-1 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isAddingNewRapbm ? 'Batal' : `+ Tambah Uraian ${trxType === 'IN' ? 'Penerimaan' : 'Pengeluaran'} Baru`}</span>
                  </button>
                </div>

                {isAddingNewRapbm ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2.5 my-1 animate-in fade-in duration-150">
                    <p className="font-bold text-xs text-emerald-900">Tambah Uraian {trxType === 'IN' ? 'Penerimaan' : 'Pengeluaran'} RAPBM Baru:</p>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama / Uraian Item *</label>
                        <input
                          type="text"
                          placeholder="misal: Sumbangan Donatur / Pembelian Alat Kantor"
                          value={newUraianRapbm}
                          onChange={(e) => setNewUraianRapbm(e.target.value)}
                          required
                          className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewRapbm(false)}
                        className="px-2.5 py-1 text-slate-600 font-medium text-xs rounded hover:bg-slate-200"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewRapbmItem}
                        className="px-3 py-1 bg-emerald-700 text-white font-bold text-xs rounded-lg shadow hover:bg-emerald-800 transition"
                      >
                        Simpan & Gunakan
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedRapbmCode}
                    onChange={(e) => handleRapbmCodeChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Pilih Uraian RAPBM (Atau Ketik Uraian Bebas) --</option>
                    {availableRapbmItems.map((item) => (
                      <option key={item.id} value={item.uraian}>
                        {item.uraian} ({item.categoryName})
                      </option>
                    ))}
                  </select>
                )}
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
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenModal(false);
                    setSuccessMessage(null);
                  }}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 text-xs sm:text-sm"
                >
                  Selesai / Tutup
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isSubmitting || !description || !amount || Number(amount) <= 0}
                    onClick={() => saveTransaction(true)}
                    className="px-3 sm:px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold hover:bg-emerald-200 disabled:opacity-50 text-xs sm:text-sm flex items-center space-x-1.5 transition"
                    title="Simpan transaksi ini dan biarkan form tetap terbuka untuk langsung menginput transaksi berikutnya"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-700" />
                    <span>Simpan &amp; Input Lagi</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || !description || !amount || Number(amount) <= 0}
                    onClick={() => saveTransaction(false)}
                    className="px-3 sm:px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 text-xs sm:text-sm flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <BookOpenCheck className="w-4 h-4 text-emerald-100" />
                    <span>{isSubmitting ? 'Simpan...' : 'Simpan & Selesai'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
