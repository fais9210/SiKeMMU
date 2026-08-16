import { apiFetch } from "./lib/api";
import { getLocalCache, saveLocalCache, flushOfflineQueue } from "./lib/syncManager";
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { RAPBMTable } from './components/RAPBMTable';
import { CashBook } from './components/CashBook';
import { PayrollManager } from './components/PayrollManager';
import { SlipGajiModal } from './components/SlipGajiModal';
import { ReportsManager } from './components/ReportsManager';
import { TeachersManager } from './components/TeachersManager';
import { InventoryManager } from './components/InventoryManager';
import { SyahriahManager } from './components/SyahriahManager';
import { NotaReceiptManager } from './components/NotaReceiptManager';
import { SettingsModal } from './components/SettingsModal';
import { TeacherAttendanceManager } from './components/TeacherAttendanceManager';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

import {
  MadrasahInfo,
  PayrollRecord,
  RAPBMItem,
  Teacher,
  Transaction,
  Student,
  StudentPayment,
  TeacherAttendance,
} from './types';
import {
  initialMadrasahInfo,
  initialPayrolls,
  initialRAPBMData,
  initialTeachers,
  initialTransactions,
  initialStudents,
  getDefaultRAPBMForYear,
  alignRapbmDataToSkeleton,
} from './data/initialData';

