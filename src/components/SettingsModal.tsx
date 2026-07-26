import React, { useState } from 'react';
import { Settings, Save, X, Moon, Building2, UserCheck } from 'lucide-react';
import { MadrasahInfo } from '../types';
import { getHijriDate } from '../utils/hijri';

interface SettingsModalProps {
  madrasah: MadrasahInfo;
  onSave: (updated: Partial<MadrasahInfo>) => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  madrasah,
  onSave,
  onClose,
}) => {
  const [namaMadrasah, setNamaMadrasah] = useState(madrasah.namaMadrasah);
  const [alamat, setAlamat] = useState(madrasah.alamat);
  const [kecamatan, setKecamatan] = useState(madrasah.kecamatan);
  const [kabupaten, setKabupaten] = useState(madrasah.kabupaten);
  const [tahunAjaranHijri, setTahunAjaranHijri] = useState(madrasah.tahunAjaranHijri);
  const [pengurusName, setPengurusName] = useState(madrasah.pengurusName);
  const [headmasterName, setHeadmasterName] = useState(madrasah.headmasterName);
  const [treasurerName, setTreasurerName] = useState(madrasah.treasurerName);
  const [hijriOffsetDays, setHijriOffsetDays] = useState(madrasah.hijriOffsetDays);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewHijri = getHijriDate(new Date(), hijriOffsetDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        namaMadrasah,
        alamat,
        kecamatan,
        kabupaten,
        tahunAjaranHijri,
        pengurusName,
        headmasterName,
        treasurerName,
        hijriOffsetDays,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-base">
            <Settings className="w-5 h-5 text-emerald-700" />
            <span>Pengaturan Madrasah & TTD Pejabat</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Section 1: Institutional Header */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Identitas KOP Madrasah</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Madrasah</label>
              <input
                type="text"
                value={namaMadrasah}
                onChange={(e) => setNamaMadrasah(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat / RT/RW</label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kabupaten</label>
                <input
                  type="text"
                  value={kabupaten}
                  onChange={(e) => setKabupaten(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran Hijriyah</label>
                <input
                  type="text"
                  value={tahunAjaranHijri}
                  onChange={(e) => setTahunAjaranHijri(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-emerald-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Signatories / Pejabat TTD */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Pejabat Penandatangan Laporan (TTD)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Pengurus Madrasah</label>
              <input
                type="text"
                value={pengurusName}
                onChange={(e) => setPengurusName(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Madrasah</label>
                <input
                  type="text"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Bendahara Madrasah</label>
                <input
                  type="text"
                  value={treasurerName}
                  onChange={(e) => setTreasurerName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Hijri Calendar Adjustment Offset */}
          <div className="space-y-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-amber-900 text-xs">
                <Moon className="w-4 h-4 text-amber-600" />
                <span>Koreksi Tanggal Hijriyah (Rukyat Hilal Offset)</span>
              </div>
              <span className="text-amber-800 font-bold bg-amber-200 px-2.5 py-0.5 rounded-full">
                {previewHijri.formatted}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Koreksi Hari (+/- Hari):
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={hijriOffsetDays}
                  onChange={(e) => setHijriOffsetDays(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <span className="font-bold text-amber-900 text-sm w-12 text-center bg-white py-1 px-2 border rounded-lg">
                  {hijriOffsetDays > 0 ? `+${hijriOffsetDays}` : hijriOffsetDays} hr
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Gunakan geseran ini jika ada selisih 1-2 hari hasil rukyatul hilal lokal dengan penanggalan standar.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
