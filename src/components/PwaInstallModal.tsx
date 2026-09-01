import React from 'react';
import { Download, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../utils/pwa';
import { playDinoSound } from '../utils/data/audio';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const { install } = usePWAInstall();

  if (!isOpen) return null;

  const handleDirectDownload = async () => {
    playDinoSound();

    // 1. Trigger direct file download
    const link = document.createElement('a');
    link.href = '/api/download-app';
    link.download = 'Conservatoire_de_Fossiles.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Trigger native prompt if available
    try {
      await install();
    } catch {
      // Ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-100 text-center">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-2">
          <div className="relative">
            <img 
              src="/icons/icon-192x192.png" 
              alt="Logo Conservatoire" 
              className="w-20 h-20 rounded-2xl shadow-xl border border-yellow-500/50 p-1 bg-slate-950 object-contain mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-slate-900">
              <Sparkles className="w-4 h-4 font-bold" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white tracking-wide">
            Conservatoire de Fossiles
          </h2>
        </div>

        {/* DIRECT DOWNLOAD BUTTON */}
        <div className="pt-2 pb-2">
          <button
            id="btn-modal-direct-download"
            onClick={handleDirectDownload}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black p-4.5 rounded-2xl text-sm uppercase tracking-wider transition shadow-xl shadow-yellow-500/25 active:scale-95 cursor-pointer border border-yellow-300/50"
          >
            <Download className="w-6 h-6 stroke-[2.5]" />
            <span>TÉLÉCHARGER L'APPLICATION</span>
          </button>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Téléchargement direct
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