import { getHijriDate, getCurrentHijriAcademicYear, formatHijriDateForAcademicYear } from './utils/hijri';
import {
  generateCashFlowPDF,
  generateRAPBMPDF,
  generateInventoryPDF,
  generateSlipGajiPDF,
} from './utils/pdfGenerator';
import { AddYearModal } from './components/AddYearModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickActionSheet } from './components/QuickActionSheet';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Application Data States (with local offline fallback)
  const [madrasahInfo, setMadrasahInfo] = useState<MadrasahInfo>(() => getLocalCache('madrasahInfo', initialMadrasahInfo));

  const currentRunningYear = getCurrentHijriAcademicYear(madrasahInfo.hijriOffsetDays);

  // Academic Year State (RAPBM Tiap Tahun) - Defaults dynamically to current running year
  const [selectedYear, setSelectedYear] = useState<string>(currentRunningYear);
  const [availableYears, setAvailableYears] = useState<string[]>(() => {
    const defaultYears = [
      '1444 - 1445 H.',
      '1445 - 1446 H.',
      '1446 - 1447 H.',
      '1447 - 1448 H.',
      '1448 - 1449 H.',
      '1449 - 1450 H.',
    ];
    if (!defaultYears.includes(currentRunningYear)) {
      return [...defaultYears, currentRunningYear].sort();
    }
    return defaultYears;
  });
  const [rapbmData, setRapbmData] = useState<RAPBMItem[]>(() => getLocalCache('rapbmData', initialRAPBMData));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocalCache('transactions', initialTransactions));
  const [teachers, setTeachers] = useState<Teacher[]>(() => getLocalCache('teachers', initialTeachers));
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(() => getLocalCache('payrolls', initialPayrolls));
  const [students, setStudents] = useState<Student[]>(() => getLocalCache('students', initialStudents as Student[]));
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>(() => getLocalCache('studentPayments', []));
  const [teacherAttendances, setTeacherAttendances] = useState<TeacherAttendance[]>(() => getLocalCache('teacherAttendances', []));

  // Sync state to local cache whenever they change
  useEffect(() => { saveLocalCache('madrasahInfo', madrasahInfo); }, [madrasahInfo]);
  useEffect(() => { saveLocalCache('rapbmData', rapbmData); }, [rapbmData]);
  useEffect(() => { saveLocalCache('transactions', transactions); }, [transactions]);
  useEffect(() => { saveLocalCache('teachers', teachers); }, [teachers]);
  useEffect(() => { saveLocalCache('payrolls', payrolls); }, [payrolls]);
  useEffect(() => { saveLocalCache('students', students); }, [students]);
  useEffect(() => { saveLocalCache('studentPayments', studentPayments); }, [studentPayments]);
  useEffect(() => { saveLocalCache('teacherAttendances', teacherAttendances); }, [teacherAttendances]);

  // Modals & Synchronization States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewTrxModalOpen, setIsNewTrxModalOpen] = useState(false);
  const [selectedPayrollForModal, setSelectedPayrollForModal] = useState<PayrollRecord | PayrollRecord[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch initial data from Express backend
  const fetchBackendData = async () => {
    setIsSyncing(true);
    try {
      // First attempt to flush any pending offline mutations
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await flushOfflineQueue();
      }

      const [resSettings, resRapbm, resTrx, resTeachers, resPayroll, resStudents, resStudentPay, resAttendances] = await Promise.all([
        apiFetch('/api/settings').catch(() => null),
        apiFetch('/api/rapbm').catch(() => null),
        apiFetch('/api/transactions').catch(() => null),
        apiFetch('/api/teachers').catch(() => null),
        apiFetch('/api/payroll').catch(() => null),
        apiFetch('/api/students').catch(() => null),
        apiFetch('/api/student-payments').catch(() => null),
        apiFetch('/api/teacher-attendances').catch(() => null),
      ]);

      const parseJsonSafe = async (res: Response | null) => {
        if (!res || !res.ok) return null;
        try {
          return await res.json();
        } catch {
          return null;
        }
      };

      const settingsData = await parseJsonSafe(resSettings);
      const rapbmDataRes = await parseJsonSafe(resRapbm);
      const trxData = await parseJsonSafe(resTrx);
      const teachersData = await parseJsonSafe(resTeachers);
      const payrollData = await parseJsonSafe(resPayroll);
      const studentsData = await parseJsonSafe(resStudents);
      const studentPayData = await parseJsonSafe(resStudentPay);
      const attendancesData = await parseJsonSafe(resAttendances);

      if (settingsData) setMadrasahInfo(settingsData);
      if (rapbmDataRes && Array.isArray(rapbmDataRes)) {
        setRapbmData(alignRapbmDataToSkeleton(rapbmDataRes, ['1446 - 1447 H.', '1447 - 1448 H.']));
      } else {
        setRapbmData(alignRapbmDataToSkeleton(initialRAPBMData, ['1446 - 1447 H.', '1447 - 1448 H.']));
      }
      if (trxData && Array.isArray(trxData)) setTransactions(trxData);
      if (teachersData && Array.isArray(teachersData)) setTeachers(teachersData);
      if (payrollData && Array.isArray(payrollData)) setPayrolls(payrollData);
      if (studentsData && Array.isArray(studentsData)) setStudents(studentsData);
      if (studentPayData && Array.isArray(studentPayData)) setStudentPayments(studentPayData);
      if (attendancesData && Array.isArray(attendancesData)) setTeacherAttendances(attendancesData);
    } catch (e) {
      console.warn('Backend server offline, using local cached state', e);
    } finally {
      setIsSyncing(false);
    }
  };


  useEffect(() => {
    fetchBackendData();
  }, []);

  // --- Browser History & Mobile Back Button Management ---
  const navigateToTab = (newTab: ActiveTab) => {
    if (newTab === activeTab) return;
    try {
      window.history.pushState({ tab: newTab, modal: null }, '', window.location.pathname);
    } catch {
      // ignore
    }
    setActiveTab(newTab);
  };

  const handleOpenSettings = () => {
    try {
      window.history.pushState({ tab: activeTab, modal: 'settings' }, '', window.location.pathname);
    } catch {}
    setIsSettingsOpen(true);
  };

  const handleOpenAddYear = () => {
    try {
      window.history.pushState({ tab: activeTab, modal: 'addYear' }, '', window.location.pathname);
    } catch {}
    setIsAddYearModalOpen(true);
  };

  const handleOpenNewTrx = () => {
    try {
      window.history.pushState({ tab: activeTab, modal: 'newTrx' }, '', window.location.pathname);
    } catch {}
    setIsNewTrxModalOpen(true);
  };

  const handleOpenQuickAction = () => {
    try {
      window.history.pushState({ tab: activeTab, modal: 'quickAction' }, '', window.location.pathname);
    } catch {}
    setIsQuickActionOpen(true);
  };

  const handleOpenPayrollModal = (p: PayrollRecord | PayrollRecord[]) => {
    try {
      window.history.pushState({ tab: activeTab, modal: 'payrollModal' }, '', window.location.pathname);
    } catch {}
    setSelectedPayrollForModal(p);
  };

  // Explicit back navigation handler for mobile header and back events
  const handleNavigateBack = () => {
    // 1. Close any open modal or mobile drawer first
    if (
      isSettingsOpen ||
      isAddYearModalOpen ||
      selectedPayrollForModal ||
      isNewTrxModalOpen ||
      isQuickActionOpen ||
      (isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768)
    ) {
      setIsSettingsOpen(false);
      setIsAddYearModalOpen(false);
      setSelectedPayrollForModal(null);
      setIsNewTrxModalOpen(false);
      setIsQuickActionOpen(false);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
      return;
    }

    // 2. If on any tab other than dashboard, return to dashboard
    if (activeTab !== 'dashboard') {
      try {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          window.history.back();
        } else {
          setActiveTab('dashboard');
        }
      } catch {
        setActiveTab('dashboard');
      }
    }
  };

  // Listen to popstate event (Hardware Back Button / Browser Back Arrow)
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.tab) {
        window.history.replaceState({ tab: activeTab, modal: null }, '', window.location.pathname);
      }
    } catch {}

    const handlePopState = (event: PopStateEvent) => {
      // 1. Close any open modal / drawer
      if (
        isSettingsOpen ||
        isAddYearModalOpen ||
        selectedPayrollForModal ||
        isNewTrxModalOpen ||
        isQuickActionOpen ||
        (isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768)
      ) {
        setIsSettingsOpen(false);
        setIsAddYearModalOpen(false);
        setSelectedPayrollForModal(null);
        setIsNewTrxModalOpen(false);
        setIsQuickActionOpen(false);
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
        return;
      }

      // 2. Switch tab based on event state or go to dashboard
      const stateTab = event.state?.tab as ActiveTab | undefined;
      if (stateTab) {
        setActiveTab(stateTab);
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isSettingsOpen,
    isAddYearModalOpen,
    selectedPayrollForModal,
    isNewTrxModalOpen,
    isQuickActionOpen,
    isSidebarOpen,
    activeTab,
  ]);

  // Sync RAPBM Bisyaroh Guru, Bisyaroh TU, Syahriyah, IMDA, IMNI, dan transaksi Buku Kas Real-time untuk tahun yang aktif
  useEffect(() => {
    if (!rapbmData || rapbmData.length === 0) return;

    // Total Bisyaroh Guru (Pengeluaran) dari Slip Gaji Guru (non-TU) tahun aktif
    const activeYearGuruPayrolls = payrolls.filter(
      (p) =>
        (p.tahunAjaran === selectedYear || (!p.tahunAjaran && selectedYear === '1446 - 1447 H.')) &&
        p.status !== 'TERTUNDA' &&
        !(p.role && (p.role.toLowerCase().includes('tu') || p.role.toLowerCase().includes('tata usaha')))
    );
    const totalBisyarohGuru = activeYearGuruPayrolls.reduce((sum, p) => sum + (p.bisyarohBersih || 0), 0);

    // Total Bisyaroh TU (Pengeluaran) dari Slip Gaji Staf TU tahun aktif
    const activeYearTUPayrolls = payrolls.filter(
      (p) =>
        (p.tahunAjaran === selectedYear || (!p.tahunAjaran && selectedYear === '1446 - 1447 H.')) &&
        p.status !== 'TERTUNDA' &&
        p.role &&
        (p.role.toLowerCase().includes('tu') || p.role.toLowerCase().includes('tata usaha'))
    );
    const totalBisyarohTU = activeYearTUPayrolls.reduce((sum, p) => sum + (p.bisyarohBersih || 0), 0);

    const isMatchYear = (year1?: string, year2?: string) => {
      if (!year1) return year2 === '1446 - 1447 H.';
      return (
        year1.replace(/\s+/g, '').replace('.', '').toLowerCase() ===
        (year2 || '').replace(/\s+/g, '').replace('.', '').toLowerCase()
      );
    };

    // Total Uang Syahriyah (Penerimaan) dari Pembayaran Syahriah santri tahun aktif
    const activeYearSyahriah = studentPayments.filter(
      (p) =>
        isMatchYear(p.tahunAjaran, selectedYear) &&
        (!p.type || p.type.toUpperCase().includes('SYAHRI') || p.type.toUpperCase().includes('SPP'))
    );
    const totalUangSyahriah = activeYearSyahriah.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Total Uang IMDA (Penerimaan) dari Pembayaran IMDA santri tahun aktif
    const activeYearIMDA = studentPayments.filter(
      (p) =>
        isMatchYear(p.tahunAjaran, selectedYear) &&
        p.type &&
        p.type.toUpperCase().includes('IMDA')
    );
    const totalUangIMDA = activeYearIMDA.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Total Uang IMNI (Penerimaan) dari Pembayaran IMNI santri tahun aktif
    const activeYearIMNI = studentPayments.filter(
      (p) =>
        isMatchYear(p.tahunAjaran, selectedYear) &&
        p.type &&
        p.type.toUpperCase().includes('IMNI')
    );
    const totalUangIMNI = activeYearIMNI.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Filter real-time cashbook transactions for active year
    const activeYearTransactions = transactions.filter(
      (t) => t.tahunAjaran === selectedYear || (!t.tahunAjaran && selectedYear === '1446 - 1447 H.')
    );

    // Filter active year RAPBM items
    const activeRapbm = rapbmData.filter(
      (item) => item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.')
    );

    // Sum of amounts grouped by rapbmItemId
    const trxSumByRapbmId: Record<string, number> = {};

    activeYearTransactions.forEach((t) => {
      const isIncome = t.type === 'IN';
      const targetType = isIncome ? 'PENERIMAAN' : 'PENGELUARAN';
      const descUpper = (t.description || '').toUpperCase().trim();
      const catUpper = (t.category || '').toUpperCase().trim();
      const codeTrim = (t.rapbmCode || '').trim().toLowerCase();

      let matchedItem: RAPBMItem | undefined = undefined;

      // 1. Direct rapbmCode match (highest priority)
      if (codeTrim) {
        matchedItem = activeRapbm.find(
          (item) =>
            item.type === targetType &&
            (item.noKode.trim().toLowerCase() === codeTrim || item.id.trim().toLowerCase() === codeTrim)
        );
        if (!matchedItem) {
          matchedItem = activeRapbm.find(
            (item) =>
              item.noKode.trim().toLowerCase() === codeTrim || item.id.trim().toLowerCase() === codeTrim
          );
        }
      }

      const candidates = activeRapbm.filter((item) => item.type === targetType);
      const searchPool = candidates.length > 0 ? candidates : activeRapbm;

      // 2. Exact or Substring Match on Description vs Uraian
      if (!matchedItem && descUpper) {
        matchedItem = searchPool.find((item) => {
          const u = (item.uraian || '').toUpperCase().trim();
          return u && (descUpper === u || descUpper.includes(u) || u.includes(descUpper));
        });
      }

      // 3. Domain Specific Keyword Rules
      if (!matchedItem) {
        if (!isIncome) {
          // PENGELUARAN
          if (descUpper.includes('TU') || descUpper.includes('TATA USAHA')) {
            if (descUpper.includes('BISYAROH') || descUpper.includes('GAJI') || descUpper.includes('STAF') || descUpper.includes('STAFF')) {
              matchedItem = searchPool.find((i) => i.noKode === '1.2' || i.uraian.toLowerCase().includes('bisyaroh tu'));
            }
          }
          if (!matchedItem && (descUpper.includes('BISYAROH') || descUpper.includes('GAJI') || descUpper.includes('GURU') || descUpper.includes('USTADZ'))) {
            matchedItem = searchPool.find((i) => i.noKode === '1.1' || i.uraian.toLowerCase().includes('bisyaroh guru'));
          }
          if (!matchedItem && (descUpper.includes('BEASISWA') || descUpper.includes('SUBSIDI'))) {
            matchedItem = searchPool.find((i) => i.noKode === '1.3');
          }
          if (!matchedItem && (descUpper.includes('DAMPAR') || descUpper.includes('BANGKU') || descUpper.includes('MEJA'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.1');
          }
          if (!matchedItem && (descUpper.includes('LISTRIK') || descUpper.includes('INTERNET') || descUpper.includes('WIFI') || descUpper.includes('PLN') || descUpper.includes('PULSA'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.2');
          }
          if (!matchedItem && (descUpper.includes('CAT') || descUpper.includes('PENGECATAN') || descUpper.includes('GEDUNG'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.3');
          }
          if (!matchedItem && (descUpper.includes('KOMPUTER') || descUpper.includes('PRINTER') || descUpper.includes('LAPTOP'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.4');
          }
          if (!matchedItem && descUpper.includes('LAMPU')) {
            matchedItem = searchPool.find((i) => i.noKode === '2.5');
          }
          if (!matchedItem && descUpper.includes('PAPAN TULIS')) {
            matchedItem = searchPool.find((i) => i.noKode === '2.6');
          }
          if (!matchedItem && (descUpper.includes('SAMPAH') || descUpper.includes('SAPU') || descUpper.includes('SULAK'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.7');
          }
          if (!matchedItem && (descUpper.includes('ATAP') || descUpper.includes('JENDELA') || descUpper.includes('PINTU'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.8');
          }
          if (!matchedItem && descUpper.includes('KIPAS')) {
            matchedItem = searchPool.find((i) => i.noKode === '2.9');
          }
          if (!matchedItem && (descUpper.includes('KAMAR MANDI') || descUpper.includes('WC') || descUpper.includes('TOILET'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.10');
          }
          if (!matchedItem && (descUpper.includes('BANNER') || descUpper.includes('JADWAL') || descUpper.includes('KALENDER'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.1');
          }
          if (!matchedItem && (descUpper.includes('BUFALLO') || descUpper.includes('BUFFALO'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.2');
          }
          if (!matchedItem && (descUpper.includes('HVS') || descUpper.includes('KERTAS'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.3');
          }
          if (!matchedItem && (descUpper.includes('ISOLASI') || descUpper.includes('STAPLES') || descUpper.includes('LAKBAN') || descUpper.includes('GUNTING'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.4');
          }
          if (!matchedItem && descUpper.includes('KAPUR')) {
            matchedItem = searchPool.find((i) => i.noKode === '3.5');
          }
          if (!matchedItem && (descUpper.includes('FOTOKOPI') || descUpper.includes('FOTO COPY') || descUpper.includes('JILID'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.6');
          }
          if (!matchedItem && (descUpper.includes('BALLPOINT') || descUpper.includes('PULPEN') || descUpper.includes('SPIDOL'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.7');
          }
          if (!matchedItem && (descUpper.includes('PENGHAPUS') || descUpper.includes('TAPLAK'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.8');
          }
          if (!matchedItem && (descUpper.includes('PROPOSAL') || descUpper.includes('SPJ') || descUpper.includes('MOU'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.9');
          }
          if (!matchedItem && descUpper.includes('TINTA')) {
            matchedItem = searchPool.find((i) => i.noKode === '3.10');
          }
          if (!matchedItem && descUpper.includes('RAPIM')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.1');
          }
          if (!matchedItem && descUpper.includes('KMGF')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.2');
          }
          if (!matchedItem && descUpper.includes('MUAMMAR')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.3');
          }
          if (!matchedItem && descUpper.includes('RAPAT')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.4');
          }
          if (!matchedItem && descUpper.includes('TAMRIN')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.5');
          }
          if (!matchedItem && descUpper.includes('IMDA')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.6' || (i.uraian && i.uraian.toUpperCase().includes('IMDA')));
          }
          if (!matchedItem && descUpper.includes('IMNI')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.7' || (i.uraian && i.uraian.toUpperCase().includes('IMNI')));
          }
          if (!matchedItem && (descUpper.includes('PHBI') || descUpper.includes('MAULID') || descUpper.includes('ISRA'))) {
            matchedItem = searchPool.find((i) => i.noKode === '4.8');
          }
          if (!matchedItem && descUpper.includes('SERAGAM')) {
            matchedItem = searchPool.find((i) => i.noKode === '5.1');
          }
          if (!matchedItem && (descUpper.includes('HAFLATUL') || descUpper.includes('HAFLAH') || descUpper.includes('IKHTIBAR'))) {
            matchedItem = searchPool.find((i) => i.noKode === '5.2');
          }
        } else {
          // PENERIMAAN
          if (descUpper.includes('SISA TAHUN LALU') || descUpper.includes('SALDO AWAL') || descUpper.includes('SISA KAS')) {
            matchedItem = searchPool.find((i) => i.noKode === '1' || i.uraian.toUpperCase().includes('SISA TAHUN LALU'));
          }
          if (!matchedItem && (descUpper.includes('SYAHRIYAH') || descUpper.includes('SYAHRIAH') || descUpper.includes('SPP'))) {
            matchedItem = searchPool.find((i) => i.noKode === '2.1' || (i.uraian && (i.uraian.toLowerCase().includes('syahri') || i.uraian.toLowerCase().includes('spp'))));
          }
          if (!matchedItem && descUpper.includes('IMDA')) {
            matchedItem = searchPool.find((i) => i.noKode === '2.2' || (i.uraian && i.uraian.toUpperCase().includes('IMDA')));
          }
          if (!matchedItem && descUpper.includes('IMNI')) {
            matchedItem = searchPool.find((i) => i.noKode === '2.3' || (i.uraian && i.uraian.toUpperCase().includes('IMNI')));
          }
          if (!matchedItem && (descUpper.includes('BPPDGS') || descUpper.includes('BOS') || descUpper.includes('PROVINSI'))) {
            matchedItem = searchPool.find((i) => i.noKode === '3.1');
          }
          if (!matchedItem && descUpper.includes('DANSOS')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.1');
          }
          if (!matchedItem && descUpper.includes('SAWAH')) {
            matchedItem = searchPool.find((i) => i.noKode === '4.2');
          }
          if (!matchedItem && descUpper.includes('TABUNGAN')) {
            matchedItem = searchPool.find((i) => i.noKode === '5.1');
          }
          if (!matchedItem && descUpper.includes('KITAB')) {
            matchedItem = searchPool.find((i) => i.noKode === '5.2');
          }
          if (!matchedItem && descUpper.includes('SERAGAM')) {
            matchedItem = searchPool.find((i) => i.noKode === '5.3');
          }
          if (!matchedItem && (descUpper.includes('PENDAFTARAN') || descUpper.includes('MURID BARU'))) {
            matchedItem = searchPool.find((i) => i.noKode === '5.4');
          }
          if (!matchedItem && descUpper.includes('KOPERASI')) {
            matchedItem = searchPool.find((i) => i.noKode === '5.5');
          }
          if (!matchedItem && (descUpper.includes('FOTOKOPI') || descUpper.includes('FOTO COPY'))) {
            matchedItem = searchPool.find((i) => i.noKode === '5.6');
          }
          if (!matchedItem && (descUpper.includes('HAFLATUL') || descUpper.includes('IKHTIBAR'))) {
            matchedItem = searchPool.find((i) => i.noKode === '6.1');
          }
          if (!matchedItem && (descUpper.includes('DONATUR') || descUpper.includes('ALUMNI'))) {
            matchedItem = searchPool.find((i) => i.noKode === '6.2');
          }
          if (!matchedItem && (descUpper.includes('JAM\'IYYAH') || descUpper.includes('JAMIYYAH'))) {
            matchedItem = searchPool.find((i) => i.noKode === '6.3');
          }
        }
      }

      // 4. Token Overlap Scoring Match
      if (!matchedItem && descUpper) {
        const descTokens = descUpper.split(/[\s,.\/-]+/).filter((w) => w.length >= 3 && !['DAN', 'ATAU', 'YANG', 'BIAYA', 'PENGELUARAN', 'PENERIMAAN'].includes(w));
        let maxScore = 0;
        let bestCandidate: RAPBMItem | undefined = undefined;

        searchPool.forEach((item) => {
          const itemTokens = (item.uraian || '').toUpperCase().split(/[\s,.\/-]+/).filter((w) => w.length >= 3 && !['DAN', 'ATAU', 'YANG', 'BIAYA', 'PENGELUARAN', 'PENERIMAAN'].includes(w));
          let score = 0;
          itemTokens.forEach((iToken) => {
            if (descTokens.some((dToken) => dToken === iToken || dToken.includes(iToken) || iToken.includes(dToken))) {
              score += 10;
            }
          });
          if (catUpper && (item.categoryName.toUpperCase().includes(catUpper) || catUpper.includes(item.categoryName.toUpperCase()))) {
            score += 2;
          }
          if (score > maxScore) {
            maxScore = score;
            bestCandidate = item;
          }
        });

        if (maxScore > 0) {
          matchedItem = bestCandidate;
        }
      }

      // 5. Category Match
      if (!matchedItem && catUpper) {
        matchedItem = searchPool.find((item) => {
          const cName = (item.categoryName || '').toUpperCase().trim();
          const cCode = (item.categoryCode || '').toUpperCase().trim();
          return catUpper === cName || catUpper === cCode;
        });
      }

      // 6. Fallback
      if (!matchedItem) {
        if (!isIncome) {
          matchedItem =
            searchPool.find((item) => item.noKode === '5.3' || item.uraian.toLowerCase().includes('insidentil')) ||
            searchPool[searchPool.length - 1];
        } else {
          matchedItem =
            searchPool.find(
              (item) =>
                item.noKode === '6.3' ||
                item.uraian.toLowerCase().includes('jam\'iyyah') ||
                item.uraian.toLowerCase().includes('lain')
            ) || searchPool[searchPool.length - 1];
        }
      }

      if (matchedItem) {
        trxSumByRapbmId[matchedItem.id] = (trxSumByRapbmId[matchedItem.id] || 0) + (t.amount || 0);
      }
    });

    let hasChanges = false;
    const updated = rapbmData.map((item) => {
      const isThisYear = item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.');
      if (!isThisYear) return item;

      // Base realization from Real-time Cash Book
      let targetRealita = trxSumByRapbmId[item.id] || 0;

      // Sync directly from module totals for specific income and expense items
      if (item.type === 'PENERIMAAN') {
        const uLower = (item.uraian || '').toLowerCase();
        const uUpper = (item.uraian || '').toUpperCase();
        if (item.noKode === '2.1' || uLower.includes('syahri') || uLower.includes('spp')) {
          targetRealita = Math.max(targetRealita, totalUangSyahriah);
        } else if (item.noKode === '2.2' || uUpper.includes('IMDA')) {
          targetRealita = Math.max(targetRealita, totalUangIMDA);
        } else if (item.noKode === '2.3' || uUpper.includes('IMNI')) {
          targetRealita = Math.max(targetRealita, totalUangIMNI);
        }
      } else if (item.type === 'PENGELUARAN') {
        const uLower = (item.uraian || '').toLowerCase();
        if (item.noKode === '1.1' || uLower.includes('bisyaroh guru') || uLower.includes('gaji guru')) {
          targetRealita = Math.max(targetRealita, totalBisyarohGuru);
        } else if (item.noKode === '1.2' || uLower.includes('bisyaroh tu') || uLower.includes('gaji tu') || uLower.includes('staf tu')) {
          targetRealita = Math.max(targetRealita, totalBisyarohTU);
        }
      }

      // For PENERIMAAN items, update targetAnggaran if not explicitly set
      let targetAnggaran = item.jumlahAnggaran;
      if (item.type === 'PENERIMAAN' && item.jumlahAnggaran <= 0) {
        targetAnggaran = targetRealita;
      }

      if (item.realita !== targetRealita || item.jumlahAnggaran !== targetAnggaran) {
        hasChanges = true;
        const calcAnggaran = targetAnggaran > 0 ? targetAnggaran : targetRealita;
        const persentase = calcAnggaran > 0 ? Math.round((targetRealita / calcAnggaran) * 100) : 100;

        // Persist change to backend database
        apiFetch(`/api/rapbm/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jumlahAnggaran: targetAnggaran, realita: targetRealita, persentase }),
        }).catch((err) => console.error('Failed to sync RAPBM item to backend:', err));

        return { ...item, jumlahAnggaran: targetAnggaran, realita: targetRealita, persentase };
      }

      return item;
    });

    if (hasChanges) {
      setRapbmData(updated);
    }
  }, [payrolls, studentPayments, transactions, selectedYear, rapbmData]);

  // Filter RAPBM for current selected year
  const currentYearRapbm = rapbmData.filter(
    (item) => item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.')
  );

  const currentYearPayrolls = payrolls.filter(
    (item) => item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.')
  );

  const currentYearTransactions = transactions.filter(
    (item) => item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.')
  );

  // Backup & Restore Handlers
  const handleExportBackup = async () => {
    try {
      const res = await apiFetch('/api/backup/export');
      let data;
      if (res && res.ok) {
        data = await res.json();
      } else {
        // Fallback to client state
        data = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          settings: madrasahInfo,
          rapbmItems: rapbmData,
          transactions,
          teachers,
          payrollRecords: payrolls,
          students,
          studentPayments,
        };
      }

      const cleanYearName = (selectedYear || '1446-1447H').replace(/[^a-zA-Z0-9-]/g, '_');
      const fileName = `backup_madrasah_finance_${cleanYearName}_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = fileName;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export backup failed:', e);
      throw e;
    }
  };

  const handleRestoreBackup = async (backupData: any) => {
    try {
      const res = await apiFetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memulihkan data');
      }

      // Refresh application state
      await fetchBackendData();
    } catch (e) {
      console.error('Restore backup failed:', e);
      // Fallback local update if backend is offline
      if (backupData.settings) setMadrasahInfo(backupData.settings);
      if (Array.isArray(backupData.rapbmItems)) setRapbmData(backupData.rapbmItems);
      if (Array.isArray(backupData.transactions)) setTransactions(backupData.transactions);
      if (Array.isArray(backupData.teachers)) setTeachers(backupData.teachers);
      if (Array.isArray(backupData.payrollRecords)) setPayrolls(backupData.payrollRecords);
      if (Array.isArray(backupData.students)) setStudents(backupData.students);
      if (Array.isArray(backupData.studentPayments)) setStudentPayments(backupData.studentPayments);
    }
  };

  // Year Selection & Addition Handlers
  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
  };

  const handleAddNewYear = async (newYear: string) => {
    if (!availableYears.includes(newYear)) {
      setAvailableYears((prev) => [...prev, newYear]);
    }

    // Copy all established items from current selected year (including all custom added items) into the new year
    const sourceItems = rapbmData.filter((i) => i.tahunAjaran === selectedYear || (!i.tahunAjaran && selectedYear === '1446 - 1447 H.'));
    const sourceList = sourceItems.length > 0 ? sourceItems : rapbmData.filter((i) => i.tahunAjaran === '1446 - 1447 H.');

    const existingNewYearItems = rapbmData.filter((i) => i.tahunAjaran === newYear);
    if (existingNewYearItems.length === 0 && sourceList.length > 0) {
      const newYearItems: RAPBMItem[] = sourceList.map((item, idx) => ({
        id: `rapbm-${newYear.replace(/[^a-zA-Z0-9]/g, '')}-${item.type.toLowerCase()}-${(item.noKode || '').replace(/\./g, '_')}-${idx}-${Date.now()}`,
        tahunAjaran: newYear,
        type: item.type,
        categoryCode: item.categoryCode,
        categoryName: item.categoryName,
        noUrut: item.noUrut,
        noKode: item.noKode,
        uraian: item.uraian,
        jumlahAnggaran: item.jumlahAnggaran || 0,
        realita: 0,
        persentase: 0,
      }));

      setRapbmData((prev) => [...prev, ...newYearItems]);
      apiFetch('/api/rapbm/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newYearItems }),
      }).catch(console.error);
    }

    setSelectedYear(newYear);
  };

  // Total Calculations (matching RAPBM table totals exactly)
  let totalIncome = 0;
  let totalExpense = 0;

  currentYearRapbm.forEach((item) => {
    if (item.type === 'PENERIMAAN') {
      totalIncome += (item.realita > 0 ? item.realita : (item.jumlahAnggaran || 0));
    } else if (item.type === 'PENGELUARAN') {
      totalExpense += (item.realita || 0);
    }
  });

  // Handlers for Backend API Mutators
  const handleUpdateSettings = async (updated: Partial<MadrasahInfo>) => {
    const newSettings = { ...madrasahInfo, ...updated };
    setMadrasahInfo(newSettings);
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRAPBMItem = async (
    id: string,
    jumlahAnggaran: number,
    realita: number,
    uraian?: string,
    noKode?: string,
    categoryName?: string
  ) => {
    const prevItem = rapbmData.find((item) => item.id === id);
    const newAnggaran = Number(jumlahAnggaran);
    const newRealita = Number(realita);
    const persentase = newAnggaran > 0 ? Math.round((newRealita / newAnggaran) * 100) : 100;

    setRapbmData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              jumlahAnggaran: newAnggaran,
              realita: newRealita,
              persentase,
              ...(uraian !== undefined ? { uraian } : {}),
              ...(noKode !== undefined ? { noKode } : {}),
              ...(categoryName !== undefined ? { categoryName } : {}),
            }
          : item
      )
    );

    try {
      await apiFetch(`/api/rapbm/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jumlahAnggaran: newAnggaran,
          realita: newRealita,
          ...(uraian !== undefined ? { uraian } : {}),
          ...(noKode !== undefined ? { noKode } : {}),
          ...(categoryName !== undefined ? { categoryName } : {}),
        }),
      });
    } catch (e) {
      console.error(e);
    }

    // Otomatis masukkan ke catatan transaksi kas saat ada perubahan/penyesuaian realita di RAPBM
    if (prevItem) {
      const diffRealita = newRealita - (prevItem.realita || 0);
      if (diffRealita !== 0) {
        const hijriObj = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
        const isIncome = prevItem.type === 'PENERIMAAN';
        const autoTrx: Omit<Transaction, 'id'> = {
          dateGregorian: new Date().toISOString().split('T')[0],
          dateHijri: hijriObj.formatted,
          tahunAjaran: prevItem.tahunAjaran || madrasahInfo.activeYear,
          type: diffRealita > 0 ? (isIncome ? 'IN' : 'OUT') : (isIncome ? 'OUT' : 'IN'),
          category: prevItem.categoryName || (isIncome ? 'PENERIMAAN' : 'PENGELUARAN'),
          description: `Perubahan Realisasi RAPBM [Kode ${prevItem.noKode}]: ${uraian || prevItem.uraian}`,
          amount: Math.abs(diffRealita),
          receiptNumber: `RAPBM-${Date.now().toString().slice(-6)}`,
          recordedBy: madrasahInfo.treasurerName || 'Admin RAPBM',
          rapbmCode: prevItem.noKode,
        };
        await handleAddTransaction(autoTrx);
      }
    }
  };

  const handleAddRapbmItem = async (newItemData: Omit<RAPBMItem, 'id'>) => {
    const itemYear = newItemData.tahunAjaran || selectedYear;
    const baseTimestamp = Date.now();
    const createdItem: RAPBMItem = {
      id: `rapbm-${baseTimestamp}-${Math.floor(Math.random() * 1000)}`,
      ...newItemData,
      tahunAjaran: itemYear,
    };

    // Otomatis tetapkan item ini untuk semua tahun ajaran berikutnya yang terdaftar
    const futureItems: RAPBMItem[] = [];
    const currentIndex = availableYears.indexOf(itemYear);
    const subsequentYears = currentIndex !== -1
      ? availableYears.slice(currentIndex + 1)
      : availableYears.filter((y) => y > itemYear);

    subsequentYears.forEach((futYear, idx) => {
      const existsInFuture = rapbmData.some(
        (i) =>
          i.tahunAjaran === futYear &&
          ((newItemData.noKode && i.noKode === newItemData.noKode) ||
           (i.uraian && newItemData.uraian && i.uraian.toLowerCase().trim() === newItemData.uraian.toLowerCase().trim() && i.type === newItemData.type))
      );

      if (!existsInFuture) {
        futureItems.push({
          ...newItemData,
          id: `rapbm-fut-${baseTimestamp}-${idx}-${Math.floor(Math.random() * 1000)}`,
          tahunAjaran: futYear,
          jumlahAnggaran: newItemData.jumlahAnggaran || 0,
          realita: 0,
          persentase: 0,
        });
      }
    });

    const allNewItems = [createdItem, ...futureItems];
    setRapbmData((prev) => [...prev, ...allNewItems]);

    try {
      await apiFetch('/api/rapbm/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: allNewItems }),
      });
    } catch (e) {
      console.error('Error adding RAPBM items in batch:', e);
      try {
        await apiFetch('/api/rapbm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdItem),
        });
      } catch (err) {
        console.error('Error in single fallback add:', err);
      }
    }

    // Jika item RAPBM baru ditambahkan dengan realita/pencatatan nominal > 0, otomatis buat transaksi kas
    if (newItemData.realita && newItemData.realita > 0) {
      const hijriObj = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
      const isIncome = newItemData.type === 'PENERIMAAN';
      const autoTrx: Omit<Transaction, 'id'> = {
        dateGregorian: new Date().toISOString().split('T')[0],
        dateHijri: hijriObj.formatted,
        tahunAjaran: itemYear,
        type: isIncome ? 'IN' : 'OUT',
        category: newItemData.categoryName || (isIncome ? 'PENERIMAAN' : 'PENGELUARAN'),
        description: `Transaksi Baru RAPBM [Kode ${newItemData.noKode}]: ${newItemData.uraian}`,
        amount: newItemData.realita,
        receiptNumber: `RAPBM-${Date.now().toString().slice(-6)}`,
        recordedBy: madrasahInfo.treasurerName || 'Admin RAPBM',
        rapbmCode: newItemData.noKode,
      };
      await handleAddTransaction(autoTrx);
    }
  };

  const handleDeleteRapbmItem = async (id: string) => {
    setRapbmData((prev) => prev.filter((item) => item.id !== id));
    try {
      await apiFetch(`/api/rapbm/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting RAPBM item:', e);
    }
  };

  const handleAddTransaction = async (trxData: Omit<Transaction, 'id'>) => {
    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      ...trxData,
    };

    setTransactions((prev) => [newTrx, ...prev]);

    // Update RAPBM realization locally
    if (newTrx.rapbmCode) {
      setRapbmData((prev) =>
        prev.map((item) => {
          if (item.noKode === newTrx.rapbmCode) {
            const updatedRealita = item.realita + newTrx.amount;
            const persentase =
              item.jumlahAnggaran > 0
                ? Math.round((updatedRealita / item.jumlahAnggaran) * 100)
                : 100;
            return { ...item, realita: updatedRealita, persentase };
          }
          return item;
        })
      );
    }

    try {
      await apiFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trxData),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (target && target.rapbmCode) {
      setRapbmData((prev) =>
        prev.map((item) => {
          if (item.noKode === target.rapbmCode) {
            const updatedRealita = Math.max(0, item.realita - target.amount);
            const persentase =
              item.jumlahAnggaran > 0
                ? Math.round((updatedRealita / item.jumlahAnggaran) * 100)
                : 100;
            return { ...item, realita: updatedRealita, persentase };
          }
          return item;
        })
      );
    }

    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAllTransactions = async () => {
    const activeYr = selectedYear || '1446 - 1447 H.';

    // 1. Clear local transactions for active year
    setTransactions((prev) =>
      prev.filter((t) => {
        const isThisYear = t.tahunAjaran === activeYr || (!t.tahunAjaran && activeYr === '1446 - 1447 H.');
        return !isThisYear;
      })
    );

    // 2. Clear local student payments for active year
    setStudentPayments((prev) =>
      prev.filter((p) => {
        const isThisYear = p.tahunAjaran === activeYr || (!p.tahunAjaran && activeYr === '1446 - 1447 H.');
        return !isThisYear;
      })
    );

    // 3. Clear local payrolls for active year
    setPayrolls((prev) =>
      prev.filter((pr) => {
        const isThisYear = pr.tahunAjaran === activeYr || (!pr.tahunAjaran && activeYr === '1446 - 1447 H.');
        return !isThisYear;
      })
    );

    // 4. Reset RAPBM realita & persentase (and PENERIMAAN jumlahAnggaran) for active year
    setRapbmData((prev) =>
      prev.map((item) => {
        const isThisYear = item.tahunAjaran === activeYr || (!item.tahunAjaran && activeYr === '1446 - 1447 H.');
        if (isThisYear) {
          return {
            ...item,
            jumlahAnggaran: item.type === 'PENERIMAAN' ? 0 : item.jumlahAnggaran,
            realita: 0,
            persentase: 0,
          };
        }
        return item;
      })
    );

    // 5. Sync deletion to backend
    try {
      await apiFetch('/api/clear-year-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahunAjaran: activeYr }),
      });
    } catch (e) {
      console.error('Error clearing year data:', e);
    }
  };

  const handleAddTeacher = async (teacherData: Omit<Teacher, 'id'>) => {
    const newT: Teacher = {
      id: `t-${Date.now()}`,
      ...teacherData,
    };
    setTeachers((prev) => [...prev, newT]);

    try {
      await apiFetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTeacher = async (id: string, updated: Partial<Teacher>) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );

    try {
      await apiFetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      // Sync payrolls after teacher is updated
      const payRes = await apiFetch('/api/payroll');
      if (payRes && payRes.ok) {
        const payData = await payRes.json();
        setPayrolls(payData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPayroll = async (payrollData: Omit<PayrollRecord, 'id'>) => {
    const targetYear = payrollData.tahunAjaran || selectedYear;
    const formattedHijriDate = formatHijriDateForAcademicYear(
      payrollData.dateGeneratedHijri,
      targetYear,
      payrollData.monthHijri,
      madrasahInfo.hijriOffsetDays
    );
    const newPay: PayrollRecord = {
      id: `pay-${Date.now()}`,
      ...payrollData,
      tahunAjaran: targetYear,
      dateGeneratedHijri: formattedHijriDate,
    };
    setPayrolls((prev) => [newPay, ...prev]);

    // Add corresponding cashbook expense automatically
    const isTU = newPay.role.toLowerCase().includes('tu') || newPay.role.toLowerCase().includes('tata usaha');
    const rapbmCode = isTU ? '1.2' : '1.1';

    const newTrx: Transaction = {
      id: `trx-pay-${Date.now()}`,
      tahunAjaran: targetYear,
      dateGregorian: newPay.dateGeneratedGregorian,
      dateHijri: newPay.dateGeneratedHijri,
      type: 'OUT',
      rapbmCode,
      category: 'BISYAROH DAN TUNJANGAN',
      description: isTU
        ? `Bisyaroh Staf TU ${newPay.teacherName} (${newPay.monthHijri})`
        : `Bisyaroh Ustadz/ah ${newPay.teacherName} (${newPay.monthHijri})`,
      amount: newPay.bisyarohBersih,
      recordedBy: madrasahInfo.treasurerName,
      receiptNumber: `PAY-${newPay.id}`,
    };

    setTransactions((prev) => [newTrx, ...prev]);

    // Update RAPBM realization locally
    setRapbmData((prev) =>
      prev.map((item) => {
        if (item.noKode === rapbmCode && (item.tahunAjaran === targetYear || (!item.tahunAjaran && targetYear === '1446 - 1447 H.'))) {
          const updatedRealita = item.realita + newPay.bisyarohBersih;
          const persentase =
            item.jumlahAnggaran > 0
              ? Math.round((updatedRealita / item.jumlahAnggaran) * 100)
              : 100;
          return { ...item, realita: updatedRealita, persentase };
        }
        return item;
      })
    );

    try {
      await apiFetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPay),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePayroll = async (id: string) => {
    const target = payrolls.find((p) => p.id === id);
    setPayrolls((prev) => prev.filter((p) => p.id !== id));

    if (target) {
      const receiptNo = `PAY-${target.id}`;
      const trxTarget = transactions.find((t) => t.receiptNumber === receiptNo);
      if (trxTarget) {
        setTransactions((prev) => prev.filter((t) => t.receiptNumber !== receiptNo));
        if (trxTarget.rapbmCode) {
          setRapbmData((prev) =>
            prev.map((item) => {
              if (item.noKode === trxTarget.rapbmCode && (item.tahunAjaran === target.tahunAjaran || (!item.tahunAjaran && target.tahunAjaran === '1446 - 1447 H.'))) {
                const updatedRealita = Math.max(0, item.realita - trxTarget.amount);
                const persentase =
                  item.jumlahAnggaran > 0
                    ? Math.round((updatedRealita / item.jumlahAnggaran) * 100)
                    : 100;
                return { ...item, realita: updatedRealita, persentase };
              }
              return item;
            })
          );
        }
      }
    }

    try {
      await apiFetch(`/api/payroll/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAllPayrolls = async () => {
    setPayrolls([]);
    setTransactions((prev) => prev.filter((t) => !t.receiptNumber?.startsWith('PAY-')));

    setRapbmData((prev) =>
      prev.map((item) => {
        if (item.noKode === '1.1' || item.noKode === '1.2' || item.noKode === '1.3') {
          return { ...item, realita: 0, persentase: 0 };
        }
        return item;
      })
    );

    try {
      await apiFetch('/api/payroll-all', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  // Teacher Attendance & Auto-Payroll Handlers
  const handleSaveTeacherAttendances = async (items: TeacherAttendance[]) => {
    // Update local state
    setTeacherAttendances((prev) => {
      const nextMap = new Map(prev.map((a) => [a.id, a]));
      items.forEach((item) => nextMap.set(item.id, item));
      return Array.from(nextMap.values());
    });

    try {
      await apiFetch('/api/teacher-attendances/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (e) {
      console.error('Failed to save teacher attendances:', e);
    }
  };

  const handleGeneratePayrollFromAttendance = async (
    monthHijri: string,
    targetYear: string,
    attendancesToProcess: TeacherAttendance[]
  ) => {
    const today = new Date();
    const gregorianStr = today.toISOString().split('T')[0];
    const rawHijri = getHijriDate(today, madrasahInfo.hijriOffsetDays);
    const formattedHijri = formatHijriDateForAcademicYear(rawHijri, targetYear, monthHijri, madrasahInfo.hijriOffsetDays);

    const generatedPayrolls: PayrollRecord[] = [];
    const generatedTrx: Transaction[] = [];

    for (const att of attendancesToProcess) {
      const teacher = teachers.find((t) => t.id === att.teacherId);
      const isTU = (att.role || teacher?.role || '').toLowerCase().includes('tu') || (att.role || teacher?.role || '').toLowerCase().includes('tata usaha');
      const rapbmCode = isTU ? '1.2' : '1.1';

      const hadir = Number(att.hadir) || 0;
      const tarif = Number(att.tarifPerTatapMuka) || Number(teacher?.tarifPerJam) || 25000;
      const bisyarohPokok = hadir * tarif;
      const tunjanganJabatan = Number(att.tunjanganJabatan) || 0;
      const tunjanganMasaKerja = Number(att.tunjanganMasaKerja) || 0;
      const tunjanganKehadiran = Number(att.tunjanganKehadiran) || 0;
      const totalGajiKotor = bisyarohPokok + tunjanganJabatan + tunjanganMasaKerja + tunjanganKehadiran;

      const potInfaq = Number(att.potonganInfaq) || 0;
      const potTabungan = Number(att.potonganTabungan) || 0;
      const potLain = Number(att.potonganLain) || 0;
      const totalPotongan = potInfaq + potTabungan + potLain;
      const bisyarohBersih = Math.max(0, totalGajiKotor - totalPotongan);

      const totalTunjangan = tunjanganJabatan + tunjanganMasaKerja + tunjanganKehadiran;

      const payRecord: PayrollRecord = {
        id: `pay-att-${targetYear.replace(/[^a-zA-Z0-9]/g, '')}-${monthHijri.replace(/[^a-zA-Z0-9]/g, '')}-${att.teacherId}`,
        tahunAjaran: targetYear,
        teacherId: att.teacherId,
        teacherName: att.teacherName,
        nipNu: att.nipNu || teacher?.nipNu || '',
        role: att.role || teacher?.role || 'Pengajar',
        monthHijri,
        monthGregorian: gregorianStr,
        dateGeneratedGregorian: gregorianStr,
        dateGeneratedHijri: formattedHijri,
        jamMengajar: hadir, // Menggunakan kehadiran aktual tatap muka
        bisyarohPokok,
        tunjanganGuru: totalTunjangan,
        tunjanganLain: 0,
        totalGajiKotor,
        potonganInfaq: potInfaq,
        potonganTabungan: potTabungan,
        potonganLain: potLain,
        totalPotongan,
        bisyarohBersih,
        status: 'LUNAS',
        notes: `Kalkulasi presensi tatap muka: ${hadir} jam/pertemuan (${monthHijri})`,
      };

      generatedPayrolls.push(payRecord);

      const newTrx: Transaction = {
        id: `trx-${payRecord.id}`,
        tahunAjaran: targetYear,
        dateGregorian: gregorianStr,
        dateHijri: formattedHijri,
        type: 'OUT',
        rapbmCode,
        category: 'BISYAROH DAN TUNJANGAN',
        description: isTU
          ? `Bisyaroh Staf TU ${payRecord.teacherName} (${monthHijri}) - Presensi: ${hadir} TM`
          : `Bisyaroh Ustadz/ah ${payRecord.teacherName} (${monthHijri}) - Presensi: ${hadir} TM`,
        amount: bisyarohBersih,
        recordedBy: madrasahInfo.treasurerName,
        receiptNumber: `PAY-${payRecord.id}`,
      };

      generatedTrx.push(newTrx);
    }

    // Update payrolls state (replace existing for same month or prepend)
    setPayrolls((prev) => {
      const generatedIds = new Set(generatedPayrolls.map((p) => p.id));
      const filtered = prev.filter((p) => !generatedIds.has(p.id));
      return [...generatedPayrolls, ...filtered];
    });

    // Update transactions state
    setTransactions((prev) => {
      const receiptNos = new Set(generatedPayrolls.map((p) => `PAY-${p.id}`));
      const filtered = prev.filter((t) => !receiptNos.has(t.receiptNumber || ''));
      return [...generatedTrx, ...filtered];
    });

    // Update RAPBM Realization
    const totalGuruBersih = generatedPayrolls
      .filter((p) => !p.role.toLowerCase().includes('tu') && !p.role.toLowerCase().includes('tata usaha'))
      .reduce((sum, p) => sum + p.bisyarohBersih, 0);

    const totalTUBersih = generatedPayrolls
      .filter((p) => p.role.toLowerCase().includes('tu') || p.role.toLowerCase().includes('tata usaha'))
      .reduce((sum, p) => sum + p.bisyarohBersih, 0);

    setRapbmData((prev) =>
      prev.map((item) => {
        if (item.tahunAjaran === targetYear || (!item.tahunAjaran && targetYear === '1446 - 1447 H.')) {
          if (item.noKode === '1.1') {
            const updatedRealita = item.realita + totalGuruBersih;
            const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;
            return { ...item, realita: updatedRealita, persentase };
          }
          if (item.noKode === '1.2') {
            const updatedRealita = item.realita + totalTUBersih;
            const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;
            return { ...item, realita: updatedRealita, persentase };
          }
        }
        return item;
      })
    );

    // Save attendance batch and payrolls to backend
    try {
      await apiFetch('/api/teacher-attendances/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: attendancesToProcess }),
      });

      for (const pay of generatedPayrolls) {
        await apiFetch('/api/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pay),
        });
      }
    } catch (e) {
      console.error('Error generating payroll batch:', e);
    }
  };

  // Student & Payment Handlers
  const handleAddStudent = async (studentData: Omit<Student, 'id'> & { id?: string }) => {
    try {
      const res = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      if (res.ok) {
        const saved = await res.json();
        setStudents((prev) => [...prev, saved]);
      }
    } catch (e) {
      console.error('Error adding student:', e);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setStudentPayments((prev) => prev.filter((p) => p.studentId !== id));
    try {
      const res = await apiFetch(`/api/students/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res && res.ok) {
        await fetchBackendData();
      }
    } catch (e) {
      console.error('Error deleting student:', e);
      await fetchBackendData();
    }
  };

  const handleImportStudents = async (studentsList: any[], overwrite = false) => {
    try {
      const res = await apiFetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentsList, overwrite }),
      });
      if (res.ok) {
        await fetchBackendData();
      }
    } catch (e) {
      console.error('Error importing students:', e);
    }
  };

  const handleSaveBatchPayments = async (paymentsList: Omit<StudentPayment, 'id'>[], createCashbookEntry: boolean) => {
    try {
      const res = await apiFetch('/api/student-payments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments: paymentsList, createCashbookEntry }),
      });
      if (res.ok) {
        // Refetch backend data to synchronize payments, cashbook transactions, and RAPBM
        await fetchBackendData();
      }
    } catch (e) {
      console.error('Error saving batch payments:', e);
    }
  };

  const handleDeletePayment = async (id: string) => {
    setStudentPayments((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await apiFetch(`/api/student-payments/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res && res.ok) {
        await fetchBackendData();
      }
    } catch (e) {
      console.error('Error deleting payment:', e);
      // Re-sync backend data in case deletion failed
      await fetchBackendData();
    }
  };

  const handleDeleteBatchPayments = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setStudentPayments((prev) => prev.filter((p) => !ids.includes(p.id)));
    try {
      const res = await apiFetch('/api/student-payments/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res && res.ok) {
        await fetchBackendData();
      }
    } catch (e) {
      console.error('Error batch deleting payments:', e);
      await fetchBackendData();
    }
  };

  const handleUpdatePayment = async (id: string, updatedData: Partial<StudentPayment>) => {
    setStudentPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedData } : p))
    );
    try {
      const res = await apiFetch(`/api/student-payments/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        await fetchBackendData();
      }
    } catch (e) {
      console.error('Error updating payment:', e);
    }
  };


  const activeMadrasahInfo = { ...madrasahInfo, tahunAjaranHijri: selectedYear };

  // PDF Export Triggers
  const handleExportRAPBMPDF = (customTanggal?: string) => {
    const currentHijri = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
    const dateStr = customTanggal || localStorage.getItem('rapbm_tanggal_pengesahan') || `${madrasahInfo.kabupaten || 'Pasuruan'}, ${currentHijri.formatted}`;
    generateRAPBMPDF(activeMadrasahInfo, currentYearRapbm, dateStr);
  };

  const handleExportCashflowPDF = () => {
    const currentHijri = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
    generateCashFlowPDF(activeMadrasahInfo, transactions, selectedYear, currentHijri.formatted);
  };

  const handleExportInventoryPDF = (inventoryData: any[]) => {
    const currentHijri = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
    generateInventoryPDF(activeMadrasahInfo, inventoryData, currentHijri.formatted);
  };

  const handleExportSlipPDF = (payroll: PayrollRecord | PayrollRecord[]) => {
    generateSlipGajiPDF(activeMadrasahInfo, payroll);
  };

  // Dynamic Badge Counts for Navigation
  const unpaidTeachersCount = payrolls.filter(
    (p) =>
      (p.tahunAjaran === selectedYear || (!p.tahunAjaran && selectedYear === '1446 - 1447 H.')) &&
      p.status === 'TERTUNDA'
  ).length;

  const currentYearTransactionsCount = transactions.filter(
    (t) => t.tahunAjaran === selectedYear || (!t.tahunAjaran && selectedYear === '1446 - 1447 H.')
  ).length;

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
      
      {/* PWA Mobile App Install Prompt & Offline Notification */}
      <PWAInstallPrompt onSyncCompleted={fetchBackendData} />

      {/* Top Navbar */}
      <Navbar
        madrasah={activeMadrasahInfo}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onSelectYear={handleSelectYear}
        onAddNewYear={() => handleOpenAddYear()}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        onOpenSettings={handleOpenSettings}
        onExportRAPBMPDF={handleExportRAPBMPDF}
        onExportCashflowPDF={handleExportCashflowPDF}
        isSyncing={isSyncing}
        onRefreshData={fetchBackendData}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        onNavigateBack={handleNavigateBack}
      />

      <AddYearModal
        isOpen={isAddYearModalOpen}
        onClose={() => setIsAddYearModalOpen(false)}
        onSave={handleAddNewYear}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          unpaidTeachersCount={unpaidTeachersCount}
          teachersCount={teachers.length}
          studentsCount={students.length}
          transactionsCount={currentYearTransactionsCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCompact={isSidebarCompact}
          onToggleCompact={() => setIsSidebarCompact(!isSidebarCompact)}
          onOpenQuickAction={handleOpenQuickAction}
          onOpenSettings={handleOpenSettings}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelectYear={handleSelectYear}
              rapbmData={currentYearRapbm}
              transactions={transactions}
              payrolls={currentYearPayrolls}
              onNavigateTab={(tab) => navigateToTab(tab)}
              onOpenNewTransaction={() => {
                navigateToTab('cashbook');
                handleOpenNewTrx();
              }}
              onGeneratePayrollPDF={handleExportSlipPDF}
            />
          )}

          {activeTab === 'rapbm' && (
            <RAPBMTable
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelectYear={handleSelectYear}
              onAddNewYear={() => handleOpenAddYear()}
              rapbmData={currentYearRapbm}
              onUpdateItem={handleUpdateRAPBMItem}
              onAddItem={handleAddRapbmItem}
              onDeleteItem={handleDeleteRapbmItem}
              onExportPDF={handleExportRAPBMPDF}
            />
          )}

          {activeTab === 'syahriah' && (
            <SyahriahManager
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              students={students}
              payments={studentPayments}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
              onImportStudents={handleImportStudents}
              onSaveBatchPayments={handleSaveBatchPayments}
              onDeletePayment={handleDeletePayment}
              onDeleteBatchPayments={handleDeleteBatchPayments}
              onUpdatePayment={handleUpdatePayment}
            />
          )}


          {activeTab === 'cashbook' && (
            <CashBook
              madrasah={activeMadrasahInfo}
              transactions={transactions}
              rapbmData={rapbmData}
              studentPayments={studentPayments}
              payrolls={payrolls}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelectYear={handleSelectYear}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteAllTransactions={handleDeleteAllTransactions}
              onAddRapbmItem={handleAddRapbmItem}
              onExportCashflowPDF={handleExportCashflowPDF}
              isOpenModal={isNewTrxModalOpen}
              setIsOpenModal={setIsNewTrxModalOpen}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollManager
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelectYear={handleSelectYear}
              teachers={teachers}
              payrolls={payrolls}
              onAddPayroll={handleAddPayroll}
              onDeletePayroll={handleDeletePayroll}
              onDeleteAllPayrolls={handleDeleteAllPayrolls}
              onSelectPayrollForModal={(p) => handleOpenPayrollModal(p)}
              onDownloadPDF={handleExportSlipPDF}
              onNavigateToAttendance={() => navigateToTab('presensi')}
            />
          )}

          {activeTab === 'presensi' && (
            <TeacherAttendanceManager
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelectYear={handleSelectYear}
              teachers={teachers}
              attendances={teacherAttendances}
              onSaveAttendances={handleSaveTeacherAttendances}
              onGeneratePayrollFromAttendance={handleGeneratePayrollFromAttendance}
              onNavigateToPayroll={() => navigateToTab('payroll')}
            />
          )}

          {activeTab === 'nota' && (
            <NotaReceiptManager
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              rapbmData={rapbmData}
              transactions={transactions}
              onSelectYear={handleSelectYear}
              availableYears={availableYears}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsManager
              madrasah={activeMadrasahInfo}
              rapbmData={currentYearRapbm}
              transactions={transactions}
              payrolls={currentYearPayrolls}
              onExportRAPBMPDF={handleExportRAPBMPDF}
              onExportCashflowPDF={handleExportCashflowPDF}
            />
          )}

          {activeTab === 'teachers' && (
            <TeachersManager
              teachers={teachers}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager onExportPDF={handleExportInventoryPDF} />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Pengaturan Sistem Keuangan</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Buka modal pengaturan untuk memperbarui identitas KOP Madrasah, nama penandatangan, dan koreksi hilal Hijriyah.
                </p>
                <button
                  onClick={handleOpenSettings}
                  className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition shadow-sm"
                >
                  Buka Form Pengaturan Madrasah
                </button>
              </div>
            </div>
          )}
        </main>

      </div>

      {/* Slip Gaji Preview / Print Modal */}
      {selectedPayrollForModal && (
        <SlipGajiModal
          madrasah={{...madrasahInfo, tahunAjaranHijri: selectedYear}}
          payroll={Array.isArray(selectedPayrollForModal) ? selectedPayrollForModal[0] : selectedPayrollForModal}
          payrolls={Array.isArray(selectedPayrollForModal) ? selectedPayrollForModal : undefined}
          onClose={() => setSelectedPayrollForModal(null)}
          onDownloadPDF={handleExportSlipPDF}
          onDeletePayroll={Array.isArray(selectedPayrollForModal) ? undefined : handleDeletePayroll}
          onGoHome={() => {
            setSelectedPayrollForModal(null);
            navigateToTab('dashboard');
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          madrasah={madrasahInfo}
          onSave={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
          onExportBackup={handleExportBackup}
          onRestoreBackup={handleRestoreBackup}
        />
      )}

      {/* Quick Action Bottom Sheet */}
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onNavigateTab={navigateToTab}
        onOpenNewTransaction={() => {
          navigateToTab('cashbook');
          handleOpenNewTrx();
        }}
        onOpenSettings={handleOpenSettings}
        onExportRAPBMPDF={handleExportRAPBMPDF}
        onExportCashflowPDF={handleExportCashflowPDF}
        selectedYear={selectedYear}
      />

      {/* Sticky Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenQuickAction={handleOpenQuickAction}
        unpaidTeachersCount={unpaidTeachersCount}
        teachersCount={teachers.length}
        studentsCount={students.length}
        transactionsCount={currentYearTransactionsCount}
        onOpenSettings={handleOpenSettings}
        onOpenNewTransaction={() => {
          navigateToTab('cashbook');
          handleOpenNewTrx();
        }}
      />

    </div>
  );
}
