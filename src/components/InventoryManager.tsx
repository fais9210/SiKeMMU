import React, { useState, useEffect } from 'react';
import { PackageOpen, PlusCircle, Search, Edit2, Trash2, Download } from 'lucide-react';
import { InventoryItem } from '../types';
import { apiFetch } from '../lib/api';

interface InventoryManagerProps {
  onExportPDF: (data: InventoryItem[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onExportPDF }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ruang Kelas');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<'BAIK' | 'KURANG BAIK' | 'RUSAK BERAT'>('BAIK');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Gedung Madin',
    'Ruang Kepala Madin',
    'Ruang Ustadz/Ustadzah',
    'Ruang Tata Usaha/Administrasi',
    'Ruang Kegiatan Belajar / Ruang Kelas',
    'Ruang Perpustakaan',
    'Tempat Ibadah/Masjid/Musholla',
    'Kamar Mandi / Toilet',
    'Dapur',
    'Gudang'
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await apiFetch('/api/inventory');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const [isKeepOpen, setIsKeepOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        category,
        quantity,
        condition,
        acquisitionDate,
        notes,
      };

      if (editingId) {
        await apiFetch(`/api/inventory/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/inventory', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      
      await fetchItems();
      
      if (isKeepOpen && !editingId) {
        setName('');
        setQuantity(1);
        setCondition('BAIK');
        setNotes('');
        setIsKeepOpen(false);
      } else {
        resetForm();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus item ini?')) return;
    try {
      await apiFetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setCondition(item.condition);
    setAcquisitionDate(item.acquisitionDate || '');
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Ruang Kelas');
    setQuantity(1);
    setCondition('BAIK');
    setAcquisitionDate('');
    setNotes('');
    setIsModalOpen(false);
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <PackageOpen className="w-4 h-4" />
              <span>Inventaris Madrasah</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">Data Barang & Aset</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportPDF(items)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm text-xs transition flex items-center space-x-2 border border-slate-200"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF</span>
            </button>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Inventaris</span>
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama barang atau ruang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Memuat data...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <PackageOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Belum ada inventaris</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Nama Barang</th>
                  <th className="px-6 py-4">Kategori / Ruang</th>
                  <th className="px-6 py-4 text-center">Jumlah</th>
                  <th className="px-6 py-4 text-center">Kondisi</th>
                  <th className="px-6 py-4">Tgl Diperoleh</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4 text-center font-bold">{item.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                        item.condition === 'BAIK' ? 'bg-emerald-100 text-emerald-800' :
                        item.condition === 'KURANG BAIK' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">{item.acquisitionDate || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">{editingId ? 'Edit Inventaris' : 'Tambah Inventaris'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">Nama Barang</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Kategori Ruang</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 border rounded-xl">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Jumlah</label>
                  <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kondisi</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value as any)} className="w-full p-2.5 border rounded-xl">
                    <option value="BAIK">Baik</option>
                    <option value="KURANG BAIK">Kurang Baik</option>
                    <option value="RUSAK BERAT">Rusak Berat</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Tanggal Diperoleh</label>
                <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Keterangan Tambahan</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 border rounded-xl" />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button>
                {!editingId && (
                  <button type="submit" onClick={() => setIsKeepOpen(true)} disabled={isSubmitting} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold">
                    Simpan & Tambah Lagi
                  </button>
                )}
                <button type="submit" onClick={() => setIsKeepOpen(false)} disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
