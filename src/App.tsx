import { apiFetch } from "./lib/api";
import { auth, loginWithGoogle, logout } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
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
import { SettingsModal } from './components/SettingsModal';

import {
  MadrasahInfo,
  PayrollRecord,
  RAPBMItem,
  Teacher,
  Transaction,
} from './types';
import {
  initialMadrasahInfo,
  initialPayrolls,
  initialRAPBMData,
  initialTeachers,
  initialTransactions,
  getDefaultRAPBMForYear,
} from './data/initialData';
import { getHijriDate } from './utils/hijri';
import {
  generateCashFlowPDF,
  generateRAPBMPDF,
  generateInventoryPDF,
  generateSlipGajiPDF,
} from './utils/pdfGenerator';
import { AddYearModal } from './components/AddYearModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);

  // Academic Year State (RAPBM Tiap Tahun)
  const [selectedYear, setSelectedYear] = useState<string>('1446 - 1447 H.');
  const [availableYears, setAvailableYears] = useState<string[]>([
    '1444 - 1445 H.',
    '1445 - 1446 H.',
    '1446 - 1447 H.',
    '1447 - 1448 H.',
    '1448 - 1449 H.',
  ]);

  // Application Data States
  const [madrasahInfo, setMadrasahInfo] = useState<MadrasahInfo>(initialMadrasahInfo);
  const [rapbmData, setRapbmData] = useState<RAPBMItem[]>(initialRAPBMData);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(initialPayrolls);

  // Modals & Synchronization States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewTrxModalOpen, setIsNewTrxModalOpen] = useState(false);
  const [selectedPayrollForModal, setSelectedPayrollForModal] = useState<PayrollRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch initial data from Express backend
  const fetchBackendData = async () => {
    setIsSyncing(true);
    try {
      const [resSettings, resRapbm, resTrx, resTeachers, resPayroll] = await Promise.all([
        apiFetch('/api/settings').catch(() => null),
        apiFetch('/api/rapbm').catch(() => null),
        apiFetch('/api/transactions').catch(() => null),
        apiFetch('/api/teachers').catch(() => null),
        apiFetch('/api/payroll').catch(() => null),
      ]);

      if (resSettings && resSettings.ok) setMadrasahInfo(await resSettings.json());
      if (resRapbm && resRapbm.ok) setRapbmData(await resRapbm.json());
      if (resTrx && resTrx.ok) setTransactions(await resTrx.json());
      if (resTeachers && resTeachers.ok) setTeachers(await resTeachers.json());
      if (resPayroll && resPayroll.ok) setPayrolls(await resPayroll.json());
    } catch (e) {
      console.warn('Backend server offline, using local initial state', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBackendData();
    }
  }, [user]);

  // Filter RAPBM for current selected year
  const currentYearRapbm = rapbmData.filter(
    (item) => item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.')
  );

  const currentYearPayrolls = payrolls.filter(
    (item) => item.tahunAjaran === selectedYear || (!item.tahunAjaran && selectedYear === '1446 - 1447 H.')
  );

  // Year Selection & Addition Handlers
  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    // Check if RAPBM data for this year already exists
    const hasData = rapbmData.some((i) => i.tahunAjaran === year);
    if (!hasData) {
      const defaultItems = getDefaultRAPBMForYear(year);
      setRapbmData((prev) => [...prev, ...defaultItems]);

      // Seed to backend
      apiFetch('/api/rapbm/seed-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: defaultItems }),
      }).catch(console.error);
    }
  };

  const handleAddNewYear = (newYear: string) => {
    if (!availableYears.includes(newYear)) {
      setAvailableYears((prev) => [...prev, newYear]);
    }
    handleSelectYear(newYear);
  };

  // Total Calculations
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'IN') totalIncome += t.amount;
    if (t.type === 'OUT') totalExpense += t.amount;
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
    realita: number
  ) => {
    const newAnggaran = Number(jumlahAnggaran);
    const newRealita = Number(realita);
    const persentase = newAnggaran > 0 ? Math.round((newRealita / newAnggaran) * 100) : 100;

    setRapbmData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, jumlahAnggaran: newAnggaran, realita: newRealita, persentase }
          : item
      )
    );

    try {
      await apiFetch(`/api/rapbm/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jumlahAnggaran: newAnggaran, realita: newRealita }),
      });
    } catch (e) {
      console.error(e);
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
      const payRes = await apiFetch('/api/payrolls');
      const payData = await payRes.json();
      setPayrolls(payData);
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

  const handleAddPayroll = async (payrollData: Omit<PayrollRecord, 'id' | 'tahunAjaran'>) => {
    const newPay: PayrollRecord = {
      id: `pay-${Date.now()}`,
      tahunAjaran: selectedYear,
      ...payrollData,
    };
    setPayrolls((prev) => [newPay, ...prev]);

    // Add corresponding cashbook expense automatically
    const isTU = newPay.role.toLowerCase().includes('tu') || newPay.role.toLowerCase().includes('tata usaha');
    const rapbmCode = isTU ? '1.3' : '1.1';

    const newTrx: Transaction = {
      id: `trx-pay-${Date.now()}`,
      dateGregorian: newPay.dateGeneratedGregorian,
      dateHijri: newPay.dateGeneratedHijri,
      type: 'OUT',
      rapbmCode,
      category: 'BISYAROH DAN TUNJANGAN',
      description: `Bisyaroh Ustadz/ah ${newPay.teacherName} (${newPay.monthHijri})`,
      amount: newPay.bisyarohBersih,
      recordedBy: madrasahInfo.treasurerName,
      receiptNumber: `PAY-${newPay.id}`,
    };

    setTransactions((prev) => [newTrx, ...prev]);

    try {
      await apiFetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payrollData),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const activeMadrasahInfo = { ...madrasahInfo, tahunAjaranHijri: selectedYear };

  // PDF Export Triggers
  const handleExportRAPBMPDF = () => {
    const currentHijri = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
    generateRAPBMPDF(activeMadrasahInfo, currentYearRapbm, currentHijri.formatted);
  };

  const handleExportCashflowPDF = () => {
    const currentHijri = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
    generateCashFlowPDF(activeMadrasahInfo, transactions, selectedYear, currentHijri.formatted);
  };

  const handleExportInventoryPDF = (inventoryData: any[]) => {
    const currentHijri = getHijriDate(new Date(), madrasahInfo.hijriOffsetDays);
    generateInventoryPDF(activeMadrasahInfo, inventoryData, currentHijri.formatted);
  };

  const handleExportSlipPDF = (payroll: PayrollRecord) => {
    generateSlipGajiPDF(activeMadrasahInfo, payroll);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div></div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Madrasah Finance</h2>
        <p className="text-slate-600 mb-8">Silakan masuk untuk mengakses sistem</p>
        <button onClick={loginWithGoogle} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center">
          Masuk dengan Google
        </button>
      </div>
    </div>
  );

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        madrasah={activeMadrasahInfo}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onSelectYear={handleSelectYear}
        onAddNewYear={() => setIsAddYearModalOpen(true)}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportRAPBMPDF={handleExportRAPBMPDF}
        onExportCashflowPDF={handleExportCashflowPDF}
        isSyncing={isSyncing}
        onRefreshData={fetchBackendData}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
          setActiveTab={setActiveTab}
          unpaidTeachersCount={0}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelectYear={handleSelectYear}
              rapbmData={currentYearRapbm}
              transactions={transactions}
              payrolls={currentYearPayrolls}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNewTransaction={() => {
                setActiveTab('cashbook');
                setIsNewTrxModalOpen(true);
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
              onAddNewYear={() => setIsAddYearModalOpen(true)}
              rapbmData={currentYearRapbm}
              onUpdateItem={handleUpdateRAPBMItem}
              onExportPDF={handleExportRAPBMPDF}
            />
          )}

          {activeTab === 'cashbook' && (
            <CashBook
              madrasah={activeMadrasahInfo}
              transactions={transactions}
              rapbmData={currentYearRapbm}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onExportCashflowPDF={handleExportCashflowPDF}
              isOpenModal={isNewTrxModalOpen}
              setIsOpenModal={setIsNewTrxModalOpen}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollManager
              madrasah={activeMadrasahInfo}
              selectedYear={selectedYear}
              teachers={teachers}
              payrolls={currentYearPayrolls}
              onAddPayroll={handleAddPayroll}
              onSelectPayrollForModal={(p) => setSelectedPayrollForModal(p)}
              onDownloadPDF={handleExportSlipPDF}
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
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition"
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
          payroll={selectedPayrollForModal}
          onClose={() => setSelectedPayrollForModal(null)}
          onDownloadPDF={handleExportSlipPDF}
          onGoHome={() => {
            setSelectedPayrollForModal(null);
            setActiveTab('dashboard');
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          madrasah={madrasahInfo}
          onSave={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

    </div>
  );
}
