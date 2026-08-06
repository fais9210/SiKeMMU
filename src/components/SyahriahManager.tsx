import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  Upload,
  Filter,
  List,
  Printer,
  CheckCircle2,
  X,
  UserPlus,
  Trash2,
  Calendar,
  CreditCard,
  User,
  Coins,
  FileSpreadsheet,
  FileText,
  Pencil,
  Edit2,
  History,
  Info,
} from 'lucide-react';
import { Student, StudentPayment, MadrasahInfo } from '../types';
import { formatCurrency, getHijriDate } from '../utils/hijri';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const HIJRI_MONTHS = [
  'Syawal',
  "Dzulqa'dah",
  'Dzulhijjah',
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
];

interface SyahriahManagerProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  students: Student[];
  payments: StudentPayment[];
  onAddStudent: (student: Omit<Student, 'id'> & { id?: string }) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onImportStudents: (studentsList: any[], overwrite?: boolean) => Promise<void>;
  onSaveBatchPayments: (payments: Omit<StudentPayment, 'id'>[], createCashbookEntry: boolean) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
  onDeleteBatchPayments?: (ids: string[]) => Promise<void>;
  onUpdatePayment?: (id: string, updatedData: Partial<StudentPayment>) => Promise<void>;
}

export const SyahriahManager: React.FC<SyahriahManagerProps> = ({
  madrasah,
  selectedYear,
  students,
  payments,
  onAddStudent,
  onDeleteStudent,
  onImportStudents,
  onSaveBatchPayments,
  onDeletePayment,
  onDeleteBatchPayments,
  onUpdatePayment,
}) => {
  // Filter & Search states
  const [selectedClass, setSelectedClass] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Selected Hijri Month for Syahriyah
  const [selectedHijriMonth, setSelectedHijriMonth] = useState<string>('Syawal');

  // Dynamic Class list derived from actual student data
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach((s) => {
      if (s.kelas && s.kelas.trim()) {
        classSet.add(s.kelas.trim());
      }
    });
    // Default fallback classes if empty
    if (classSet.size === 0) {
      ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].forEach(k => classSet.add(k));
    }
    return Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [students]);

  // Modal States
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);
  const [activePaymentType, setActivePaymentType] = useState<'SYAHRIYAH' | 'IMDA' | 'IMNI'>('SYAHRIYAH');
  const [selectedImdaSubtype, setSelectedImdaSubtype] = useState<'IMDA 1' | 'IMDA 2' | 'IMDA 3'>('IMDA 1');
  const [batchClassFilter, setBatchClassFilter] = useState<string>('SEMUA');
  const [batchDate, setBatchDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [batchAmounts, setBatchAmounts] = useState<{ [studentId: string]: number }>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<{ [studentId: string]: boolean }>({});
  const [syncToCashbook, setSyncToCashbook] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // All Payments Log Modal State
  const [allHistoryModalOpen, setAllHistoryModalOpen] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('SEMUA');
  const [selectedLogPaymentIds, setSelectedLogPaymentIds] = useState<{ [id: string]: boolean }>({});

  // Modal Hapus Pembayaran Kolektif (Batch Delete Modal) State
  const [deleteBatchModalOpen, setDeleteBatchModalOpen] = useState<boolean>(false);
  const [deleteBatchType, setDeleteBatchType] = useState<string>('SEMUA');
  const [deleteBatchMonth, setDeleteBatchMonth] = useState<string>('SEMUA');
  const [deleteBatchClass, setDeleteBatchClass] = useState<string>('SEMUA');
  const [deleteBatchDate, setDeleteBatchDate] = useState<string>('');
  const [selectedBatchDeleteIds, setSelectedBatchDeleteIds] = useState<{ [id: string]: boolean }>({});

  // Student Detail & History Modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // Edit Payment Modal State
  const [editingPayment, setEditingPayment] = useState<StudentPayment | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDateGregorian, setEditDateGregorian] = useState<string>('');
  const [editMonthPeriod, setEditMonthPeriod] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Custom Delete Confirm Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'STUDENT' | 'PAYMENT' | 'BATCH_PAYMENT';
    id: string;
    batchIds?: string[];
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'PAYMENT',
    id: '',
    batchIds: [],
    title: '',
    description: '',
  });

  // Filter matching payments for Batch Delete Modal
  const matchingBatchDeletePayments = useMemo(() => {
    return payments.filter((p) => {
      if (p.tahunAjaran !== selectedYear) return false;
      if (deleteBatchType !== 'SEMUA' && p.type !== deleteBatchType) return false;
      if (deleteBatchClass !== 'SEMUA' && p.kelas !== deleteBatchClass) return false;
      if (deleteBatchMonth !== 'SEMUA' && p.monthPeriod !== deleteBatchMonth) return false;
      if (deleteBatchDate && p.dateGregorian !== deleteBatchDate) return false;
      return true;
    });
  }, [payments, selectedYear, deleteBatchType, deleteBatchClass, deleteBatchMonth, deleteBatchDate]);

  const handleOpenDeleteBatchModal = () => {
    setDeleteBatchType('SEMUA');
    setDeleteBatchMonth('SEMUA');
    setDeleteBatchClass(selectedClass);
    setDeleteBatchDate('');
    
    // Auto-select all matching payments by default
    const initialSel: { [id: string]: boolean } = {};
    payments
      .filter((p) => p.tahunAjaran === selectedYear && (selectedClass === 'SEMUA' || p.kelas === selectedClass))
      .forEach((p) => {
        initialSel[p.id] = true;
      });
    setSelectedBatchDeleteIds(initialSel);
    setDeleteBatchModalOpen(true);
  };

  const handleConfirmBatchDeleteFromModal = () => {
    const selectedIds = Object.keys(selectedBatchDeleteIds).filter((id) => selectedBatchDeleteIds[id]);
    if (selectedIds.length === 0) {
      alert('Tidak ada pembayaran yang dipilih untuk dihapus!');
      return;
    }
    const totalAmount = payments
      .filter((p) => selectedIds.includes(p.id))
      .reduce((sum, p) => sum + p.amount, 0);

    setDeleteConfirmModal({
      isOpen: true,
      type: 'BATCH_PAYMENT',
      id: '',
      batchIds: selectedIds,
      title: 'Hapus Pembayaran Kolektif',
      description: `Apakah Anda yakin ingin menghapus TOTAL ${selectedIds.length} transaksi pembayaran kolektif senilai ${formatCurrency(totalAmount)}? Data pembayaran ini akan dihapus dari sistem.`,
    });
  };

  const handleExecuteDelete = async () => {
    setIsSubmitting(true);
    try {
      if (deleteConfirmModal.type === 'STUDENT') {
        if (deleteConfirmModal.id) await onDeleteStudent(deleteConfirmModal.id);
      } else if (deleteConfirmModal.type === 'BATCH_PAYMENT') {
        const ids = deleteConfirmModal.batchIds || [];
        if (ids.length > 0) {
          if (onDeleteBatchPayments) {
            await onDeleteBatchPayments(ids);
          } else {
            for (const id of ids) {
              await onDeletePayment(id);
            }
          }
          setSelectedBatchDeleteIds({});
          setSelectedLogPaymentIds({});
          setDeleteBatchModalOpen(false);
        }
      } else {
        if (deleteConfirmModal.id) await onDeletePayment(deleteConfirmModal.id);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Gagal menghapus data pembayaran!');
    } finally {
      setIsSubmitting(false);
      setDeleteConfirmModal({ isOpen: false, type: 'PAYMENT', id: '', batchIds: [], title: '', description: '' });
    }
  };

  const handleOpenEditPayment = (pay: StudentPayment) => {
    setEditingPayment(pay);
    setEditAmount(pay.amount);
    setEditDateGregorian(pay.dateGregorian || new Date().toISOString().split('T')[0]);
    setEditMonthPeriod(pay.monthPeriod || '');
    setEditNotes(pay.notes || '');
  };

  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setIsSubmitting(true);
    try {
      const hijriObj = getHijriDate(editDateGregorian, madrasah.hijriOffsetDays);
      if (onUpdatePayment) {
        await onUpdatePayment(editingPayment.id, {
          amount: Number(editAmount),
          dateGregorian: editDateGregorian,
          dateHijri: hijriObj.formatted,
          monthPeriod: editMonthPeriod,
          notes: editNotes,
        });
      }
      setEditingPayment(null);
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Gagal memperbarui pembayaran!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // New Student Modal
  const [addStudentModalOpen, setAddStudentModalOpen] = useState<boolean>(false);
  const [newStudentForm, setNewStudentForm] = useState({
    id: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    kelas: availableClasses[0] || 'Kelas 1',
  });

  // Import Modal States
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [overwriteImport, setOverwriteImport] = useState<boolean>(false);
  const [parsedImportData, setParsedImportData] = useState<Array<{ id: string; name: string; gender: 'L' | 'P'; kelas: string }>>([]);

  // Helper to check if student is in Class 6
  const isKelas6 = (kelas: string): boolean => {
    if (!kelas) return false;
    const k = kelas.toLowerCase().trim();
    return k.includes('6') || k.includes('vi') || k.includes('enam');
  };

  // Calculate default fee for student based on type and class
  const getDefaultFee = (type: 'SYAHRIYAH' | 'IMDA' | 'IMNI', kelas: string): number => {
    if (type === 'SYAHRIYAH') return 30000;
    if (type === 'IMDA') {
      const isLower = ['Kelas 1', 'Kelas 2', 'Kelas 3', '1', '2', '3'].some(k => kelas.includes(k));
      return isLower ? 40000 : 45000;
    }
    if (type === 'IMNI') {
      return isKelas6(kelas) ? 50000 : 0;
    }
    return 0; // Default fallback
  };

  // Open Batch Modal
  const handleOpenBatchModal = (type: 'SYAHRIYAH' | 'IMDA' | 'IMNI') => {
    setActivePaymentType(type);
    setBatchClassFilter(type === 'IMNI' ? 'SEMUA' : selectedClass);
    if (type === 'IMDA') {
      setSelectedImdaSubtype('IMDA 1');
    }
    const initialAmounts: { [id: string]: number } = {};
    const initialSelections: { [id: string]: boolean } = {};

    students.forEach((s) => {
      initialAmounts[s.id] = getDefaultFee(type, s.kelas);
      if (type === 'IMNI') {
        initialSelections[s.id] = isKelas6(s.kelas);
      } else {
        initialSelections[s.id] = true; // Selected by default
      }
    });

    setBatchAmounts(initialAmounts);
    setSelectedStudentIds(initialSelections);
    setBatchSearch('');
    setBatchModalOpen(true);
  };

  // Quick Pay for single month (Syahriyah)
  const handlePaySingleMonth = async (student: Student, monthName: string) => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const hijriObj = getHijriDate(today, madrasah.hijriOffsetDays);
      const fee = getDefaultFee('SYAHRIYAH', student.kelas);

      const paymentData: Omit<StudentPayment, 'id'> = {
        studentId: student.id,
        studentName: student.name,
        tahunAjaran: selectedYear,
        kelas: student.kelas,
        type: 'SYAHRIYAH',
        amount: fee,
        dateGregorian: today,
        dateHijri: hijriObj.formatted,
        monthPeriod: monthName,
        recordedBy: 'Bendahara',
        notes: `Pembayaran Syahriyah Bulan ${monthName} (${student.kelas})`,
      };

      await onSaveBatchPayments([paymentData], syncToCashbook);
    } catch (err) {
      console.error('Error paying single month:', err);
      alert('Gagal menyimpan pembayaran Syahriyah!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Pay for IMDA stage
  const handlePaySingleImda = async (student: Student, imdaSubtype: 'IMDA 1' | 'IMDA 2' | 'IMDA 3') => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const hijriObj = getHijriDate(today, madrasah.hijriOffsetDays);
      const fee = getDefaultFee('IMDA', student.kelas);

      const paymentData: Omit<StudentPayment, 'id'> = {
        studentId: student.id,
        studentName: student.name,
        tahunAjaran: selectedYear,
        kelas: student.kelas,
        type: 'IMDA',
        amount: fee,
        dateGregorian: today,
        dateHijri: hijriObj.formatted,
        monthPeriod: imdaSubtype,
        recordedBy: 'Bendahara',
        notes: `Pembayaran ${imdaSubtype} (${student.kelas})`,
      };

      await onSaveBatchPayments([paymentData], syncToCashbook);
    } catch (err) {
      console.error('Error paying single IMDA:', err);
      alert('Gagal menyimpan pembayaran IMDA!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Pay for IMNI (Khusus Kelas 6)
  const handlePaySingleImni = async (student: Student) => {
    if (!isKelas6(student.kelas)) {
      alert('Pembayaran IMNI hanya diperuntukkan bagi siswa Kelas 6!');
      return;
    }
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const hijriObj = getHijriDate(today, madrasah.hijriOffsetDays);
      const fee = getDefaultFee('IMNI', student.kelas) || 50000;

      const paymentData: Omit<StudentPayment, 'id'> = {
        studentId: student.id,
        studentName: student.name,
        tahunAjaran: selectedYear,
        kelas: student.kelas,
        type: 'IMNI',
        amount: fee,
        dateGregorian: today,
        dateHijri: hijriObj.formatted,
        monthPeriod: 'IMNI',
        recordedBy: 'Bendahara',
        notes: `Pembayaran IMNI Kelas 6 (${student.kelas})`,
      };

      await onSaveBatchPayments([paymentData], syncToCashbook);
    } catch (err) {
      console.error('Error paying single IMNI:', err);
      alert('Gagal menyimpan pembayaran IMNI!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Batch Payments
  const handleSaveBatch = async () => {
    setIsSubmitting(true);
    try {
      const activeStudentsList = students.filter(s => {
        if (activePaymentType === 'IMNI' && !isKelas6(s.kelas)) return false;
        if (batchClassFilter !== 'SEMUA' && s.kelas !== batchClassFilter) return false;
        return selectedStudentIds[s.id];
      });

      if (activeStudentsList.length === 0) {
        alert('Tidak ada siswa yang dipilih untuk pembayaran!');
        setIsSubmitting(false);
        return;
      }

      if (activePaymentType === 'IMNI') {
        const invalidStudents = activeStudentsList.filter(s => !isKelas6(s.kelas));
        if (invalidStudents.length > 0) {
          alert('Pembayaran IMNI hanya diperuntukkan bagi siswa Kelas 6!');
          setIsSubmitting(false);
          return;
        }
      }

      const hijriObj = getHijriDate(batchDate, madrasah.hijriOffsetDays);

      const batchData: Omit<StudentPayment, 'id'>[] = activeStudentsList.map(s => ({
        studentId: s.id,
        studentName: s.name,
        tahunAjaran: selectedYear,
        kelas: s.kelas,
        type: activePaymentType,
        amount: Number(batchAmounts[s.id]) || 0,
        dateGregorian: batchDate,
        dateHijri: hijriObj.formatted,
        monthPeriod:
          activePaymentType === 'SYAHRIYAH'
            ? selectedHijriMonth
            : activePaymentType === 'IMDA'
            ? selectedImdaSubtype
            : 'IMNI',
        recordedBy: 'Bendahara',
        notes:
          activePaymentType === 'SYAHRIYAH'
            ? `Pembayaran Syahriyah Bulan ${selectedHijriMonth} (${s.kelas})`
            : activePaymentType === 'IMDA'
            ? `Pembayaran ${selectedImdaSubtype} (${s.kelas})`
            : `Pembayaran IMNI Kelas 6 (${s.kelas})`,
      }));

      await onSaveBatchPayments(batchData, syncToCashbook);
      setBatchModalOpen(false);
    } catch (err) {
      console.error('Error saving batch payments:', err);
      alert('Gagal menyimpan pembayaran batch!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students for main table
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = selectedClass === 'SEMUA' || s.kelas === selectedClass;
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, searchTerm]);

  // Compute total payments map per student
  const studentTotalsMap = useMemo(() => {
    const map: { [studentId: string]: { syahriyah: number; imda: number; imni: number; total: number } } = {};
    
    students.forEach((s) => {
      map[s.id] = { syahriyah: 0, imda: 0, imni: 0, total: 0 };
    });

    payments.filter(p => p.tahunAjaran === selectedYear).forEach((p) => {
      if (!map[p.studentId]) {
        map[p.studentId] = { syahriyah: 0, imda: 0, imni: 0, total: 0 };
      }
      if (p.type === 'SYAHRIYAH') map[p.studentId].syahriyah += p.amount;
      if (p.type === 'IMDA') map[p.studentId].imda += p.amount;
      if (p.type === 'IMNI') map[p.studentId].imni += p.amount;
      map[p.studentId].total += p.amount;
    });

    return map;
  }, [students, payments, selectedYear]);

  // Compute set of paid Hijri months for Syahriyah per student
  const studentSyahriyahMonthsMap = useMemo(() => {
    const map: { [studentId: string]: Set<string> } = {};
    students.forEach(s => { map[s.id] = new Set(); });
    payments.filter(p => p.tahunAjaran === selectedYear && p.type === 'SYAHRIYAH').forEach(p => {
      if (!map[p.studentId]) map[p.studentId] = new Set();
      if (p.monthPeriod) map[p.studentId].add(p.monthPeriod);
    });
    return map;
  }, [students, payments, selectedYear]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // Handle submit new student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddStudent({
        id: newStudentForm.id.trim() || undefined,
        name: newStudentForm.name.toUpperCase(),
        gender: newStudentForm.gender,
        kelas: newStudentForm.kelas,
        status: 'AKTIF',
      });
      setAddStudentModalOpen(false);
      setNewStudentForm({
        id: '',
        name: '',
        gender: 'L',
        kelas: availableClasses[0] || 'Kelas 1',
      });
    } catch (err) {
      alert('Gagal menambah siswa!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Data Murid to CSV
  const handleExportStudentsCSV = () => {
    const csvRows = [
      ['NIS', 'Nama Lengkap', 'J/K', 'Kelas'].join(','),
      ...students.map(s => [
        `"${s.id}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.gender}"`,
        `"${s.kelas.replace(/"/g, '""')}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Murid_${madrasah.namaMadrasah.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse Text / CSV for Import
  const handleParseImportText = (rawText: string) => {
    setImportText(rawText);
    if (!rawText.trim()) {
      setParsedImportData([]);
      return;
    }

    try {
      // Try JSON first
      if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
        const parsed = JSON.parse(rawText);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const formatted = list.map((item: any, idx: number) => ({
          id: String(item.id || item.nis || item.NIS || `144${Date.now().toString().slice(-6)}${idx}`),
          name: String(item.name || item.nama || item.Nama || '').trim().toUpperCase(),
          gender: String(item.gender || item.jk || item.JK || 'L').toUpperCase().startsWith('P') ? 'P' as const : 'L' as const,
          kelas: String(item.kelas || item.Kelas || 'Kelas 1').trim(),
        })).filter(s => s.name.length > 0);
        setParsedImportData(formatted);
        return;
      }

      // Parse CSV / TSV lines
      const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
      const items: Array<{ id: string; name: string; gender: 'L' | 'P'; kelas: string }> = [];

      lines.forEach((line, idx) => {
        // Skip header line if contains NIS or Nama
        if (idx === 0 && (line.toLowerCase().includes('nis') || line.toLowerCase().includes('nama'))) {
          return;
        }

        // Split by comma, tab, or semicolon
        const cols = line.split(/[,;\t]/).map(c => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length >= 2) {
          // Detect format: NIS, Nama, JK, Kelas OR Nama, JK, Kelas
          let id = '';
          let name = '';
          let gender: 'L' | 'P' = 'L';
          let kelas = 'Kelas 1';

          if (/^\d{5,15}$/.test(cols[0])) {
            id = cols[0];
            name = cols[1] || '';
            gender = (cols[2] || '').toUpperCase().startsWith('P') ? 'P' : 'L';
            kelas = cols[3] || 'Kelas 1';
          } else {
            name = cols[0] || '';
            gender = (cols[1] || '').toUpperCase().startsWith('P') ? 'P' : 'L';
            kelas = cols[2] || 'Kelas 1';
            id = cols[3] && /^\d+$/.test(cols[3]) ? cols[3] : `144${Date.now().toString().slice(-6)}${idx}`;
          }

          if (name) {
            items.push({
              id,
              name: name.toUpperCase(),
              gender,
              kelas,
            });
          }
        }
      });

      setParsedImportData(items);
    } catch (e) {
      console.error('Parsing error:', e);
    }
  };

  // File Upload Handler for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParseImportText(content);
    };
    reader.readAsText(file);
  };

  // Submit Import
  const handleConfirmImport = async () => {
    if (parsedImportData.length === 0) {
      alert('Tidak ada data murid yang valid untuk diimport!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onImportStudents(parsedImportData, overwriteImport);
      setImportModalOpen(false);
      setImportText('');
      setParsedImportData([]);
      alert(`Berhasil mengimpor ${parsedImportData.length} data murid!`);
    } catch (err) {
      alert('Gagal mengimpor data murid!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Rekapan PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(madrasah.namaMadrasah.toUpperCase(), 148, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`REKAPAN PEMBAYARAN SYAHRIYAH, IMDA, & IMNI SISWA - TAHUN AJARAN ${selectedYear}`, 148, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`${madrasah.alamat} - Desa ${madrasah.desaSampung}, Kec. ${madrasah.kecamatan}, Kab. ${madrasah.kabupaten}`, 148, 25, { align: 'center' });

    doc.line(15, 28, 282, 28);

    const tableData = filteredStudents.map((s, idx) => {
      const stats = studentTotalsMap[s.id] || { syahriyah: 0, imda: 0, imni: 0, total: 0 };
      return [
        idx + 1,
        s.id,
        s.name,
        s.kelas,
        s.gender,
        formatCurrency(stats.syahriyah),
        formatCurrency(stats.imda),
        formatCurrency(stats.imni),
        formatCurrency(stats.total),
      ];
    });

    const grandSyahriyah = filteredStudents.reduce((acc, s) => acc + (studentTotalsMap[s.id]?.syahriyah || 0), 0);
    const grandImda = filteredStudents.reduce((acc, s) => acc + (studentTotalsMap[s.id]?.imda || 0), 0);
    const grandImni = filteredStudents.reduce((acc, s) => acc + (studentTotalsMap[s.id]?.imni || 0), 0);
    const grandTotal = grandSyahriyah + grandImda + grandImni;

    autoTable(doc, {
      startY: 32,
      head: [['NO', 'NIS', 'NAMA LENGKAP', 'KELAS', 'J/K', 'SYAHRIYAH', 'IMDA', 'IMNI', 'TOTAL (JML)']],
      body: [
        ...tableData,
        [
          { content: 'TOTAL KESELURUHAN', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: formatCurrency(grandSyahriyah), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: formatCurrency(grandImda), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: formatCurrency(grandImni), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: formatCurrency(grandTotal), styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } },
        ]
      ],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 166, 90], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 32 },
        2: { halign: 'left' },
        3: { halign: 'center', cellWidth: 28 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right', fontStyle: 'bold' },
      },
    });

    // Signature Block
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const dateToday = getHijriDate(new Date(), madrasah.hijriOffsetDays).formatted;

    doc.setFontSize(9);
    doc.text(`${madrasah.kabupaten}, ${dateToday}`, 220, finalY);
    doc.text('Mengetahui,', 30, finalY + 5);
    doc.text('Kepala Madrasah', 30, finalY + 10);
    doc.text(madrasah.headmasterName, 30, finalY + 30);

    doc.text('Bendahara Madrasah', 220, finalY + 10);
    doc.text(madrasah.treasurerName, 220, finalY + 30);

    doc.save(`Rekapan_Syahriah_Murid_${selectedYear.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600" />
            Pembayaran Syahriah Murid
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pembayaran Syahriyah, IMDA, dan IMNI siswa Madrasah tahun ajaran <span className="font-semibold text-emerald-700">{selectedYear}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import Murid Button */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Import Data Murid dari CSV / Excel"
          >
            <Upload className="w-4 h-4" />
            <span>Import Murid</span>
          </button>

          {/* Export Murid Button */}
          <button
            onClick={handleExportStudentsCSV}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Export Master Data Murid ke CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Murid</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={() => setAddStudentModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Murid</span>
          </button>
        </div>
      </div>

      {/* Konversi Tanggal ke Hijriyah Widget */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span>Konversi Tanggal Pembayaran ke Hijriyah</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 pt-1">
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Tanggal Masehi</label>
            <div className="relative">
              <input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs cursor-pointer min-w-[180px]"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Konversi Hijriyah</label>
            <div className="px-5 py-2 bg-[#FFFDF0] border border-amber-300/90 rounded-xl font-bold text-[#7A2E00] text-xs flex items-center shadow-2xs min-w-[190px] justify-center tracking-wide">
              {getHijriDate(batchDate, madrasah.hijriOffsetDays).formatted}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left Filters - Dynamic Class Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-2 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg text-xs py-1 px-2 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="SEMUA">Semua Kelas ({students.length})</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} ({students.filter(s => s.kelas === cls).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari NIS / Nama Murid..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-slate-700 mr-1 hidden sm:inline">JENIS BIAYA:</span>
            
            <button
              onClick={() => handleOpenBatchModal('SYAHRIYAH')}
              className="px-3.5 py-2 bg-[#00A65A] hover:bg-[#008d4c] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1 uppercase tracking-wide"
            >
              <span>SYAHRIYAH</span>
              <Plus className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => handleOpenBatchModal('IMDA')}
              className="px-3.5 py-2 bg-[#00A65A] hover:bg-[#008d4c] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1 uppercase tracking-wide"
            >
              <span>IMDA</span>
              <Plus className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => handleOpenBatchModal('IMNI')}
              className="px-3.5 py-2 bg-[#00A65A] hover:bg-[#008d4c] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1 uppercase tracking-wide"
            >
              <span>IMNI</span>
              <Plus className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-[#DD4B39] hover:bg-[#c9302c] text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1 uppercase tracking-wide"
              title="Cetak / Export Laporan Rekapan PDF"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>JML</span>
            </button>

            <button
              type="button"
              onClick={() => setAllHistoryModalOpen(true)}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1 uppercase tracking-wide cursor-pointer"
              title="Lihat & Kelola Seluruh Riwayat Pembayaran Syahriyah"
            >
              <History className="w-3.5 h-3.5 mr-1" />
              <span>Log Transaksi</span>
            </button>

            <button
              type="button"
              onClick={handleOpenDeleteBatchModal}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1 uppercase tracking-wide cursor-pointer"
              title="Hapus Pembayaran Kolektif (Grup / Batch)"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Hapus Kolektif</span>
            </button>
          </div>

        </div>

        {/* Quick Class Pills Filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">Quick Filter Kelas:</span>
          <button
            type="button"
            onClick={() => { setSelectedClass('SEMUA'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              selectedClass === 'SEMUA'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({students.length})
          </button>
          {availableClasses.map((cls) => {
            const count = students.filter(s => s.kelas === cls).length;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => { setSelectedClass(cls); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  selectedClass === cls
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Student Payment Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">NIS (ID Murid)</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4 text-center">Kelas</th>
                <th className="py-3 px-4 text-center">J/K</th>
                <th className="py-3 px-4 text-right">Syahriyah</th>
                <th className="py-3 px-4 text-right">IMDA</th>
                <th className="py-3 px-4 text-right">IMNI</th>
                <th className="py-3 px-4 text-right font-black">Total (JML)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa ditemukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => {
                  const stats = studentTotalsMap[s.id] || { syahriyah: 0, imda: 0, imni: 0, total: 0 };
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      {/* ID Murid Column with Green Badge + Orange List Button */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center shadow-xs rounded-md overflow-hidden border border-emerald-700/30">
                          <span className="bg-[#00A65A] text-white font-bold px-2 py-1 text-[11px] font-mono">
                            {s.id}
                          </span>
                          <button
                            onClick={() => setSelectedStudentDetail(s)}
                            className="bg-[#F39C12] hover:bg-[#e08e0b] text-white px-2 py-1 transition flex items-center justify-center"
                            title="Lihat Rekapan & Histori Pembayaran Siswa"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-bold text-slate-800 uppercase whitespace-nowrap">{s.name}</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-700">{s.kelas}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-600">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${s.gender === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {s.gender}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                        {stats.syahriyah > 0 ? (
                          <div>
                            <div>{formatCurrency(stats.syahriyah)}</div>
                            <div className="text-[10px] font-sans font-semibold text-emerald-600">
                              ({(studentSyahriyahMonthsMap[s.id]?.size || 0)}/10 Bulan)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                        {stats.imda > 0 ? formatCurrency(stats.imda) : <span className="text-slate-300">0</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                        {stats.imni > 0 ? (
                          formatCurrency(stats.imni)
                        ) : isKelas6(s.kelas) ? (
                          <span className="text-slate-300">0</span>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic" title="IMNI khusus untuk Kelas 6">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900 text-sm">
                        {stats.total > 0 ? formatCurrency(stats.total) : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmModal({
                              isOpen: true,
                              type: 'STUDENT',
                              id: s.id,
                              title: 'Hapus Data Murid',
                              description: `Apakah Anda yakin ingin menghapus data murid ${s.name} (${s.id}) beserta seluruh riwayat pembayarannya?`
                            });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                          title="Hapus Data Murid"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 border rounded font-bold ${
                  currentPage === page ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}
            {totalPages > 5 && (
              <span className="px-1 text-slate-400">...</span>
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              &raquo;
            </button>
          </div>
          <span className="text-slate-500 text-[11px]">
            Menampilkan {paginatedStudents.length} dari {filteredStudents.length} Murid
          </span>
        </div>
      </div>

      {/* ==================== BATCH PAYMENT MODAL ==================== */}
      {batchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Tambah Pembayaran Jenis <span className="text-emerald-700">{activePaymentType === 'IMDA' ? selectedImdaSubtype : activePaymentType}</span>
                </h3>
              </div>

              {/* Right Inputs: Filter Kelas, Sub-type IMDA / Bulan Hijriyah, Tanggal Bayar & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Kelas Selector inside Batch Modal */}
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs font-semibold text-slate-800">
                  <span className="bg-slate-100 px-2 py-1.5 text-slate-600 border-r border-slate-300 font-bold">
                    Filter Kelas
                  </span>
                  <select
                    value={batchClassFilter}
                    onChange={(e) => setBatchClassFilter(e.target.value)}
                    className="px-2 py-1 bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="SEMUA">Semua Kelas ({students.length})</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} ({students.filter((s) => s.kelas === cls).length})
                      </option>
                    ))}
                  </select>
                </div>

                {activePaymentType === 'SYAHRIYAH' && (
                  <div className="flex items-center border border-emerald-300 rounded-lg overflow-hidden bg-emerald-50 text-xs font-semibold text-emerald-900">
                    <span className="bg-emerald-100 px-2 py-1.5 text-emerald-800 border-r border-emerald-200 font-bold">
                      Bulan Hijriyah
                    </span>
                    <select
                      value={selectedHijriMonth}
                      onChange={(e) => setSelectedHijriMonth(e.target.value)}
                      className="px-2 py-1 bg-transparent font-bold text-emerald-900 focus:outline-none cursor-pointer"
                    >
                      {HIJRI_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activePaymentType === 'IMDA' && (
                  <div className="flex items-center border border-emerald-300 rounded-lg overflow-hidden bg-emerald-50 text-xs font-semibold text-emerald-900">
                    <span className="bg-emerald-100 px-2 py-1.5 text-emerald-800 border-r border-emerald-200 font-bold">
                      Pilihan Tahap IMDA
                    </span>
                    <select
                      value={selectedImdaSubtype}
                      onChange={(e) => setSelectedImdaSubtype(e.target.value as 'IMDA 1' | 'IMDA 2' | 'IMDA 3')}
                      className="px-2 py-1 bg-transparent font-bold text-emerald-900 focus:outline-none cursor-pointer"
                    >
                      <option value="IMDA 1">IMDA 1</option>
                      <option value="IMDA 2">IMDA 2</option>
                      <option value="IMDA 3">IMDA 3</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-300">
                  <div className="flex items-center space-x-1.5 px-2 py-0.5">
                    <span className="text-[11px] font-bold text-slate-600">Masehi:</span>
                    <input
                      type="date"
                      value={batchDate}
                      onChange={(e) => setBatchDate(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div className="px-2.5 py-1 bg-[#FFFDF0] border-l border-amber-300 rounded-r-lg font-bold text-[#7A2E00] text-xs shadow-2xs">
                    {getHijriDate(batchDate, madrasah.hijriOffsetDays).formatted}
                  </div>
                </div>

                <div className="relative min-w-[140px]">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="w-full pr-7 pl-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1.5" />
                </div>

                <button
                  onClick={() => setBatchModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Quick Selection Toggle Bar */}
            {activePaymentType === 'IMNI' && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Ketentuan: Pembayaran IMNI (Imtihan Nihai) hanya diperuntukkan bagi siswa Kelas 6.</span>
              </div>
            )}
            <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    const newSel: { [id: string]: boolean } = {};
                    students.forEach(s => {
                      if (activePaymentType === 'IMNI' && !isKelas6(s.kelas)) return;
                      if (batchClassFilter === 'SEMUA' || s.kelas === batchClassFilter) {
                        newSel[s.id] = true;
                      }
                    });
                    setSelectedStudentIds(newSel);
                  }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Pilih Semua {batchClassFilter !== 'SEMUA' ? `(${batchClassFilter})` : ''}
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds({})}
                  className="text-slate-600 hover:underline"
                >
                  Hapus Pilihan
                </button>
              </div>

              <label className="flex items-center space-x-2 font-semibold text-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToCashbook}
                  onChange={(e) => setSyncToCashbook(e.target.checked)}
                  className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Otomatis Masukkan ke Buku Kas (Penerimaan RAPBM)</span>
              </label>
            </div>

            {/* Modal Body Table */}
            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">NIS</th>
                    <th className="py-2 px-3">Nama Lengkap</th>
                    <th className="py-2 px-3">Kelas</th>
                    <th className="py-2 px-3 text-right">Bayar (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => {
                      if (activePaymentType === 'IMNI' && !isKelas6(s.kelas)) return false;
                      if (batchClassFilter !== 'SEMUA' && s.kelas !== batchClassFilter) return false;
                      if (
                        batchSearch &&
                        !s.name.toLowerCase().includes(batchSearch.toLowerCase()) &&
                        !s.id.toLowerCase().includes(batchSearch.toLowerCase())
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((s) => {
                      const isSelected = !!selectedStudentIds[s.id];
                      return (
                        <tr key={s.id} className={isSelected ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                setSelectedStudentIds((prev) => ({ ...prev, [s.id]: e.target.checked }))
                              }
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{s.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 uppercase">{s.name}</td>
                          <td className="py-2 px-3 text-slate-600">{s.kelas}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800">
                              <span className="text-slate-500 mr-1 text-[10px]">RP.</span>
                              <input
                                type="number"
                                value={batchAmounts[s.id] ?? 0}
                                onChange={(e) =>
                                  setBatchAmounts((prev) => ({ ...prev, [s.id]: Number(e.target.value) || 0 }))
                                }
                                disabled={!isSelected}
                                className="w-24 text-right bg-transparent focus:outline-none font-bold"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 bg-[#F39C12] hover:bg-[#e08e0b] text-white font-bold text-xs rounded-md shadow-xs transition flex items-center gap-1 uppercase"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBatch}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#00A65A] hover:bg-[#008d4c] text-white font-bold text-xs rounded-md shadow-xs transition flex items-center gap-1.5 uppercase disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== REKAPAN SISWA DETAIL MODAL ==================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            
            {/* Header */}
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-amber-300 text-sm">
                  {selectedStudentDetail.gender === 'L' ? 'L' : 'P'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white uppercase tracking-wide">
                    {selectedStudentDetail.name}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    NIS: {selectedStudentDetail.id} | {selectedStudentDetail.kelas} | J/K: {selectedStudentDetail.gender}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-emerald-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Syahriyah</span>
                  <span className="text-sm font-black text-emerald-950 font-mono">
                    {formatCurrency(studentTotalsMap[selectedStudentDetail.id]?.syahriyah || 0)}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">IMDA</span>
                  <span className="text-sm font-black text-emerald-950 font-mono">
                    {formatCurrency(studentTotalsMap[selectedStudentDetail.id]?.imda || 0)}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">IMNI</span>
                  <span className="text-sm font-black text-emerald-950 font-mono">
                    {formatCurrency(studentTotalsMap[selectedStudentDetail.id]?.imni || 0)}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Bayar</span>
                  <span className="text-sm font-black text-amber-950 font-mono">
                    {formatCurrency(studentTotalsMap[selectedStudentDetail.id]?.total || 0)}
                  </span>
                </div>
              </div>

              {/* Kartu Status Syahriyah 10 Bulan Hijriyah */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Kartu Syahriyah 10 Bulan Hijriyah</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {payments.filter(p => p.studentId === selectedStudentDetail.id && p.type === 'SYAHRIYAH' && p.tahunAjaran === selectedYear).length} / 10 Bulan Lunas
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {HIJRI_MONTHS.map((m) => {
                    const paymentFound = payments.find(
                      p => p.studentId === selectedStudentDetail.id && p.type === 'SYAHRIYAH' && p.tahunAjaran === selectedYear && p.monthPeriod === m
                    );
                    return (
                      <div
                        key={m}
                        className={`p-2 rounded-lg border text-center flex flex-col justify-between min-h-[64px] transition ${
                          paymentFound
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        <span className="font-bold text-[11px] block">{m}</span>
                        {paymentFound ? (
                          <div className="mt-1 flex flex-col items-center">
                            <span className="bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded inline-block">
                              ✓ LUNAS
                            </span>
                            <span className="block text-[9px] text-emerald-700 font-mono mt-0.5">{paymentFound.dateGregorian}</span>
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPayment(paymentFound)}
                                className="text-slate-500 hover:text-amber-600 p-0.5 rounded bg-white border border-slate-200 hover:border-amber-400 transition cursor-pointer"
                                title="Edit Pembayaran Syahriyah"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirmModal({
                                    isOpen: true,
                                    type: 'PAYMENT',
                                    id: paymentFound.id,
                                    title: 'Hapus Pembayaran Syahriyah',
                                    description: `Apakah Anda yakin ingin menghapus pembayaran Syahriyah bulan ${m} (${formatCurrency(paymentFound.amount)}) untuk ${selectedStudentDetail?.name}?`
                                  });
                                }}
                                className="text-slate-500 hover:text-rose-600 p-0.5 rounded bg-white border border-slate-200 hover:border-rose-400 transition cursor-pointer"
                                title="Hapus Pembayaran"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePaySingleMonth(selectedStudentDetail, m)}
                            disabled={isSubmitting}
                            className="mt-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-1.5 py-1 rounded transition flex items-center justify-center gap-0.5 shadow-xs"
                            title={`Bayar Syahriyah Bulan ${m}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Bayar</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kartu Status IMDA (IMDA 1, IMDA 2, IMDA 3) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kartu Status IMDA (Tahap 1, 2, 3)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {
                      (['IMDA 1', 'IMDA 2', 'IMDA 3'] as const).filter(imdaName =>
                        payments.some(p => p.studentId === selectedStudentDetail.id && p.type === 'IMDA' && p.tahunAjaran === selectedYear && (p.monthPeriod === imdaName || (p.notes && p.notes.includes(imdaName))))
                      ).length
                    } / 3 Tahap Lunas
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  {(['IMDA 1', 'IMDA 2', 'IMDA 3'] as const).map((imdaStage) => {
                    const paymentFound = payments.find(
                      p => p.studentId === selectedStudentDetail.id && p.type === 'IMDA' && p.tahunAjaran === selectedYear && (p.monthPeriod === imdaStage || (p.notes && p.notes.includes(imdaStage)))
                    );
                    return (
                      <div
                        key={imdaStage}
                        className={`p-2.5 rounded-lg border text-center flex flex-col justify-between min-h-[64px] transition ${
                          paymentFound
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        <span className="font-bold text-xs block">{imdaStage}</span>
                        {paymentFound ? (
                          <div className="mt-1 flex flex-col items-center">
                            <span className="bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded inline-block">
                              ✓ LUNAS
                            </span>
                            <span className="block text-[9px] text-emerald-700 font-mono mt-0.5">{paymentFound.dateGregorian}</span>
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPayment(paymentFound)}
                                className="text-slate-500 hover:text-amber-600 p-0.5 rounded bg-white border border-slate-200 hover:border-amber-400 transition cursor-pointer"
                                title="Edit Pembayaran IMDA"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirmModal({
                                    isOpen: true,
                                    type: 'PAYMENT',
                                    id: paymentFound.id,
                                    title: 'Hapus Pembayaran IMDA',
                                    description: `Apakah Anda yakin ingin menghapus pembayaran ${imdaStage} (${formatCurrency(paymentFound.amount)}) untuk ${selectedStudentDetail?.name}?`
                                  });
                                }}
                                className="text-slate-500 hover:text-rose-600 p-0.5 rounded bg-white border border-slate-200 hover:border-rose-400 transition cursor-pointer"
                                title="Hapus Pembayaran"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePaySingleImda(selectedStudentDetail, imdaStage)}
                            disabled={isSubmitting}
                            className="mt-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-2 py-1 rounded transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                            title={`Bayar ${imdaStage}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Bayar</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kartu Status IMNI (Khusus Kelas 6) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>Kartu Status IMNI (Imtihan Nihai - Khusus Kelas 6)</span>
                  </h4>
                  {isKelas6(selectedStudentDetail.kelas) ? (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {payments.some(p => p.studentId === selectedStudentDetail.id && p.type === 'IMNI' && p.tahunAjaran === selectedYear) ? '1 / 1 Lunas' : 'Belum Lunas'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Bukan Siswa Kelas 6
                    </span>
                  )}
                </div>

                {isKelas6(selectedStudentDetail.kelas) ? (
                  <div className="text-xs">
                    {(() => {
                      const paymentFound = payments.find(
                        p => p.studentId === selectedStudentDetail.id && p.type === 'IMNI' && p.tahunAjaran === selectedYear
                      );
                      return (
                        <div
                          className={`p-3 rounded-lg border flex items-center justify-between transition ${
                            paymentFound
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs block">Ujian Akhir IMNI (Kelas 6)</span>
                            {paymentFound ? (
                              <span className="text-[10px] text-amber-700 font-mono block mt-0.5">
                                Tgl Bayar: {paymentFound.dateGregorian} ({paymentFound.dateHijri})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block mt-0.5">Nominal Acuan: {formatCurrency(50000)}</span>
                            )}
                          </div>

                          {paymentFound ? (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-amber-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                                ✓ LUNAS ({formatCurrency(paymentFound.amount)})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPayment(paymentFound)}
                                className="text-slate-500 hover:text-amber-600 p-1 rounded bg-white border border-slate-200 hover:border-amber-400 transition cursor-pointer"
                                title="Edit Pembayaran IMNI"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirmModal({
                                    isOpen: true,
                                    type: 'PAYMENT',
                                    id: paymentFound.id,
                                    title: 'Hapus Pembayaran IMNI',
                                    description: `Apakah Anda yakin ingin menghapus pembayaran IMNI (${formatCurrency(paymentFound.amount)}) untuk ${selectedStudentDetail?.name}?`
                                  });
                                }}
                                className="text-slate-500 hover:text-rose-600 p-1 rounded bg-white border border-slate-200 hover:border-rose-400 transition cursor-pointer"
                                title="Hapus Pembayaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePaySingleImni(selectedStudentDetail)}
                              disabled={isSubmitting}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Bayar IMNI</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    Siswa ini berada di {selectedStudentDetail.kelas}. Pembayaran IMNI (Imtihan Nihai) hanya diperuntukkan untuk siswa tingkat akhir (Kelas 6).
                  </p>
                )}
              </div>

              {/* Payment History List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b pb-1">
                  Riwayat Pembayaran Siswa
                </h4>

                {payments.filter(p => p.studentId === selectedStudentDetail.id && p.tahunAjaran === selectedYear).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada riwayat pembayaran untuk siswa ini pada tahun ajaran {selectedYear}.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {payments
                      .filter(p => p.studentId === selectedStudentDetail.id && p.tahunAjaran === selectedYear)
                      .map((pay) => (
                        <div key={pay.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                {pay.type}
                              </span>
                              <span className="font-semibold text-slate-700">{pay.dateGregorian} ({pay.dateHijri})</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{pay.notes || `Pembayaran ${pay.type}`}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold font-mono text-emerald-700 text-sm">
                              {formatCurrency(pay.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPayment(pay)}
                              className="text-slate-400 hover:text-amber-600 p-1 cursor-pointer"
                              title="Edit Pembayaran"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmModal({
                                  isOpen: true,
                                  type: 'PAYMENT',
                                  id: pay.id,
                                  title: 'Hapus Transaksi Pembayaran',
                                  description: `Apakah Anda yakin ingin menghapus transaksi pembayaran ${pay.type} ${pay.monthPeriod || ''} (${formatCurrency(pay.amount)})?`
                                });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Hapus Pembayaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== ADD STUDENT MODAL ==================== */}
      {addStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <form onSubmit={handleCreateStudent} className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Tambah Data Murid Baru
              </h3>
              <button
                type="button"
                onClick={() => setAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">NIS (ID Murid)</label>
                <input
                  type="text"
                  placeholder="Contoh: 1446003540 (Opsional, otomatis jika kosong)"
                  value={newStudentForm.id}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Murid *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Siswa / Murid"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 uppercase font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Kelas 1, DUA-B"
                    value={newStudentForm.kelas}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select
                    value={newStudentForm.gender}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="L">L (Laki-laki)</option>
                    <option value="P">P (Perempuan)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setAddStudentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Murid'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== IMPORT STUDENTS MODAL ==================== */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">Import Master Data Murid</h3>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Instructions */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <p className="font-bold text-xs">Format Data Import:</p>
                <p className="text-[11px] leading-relaxed">
                  Unggah file <code className="bg-amber-100 px-1 rounded font-bold">.csv</code> / <code className="bg-amber-100 px-1 rounded font-bold">.json</code> atau tempel teks langsung. Format kolom wajib:
                  <br />
                  <span className="font-mono font-bold text-amber-950">NIS, Nama Lengkap, J/K, Kelas</span>
                  <br />
                  Contoh: <code className="font-mono text-[10px]">1446001001, AHMAD SUBHAN, L, Kelas 1</code>
                </p>
              </div>

              {/* Upload Input & Text Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Pilih File (.csv / .json):</label>
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Atau Tempel Teks Data Murid di Sini:</label>
                  <textarea
                    rows={5}
                    value={importText}
                    onChange={(e) => handleParseImportText(e.target.value)}
                    placeholder={`NIS, Nama Lengkap, J/K, Kelas\n1446001001, AHMAD SUBHAN, L, Kelas 1\n1446001002, SITI FATIMAH, P, Kelas 2`}
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Import Options */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <label className="flex items-center space-x-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overwriteImport}
                    onChange={(e) => setOverwriteImport(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Kosongkan & Hapus data murid lama sebelum import (Timpa)</span>
                </label>
              </div>

              {/* Parsed Preview Table */}
              {parsedImportData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Pratinjau Data Murid Terbaca ({parsedImportData.length} Murid):</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold uppercase">
                        <tr>
                          <th className="p-2 border-b">NIS</th>
                          <th className="p-2 border-b">Nama Lengkap</th>
                          <th className="p-2 border-b text-center">J/K</th>
                          <th className="p-2 border-b text-center">Kelas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedImportData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-700">{item.id}</td>
                            <td className="p-2 font-bold uppercase text-slate-800">{item.name}</td>
                            <td className="p-2 text-center font-bold">{item.gender}</td>
                            <td className="p-2 text-center text-slate-600">{item.kelas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting || parsedImportData.length === 0}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengimpor...' : `Proses Import (${parsedImportData.length} Murid)`}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== EDIT PAYMENT MODAL ==================== */}
      {editingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <form onSubmit={handleSaveEditPayment} className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                Edit Data Pembayaran
              </h3>
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">{editingPayment.studentName}</p>
                <p className="text-[11px] text-slate-500">
                  NIS: {editingPayment.studentId} | Kelas: {editingPayment.kelas} | Jenis: <span className="font-bold text-emerald-700">{editingPayment.type}</span>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Periode Bulan / Tahap</label>
                {editingPayment.type === 'SYAHRIYAH' ? (
                  <select
                    value={editMonthPeriod}
                    onChange={(e) => setEditMonthPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold"
                  >
                    {HIJRI_MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : editingPayment.type === 'IMDA' ? (
                  <select
                    value={editMonthPeriod}
                    onChange={(e) => setEditMonthPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold"
                  >
                    <option value="IMDA 1">IMDA 1</option>
                    <option value="IMDA 2">IMDA 2</option>
                    <option value="IMDA 3">IMDA 3</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editMonthPeriod}
                    onChange={(e) => setEditMonthPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Bayar Masehi</label>
                <input
                  type="date"
                  value={editDateGregorian}
                  onChange={(e) => setEditDateGregorian(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan opsional..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== ALL PAYMENTS LOG MODAL ==================== */}
      {allHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Log Transaksi Pembayaran Syahriyah Siswa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh transaksi pembayaran tahun ajaran <span className="font-bold text-emerald-700">{selectedYear}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari NIS, Nama Siswa, Keterangan..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-semibold text-slate-600 whitespace-nowrap">Jenis:</span>
                <select
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500 text-xs"
                >
                  <option value="SEMUA">Semua Jenis</option>
                  <option value="SYAHRIYAH">SYAHRIYAH</option>
                  <option value="IMDA">IMDA</option>
                  <option value="IMNI">IMNI</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setAllHistoryModalOpen(false);
                    handleOpenDeleteBatchModal();
                  }}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Buka Modal Filter Hapus Kolektif"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kolektif</span>
                </button>
              </div>
            </div>

            {/* Table of Payments */}
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              {(() => {
                const filtered = payments.filter((p) => {
                  if (p.tahunAjaran !== selectedYear) return false;
                  if (historyTypeFilter !== 'SEMUA' && p.type !== historyTypeFilter) return false;
                  if (historySearch) {
                    const query = historySearch.toLowerCase();
                    const matchesName = p.studentName?.toLowerCase().includes(query);
                    const matchesNis = p.studentId?.toLowerCase().includes(query);
                    const matchesNotes = p.notes?.toLowerCase().includes(query);
                    const matchesMonth = p.monthPeriod?.toLowerCase().includes(query);
                    if (!matchesName && !matchesNis && !matchesNotes && !matchesMonth) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada riwayat transaksi pembayaran ditemukan.
                    </div>
                  );
                }

                const selectedCount = filtered.filter(p => selectedLogPaymentIds[p.id]).length;
                const isAllSelected = filtered.length > 0 && filtered.every(p => selectedLogPaymentIds[p.id]);

                return (
                  <div>
                    {/* Multi-Select Quick Action Banner */}
                    <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newSel = { ...selectedLogPaymentIds };
                            filtered.forEach(p => { newSel[p.id] = !isAllSelected; });
                            setSelectedLogPaymentIds(newSel);
                          }}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          {isAllSelected ? 'Batalkan Semua Pilihan' : `Pilih Semua Ditemukan (${filtered.length})`}
                        </button>
                      </div>

                      {selectedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const selIds = filtered.filter(p => selectedLogPaymentIds[p.id]).map(p => p.id);
                            const totalAmount = filtered.filter(p => selectedLogPaymentIds[p.id]).reduce((sum, p) => sum + p.amount, 0);
                            setDeleteConfirmModal({
                              isOpen: true,
                              type: 'BATCH_PAYMENT',
                              id: '',
                              batchIds: selIds,
                              title: 'Hapus Pembayaran Terpilih',
                              description: `Apakah Anda benar-benar yakin ingin menghapus ${selIds.length} transaksi pembayaran terpilih senilai ${formatCurrency(totalAmount)}?`
                            });
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Terpilih ({selectedCount})</span>
                        </button>
                      )}
                    </div>

                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 w-8">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newSel = { ...selectedLogPaymentIds };
                                filtered.forEach(p => { newSel[p.id] = checked; });
                                setSelectedLogPaymentIds(newSel);
                              }}
                              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">NIS & Nama Siswa</th>
                          <th className="py-2.5 px-3">Kelas</th>
                          <th className="py-2.5 px-3">Jenis</th>
                          <th className="py-2.5 px-3">Bulan / Periode</th>
                          <th className="py-2.5 px-3 text-right">Nominal</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {filtered.map((pay) => {
                          const isChecked = !!selectedLogPaymentIds[pay.id];
                          return (
                            <tr key={pay.id} className={isChecked ? 'bg-rose-50/50' : 'hover:bg-slate-50 transition'}>
                              <td className="py-2 px-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    setSelectedLogPaymentIds(prev => ({ ...prev, [pay.id]: e.target.checked }));
                                  }}
                                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="font-mono block">{pay.dateGregorian}</span>
                                <span className="text-[10px] text-slate-500 block">{pay.dateHijri}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-800 block uppercase">{pay.studentName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">NIS: {pay.studentId}</span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-700">{pay.kelas}</td>
                              <td className="py-2 px-3">
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {pay.type}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-700">
                                {pay.monthPeriod || '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                {formatCurrency(pay.amount)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPayment(pay)}
                                    className="text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-amber-50 transition cursor-pointer"
                                    title="Edit Transaksi Pembayaran"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteConfirmModal({
                                        isOpen: true,
                                        type: 'PAYMENT',
                                        id: pay.id,
                                        title: 'Hapus Transaksi Pembayaran',
                                        description: `Apakah Anda yakin ingin menghapus transaksi pembayaran ${pay.type} atas nama ${pay.studentName} (${formatCurrency(pay.amount)})?`
                                      });
                                    }}
                                    className="text-slate-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                                    title="Hapus Transaksi Pembayaran"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
              <span>
                Total Transaksi: <strong className="text-slate-800">{payments.filter(p => p.tahunAjaran === selectedYear).length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setAllHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL HAPUS PEMBAYARAN KOLEKTIF ==================== */}
      {deleteBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn space-y-0">
            
            {/* Modal Header */}
            <div className="p-4 bg-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-base text-white">Hapus Pembayaran Kolektif / Batch</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteBatchModalOpen(false)}
                className="text-rose-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Gunakan filter di bawah untuk memfilter dan menghapus sekelompok transaksi pembayaran kolektif sekaligus.
                </span>
              </div>
            </div>

            {/* Filter Options */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Biaya:</label>
                <select
                  value={deleteBatchType}
                  onChange={(e) => {
                    setDeleteBatchType(e.target.value);
                    setSelectedBatchDeleteIds({});
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 text-xs"
                >
                  <option value="SEMUA">Semua Jenis Biaya</option>
                  <option value="SYAHRIYAH">SYAHRIYAH</option>
                  <option value="IMDA">IMDA</option>
                  <option value="IMNI">IMNI</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Periode Bulan / Tahap:</label>
                <select
                  value={deleteBatchMonth}
                  onChange={(e) => {
                    setDeleteBatchMonth(e.target.value);
                    setSelectedBatchDeleteIds({});
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 text-xs"
                >
                  <option value="SEMUA">Semua Bulan / Periode</option>
                  {HIJRI_MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="IMDA 1">IMDA 1</option>
                  <option value="IMDA 2">IMDA 2</option>
                  <option value="IMDA 3">IMDA 3</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Kelas:</label>
                <select
                  value={deleteBatchClass}
                  onChange={(e) => {
                    setDeleteBatchClass(e.target.value);
                    setSelectedBatchDeleteIds({});
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 text-xs"
                >
                  <option value="SEMUA">Semua Kelas ({students.length})</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Bayar (Opsional):</label>
                <input
                  type="date"
                  value={deleteBatchDate}
                  onChange={(e) => {
                    setDeleteBatchDate(e.target.value);
                    setSelectedBatchDeleteIds({});
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-xs focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Quick Selection Toggle Bar */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center space-x-3 font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    const sel: { [id: string]: boolean } = {};
                    matchingBatchDeletePayments.forEach((p) => { sel[p.id] = true; });
                    setSelectedBatchDeleteIds(sel);
                  }}
                  className="text-rose-700 font-bold hover:underline"
                >
                  Pilih Semua ({matchingBatchDeletePayments.length})
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setSelectedBatchDeleteIds({})}
                  className="text-slate-500 hover:underline"
                >
                  Kosongkan Pilihan
                </button>
              </div>

              <div className="font-bold text-slate-800">
                Ditemukan: <span className="text-rose-700">{matchingBatchDeletePayments.length}</span> Transaksi | Terpilih: <span className="text-rose-700">{Object.values(selectedBatchDeleteIds).filter(Boolean).length}</span> ({formatCurrency(matchingBatchDeletePayments.filter(p => selectedBatchDeleteIds[p.id]).reduce((s, p) => s + p.amount, 0))})
              </div>
            </div>

            {/* Table of Matching Payments */}
            <div className="p-4 overflow-y-auto flex-1 text-xs">
              {matchingBatchDeletePayments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic">
                  Tidak ada transaksi pembayaran kolektif yang cocok dengan filter di atas.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b">
                    <tr>
                      <th className="py-2 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            matchingBatchDeletePayments.length > 0 &&
                            matchingBatchDeletePayments.every((p) => selectedBatchDeleteIds[p.id])
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const sel: { [id: string]: boolean } = { ...selectedBatchDeleteIds };
                            matchingBatchDeletePayments.forEach((p) => { sel[p.id] = checked; });
                            setSelectedBatchDeleteIds(sel);
                          }}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">NIS & Nama Murid</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">Jenis & Periode</th>
                      <th className="py-2 px-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {matchingBatchDeletePayments.map((p) => {
                      const isSelected = !!selectedBatchDeleteIds[p.id];
                      return (
                        <tr key={p.id} className={isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                setSelectedBatchDeleteIds((prev) => ({ ...prev, [p.id]: e.target.checked }))
                              }
                              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-mono block">{p.dateGregorian}</span>
                            <span className="text-[10px] text-slate-500 block">{p.dateHijri}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-800 block uppercase">{p.studentName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">NIS: {p.studentId}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700">{p.kelas}</td>
                          <td className="py-2 px-3">
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1">
                              {p.type}
                            </span>
                            <span className="font-semibold text-slate-700">{p.monthPeriod || '-'}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeleteBatchModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmBatchDeleteFromModal}
                disabled={Object.values(selectedBatchDeleteIds).filter(Boolean).length === 0}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  Hapus {Object.values(selectedBatchDeleteIds).filter(Boolean).length} Pembayaran Kolektif Terpilih
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== CONFIRM DELETE MODAL ==================== */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">{deleteConfirmModal.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {deleteConfirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: 'PAYMENT', id: '', title: '', description: '' })}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
