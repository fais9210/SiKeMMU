import React, { useState, useRef } from 'react';
import { Settings, Save, X, Building2, UserCheck, Moon, Image as ImageIcon, Upload, Download, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { MadrasahInfo } from '../types';
import { getHijriDate } from '../utils/hijri';

interface SettingsModalProps {
  madrasah: MadrasahInfo;
  onSave: (info: MadrasahInfo) => Promise<void>;
  onClose: () => void;
  onExportBackup?: () => Promise<void>;
  onRestoreBackup?: (backupData: any) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  madrasah,
  onSave,
  onClose,
  onExportBackup,
  onRestoreBackup,
}) => {
  const [namaMadrasah, setNamaMadrasah] = useState(madrasah.namaMadrasah);
  const [alamat, setAlamat] = useState(madrasah.alamat);
  const [kecamatan, setKecamatan] = useState(madrasah.kecamatan);
  const [kabupaten, setKabupaten] = useState(madrasah.kabupaten);
  
  const [pengurusName, setPengurusName] = useState(madrasah.pengurusName);
  const [headmasterName, setHeadmasterName] = useState(madrasah.headmasterName);
  const [treasurerName, setTreasurerName] = useState(madrasah.treasurerName);

  const [hijriOffsetDays, setHijriOffsetDays] = useState(madrasah.hijriOffsetDays);
  const [logoUrl, setLogoUrl] = useState(madrasah.logoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backup & Restore state
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const previewHijri = getHijriDate(new Date(), hijriOffsetDays);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackupExportClick = async () => {
    if (!onExportBackup) return;
    setIsExporting(true);
    setRestoreMessage(null);
    try {
      await onExportBackup();
      setRestoreMessage({ type: 'success', text: 'File cadangan JSON berhasil diunduh!' });
    } catch (err) {
      console.error(err);
      setRestoreMessage({ type: 'error', text: 'Gagal mengunduh file cadangan.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        if (!jsonContent || typeof jsonContent !== 'object') {
          throw new Error('Format file JSON tidak valid.');
        }

        const confirmRestore = confirm(
          'Apakah Anda yakin ingin memulihkan (restore) data dari file ini?\nData yang ada saat ini akan diperbarui dengan data dari file cadangan.'
        );

        if (!confirmRestore) {
          if (backupInputRef.current) backupInputRef.current.value = '';
          return;
        }

        setIsRestoring(true);
        setRestoreMessage(null);

        if (onRestoreBackup) {
          await onRestoreBackup(jsonContent);
          setRestoreMessage({
            type: 'success',
            text: 'Data berhasil dipulihkan dari file backup!',
          });
        }
      } catch (err: any) {
        console.error('Error parsing restore file:', err);
        setRestoreMessage({
          type: 'error',
          text: `Gagal memulihkan data: ${err.message || 'Format JSON tidak sesuai'}`,
        });
      } finally {
        setIsRestoring(false);
        if (backupInputRef.current) backupInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        namaMadrasah,
        alamat,
        kecamatan,
        kabupaten,
        tahunAjaranHijri: madrasah.tahunAjaranHijri,
        pengurusName,
        pengurusTitle: madrasah.pengurusTitle,
        headmasterName,
        headmasterTitle: madrasah.headmasterTitle,
        treasurerName,
        treasurerTitle: madrasah.treasurerTitle,
        hijriOffsetDays,
        rtRw: madrasah.rtRw,
        desaSampung: madrasah.desaSampung,
        logoUrl
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-5 my-auto">
        
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
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                <div 
                  className="w-24 h-[153px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  title="Klik untuk upload logo (250x400)"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Madrasah" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">250x400</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] flex items-center space-x-1 px-2 py-1 bg-white border shadow-sm rounded text-slate-600 font-medium hover:bg-slate-50"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </button>
              </div>
              <div className="flex-1 space-y-3">
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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

          {/* Section 4: Backup & Restore Data System */}
          <div className="space-y-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-emerald-950 text-xs">
                <Database className="w-4 h-4 text-emerald-700" />
                <span>Backup & Restore Data Sistem</span>
              </div>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                Format JSON
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Unduh cadangan data lengkap (Identitas, RAPBM, Transaksi, Guru, Slip Gaji, Santri, Syahriyah, Inventaris) untuk arsip aman atau ekspor ulang ke perangkat lain.
            </p>

            {restoreMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  restoreMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{restoreMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleBackupExportClick}
                disabled={isExporting}
                className="w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-amber-300" />
                )}
                <span>Unduh Backup Data (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                disabled={isRestoring}
                className="w-full py-2.5 px-3 bg-white hover:bg-emerald-50 border border-emerald-400 text-emerald-900 font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isRestoring ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                ) : (
                  <Upload className="w-4 h-4 text-emerald-700" />
                )}
                <span>Pulihkan / Restore Data</span>
              </button>

              <input
                type="file"
                ref={backupInputRef}
                onChange={handleBackupRestoreFile}
                accept=".json,application/json"
                className="hidden"
              />
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
