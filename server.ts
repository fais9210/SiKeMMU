import express from 'express';
import path from 'path';
import { pathToFileURL } from 'url';
import { createServer as createViteServer } from 'vite';
import { getHijriDate } from './src/utils/hijri';
import { requireAuth, AuthRequest } from './src/middleware/auth';
import { db, initTables } from './src/db/db';
import { settings, rapbmItems, transactions, teachers, payrollRecords, inventory } from './src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { initialMadrasahInfo, initialRAPBMData } from './src/data/initialData';

export async function createApp() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
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
        // Upsert logic
        for (const i of items) {
          const existing = await db.select().from(rapbmItems).where(eq(rapbmItems.id, i.id));
          if (existing.length > 0) {
            await db.update(rapbmItems).set(i).where(eq(rapbmItems.id, i.id));
          } else {
            await db.insert(rapbmItems).values(i);
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to seed rapbm' });
    }
  });

  app.put('/api/rapbm/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { jumlahAnggaran, realita, uraian } = req.body;
      const item = await db.select().from(rapbmItems).where(eq(rapbmItems.id, id as string));
      if (item.length > 0) {
        const newAnggaran = jumlahAnggaran !== undefined ? Number(jumlahAnggaran) : item[0].jumlahAnggaran;
        const newRealita = realita !== undefined ? Number(realita) : item[0].realita;
        const persentase = newAnggaran > 0 ? Math.round((newRealita / newAnggaran) * 100) : 100;
        const newUraian = uraian !== undefined ? String(uraian) : item[0].uraian;
        
        const updated = await db.update(rapbmItems).set({
          jumlahAnggaran: newAnggaran,
          realita: newRealita,
          persentase,
          uraian: newUraian,
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
      const rapbmCode = isTU ? '1.3' : '1.1';
      const newTrx = {
        id: `trx-pay-${Date.now()}`,
        tahunAjaran: newPayroll.tahunAjaran,
        dateGregorian: newPayroll.dateGeneratedGregorian,
        dateHijri: newPayroll.dateGeneratedHijri,
        type: 'OUT',
        rapbmCode,
        category: 'BISYAROH DAN TUNJANGAN',
        description: `Bisyaroh Ustadz/ah ${newPayroll.teacherName} (${newPayroll.monthHijri})`,
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

      const rapbmCodes = ['1.1', '1.3'];
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

  // 6. Hijri Conversion API
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
  
  return app;
}

export async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Madrasah Finance Server] Running on http://localhost:${PORT}`);
  });
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  startServer();
}

export default async function handler(req: any, res: any) {
  const app = await createApp();
  return app.handle(req, res, (err: unknown) => {
    if (err) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
}
