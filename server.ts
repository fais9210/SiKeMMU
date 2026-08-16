import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getHijriDate } from './src/utils/hijri';
import { requireAuth, AuthRequest } from './src/middleware/auth';
import { db, initTables } from './src/db/db';
import { settings, rapbmItems, transactions, teachers, payrollRecords, inventory, students, studentPayments } from './src/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { initialMadrasahInfo, initialRAPBMData, initialStudents } from './src/data/initialData';


async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Auto-create tables in PostgreSQL if they don't exist yet
  await initTables();

  // Init Settings
  try {
    const existingSettings = await db.select().from(settings).where(eq(settings.id, 'app-settings'));
    if (existingSettings.length === 0) {
      await db.insert(settings).values({ id: 'app-settings', ...initialMadrasahInfo });
    }
  } catch (e) {
    console.error('Error initializing settings:', e);
  }

  // Init RAPBM
  try {
    const existingRapbm = await db.select().from(rapbmItems);
    if (existingRapbm.length === 0) {
      await db.insert(rapbmItems).values(initialRAPBMData.map(i => ({
        id: i.id,
        tahunAjaran: i.tahunAjaran,
        type: i.type,
        categoryCode: i.categoryCode,
        categoryName: i.categoryName,
        noUrut: i.noUrut,
        noKode: i.noKode,
        uraian: i.uraian,
        jumlahAnggaran: i.jumlahAnggaran,
        realita: i.realita,
        persentase: i.persentase,
      })));
    }
  } catch (e) {
    console.error('Error initializing rapbm:', e);
  }

  // Init Students
  try {
    const existingStudents = await db.select().from(students);
    if (existingStudents.length === 0) {
      await db.insert(students).values(initialStudents);
    }
  } catch (e) {
    console.error('Error initializing students:', e);
  }



  // API ROUTES
  app.get('/api/health', async (req, res) => {
    res.json({ status: 'ok' });
  });

  // 1. Madrasah Settings
  app.get('/api/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await db.select().from(settings).where(eq(settings.id, 'app-settings'));
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await db.update(settings).set(req.body).where(eq(settings.id, 'app-settings')).returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // 2. RAPBM Multi-Year Management
  app.get('/api/rapbm', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { year } = req.query;
      let data;
      if (year) {
        data = await db.select().from(rapbmItems).where(eq(rapbmItems.tahunAjaran, year as string));
      } else {
        data = await db.select().from(rapbmItems);
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rapbm' });
    }
  });

  app.post('/api/rapbm/seed-year', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { items } = req.body;
      if (Array.isArray(items) && items.length > 0) {
        for (const i of items) {
          if (!i || !i.id) continue;
          const cleanItem = {
            id: String(i.id),
            tahunAjaran: String(i.tahunAjaran || '1446 - 1447 H.'),
            type: String(i.type || 'PENERIMAAN'),
            categoryCode: String(i.categoryCode || ''),
            categoryName: String(i.categoryName || ''),
            noUrut: String(i.noUrut || ''),
            noKode: String(i.noKode || ''),
            uraian: String(i.uraian || ''),
            jumlahAnggaran: Math.round(Number(i.jumlahAnggaran) || 0),
            realita: Math.round(Number(i.realita) || 0),
            persentase: Math.round(Number(i.persentase) || 0),
          };

          const existing = await db.select().from(rapbmItems).where(eq(rapbmItems.id, cleanItem.id));
          if (existing.length > 0) {
            await db.update(rapbmItems).set(cleanItem).where(eq(rapbmItems.id, cleanItem.id));
          } else {
            await db.insert(rapbmItems).values(cleanItem);
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error seeding rapbm:', error);
      res.status(500).json({ error: 'Failed to seed rapbm' });
    }
  });

  app.post('/api/rapbm', requireAuth, async (req: AuthRequest, res) => {
    try {
      const newItem = req.body;
      const existing = await db.select().from(rapbmItems).where(eq(rapbmItems.id, newItem.id));
      if (existing.length > 0) {
        await db.update(rapbmItems).set(newItem).where(eq(rapbmItems.id, newItem.id));
        return res.json(newItem);
      }
      const created = await db.insert(rapbmItems).values(newItem).returning();
      res.json(created[0] || newItem);
    } catch (error) {
      console.error('Error adding rapbm item:', error);
      res.status(500).json({ error: 'Failed to create rapbm item' });
    }
  });

  app.post('/api/rapbm/batch', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { items } = req.body;
      if (Array.isArray(items) && items.length > 0) {
        for (const i of items) {
          if (!i || !i.id) continue;
          const cleanItem = {
            id: String(i.id),
            tahunAjaran: String(i.tahunAjaran || '1446 - 1447 H.'),
            type: String(i.type || 'PENERIMAAN'),
            categoryCode: String(i.categoryCode || ''),
            categoryName: String(i.categoryName || ''),
            noUrut: String(i.noUrut || ''),
            noKode: String(i.noKode || ''),
            uraian: String(i.uraian || ''),
            jumlahAnggaran: Math.round(Number(i.jumlahAnggaran) || 0),
            realita: Math.round(Number(i.realita) || 0),
            persentase: Math.round(Number(i.persentase) || 0),
          };

          const existing = await db.select().from(rapbmItems).where(eq(rapbmItems.id, cleanItem.id));
          if (existing.length > 0) {
            await db.update(rapbmItems).set(cleanItem).where(eq(rapbmItems.id, cleanItem.id));
          } else {
            await db.insert(rapbmItems).values(cleanItem);
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error in batch rapbm update:', error);
      res.status(500).json({ error: 'Failed to batch update rapbm' });
    }
  });

  app.delete('/api/rapbm/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(rapbmItems).where(eq(rapbmItems.id, id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete rapbm item' });
    }
  });

  app.put('/api/rapbm/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { jumlahAnggaran, realita, uraian, noKode, categoryName } = req.body;
      const item = await db.select().from(rapbmItems).where(eq(rapbmItems.id, id as string));
      if (item.length > 0) {
        const newAnggaran = jumlahAnggaran !== undefined ? Number(jumlahAnggaran) : item[0].jumlahAnggaran;
        const newRealita = realita !== undefined ? Number(realita) : item[0].realita;
        const persentase = newAnggaran > 0 ? Math.round((newRealita / newAnggaran) * 100) : 100;
        const newUraian = uraian !== undefined ? String(uraian) : item[0].uraian;
        const newKode = noKode !== undefined ? String(noKode) : item[0].noKode;
        const newCategory = categoryName !== undefined ? String(categoryName) : item[0].categoryName;
        
        const updated = await db.update(rapbmItems).set({
          jumlahAnggaran: newAnggaran,
          realita: newRealita,
          persentase,
          uraian: newUraian,
          noKode: newKode,
          categoryName: newCategory,
        }).where(eq(rapbmItems.id, id as string)).returning();
        return res.json(updated[0]);
      }
      res.status(404).json({ error: 'Item RAPBM tidak ditemukan' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update rapbm' });
    }
  });

  // 3. Real-time Cashbook Transactions
  app.get('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await db.select().from(transactions).orderBy(desc(transactions.id));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const settingsData = await db.select().from(settings).where(eq(settings.id, 'app-settings'));
      const treasurerName = settingsData[0]?.treasurerName || 'Unknown';
      const newTrx = {
        id: `trx-${Date.now()}`,
        receiptNumber: req.body.receiptNumber || `KW-MU22-${Math.floor(100 + Math.random() * 900)}`,
        recordedBy: req.body.recordedBy || treasurerName,
        tahunAjaran: req.body.tahunAjaran,
        dateGregorian: req.body.dateGregorian,
        dateHijri: req.body.dateHijri,
        type: req.body.type,
        rapbmCode: req.body.rapbmCode,
        category: req.body.category,
        description: req.body.description,
        amount: req.body.amount,
      };
      const inserted = await db.insert(transactions).values(newTrx).returning();

      if (newTrx.rapbmCode) {
        const rapbmItem = await db.select().from(rapbmItems).where(eq(rapbmItems.noKode, newTrx.rapbmCode));
        if (rapbmItem.length > 0) {
          const item = rapbmItem[0];
          const updatedRealita = item.realita + newTrx.amount;
          const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;
          await db.update(rapbmItems).set({ realita: updatedRealita, persentase }).where(eq(rapbmItems.id, item.id));
        }
      }
      res.status(201).json(inserted[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  app.delete('/api/transactions/all', requireAuth, async (req: AuthRequest, res) => {
    try {
      await db.delete(transactions);
      res.json({ success: true, message: 'Semua transaksi berhasil dihapus' });
    } catch (error) {
      console.error('Failed to delete all transactions:', error);
      res.status(500).json({ error: 'Failed to delete all transactions' });
    }
  });

  app.post('/api/clear-year-data', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { tahunAjaran } = req.body;
      const targetYear = tahunAjaran || '1446 - 1447 H.';

      // 1. Delete transactions for target year
      const allTrxs = await db.select().from(transactions);
      const trxsToDelete = allTrxs.filter(
        (t) => t.tahunAjaran === targetYear || (!t.tahunAjaran && targetYear === '1446 - 1447 H.')
      );
      if (trxsToDelete.length > 0) {
        await db.delete(transactions).where(inArray(transactions.id, trxsToDelete.map((t) => t.id)));
      }

      // 2. Delete student payments for target year
      const allPayments = await db.select().from(studentPayments);
      const paymentsToDelete = allPayments.filter(
        (p) => p.tahunAjaran === targetYear || (!p.tahunAjaran && targetYear === '1446 - 1447 H.')
      );
      if (paymentsToDelete.length > 0) {
        await db.delete(studentPayments).where(inArray(studentPayments.id, paymentsToDelete.map((p) => p.id)));
      }

      // 3. Delete payroll records for target year
      const allPayrolls = await db.select().from(payrollRecords);
      const payrollsToDelete = allPayrolls.filter(
        (pr) => pr.tahunAjaran === targetYear || (!pr.tahunAjaran && targetYear === '1446 - 1447 H.')
      );
      if (payrollsToDelete.length > 0) {
        await db.delete(payrollRecords).where(inArray(payrollRecords.id, payrollsToDelete.map((pr) => pr.id)));
      }

      // 4. Reset RAPBM items for target year (realita = 0, persentase = 0, and PENERIMAAN jumlahAnggaran = 0)
      const allRapbm = await db.select().from(rapbmItems);
      const itemsToReset = allRapbm.filter(
        (r) => r.tahunAjaran === targetYear || (!r.tahunAjaran && targetYear === '1446 - 1447 H.')
      );
      for (const item of itemsToReset) {
        const resetAnggaran = item.type === 'PENERIMAAN' ? 0 : item.jumlahAnggaran;
        await db
          .update(rapbmItems)
          .set({
            jumlahAnggaran: resetAnggaran,
            realita: 0,
            persentase: 0,
          })
          .where(eq(rapbmItems.id, item.id));
      }

      res.json({ success: true, message: `Data transaksi & RAPBM tahun ajaran ${targetYear} berhasil dibersihkan.` });
    } catch (error) {
      console.error('Error clearing year data:', error);
      res.status(500).json({ error: 'Failed to clear year data' });
    }
  });

  app.delete('/api/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const trx = await db.select().from(transactions).where(eq(transactions.id, id as string));
      if (trx.length > 0) {
        await db.delete(transactions).where(eq(transactions.id, id as string));
        if (trx[0].rapbmCode) {
          const rapbmItem = await db.select().from(rapbmItems).where(eq(rapbmItems.noKode, trx[0].rapbmCode));
          if (rapbmItem.length > 0) {
            const item = rapbmItem[0];
            const updatedRealita = Math.max(0, item.realita - trx[0].amount);
            const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;
            await db.update(rapbmItems).set({ realita: updatedRealita, persentase }).where(eq(rapbmItems.id, item.id));
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  });

  // 4. Master Teachers
  app.get('/api/teachers', requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await db.select().from(teachers);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch teachers' });
    }
  });

  app.post('/api/teachers', requireAuth, async (req: AuthRequest, res) => {
    try {
      const newTeacher = {
        id: `t-${Date.now()}`,
        status: 'AKTIF',
        nipNu: req.body.nipNu,
        name: req.body.name,
        role: req.body.role,
        jamMengajar: req.body.jamMengajar,
        tarifPerJam: req.body.tarifPerJam,
        tunjanganJabatan: req.body.tunjanganJabatan,
        tunjanganMasaKerja: req.body.tunjanganMasaKerja,
        tunjanganKehadiran: req.body.tunjanganKehadiran,
        potonganInfaq: req.body.potonganInfaq,
        potonganTabungan: req.body.potonganTabungan,
        bankAccount: req.body.bankAccount,
      };
      const inserted = await db.insert(teachers).values(newTeacher).returning();
      res.status(201).json(inserted[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add teacher' });
    }
  });

  app.put('/api/teachers/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updated = await db.update(teachers).set(req.body).where(eq(teachers.id, id as string)).returning();
      
      if (updated.length > 0) {
        const teacherData = updated[0];
        const teacherPayrolls = await db.select().from(payrollRecords).where(eq(payrollRecords.teacherId, id as string));

        for (const pr of teacherPayrolls) {
          const jamMengajar = teacherData.jamMengajar ?? 0;
          const tarifPerJam = teacherData.tarifPerJam ?? 0;
          const bisyarohPokok = jamMengajar * tarifPerJam;
          const tunjanganGuru = (teacherData.tunjanganJabatan ?? 0) + (teacherData.tunjanganMasaKerja ?? 0) + (teacherData.tunjanganKehadiran ?? 0);
          const tunjanganLain = pr.tunjanganLain ?? 0;
          const totalGajiKotor = bisyarohPokok + tunjanganGuru + tunjanganLain;

          const potonganInfaq = teacherData.potonganInfaq ?? 0;
          const potonganTabungan = teacherData.potonganTabungan ?? 0;
          const potonganLain = pr.potonganLain ?? 0;
          const totalPotongan = potonganInfaq + potonganTabungan + potonganLain;

          const bisyarohBersih = Math.max(0, totalGajiKotor - totalPotongan);

          await db.update(payrollRecords)
            .set({
              teacherName: teacherData.name,
              nipNu: teacherData.nipNu,
              role: teacherData.role,
              jamMengajar,
              bisyarohPokok,
              tunjanganGuru,
              totalGajiKotor,
              potonganInfaq,
              potonganTabungan,
              totalPotongan,
              bisyarohBersih,
            })
            .where(eq(payrollRecords.id, pr.id));
        }

        return res.json(teacherData);
      }
      res.status(404).json({ error: 'Ustadz/Guru tidak ditemukan' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update teacher' });
    }
  });

  app.delete('/api/teachers/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(teachers).where(eq(teachers.id, id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete teacher' });
    }
  });

  // 5. Payroll (Slip Gaji)
  app.get('/api/payroll', requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await db.select().from(payrollRecords).orderBy(desc(payrollRecords.id));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch payrolls' });
    }
  });

  app.post('/api/payroll', requireAuth, async (req: AuthRequest, res) => {
    try {
      const newPayroll = {
        id: `pay-${Date.now()}`,
        status: 'LUNAS',
        ...req.body,
      };
      const inserted = await db.insert(payrollRecords).values(newPayroll).returning();
      
      const settingsData = await db.select().from(settings).where(eq(settings.id, 'app-settings'));
      const treasurerName = settingsData[0]?.treasurerName || 'Unknown';

      const isTU = newPayroll.role.toLowerCase().includes('tu') || newPayroll.role.toLowerCase().includes('tata usaha');
      const rapbmCode = isTU ? '1.2' : '1.1';
      const newTrx = {
        id: `trx-pay-${Date.now()}`,
        tahunAjaran: newPayroll.tahunAjaran,
        dateGregorian: newPayroll.dateGeneratedGregorian,
        dateHijri: newPayroll.dateGeneratedHijri,
        type: 'OUT',
        rapbmCode,
        category: 'BISYAROH DAN TUNJANGAN',
        description: isTU
          ? `Bisyaroh Staf TU ${newPayroll.teacherName} (${newPayroll.monthHijri})`
          : `Bisyaroh Ustadz/ah ${newPayroll.teacherName} (${newPayroll.monthHijri})`,
        amount: newPayroll.bisyarohBersih,
        recordedBy: treasurerName,
        receiptNumber: `PAY-${newPayroll.id}`,
      };
      await db.insert(transactions).values(newTrx);

      const rapbmItem = await db.select().from(rapbmItems).where(eq(rapbmItems.noKode, rapbmCode));
      if (rapbmItem.length > 0) {
        const item = rapbmItem.find((i) => i.tahunAjaran === newPayroll.tahunAjaran) || rapbmItem[0];
        const updatedRealita = item.realita + newPayroll.bisyarohBersih;
        const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;
        await db.update(rapbmItems).set({ realita: updatedRealita, persentase }).where(eq(rapbmItems.id, item.id));
      }
      res.status(201).json(inserted[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create payroll' });
    }
  });

  app.delete('/api/payroll-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      const allPayrolls = await db.select().from(payrollRecords);
      for (const pay of allPayrolls) {
        const receiptNo = `PAY-${pay.id}`;
        await db.delete(transactions).where(eq(transactions.receiptNumber, receiptNo));
      }
      await db.delete(payrollRecords);

      const rapbmCodes = ['1.1', '1.2', '1.3'];
      for (const code of rapbmCodes) {
        const items = await db.select().from(rapbmItems).where(eq(rapbmItems.noKode, code));
        for (const item of items) {
          const trxs = await db.select().from(transactions).where(eq(transactions.rapbmCode, code));
          const sum = trxs.reduce((acc, curr) => acc + curr.amount, 0);
          const persentase = item.jumlahAnggaran > 0 ? Math.round((sum / item.jumlahAnggaran) * 100) : 0;
          await db.update(rapbmItems).set({ realita: sum, persentase }).where(eq(rapbmItems.id, item.id));
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting all payrolls:', error);
      res.status(500).json({ error: 'Failed to delete all payrolls' });
    }
  });

  app.delete('/api/payroll/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rawId = req.params.id as string;
      const id = decodeURIComponent(rawId);
      const existing = await db.select().from(payrollRecords).where(eq(payrollRecords.id, id));
      if (existing.length > 0) {
        const pay = existing[0];
        const receiptNo = `PAY-${pay.id}`;
        const trxs = await db.select().from(transactions).where(eq(transactions.receiptNumber, receiptNo));
        for (const trx of trxs) {
          if (trx.rapbmCode) {
            const rapbmItem = await db.select().from(rapbmItems).where(eq(rapbmItems.noKode, trx.rapbmCode));
            if (rapbmItem.length > 0) {
              const item = rapbmItem.find((i) => i.tahunAjaran === pay.tahunAjaran) || rapbmItem[0];
              const updatedRealita = Math.max(0, item.realita - trx.amount);
              const persentase = item.jumlahAnggaran > 0 ? Math.round((updatedRealita / item.jumlahAnggaran) * 100) : 100;
              await db.update(rapbmItems).set({ realita: updatedRealita, persentase }).where(eq(rapbmItems.id, item.id));
            }
          }
          await db.delete(transactions).where(eq(transactions.id, trx.id));
        }
        await db.delete(payrollRecords).where(eq(payrollRecords.id, id));
      } else {
        await db.delete(payrollRecords).where(eq(payrollRecords.id, id));
      }
      res.json({ success: true, id });
    } catch (error) {
      console.error('Error deleting payroll:', error);
      res.status(500).json({ error: 'Failed to delete payroll' });
    }
  });

  // 5.5 Inventory
  app.get("/api/inventory", requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await db.select().from(inventory).orderBy(desc(inventory.id));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", requireAuth, async (req: AuthRequest, res) => {
    try {
      const newItem = {
        id: `inv-${Date.now()}`,
        name: req.body.name,
        category: req.body.category,
        quantity: req.body.quantity,
        condition: req.body.condition,
        acquisitionDate: req.body.acquisitionDate,
        notes: req.body.notes,
      };
      const inserted = await db.insert(inventory).values(newItem).returning();
      res.status(201).json(inserted[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to add inventory" });
    }
  });

  app.put("/api/inventory/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updated = await db.update(inventory).set(req.body).where(eq(inventory.id, id as string)).returning();
      if (updated.length > 0) return res.json(updated[0]);
      res.status(404).json({ error: "Inventory item not found" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory" });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(inventory).where(eq(inventory.id, id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete inventory" });
    }
  });

  // 5.6 Students Management API
  app.get("/api/students", requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await db.select().from(students);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students", requireAuth, async (req: AuthRequest, res) => {
    try {
      const newStudent = {
        id: req.body.id || `144${Date.now().toString().slice(-7)}`,
        ranting: req.body.ranting || 'A-22',
        name: req.body.name,
        gender: req.body.gender || 'L',
        age: Number(req.body.age) || 9,
        kelas: req.body.kelas || 'Kelas 1',
        status: req.body.status || 'AKTIF',
      };
      const inserted = await db.insert(students).values(newStudent).returning();
      res.status(201).json(inserted[0]);
    } catch (error) {
      console.error('Error adding student:', error);
      res.status(500).json({ error: "Failed to add student" });
    }
  });

  app.put("/api/students/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updated = await db.update(students).set(req.body).where(eq(students.id, id as string)).returning();
      if (updated.length > 0) return res.json(updated[0]);
      res.status(404).json({ error: "Student not found" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const paramId = String(req.params.id);
      const decodedId = decodeURIComponent(paramId);

      // Delete student's payments first
      await db.delete(studentPayments).where(eq(studentPayments.studentId, decodedId));
      if (decodedId !== paramId) {
        await db.delete(studentPayments).where(eq(studentPayments.studentId, paramId));
      }

      // Delete student record
      const deleted = await db.delete(students).where(eq(students.id, decodedId)).returning();
      if (deleted.length === 0 && decodedId !== paramId) {
        await db.delete(students).where(eq(students.id, paramId));
      }

      res.json({ success: true, id: decodedId });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  app.post("/api/students/bulk", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { studentsList, overwrite } = req.body;
      if (!Array.isArray(studentsList) || studentsList.length === 0) {
        return res.status(400).json({ error: "Students list is empty" });
      }

      if (overwrite) {
        await db.delete(students);
      }

      const insertedStudents = [];
      for (const s of studentsList) {
        const studentObj = {
          id: String(s.id || s.nis || `144${Date.now().toString().slice(-7)}`),
          ranting: s.ranting || 'A-22',
          name: String(s.name || s.nama || '').trim().toUpperCase(),
          gender: (s.gender || s.jk || 'L').toString().toUpperCase().startsWith('P') ? 'P' : 'L',
          age: Number(s.age) || 9,
          kelas: String(s.kelas || 'Kelas 1').trim(),
          status: s.status || 'AKTIF',
        };
        if (!studentObj.name) continue;

        // Upsert or insert
        const existing = await db.select().from(students).where(eq(students.id, studentObj.id));
        if (existing.length > 0) {
          const updated = await db.update(students).set(studentObj).where(eq(students.id, studentObj.id)).returning();
          insertedStudents.push(updated[0]);
        } else {
          const inserted = await db.insert(students).values(studentObj).returning();
          insertedStudents.push(inserted[0]);
        }
      }

      res.status(201).json({ success: true, count: insertedStudents.length, data: insertedStudents });
    } catch (error) {
      console.error('Error bulk importing students:', error);
      res.status(500).json({ error: "Failed to import students" });
    }
  });

  // 5.7 Student Payments API
  app.get("/api/student-payments", requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await db.select().from(studentPayments).orderBy(desc(studentPayments.dateGregorian));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student payments" });
    }
  });

  app.post("/api/student-payments/batch", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { payments, createCashbookEntry } = req.body;
      if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ error: "Payments array is empty" });
      }

      const insertedRecords = [];
      let totalAmountBatch = 0;
      const paymentType = payments[0]?.type || 'SYAHRIYAH';
      const tahunAjaran = payments[0]?.tahunAjaran || '1446 - 1447 H.';
      const kelas = payments[0]?.kelas || '';
      const dateGregorian = payments[0]?.dateGregorian || new Date().toISOString().split('T')[0];
      const dateHijri = payments[0]?.dateHijri || '';

      for (const p of payments) {
        const id = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const record = {
          id,
          studentId: p.studentId,
          studentName: p.studentName,
          tahunAjaran: p.tahunAjaran || tahunAjaran,
          kelas: p.kelas || kelas,
          type: p.type,
          amount: Number(p.amount) || 0,
          dateGregorian: p.dateGregorian || dateGregorian,
          dateHijri: p.dateHijri || dateHijri,
          monthPeriod: p.monthPeriod || '',
          recordedBy: p.recordedBy || 'Bendahara',
          notes: p.notes || '',
        };
        const inserted = await db.insert(studentPayments).values(record).returning();
        insertedRecords.push(inserted[0]);
        totalAmountBatch += Number(p.amount) || 0;
      }

      // Automatically sync income to Cashbook/Transactions if total > 0
      if (createCashbookEntry && totalAmountBatch > 0) {
        const txId = `tx-syahriah-${Date.now()}`;
        const pTypeUpper = String(paymentType || '').toUpperCase();
        let rapbmCode = '2.1';
        let category = 'PENDAPATAN RUTIN';
        if (pTypeUpper.includes('IMDA')) {
          rapbmCode = '2.2';
          category = 'PENDAPATAN RUTIN';
        } else if (pTypeUpper.includes('IMNI')) {
          rapbmCode = '2.3';
          category = 'PENDAPATAN RUTIN';
        } else if (pTypeUpper.includes('SYAHRI')) {
          rapbmCode = '2.1';
          category = 'PENDAPATAN RUTIN';
        } else {
          rapbmCode = '2.1';
        }
        const description = `Penerimaan ${paymentType} ${kelas} (${payments.length} Murid)`;
        
        await db.insert(transactions).values({
          id: txId,
          tahunAjaran,
          dateGregorian,
          dateHijri,
          type: 'IN',
          rapbmCode,
          category,
          description,
          amount: totalAmountBatch,
          recordedBy: 'Bendahara',
          receiptNumber: `SYH-${Date.now().toString().slice(-6)}`,
        });

        // Also update RAPBM realita
        const existingRapbm = await db.select().from(rapbmItems).where(eq(rapbmItems.type, 'PENERIMAAN'));
        const item = existingRapbm.find((r) => {
          const yrMatch = r.tahunAjaran === tahunAjaran || (!r.tahunAjaran && tahunAjaran === '1446 - 1447 H.');
          const u = (r.uraian || '').toLowerCase();
          if (pTypeUpper.includes('IMDA')) return yrMatch && (r.noKode === '2.2' || u.includes('imda'));
          if (pTypeUpper.includes('IMNI')) return yrMatch && (r.noKode === '2.3' || u.includes('imni'));
          return yrMatch && (r.noKode === '2.1' || u.includes('syahri') || u.includes('spp'));
        });

        if (item) {
          const newRealita = item.realita + totalAmountBatch;
          const newPersentase = item.jumlahAnggaran > 0 ? Math.round((newRealita / item.jumlahAnggaran) * 100) : 100;
          await db.update(rapbmItems).set({
            realita: newRealita,
            persentase: newPersentase,
          }).where(eq(rapbmItems.id, item.id));
        }
      }

      res.status(201).json({ success: true, count: insertedRecords.length, totalAmount: totalAmountBatch });
    } catch (error) {
      console.error('Error saving batch payments:', error);
      res.status(500).json({ error: "Failed to save batch payments" });
    }
  });

  app.put("/api/student-payments/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { amount, dateGregorian, dateHijri, monthPeriod, notes, type, kelas } = req.body;
      const updated = await db.update(studentPayments).set({
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(dateGregorian ? { dateGregorian } : {}),
        ...(dateHijri ? { dateHijri } : {}),
        ...(monthPeriod !== undefined ? { monthPeriod } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(type ? { type } : {}),
        ...(kelas ? { kelas } : {}),
      }).where(eq(studentPayments.id, id as string)).returning();

      if (updated.length > 0) {
        return res.json(updated[0]);
      }
      res.status(404).json({ error: "Student payment not found" });
    } catch (error) {
      console.error('Error updating student payment:', error);
      res.status(500).json({ error: "Failed to update student payment" });
    }
  });

  app.delete("/api/student-payments/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const paramId = String(req.params.id);
      const decodedId = decodeURIComponent(paramId);
      const deleted = await db.delete(studentPayments).where(eq(studentPayments.id, decodedId)).returning();
      if (deleted.length === 0 && decodedId !== paramId) {
        await db.delete(studentPayments).where(eq(studentPayments.id, paramId));
      }
      res.json({ success: true, id: decodedId });
    } catch (error) {
      console.error('Error deleting student payment:', error);
      res.status(500).json({ error: "Failed to delete student payment" });
    }
  });

  app.post("/api/student-payments/bulk-delete", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No payment IDs provided" });
      }
      await db.delete(studentPayments).where(inArray(studentPayments.id, ids));
      res.json({ success: true, count: ids.length });
    } catch (error) {
      console.error('Error bulk deleting student payments:', error);
      res.status(500).json({ error: "Failed to delete student payments in bulk" });
    }
  });


  // 6. Backup & Restore Data
  app.get('/api/backup/export', requireAuth, async (req: AuthRequest, res) => {
    try {
      const [
        settingsData,
        rapbmData,
        transactionsData,
        teachersData,
        payrollsData,
        studentsData,
        studentPaymentsData,
        inventoryData,
      ] = await Promise.all([
        db.select().from(settings),
        db.select().from(rapbmItems),
        db.select().from(transactions),
        db.select().from(teachers),
        db.select().from(payrollRecords),
        db.select().from(students),
        db.select().from(studentPayments),
        db.select().from(inventory),
      ]);

      const backupPayload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings: settingsData[0] || null,
        rapbmItems: rapbmData,
        transactions: transactionsData,
        teachers: teachersData,
        payrollRecords: payrollsData,
        students: studentsData,
        studentPayments: studentPaymentsData,
        inventory: inventoryData,
      };

      res.json(backupPayload);
    } catch (error) {
      console.error('Error exporting backup:', error);
      res.status(500).json({ error: 'Failed to export backup data' });
    }
  });

  app.post('/api/backup/restore', requireAuth, async (req: AuthRequest, res) => {
    try {
      const backup = req.body;
      if (!backup || typeof backup !== 'object') {
        return res.status(400).json({ error: 'Invalid backup format' });
      }

      // 1. Settings
      if (backup.settings) {
        await db.delete(settings);
        await db.insert(settings).values({ id: 'app-settings', ...backup.settings });
      }

      // 2. RAPBM
      if (Array.isArray(backup.rapbmItems)) {
        await db.delete(rapbmItems);
        if (backup.rapbmItems.length > 0) {
          await db.insert(rapbmItems).values(backup.rapbmItems);
        }
      }

      // 3. Transactions
      if (Array.isArray(backup.transactions)) {
        await db.delete(transactions);
        if (backup.transactions.length > 0) {
          await db.insert(transactions).values(backup.transactions);
        }
      }

      // 4. Teachers
      if (Array.isArray(backup.teachers)) {
        await db.delete(teachers);
        if (backup.teachers.length > 0) {
          await db.insert(teachers).values(backup.teachers);
        }
      }

      // 5. Payrolls
      if (Array.isArray(backup.payrollRecords)) {
        await db.delete(payrollRecords);
        if (backup.payrollRecords.length > 0) {
          await db.insert(payrollRecords).values(backup.payrollRecords);
        }
      }

      // 6. Students
      if (Array.isArray(backup.students)) {
        await db.delete(students);
        if (backup.students.length > 0) {
          await db.insert(students).values(backup.students);
        }
      }

      // 7. Student Payments
      if (Array.isArray(backup.studentPayments)) {
        await db.delete(studentPayments);
        if (backup.studentPayments.length > 0) {
          await db.insert(studentPayments).values(backup.studentPayments);
        }
      }

      // 8. Inventory
      if (Array.isArray(backup.inventory)) {
        await db.delete(inventory);
        if (backup.inventory.length > 0) {
          await db.insert(inventory).values(backup.inventory);
        }
      }

      res.json({ success: true, message: 'Data berhasil dipulihkan dari backup' });
    } catch (error) {
      console.error('Error restoring backup:', error);
      res.status(500).json({ error: 'Failed to restore backup data' });
    }
  });

  // 7. Hijri Conversion API
  app.get('/api/hijri', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dateStr = req.query.date as string;
      const settingsData = await db.select().from(settings).where(eq(settings.id, 'app-settings'));
      const offset = settingsData[0]?.hijriOffsetDays || 0;
      const hijri = getHijriDate(dateStr, offset);
      res.json(hijri);
    } catch (error) {
      res.status(500).json({ error: 'Failed to convert hijri' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Madrasah Finance Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
