import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MadrasahInfo, PayrollRecord, RAPBMItem, Transaction } from '../types';
import { formatCurrency, getHijriDate } from '../utils/hijri';

interface DashboardOverviewProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  availableYears: string[];
  onSelectYear: (year: string) => void;
  rapbmData: RAPBMItem[];
  transactions: Transaction[];
  payrolls: PayrollRecord[];
  onNavigateTab: (tab: any) => void;
  onOpenNewTransaction: () => void;
  onGeneratePayrollPDF: (p: PayrollRecord) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  madrasah,
  selectedYear,
  availableYears,
  onSelectYear,
  rapbmData,
  transactions,
  payrolls,
  onNavigateTab,
  onOpenNewTransaction,
  onGeneratePayrollPDF,
}) => {
  const currentHijri = getHijriDate(new Date(), madrasah.hijriOffsetDays);

  // Compute totals
  let totalTargetPenerimaan = 0;
  let totalRealitaPenerimaan = 0;
  let totalTargetPengeluaran = 0;
  let totalRealitaPengeluaran = 0;

  rapbmData.forEach((item) => {
    if (item.type === 'PENERIMAAN') {
      totalTargetPenerimaan += item.jumlahAnggaran;
      totalRealitaPenerimaan += item.realita;
    } else {
      totalTargetPengeluaran += item.jumlahAnggaran;
      totalRealitaPengeluaran += item.realita;
    }
  });

  // Calculate Cashbook transactions total for non-RAPBM items
  let totalTrxIn = 0;
  let totalTrxOut = 0;
  transactions.forEach((t) => {
    if (!t.rapbmCode) {
      if (t.type === 'IN') totalTrxIn += t.amount;
      if (t.type === 'OUT') totalTrxOut += t.amount;
    }
  });

  const totalIncome = totalRealitaPenerimaan + totalTrxIn;
  const totalExpense = totalRealitaPengeluaran + totalTrxOut;
  const sisaKas = totalIncome - totalExpense;
  const serapanPercentage = Math.round((totalRealitaPengeluaran / (totalTargetPengeluaran || 1)) * 100);

  // Recharts Data Prep: Categories comparison
  const categoriesMap: { [key: string]: { name: string; target: number; realita: number } } = {};

  rapbmData.forEach((item) => {
    if (!categoriesMap[item.categoryName]) {
      categoriesMap[item.categoryName] = {
        name: item.categoryName.length > 18 ? item.categoryName.substring(0, 18) + '...' : item.categoryName,
        target: 0,
        realita: 0,
      };
    }
    categoriesMap[item.categoryName].target += item.jumlahAnggaran;
    categoriesMap[item.categoryName].realita += item.realita;
  });

  const chartData = Object.values(categoriesMap);

  const pieData = [
    { name: 'Bisyaroh & Tunjangan', value: 10589000, color: '#059669' },
    { name: 'Biaya Pemeliharaan', value: 17950000, color: '#0284c7' },
    { name: 'Belanja ATK', value: 1790000, color: '#d97706' },
    { name: 'Pengembangan Pendidik', value: 9140000, color: '#7c3aed' },
    { name: 'Haflah & Lain-lain', value: 7626500, color: '#e11d48' },
  ];

  return (
    <div id="dashboard-overview-container" className="space-y-6">
      
      {/* Top Banner Greeting */}
      <div className="bg-emerald-900 rounded-xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {madrasah.logoUrl && (
              <div className="w-16 h-24 flex-shrink-0 bg-white p-1 rounded-lg shadow-sm hidden sm:block">
                <img src={madrasah.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center space-x-1.5 bg-emerald-800 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold text-emerald-300 border border-emerald-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sistem RAPBM Terpadu</span>
                </div>
                <div className="inline-flex items-center space-x-1 bg-amber-400 text-emerald-950 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs">
                  <span>TA {selectedYear}</span>
                </div>
              </div>
              <h2 className="text-xl font-bold font-serif text-white tracking-tight">
                Ringkasan Dashboard Keuangan Madrasah
              </h2>
              <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
                Manajemen transparansi anggaran, pencatatan transaksi real-time, penerbitan slip bisyaroh guru, dan laporan PDF otomatis untuk <strong className="text-white font-semibold">{madrasah.namaMadrasah}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector Dropdown on Dashboard Banner */}
            <div className="bg-emerald-950/80 p-1.5 rounded-lg border border-emerald-700/80 flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 pl-1">Tahun:</span>
              <select
                id="dash-year-select"
                value={selectedYear}
                onChange={(e) => onSelectYear(e.target.value)}
                className="bg-emerald-900 text-white font-bold text-xs rounded px-2 py-1 border border-emerald-700 focus:outline-none cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    TA {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-quick-new-trx"
              onClick={onOpenNewTransaction}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow-sm text-xs transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Transaksi Kas</span>
            </button>

            <button
              id="btn-quick-view-rapbm"
              onClick={() => onNavigateTab('rapbm')}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold rounded-md border border-emerald-700 text-xs transition flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Matriks RAPBM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards (Geometric Balance 4-Card Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Target Anggaran RAPBM */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target RAPBM ({selectedYear})</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalTargetPenerimaan)}</p>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-medium">
            <span>Penerimaan = Pengeluaran</span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider">Balanced</span>
          </div>
        </div>

        {/* Card 2: Realisasi Pengeluaran */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Realisasi Pengeluaran</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalRealitaPengeluaran)}</p>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-medium">
            <span>Serapan Anggaran</span>
            <span className="font-bold text-amber-600">{serapanPercentage}%</span>
          </div>
        </div>

        {/* Card 3: Saldo Kas Real-time */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Saldo Kas Real-time</span>
          <p className={`text-2xl font-bold mt-1 ${sisaKas >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatCurrency(sisaKas)}
          </p>
          <div className="mt-2 text-[10px] text-slate-500 font-medium flex items-center justify-between">
            <span className="text-emerald-600 font-bold">In: {formatCurrency(totalIncome)}</span>
            <span className="text-rose-600 font-bold">Out: {formatCurrency(totalExpense)}</span>
          </div>
        </div>

        {/* Card 4: Bisyaroh Guru Month Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slip Bisyaroh Guru</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{payrolls.length} Ustadz/ah</p>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-medium">
            <span className="text-emerald-600 font-bold flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Termasuk Staf TU
            </span>
            <button
              onClick={() => onNavigateTab('payroll')}
              className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:underline"
            >
              Cetak &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grafik Anggaran</span>
              <h3 className="font-bold text-slate-800 text-sm">
                Perbandingan Target Anggaran vs Realita (Rp)
              </h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded font-bold border border-emerald-100">
              TA {madrasah.tahunAjaranHijri}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Jumlah']}
                  contentStyle={{ borderRadius: '8px', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="target" name="Target Anggaran" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realita" name="Realita Terpakai" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Alokasi Pengeluaran RAPBM */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proporsi Alokasi</span>
            <h3 className="font-bold text-slate-800 text-sm">
              Alokasi Pengeluaran Sektor
            </h3>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block">Realita</span>
              <span className="text-xs font-bold text-slate-800">{formatCurrency(totalRealitaPengeluaran)}</span>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate max-w-[130px]">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Two Column Section: Recent Real-time Transactions & Recent Bisyaroh Slips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Real-time Cashbook Transactions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Log Transaksi Real-time</h3>
            </div>
            <button
              onClick={() => onNavigateTab('cashbook')}
              className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider hover:underline"
            >
              Lihat Semua Kas &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 5).map((trx) => (
              <div key={trx.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-[10px] uppercase ${trx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {trx.type === 'IN' ? 'MASUK' : 'KELUAR'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{trx.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {trx.dateHijri} &bull; <span className="font-mono">{trx.receiptNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-bold">
                  <span className={trx.type === 'IN' ? 'text-emerald-600' : 'text-rose-500'}>
                    {trx.type === 'IN' ? '+' : '-'}{formatCurrency(trx.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Bisyaroh Guru Slips List */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-emerald-800" />
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Slip Bisyaroh Guru & Staf</h3>
            </div>
            <button
              onClick={() => onNavigateTab('payroll')}
              className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider hover:underline"
            >
              Kelola Payroll &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {payrolls.slice(0, 5).map((pay) => (
              <div key={pay.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">{pay.teacherName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {pay.role} &bull; <span className="text-emerald-800 font-medium">{pay.monthHijri}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-900 block">{formatCurrency(pay.bisyarohBersih)}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                      {pay.status}
                    </span>
                  </div>

                  <button
                    id={`btn-print-dash-slip-${pay.id}`}
                    onClick={() => onGeneratePayrollPDF(pay)}
                    title="Cetak PDF Slip Bisyaroh"
                    className="p-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded border border-slate-200 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Automatic Reporting Banner (Geometric Balance Bottom Bar) */}
      <div className="bg-emerald-900 rounded-xl shadow-inner flex flex-col md:flex-row items-center justify-between p-6 gap-6 text-white border border-emerald-800">
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Pelaporan Otomatis Real-Time</h4>
          <p className="text-[11px] text-emerald-200/90">
            Sistem menyusun Laporan Realisasi Anggaran (LRA) dan Buku Kas Umum secara otomatis berdasarkan jurnal setiap bulan Hijriyah.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider text-emerald-300 opacity-80 mb-1">Progres Laporan</span>
            <div className="w-32 h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800">
              <div className="w-full h-full bg-emerald-400" />
            </div>
          </div>
          <div className="h-10 w-[1px] bg-emerald-800 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">100% Terintegrasi</span>
            <span className="text-[9px] text-emerald-300/80 uppercase">Node.js Express + PDF Engine</span>
          </div>
        </div>
      </div>

    </div>
  );
};
