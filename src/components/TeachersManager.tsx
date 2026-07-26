import React, { useState } from 'react';
import { Users, PlusCircle, Edit2, Trash2, Search, CheckCircle2, Award, Download, Upload } from 'lucide-react';
import { Teacher } from '../types';
import { formatCurrency } from '../utils/hijri';

interface TeachersManagerProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  onUpdateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
}

export const TeachersManager: React.FC<TeachersManagerProps> = ({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [nipNu, setNipNu] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [jamMengajar, setJamMengajar] = useState<number>(18);
  const [tarifPerJam, setTarifPerJam] = useState<number>(25000);
  const [tunjanganJabatan, setTunjanganJabatan] = useState<number>(150000);
  const [tunjanganMasaKerja, setTunjanganMasaKerja] = useState<number>(100000);
  const [tunjanganKehadiran, setTunjanganKehadiran] = useState<number>(100000);
  const [potonganInfaq, setPotonganInfaq] = useState<number>(15000);
  const [potonganTabungan, setPotonganTabungan] = useState<number>(25000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewForm = () => {
    setEditingTeacher(null);
    setNipNu(`MU22-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setRole('Guru Kelas');
    setJamMengajar(18);
    setTarifPerJam(25000);
    setTunjanganJabatan(150000);
    setTunjanganMasaKerja(100000);
    setTunjanganKehadiran(100000);
    setPotonganInfaq(15000);
    setPotonganTabungan(25000);
    setIsModalOpen(true);
  };

  const openEditForm = (t: Teacher) => {
    setEditingTeacher(t);
    setNipNu(t.nipNu);
    setName(t.name);
    setRole(t.role);
    setJamMengajar(t.jamMengajar);
    setTarifPerJam(t.tarifPerJam);
    setTunjanganJabatan(t.tunjanganJabatan);
    setTunjanganMasaKerja(t.tunjanganMasaKerja);
    setTunjanganKehadiran(t.tunjanganKehadiran);
    setPotonganInfaq(t.potonganInfaq);
    setPotonganTabungan(t.potonganTabungan);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    setIsSubmitting(true);
    try {
      const data = {
        nipNu,
        name,
        role,
        jamMengajar,
        tarifPerJam,
        tunjanganJabatan,
        tunjanganMasaKerja,
        tunjanganKehadiran,
        potonganInfaq,
        potonganTabungan,
        status: 'AKTIF' as const,
      };

      if (editingTeacher) {
        await onUpdateTeacher(editingTeacher.id, data);
      } else {
        await onAddTeacher(data);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nipNu.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['NIP/NU', 'Nama', 'Jabatan', 'Jam Mengajar', 'Tarif Per Jam', 'Tunjangan Jabatan', 'Tunjangan Masa Kerja', 'Tunjangan Kehadiran', 'Potongan Infaq', 'Potongan Tabungan', 'Status'];
    const csvContent = [
      headers.join(','),
      ...teachers.map(t => [
        `"${t.nipNu}"`,
        `"${t.name}"`,
        `"${t.role}"`,
        t.jamMengajar,
        t.tarifPerJam,
        t.tunjanganJabatan,
        t.tunjanganMasaKerja,
        t.tunjanganKehadiran,
        t.potonganInfaq,
        t.potonganTabungan,
        `"${t.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Data_Guru_Madrasah.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      if (lines.length > 1) {
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (match) {
             const values = match.map(val => val.replace(/^"|"$/g, '').trim());
             if (values.length >= 10) {
                const nipNu = values[0];
                const existingTeacher = teachers.find(t => t.nipNu === nipNu);
                const data = {
                  nipNu,
                  name: values[1],
                  role: values[2],
                  jamMengajar: Number(values[3]) || 0,
                  tarifPerJam: Number(values[4]) || 0,
                  tunjanganJabatan: Number(values[5]) || 0,
                  tunjanganMasaKerja: Number(values[6]) || 0,
                  tunjanganKehadiran: Number(values[7]) || 0,
                  potonganInfaq: Number(values[8]) || 0,
                  potonganTabungan: Number(values[9]) || 0,
                  status: (values[10] || 'AKTIF') as 'AKTIF' | 'NON_AKTIF',
                };

                if (existingTeacher) {
                  await onUpdateTeacher(existingTeacher.id, data);
                } else {
                  await onAddTeacher(data);
                }
             }
          }
        }
      }
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  return (
    <div id="teachers-manager-container" className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Master Data Pengajar</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Data Ustadz, Guru & Staf Tata Usaha
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar tenaga pendidik beserta struktur jam mengajar, tarif, dan tunjangan.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="cursor-pointer px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm text-xs transition flex items-center space-x-2 border border-slate-300">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleImportCSV} 
            />
          </label>
          
          <button
            onClick={handleExportCSV}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm text-xs transition flex items-center space-x-2 border border-slate-300"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            id="btn-add-teacher"
            onClick={openNewForm}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama / NIP / jabatan ustadz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
          Total: {filteredTeachers.length} Pengajar
        </span>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                  {t.nipNu}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                  {t.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">{t.name}</h3>
                <p className="text-xs text-emerald-800 font-semibold">{t.role}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Jam Mengajar:</span>
                  <strong className="text-slate-900">{t.jamMengajar} Jam / Minggu</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tarif Honor / Jam:</span>
                  <strong className="text-slate-900">{formatCurrency(t.tarifPerJam)}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Tunjangan:</span>
                  <strong className="text-emerald-700">
                    {formatCurrency(t.tunjanganJabatan + t.tunjanganMasaKerja + t.tunjanganKehadiran)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => openEditForm(t)}
                className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition text-xs flex items-center space-x-1 font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => onDeleteTeacher(t.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Hapus Guru"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Teacher Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingTeacher ? 'Edit Data Pengajar' : 'Tambah Ustadz / Guru Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={nipNu}
                    onChange={(e) => setNipNu(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan / Tugas</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    placeholder="misal: Guru Fiqih & Wali Kelas"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="misal: Ustadz Ahmad Fauzi, S.Pd"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mengajar / Minggu</label>
                  <input
                    type="number"
                    value={jamMengajar}
                    onChange={(e) => setJamMengajar(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif Honor Per Jam (Rp)</label>
                  <input
                    type="number"
                    value={tarifPerJam}
                    onChange={(e) => setTarifPerJam(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunj. Jabatan</label>
                  <input
                    type="number"
                    value={tunjanganJabatan}
                    onChange={(e) => setTunjanganJabatan(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunj. Masa Kerja</label>
                  <input
                    type="number"
                    value={tunjanganMasaKerja}
                    onChange={(e) => setTunjanganMasaKerja(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunj. Kehadiran</label>
                  <input
                    type="number"
                    value={tunjanganKehadiran}
                    onChange={(e) => setTunjanganKehadiran(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Potongan Infaq (Rp)</label>
                  <input
                    type="number"
                    value={potonganInfaq}
                    onChange={(e) => setPotonganInfaq(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-rose-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Potongan Tabungan (Rp)</label>
                  <input
                    type="number"
                    value={potonganTabungan}
                    onChange={(e) => setPotonganTabungan(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-rose-700 font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Simpan...' : 'Simpan Data Guru'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
