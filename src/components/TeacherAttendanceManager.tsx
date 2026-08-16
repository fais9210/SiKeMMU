import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  Printer,
  Search,
  Plus,
  Minus,
  Save,
  FileSpreadsheet,
  Receipt,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCheck,
  RotateCcw,
  Info,
} from 'lucide-react';
import { MadrasahInfo, Teacher, TeacherAttendance, PayrollRecord } from '../types';
import { formatCurrency, getHijriDate, formatHijriDateForAcademicYear } from '../utils/hijri';

interface TeacherAttendanceManagerProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  availableYears?: string[];
  onSelectYear?: (year: string) => void;
  teachers: Teacher[];
  attendances: TeacherAttendance[];
  onSaveAttendances: (items: TeacherAttendance[]) => Promise<void>;
  onGeneratePayrollFromAttendance: (monthHijri: string, year: string, attendancesToProcess: TeacherAttendance[]) => Promise<void>;
  onNavigateToPayroll?: () => void;
}

const HIJRI_MONTHS = [
  'Muharram',
  'Shafar',
  'Rabi\'ul Awwal',
  'Rabi\'ul Akhir',
  'Jumadil Awwal',
  'Jumadil Akhir',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawal',
  'Dzulqa\'dah',
  'Dzulhijjah',
];

