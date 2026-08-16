import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  WifiOff,
  Sparkles,
  ArrowDown,
  Monitor,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Check if user is on iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt (Android / Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Online / Offline Listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsBannerVisible(false);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General fallback instructions for Android / PC
      alert('Untuk menginstall aplikasi, buka menu browser (titik tiga di kanan atas) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".');
    }
  };

  if (isStandalone) {
    return isOffline ? (
      <div className="bg-amber-950/90 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span>Mode Offline Aktif: Aplikasi tetap berjalan tanpa koneksi internet.</span>
      </div>
    ) : null;
  }

  return (
    <>
      {/* Offline Status Alert Banner if disconnected */}
      {isOffline && (
        <div className="bg-amber-950/95 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-center gap-2 z-50 sticky top-0 shadow-md">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Mode Offline: Anda sedang tidak terhubung internet. Data lokal tersimpan secara aman.</span>
        </div>
      )}

      {/* Persistent / Dismissible Install Banner */}
      {isBannerVisible && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 px-3 sm:px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 z-40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                Install Aplikasi ke HP (PWA)
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] text-emerald-300 font-normal">
                  Bisa Offline
                </span>
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                Akses cepat dari layar utama seperti aplikasi Android tanpa repot ketik URL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/40 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Sekarang</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsBannerVisible(false);
                onDismiss && onDismiss();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Step-by-Step Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Install di iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Ikuti 2 langkah mudah berikut untuk menambahkan aplikasi ke Layar Utama iPhone/iPad Anda:
            </p>

            <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="text-slate-200 font-medium flex items-center gap-1.5">
                    Ketuk tombol <Share2 className="w-3.5 h-3.5 text-blue-400" /> <strong>Bagikan / Share</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">Terletak di bilah bawah browser Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="text-slate-200 font-medium flex items-center gap-1.5">
                    Pilih <PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> <strong>"Tambah ke Layar Utama"</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">Gulir ke bawah menu lalu ketuk Tambahkan.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
