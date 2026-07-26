import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initialMadrasahInfo, initialPayrolls, initialRAPBMData, initialTeachers, initialTransactions } from './src/data/initialData';
import { MadrasahInfo, PayrollRecord, RAPBMItem, Teacher, Transaction } from './src/types';
import { getHijriDate } from './src/utils/hijri';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-Memory Data State with initial seed from RAPBM 1446-1447 H PDF
  let madrasahInfo: MadrasahInfo = { ...initialMadrasahInfo };
  let rapbmData: RAPBMItem[] = [...initialRAPBMData];
  let teachers: Teacher[] = [...initialTeachers];
  let transactions: Transaction[] = [...initialTransactions];
  let payrolls: PayrollRecord[] = [...initialPayrolls];

  // API ROUTES
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', appName: madrasahInfo.namaMadrasah });
  });

  // 1. Madrasah Settings
  app.get('/api/settings', (req, res) => {
    res.json(madrasahInfo);
  });

  app.put('/api/settings', (req, res) => {
    madrasahInfo = { ...madrasahInfo, ...req.body };
    res.json(madrasahInfo);
  });

  // 2. RAPBM Multi-Year Management
  app.get('/api/rapbm', (req, res) => {
    const { year } = req.query;
    if (year) {
      const filtered = rapbmData.filter((i) => i.tahunAjaran === year || (!i.tahunAjaran && year === '1446 - 1447 H.'));
      return res.json(filtered);
    }
    res.json(rapbmData);
  });

  app.post('/api/rapbm/seed-year', (req, res) => {
    const { items } = req.body;
    if (Array.isArray(items)) {
      items.forEach((newItem: RAPBMItem) => {
        const existingIdx = rapbmData.findIndex((r) => r.id === newItem.id);
        if (existingIdx !== -1) {
          rapbmData[existingIdx] = newItem;
        } else {
          rapbmData.push(newItem);
        }
      });
    }
    res.json({ success: true, totalItems: rapbmData.length });
  });

  app.put('/api/rapbm/:id', (req, res) => {
    const { id } = req.params;
    const { jumlahAnggaran, realita } = req.body;

    const idx = rapbmData.findIndex((item) => item.id === id);
    if (idx !== -1) {
      const item = rapbmData[idx];
      const newAnggaran = jumlahAnggaran !== undefined ? Number(jumlahAnggaran) : item.jumlahAnggaran;
      const newRealita = realita !== undefined ? Number(realita) : item.realita;
      const persentase = newAnggaran > 0 ? Math.round((newRealita / newAnggaran) * 100) : 100;

      rapbmData[idx] = {
        ...item,
        jumlahAnggaran: newAnggaran,
        realita: newRealita,
        persentase,
      };
      return res.json(rapbmData[idx]);
    }
    res.status(404).json({ error: 'Item RAPBM tidak ditemukan' });
  });

  // 3. Real-time Cashbook Transactions
  app.get('/api/transactions', (req, res) => {
    res.json(transactions);
  });

  app.post('/api/transactions', (req, res) => {
    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      receiptNumber: req.body.receiptNumber || `KW-MU22-${Math.floor(100 + Math.random() * 900)}`,
      recordedBy: req.body.recordedBy || madrasahInfo.treasurerName,
      ...req.body,
    };

    transactions.unshift(newTrx);

    // Automatically update actual realization in RAPBM if linked
    if (newTrx.rapbmCode) {
      const rapbmIdx = rapbmData.findIndex((r) => r.noKode === newTrx.rapbmCode);
      if (rapbmIdx !== -1) {
        const item = rapbmData[rapbmIdx];
        const updatedRealita = item.realita + newTrx.amount;
        const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;

        rapbmData[rapbmIdx] = {
          ...item,
          realita: updatedRealita,
          persentase,
        };
      }
    }

    res.status(201).json(newTrx);
  });

  app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const deleted = transactions.find((t) => t.id === id);
    transactions = transactions.filter((t) => t.id !== id);

    // Rollback RAPBM realization if linked
    if (deleted && deleted.rapbmCode) {
      const rapbmIdx = rapbmData.findIndex((r) => r.noKode === deleted.rapbmCode);
      if (rapbmIdx !== -1) {
        const item = rapbmData[rapbmIdx];
        const updatedRealita = Math.max(0, item.realita - deleted.amount);
        const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;

        rapbmData[rapbmIdx] = {
          ...item,
          realita: updatedRealita,
          persentase,
        };
      }
    }

    res.json({ success: true });
  });

  // 4. Master Teachers
  app.get('/api/teachers', (req, res) => {
    res.json(teachers);
  });

  app.post('/api/teachers', (req, res) => {
    const newTeacher: Teacher = {
      id: `t-${Date.now()}`,
      status: 'AKTIF',
      ...req.body,
    };
    teachers.push(newTeacher);
    res.status(201).json(newTeacher);
  });

  app.put('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    const idx = teachers.findIndex((t) => t.id === id);
    if (idx !== -1) {
      teachers[idx] = { ...teachers[idx], ...req.body };
      return res.json(teachers[idx]);
    }
    res.status(404).json({ error: 'Ustadz/Guru tidak ditemukan' });
  });

  app.delete('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    teachers = teachers.filter((t) => t.id !== id);
    res.json({ success: true });
  });

  // 5. Payroll (Slip Gaji)
  app.get('/api/payroll', (req, res) => {
    res.json(payrolls);
  });

  app.post('/api/payroll', (req, res) => {
    const newPayroll: PayrollRecord = {
      id: `pay-${Date.now()}`,
      status: 'LUNAS',
      ...req.body,
    };
    payrolls.unshift(newPayroll);

    // Automatically record as an expense transaction under Bisyaroh Guru (1.1) or TU (1.3)
    const isTU = newPayroll.role.toLowerCase().includes('tu') || newPayroll.role.toLowerCase().includes('tata usaha');
    const rapbmCode = isTU ? '1.3' : '1.1';

    const newTrx: Transaction = {
      id: `trx-pay-${Date.now()}`,
      dateGregorian: newPayroll.dateGeneratedGregorian,
      dateHijri: newPayroll.dateGeneratedHijri,
      type: 'OUT',
      rapbmCode,
      category: 'BISYAROH DAN TUNJANGAN',
      description: `Bisyaroh Ustadz/ah ${newPayroll.teacherName} (${newPayroll.monthHijri})`,
      amount: newPayroll.bisyarohBersih,
      recordedBy: madrasahInfo.treasurerName,
      receiptNumber: `PAY-${newPayroll.id}`,
    };

    transactions.unshift(newTrx);

    // Update RAPBM realization
    const rapbmIdx = rapbmData.findIndex((r) => r.noKode === rapbmCode);
    if (rapbmIdx !== -1) {
      const item = rapbmData[rapbmIdx];
      const updatedRealita = item.realita + newPayroll.bisyarohBersih;
      const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;
      rapbmData[rapbmIdx] = { ...item, realita: updatedRealita, persentase };
    }

    res.status(201).json(newPayroll);
  });

  // 6. Hijri Conversion API
  app.get('/api/hijri', (req, res) => {
    const dateStr = req.query.date as string;
    const hijri = getHijriDate(dateStr, madrasahInfo.hijriOffsetDays);
    res.json(hijri);
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Madrasah Finance Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