export const TeacherAttendanceManager: React.FC<TeacherAttendanceManagerProps> = ({
  madrasah,
  selectedYear,
  availableYears = ['1444 - 1445 H.', '1445 - 1446 H.', '1446 - 1447 H.', '1447 - 1448 H.', '1448 - 1449 H.'],
  onSelectYear,
  teachers,
  attendances,
  onSaveAttendances,
  onGeneratePayrollFromAttendance,
  onNavigateToPayroll,
}) => {
  const [selectedMonthHijri, setSelectedMonthHijri] = useState<string>('Syawal');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local editable attendance map keyed by teacherId
  const [localRows, setLocalRows] = useState<Record<string, TeacherAttendance>>({});

  // Active teachers only
  const activeTeachers = useMemo(() => {
    return teachers.filter((t) => t.status === 'AKTIF' || !t.status);
  }, [teachers]);

  // Sync localRows when selectedMonthHijri, selectedYear, or attendances change
  React.useEffect(() => {
    const currentMonthAttendances = attendances.filter(
      (a) => a.tahunAjaran === selectedYear && a.monthHijri === selectedMonthHijri
    );

    const initialMap: Record<string, TeacherAttendance> = {};

    activeTeachers.forEach((t) => {
      const existing = currentMonthAttendances.find((a) => a.teacherId === t.id);
      if (existing) {
        initialMap[t.id] = { ...existing };
      } else {
        // Default based on teacher master data: (jamMengajar per minggu * 4) = monthly target
        const targetTatapMuka = (t.jamMengajar || 4) * 4;
        const hadir = targetTatapMuka;
        const tarif = t.tarifPerJam || 25000;
        const tunjJabatan = t.tunjanganJabatan || 0;
        const tunjMasaKerja = t.tunjanganMasaKerja || 0;
        const tunjKehadiran = t.tunjanganKehadiran || 0;
        const potInfaq = t.potonganInfaq || 0;
        const potTabungan = t.potonganTabungan || 0;

        const kotor = hadir * tarif + tunjJabatan + tunjMasaKerja + tunjKehadiran;
        const bersih = Math.max(0, kotor - (potInfaq + potTabungan));

        initialMap[t.id] = {
          id: `att-${selectedYear.replace(/[^a-zA-Z0-9]/g, '')}-${selectedMonthHijri.replace(/[^a-zA-Z0-9]/g, '')}-${t.id}`,
          tahunAjaran: selectedYear,
          teacherId: t.id,
          teacherName: t.name,
          nipNu: t.nipNu,
          role: t.role,
          monthHijri: selectedMonthHijri,
          monthGregorian: '',
          targetTatapMuka,
          hadir,
          izin: 0,
          sakit: 0,
          alpa: 0,
          tarifPerTatapMuka: tarif,
          tunjanganJabatan: tunjJabatan,
          tunjanganMasaKerja: tunjMasaKerja,
          tunjanganKehadiran: tunjKehadiran,
          potonganInfaq: potInfaq,
          potonganTabungan: potTabungan,
          potonganLain: 0,
          totalBisyarohKotor: kotor,
          totalBisyarohBersih: bersih,
          status: 'DRAFT',
          notes: '',
        };
      }
    });

    setLocalRows(initialMap);
  }, [selectedMonthHijri, selectedYear, activeTeachers, attendances]);

  // Recalculate row helper
  const updateRowField = (teacherId: string, updates: Partial<TeacherAttendance>) => {
    setLocalRows((prev) => {
      const current = prev[teacherId];
      if (!current) return prev;

      const updated = { ...current, ...updates };

      const hadir = Math.max(0, Number(updated.hadir) || 0);
      const target = Math.max(1, Number(updated.targetTatapMuka) || 1);
      const tarif = Math.max(0, Number(updated.tarifPerTatapMuka) || 0);
      const tunjJabatan = Math.max(0, Number(updated.tunjanganJabatan) || 0);
      const tunjMasaKerja = Math.max(0, Number(updated.tunjanganMasaKerja) || 0);
      
      // Kehadiran bonus applies if attendance is 100% or equal to target
      let tunjKehadiran = Number(updated.tunjanganKehadiran) || 0;
      if (hadir < target) {
        // Optional pro-rated or deduction for absence
        tunjKehadiran = Math.round((hadir / target) * tunjKehadiran);
      }

      const potInfaq = Math.max(0, Number(updated.potonganInfaq) || 0);
      const potTabungan = Math.max(0, Number(updated.potonganTabungan) || 0);
      const potLain = Math.max(0, Number(updated.potonganLain) || 0);

      const bisyarohTatapMuka = hadir * tarif;
      const totalKotor = bisyarohTatapMuka + tunjJabatan + tunjMasaKerja + tunjKehadiran;
      const totalPotongan = potInfaq + potTabungan + potLain;
      const totalBersih = Math.max(0, totalKotor - totalPotongan);

      updated.hadir = hadir;
      updated.totalBisyarohKotor = totalKotor;
      updated.totalBisyarohBersih = totalBersih;

      return {
        ...prev,
        [teacherId]: updated,
      };
    });
  };

  // Quick Action: Set all teachers to 100% attendance
  const handleSetAllFullAttendance = () => {
    setLocalRows((prev) => {
      const nextMap = { ...prev };
      Object.keys(nextMap).forEach((id) => {
        const item = nextMap[id];
        const target = item.targetTatapMuka || 16;
        const teacher = activeTeachers.find((t) => t.id === item.teacherId);
        const fullTunjKehadiran = teacher?.tunjanganKehadiran || item.tunjanganKehadiran || 0;

        const bisyarohTatapMuka = target * item.tarifPerTatapMuka;
        const totalKotor = bisyarohTatapMuka + item.tunjanganJabatan + item.tunjanganMasaKerja + fullTunjKehadiran;
        const totalPotongan = item.potonganInfaq + item.potonganTabungan + (item.potonganLain || 0);

        nextMap[id] = {
          ...item,
          hadir: target,
          izin: 0,
          sakit: 0,
          alpa: 0,
          tunjanganKehadiran: fullTunjKehadiran,
          totalBisyarohKotor: totalKotor,
          totalBisyarohBersih: Math.max(0, totalKotor - totalPotongan),
        };
      });
      return nextMap;
    });

    setSuccessMessage('Semua kehadiran ustadz/ah & staf berhasil diset 100% penuh!');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Save all current rows to backend
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const itemsToSave = Object.values(localRows);
      await onSaveAttendances(itemsToSave);
      setSuccessMessage(`Data presensi bulan ${selectedMonthHijri} berhasil disimpan secara permanen.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Error saving attendance:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Generate Payroll from Attendance
  const handleGeneratePayroll = async () => {
    setIsGeneratingPayroll(true);
    try {
      const itemsToProcess = Object.values(localRows);
      await onGeneratePayrollFromAttendance(selectedMonthHijri, selectedYear, itemsToProcess);
      setSuccessMessage(`Slip gaji bisyaroh ustadz bulan ${selectedMonthHijri} berhasil digenerate otomatis berdasarkan data kehadiran!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e) {
      console.error('Error generating payroll from attendance:', e);
    } finally {
      setIsGeneratingPayroll(false);
    }
  };

  // Filtered rows for search
  const filteredRows: TeacherAttendance[] = useMemo(() => {
    const list: TeacherAttendance[] = Object.values(localRows);
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (r: TeacherAttendance) =>
        r.teacherName.toLowerCase().includes(q) ||
        (r.nipNu && r.nipNu.toLowerCase().includes(q)) ||
        (r.role && r.role.toLowerCase().includes(q))
    );
  }, [localRows, searchTerm]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const list: TeacherAttendance[] = Object.values(localRows);
    const totalTarget = list.reduce((acc: number, r: TeacherAttendance) => acc + (r.targetTatapMuka || 0), 0);
    const totalHadir = list.reduce((acc: number, r: TeacherAttendance) => acc + (r.hadir || 0), 0);
    const totalIzin = list.reduce((acc: number, r: TeacherAttendance) => acc + (r.izin || 0), 0);
    const totalSakit = list.reduce((acc: number, r: TeacherAttendance) => acc + (r.sakit || 0), 0);
    const totalAlpa = list.reduce((acc: number, r: TeacherAttendance) => acc + (r.alpa || 0), 0);
    const totalBisyaroh = list.reduce((acc: number, r: TeacherAttendance) => acc + (r.totalBisyarohBersih || 0), 0);
    const attendanceRate = totalTarget > 0 ? Math.round((totalHadir / totalTarget) * 100) : 0;

    return {
      totalTeachers: list.length,
      totalTarget,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlpa,
      totalBisyaroh,
      attendanceRate,
    };
  }, [localRows]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'NIP/NU',
      'Nama Ustadz/Staf',
      'Jabatan',
      'Target Tatap Muka',
      'Hadir',
      'Izin',
      'Sakit',
      'Alpa',
      '% Kehadiran',
      'Tarif / Pertemuan',
      'Bisyaroh Mengajar',
      'Tunj. Jabatan',
      'Tunj. Masa Kerja',
      'Tunj. Kehadiran',
      'Total Bisyaroh Kotor',
      'Potongan Infaq',
      'Potongan Tabungan',
      'Total Bisyaroh Bersih',
    ];

    const rows = filteredRows.map((r, idx) => {
      const target = r.targetTatapMuka || 1;
      const rate = target > 0 ? Math.round((r.hadir / target) * 100) : 0;
      const bisyarohMengajar = r.hadir * r.tarifPerTatapMuka;
      return [
        idx + 1,
        `"${r.nipNu || ''}"`,
        `"${r.teacherName}"`,
        `"${r.role || ''}"`,
        r.targetTatapMuka,
        r.hadir,
        r.izin,
        r.sakit,
        r.alpa,
        `"${rate}%"`,
        r.tarifPerTatapMuka,
        bisyarohMengajar,
        r.tunjanganJabatan,
        r.tunjanganMasaKerja,
        r.tunjanganKehadiran,
        r.totalBisyarohKotor,
        r.potonganInfaq,
        r.potonganTabungan,
        r.totalBisyarohBersih,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Presensi_Bisyaroh_${selectedMonthHijri}_${selectedYear.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Header & Year / Month Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Presensi & Tatap Muka Guru
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-normal">
                Kalkulasi Bisyaroh Otomatis
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Rekap jumlah jam mengajar & kehadiran per bulan untuk menghitung nominal bisyaroh secara akurat
            </p>
          </div>
        </div>

        {/* Period Selector Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tahun Ajaran */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-400 mr-2 font-medium">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => onSelectYear && onSelectYear(e.target.value)}
              className="bg-transparent text-xs text-emerald-400 font-semibold focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-slate-200">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Bulan Hijriyah */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-400 mr-2 font-medium">Bulan:</span>
            <select
              value={selectedMonthHijri}
              onChange={(e) => setSelectedMonthHijri(e.target.value)}
              className="bg-transparent text-xs text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              {HIJRI_MONTHS.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-slate-200">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Ustadz & TU</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{metrics.totalTeachers} <span className="text-xs text-slate-400 font-normal">orang</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Status aktif mengajar</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tatap Muka Hadir</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">
            {metrics.totalHadir} <span className="text-xs text-slate-400 font-normal">/ {metrics.totalTarget} jam</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, metrics.attendanceRate)}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">{metrics.attendanceRate}%</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Izin / Sakit / Alpa</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Izin: {metrics.totalIzin}</span>
            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">Sakit: {metrics.totalSakit}</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Alpa: {metrics.totalAlpa}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">Total tidak hadir sebulan</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Bisyaroh Bulan Ini</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl font-bold text-teal-400 mt-1.5">{formatCurrency(metrics.totalBisyaroh)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Kalkulasi bersih kehadiran</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ustadz / ustadzah / jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleSetAllFullAttendance}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition"
            title="Set kehadiran 100% untuk semua guru"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            Set Semua Hadir Penuh
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Unduh Excel/CSV
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs text-white font-semibold shadow-md shadow-emerald-900/30 transition"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Menyimpan...' : 'Simpan Presensi'}
          </button>

          <button
            type="button"
            onClick={handleGeneratePayroll}
            disabled={isGeneratingPayroll}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-xs text-white font-bold shadow-lg shadow-teal-900/40 transition"
          >
            <Receipt className="w-4 h-4 text-amber-300" />
            {isGeneratingPayroll ? 'Mengenerate...' : 'Generate Slip Gaji (1-Klik)'}
          </button>
        </div>
      </div>

      {/* Attendance & Calculation Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Ustadz / Ustadzah</th>
                <th className="py-3 px-3 text-center w-28">Target (Jam)</th>
                <th className="py-3 px-3 text-center w-40">Kehadiran Aktual</th>
                <th className="py-3 px-2 text-center w-24">Izin / Sakit</th>
                <th className="py-3 px-3 text-right w-28">Tarif / Jam</th>
                <th className="py-3 px-3 text-right w-32">Bisyaroh Mengajar</th>
                <th className="py-3 px-3 text-right w-28">Tunjangan</th>
                <th className="py-3 px-3 text-right w-24">Potongan</th>
                <th className="py-3 px-4 text-right w-36">Total Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada data ustadz/ustadzah ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const target = Math.max(1, r.targetTatapMuka || 1);
                  const hadir = r.hadir || 0;
                  const rate = Math.round((hadir / target) * 100);
                  const bisyarohMengajar = hadir * (r.tarifPerTatapMuka || 0);
                  const totalTunjangan = (r.tunjanganJabatan || 0) + (r.tunjanganMasaKerja || 0) + (r.tunjanganKehadiran || 0);
                  const totalPotongan = (r.potonganInfaq || 0) + (r.potonganTabungan || 0) + (r.potonganLain || 0);

                  return (
                    <tr key={r.teacherId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      
                      {/* Name & Role */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{r.teacherName}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="font-mono text-emerald-400">{r.nipNu || '-'}</span>
                          <span>•</span>
                          <span>{r.role || 'Pengajar'}</span>
                        </div>
                      </td>

                      {/* Target Tatap Muka */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max="80"
                          value={r.targetTatapMuka}
                          onChange={(e) => updateRowField(r.teacherId, { targetTatapMuka: parseInt(e.target.value) || 1 })}
                          className="w-16 bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-center font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Kehadiran Controls */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateRowField(r.teacherId, { hadir: Math.max(0, hadir - 1) })}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            max="80"
                            value={hadir}
                            onChange={(e) => updateRowField(r.teacherId, { hadir: parseInt(e.target.value) || 0 })}
                            className="w-14 bg-slate-950 border border-slate-700/80 rounded px-1.5 py-1 text-center font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />

                          <button
                            type="button"
                            onClick={() => updateRowField(r.teacherId, { hadir: hadir + 1 })}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-center mt-1 text-[10px] font-medium text-slate-400">
                          {rate >= 100 ? (
                            <span className="text-emerald-400 font-bold">100% Penuh</span>
                          ) : (
                            <span>{rate}% Kehadiran</span>
                          )}
                        </div>
                      </td>

                      {/* Izin / Sakit Quick Inputs */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-[11px]">
                          <span title="Izin">
                            <input
                              type="number"
                              min="0"
                              value={r.izin || 0}
                              onChange={(e) => updateRowField(r.teacherId, { izin: parseInt(e.target.value) || 0 })}
                              className="w-9 bg-slate-950 border border-blue-500/30 text-blue-300 rounded px-1 py-0.5 text-center text-[10px] focus:outline-none"
                              placeholder="I"
                            />
                          </span>
                          <span title="Sakit">
                            <input
                              type="number"
                              min="0"
                              value={r.sakit || 0}
                              onChange={(e) => updateRowField(r.teacherId, { sakit: parseInt(e.target.value) || 0 })}
                              className="w-9 bg-slate-950 border border-yellow-500/30 text-yellow-300 rounded px-1 py-0.5 text-center text-[10px] focus:outline-none"
                              placeholder="S"
                            />
                          </span>
                        </div>
                      </td>

                      {/* Tarif / Jam */}
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {formatCurrency(r.tarifPerTatapMuka)}
                      </td>

                      {/* Bisyaroh Mengajar (Hadir * Tarif) */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-300 font-mono">
                        {formatCurrency(bisyarohMengajar)}
                      </td>

                      {/* Tunjangan Total */}
                      <td className="py-3 px-3 text-right font-mono text-amber-300/90 text-[11px]">
                        +{formatCurrency(totalTunjangan)}
                      </td>

                      {/* Potongan Total */}
                      <td className="py-3 px-3 text-right font-mono text-rose-300/90 text-[11px]">
                        -{formatCurrency(totalPotongan)}
                      </td>

                      {/* Total Bisyaroh Bersih */}
                      <td className="py-3 px-4 text-right font-bold text-teal-400 font-mono text-sm">
                        {formatCurrency(r.totalBisyarohBersih)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950 border-t-2 border-slate-700/80 font-bold text-xs">
                  <td colSpan={3} className="py-3 px-4 text-white">
                    TOTAL KESELURUHAN ({filteredRows.length} GURU/STAF)
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-mono">
                    {filteredRows.reduce((a, b) => a + (b.hadir || 0), 0)} jam hadir
                  </td>
                  <td className="py-3 px-2 text-center text-slate-400 text-[11px]">
                    I:{filteredRows.reduce((a, b) => a + (b.izin || 0), 0)} S:{filteredRows.reduce((a, b) => a + (b.sakit || 0), 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">-</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-mono">
                    {formatCurrency(filteredRows.reduce((a, b) => a + (b.hadir * b.tarifPerTatapMuka), 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-400 font-mono text-[11px]">
                    +{formatCurrency(filteredRows.reduce((a, b) => a + (b.tunjanganJabatan + b.tunjanganMasaKerja + b.tunjanganKehadiran), 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-400 font-mono text-[11px]">
                    -{formatCurrency(filteredRows.reduce((a, b) => a + (b.potonganInfaq + b.potonganTabungan + (b.potonganLain || 0)), 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-teal-300 font-mono text-base">
                    {formatCurrency(metrics.totalBisyaroh)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Information Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">Cara Kerja Kalkulasi Bisyaroh Otomatis:</p>
          <p>
            1. Setiap ustadz/ah dihitung berdasarkan <strong>(Jumlah Jam Hadir Mengajar × Tarif per Jam)</strong> ditambah seluruh tunjangan (Jabatan, Masa Kerja, Bonus Kehadiran) dan dikurangi potongan infaq/tabungan.
          </p>
          <p>
            2. Menekan tombol <strong>"Generate Slip Gaji (1-Klik)"</strong> akan membuatkan berkas slip gaji resmi untuk setiap guru pada bulan tersebut dan langsung mencatatkannya ke dalam Buku Kas Pengeluaran (Bisyaroh Guru) & Realisasi RAPBM.
          </p>
        </div>
      </div>
    </div>
  );
};
