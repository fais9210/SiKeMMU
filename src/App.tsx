import { apiFetch } from "./lib/api";
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
import { SettingsModal } from './components/SettingsModal';

import {
  MadrasahInfo,
  PayrollRecord,
  RAPBMItem,
  Teacher,
  Transaction,
  Student,
  StudentPayment,
} from './types';
import {
  initialMadrasahInfo,
  initialPayrolls,
  initialRAPBMData,
  initialTeachers,
  initialTransactions,
  initialStudents,
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
import { MobileBottomNav } from './components/MobileBottomNav';

export default function App() {
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
  const [students, setStudents] = useState<Student[]>(initialStudents as Student[]);
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>([]);

  // Modals & Synchronization States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewTrxModalOpen, setIsNewTrxModalOpen] = useState(false);
  const [selectedPayrollForModal, setSelectedPayrollForModal] = useState<PayrollRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch initial data from Express backend
  const fetchBackendData = async () => {
    setIsSyncing(true);
    try {
      const [resSettings, resRapbm, resTrx, resTeachers, resPayroll, resStudents, resStudentPay] = await Promise.all([
        apiFetch('/api/settings').catch(() => null),
        apiFetch('/api/rapbm').catch(() => null),
        apiFetch('/api/transactions').catch(() => null),
        apiFetch('/api/teachers').catch(() => null),
        apiFetch('/api/payroll').catch(() => null),
        apiFetch('/api/students').catch(() => null),
        apiFetch('/api/student-payments').catch(() => null),
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

      if (settingsData) setMadrasahInfo(settingsData);
      if (rapbmDataRes) setRapbmData(rapbmDataRes);
      if (trxData) setTransactions(trxData);
      if (teachersData) setTeachers(teachersData);
      if (payrollData) setPayrolls(payrollData);
      if (studentsData) setStudents(studentsData);
      if (studentPayData) setStudentPayments(studentPayData);
    } catch (e) {
      console.warn('Backend server offline, using local initial state', e);
    } finally {
      setIsSyncing(false);
    }
  };


  useEffect(() => {
    fetchBackendData();
  }, []);

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

  // Total Calculations (Saldo Kas Real-time = Penerimaan RAPBM - Pengeluaran RAPBM)
  let totalIncome = 0;
  let totalExpense = 0;

  currentYearRapbm.forEach((item) => {
    if (item.type === 'PENERIMAAN') {
      totalIncome += item.realita;
    } else if (item.type === 'PENGELUARAN') {
      totalExpense += item.realita;
    }
  });

  // Tambahkan transaksi Kas yang tidak terhubung ke kode RAPBM tertentu
  transactions.forEach((t) => {
    if (!t.rapbmCode) {
      if (t.type === 'IN') totalIncome += t.amount;
      if (t.type === 'OUT') totalExpense += t.amount;
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
    uraian?: string
  ) => {
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
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRapbmItem = async (newItemData: Omit<RAPBMItem, 'id'>) => {
    const createdItem: RAPBMItem = {
      id: `rapbm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...newItemData,
    };
    setRapbmData((prev) => [...prev, createdItem]);

    try {
      await apiFetch('/api/rapbm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdItem),
      });
    } catch (e) {
      console.error('Error adding RAPBM item:', e);
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
    const newPay: PayrollRecord = {
      id: `pay-${Date.now()}`,
      ...payrollData,
      tahunAjaran: targetYear,
    };
    setPayrolls((prev) => [newPay, ...prev]);

    // Add corresponding cashbook expense automatically
    const isTU = newPay.role.toLowerCase().includes('tu') || newPay.role.toLowerCase().includes('tata usaha');
    const rapbmCode = isTU ? '1.3' : '1.1';

    const newTrx: Transaction = {
      id: `trx-pay-${Date.now()}`,
      tahunAjaran: targetYear,
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
        if (item.noKode === '1.1' || item.noKode === '1.3') {
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

  const handleExportSlipPDF = (payroll: PayrollRecord) => {
    generateSlipGajiPDF(activeMadrasahInfo, payroll);
  };

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
        isSidebarOpen={isSidebarOpen}
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
              rapbmData={currentYearRapbm}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
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
          onDeletePayroll={handleDeletePayroll}
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

      {/* Sticky Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMore={() => setIsSidebarOpen(true)}
      />

    </div>
  );
}
