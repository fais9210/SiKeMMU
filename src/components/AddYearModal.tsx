import React, { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';

interface AddYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (year: string) => void;
}

export const AddYearModal: React.FC<AddYearModalProps> = ({ isOpen, onClose, onSave }) => {
  const [newYear, setNewYear] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newYear.trim()) {
      onSave(newYear.trim());
      setNewYear('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-800 p-4 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CalendarPlus className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold">Tambah Tahun Ajaran</h3>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tahun Ajaran Baru
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 1449 - 1450 H."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              autoFocus
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Tahun ini akan ditambahkan ke daftar dan menjadi tahun aktif.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!newYear.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition disabled:opacity-50"
            >
              Simpan & Pilih
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
