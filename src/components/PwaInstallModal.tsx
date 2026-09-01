import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  Laptop, 
  X, 
  Sparkles, 
  Check, 
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Wifi,
  WifiOff
} from 'lucide-react';
import { usePWAInstall } from '../utils/pwa';
import { playDinoSound } from '../utils/data/audio';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [selectedOs, setSelectedOs] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (/Android/i.test(navigator.userAgent)) return 'android';
    return 'android';
  });
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    playDinoSound();
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('✅ Félicitations ! L\'application a été installée sur votre appareil.');
    } else if (result === 'manual_ios') {
      setSelectedOs('ios');
      setInstallStatus('ℹ️ Sur iPhone/iPad, suivez les 3 étapes simples ci-dessous.');
    } else if (result === 'dismissed') {
      setInstallStatus('Installation annulée. Vous pouvez réessayer à tout moment.');
    } else {
      setInstallStatus('ℹ️ Suivez le guide ci-dessous pour votre navigateur.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <img 
              src="/icons/icon-192x192.png" 
              alt="Logo Conservatoire" 
              className="w-16 h-16 rounded-2xl shadow-lg border border-yellow-500/40 p-1 bg-slate-950 object-contain"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-slate-900">
              <Sparkles className="w-3.5 h-3.5 font-bold" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                Installer l'Application Mobile
              </h2>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold">
                PWA Officielle
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Installez le Conservatoire de Fossiles directement sur votre écran d'accueil, sans passer par un store. Fonctionne 100% hors-ligne.
            </p>
          </div>
        </div>

        {/* INSTALL STATUS NOTIFICATION */}
        {installStatus && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-yellow-500/40 text-yellow-300 text-xs font-semibold flex items-center justify-between">
            <span>{installStatus}</span>
            <button 
              onClick={() => setInstallStatus(null)}
              className="text-slate-400 hover:text-white text-[11px] underline ml-2 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* PRIMARY 1-CLICK ACTION IF READY */}
        <div className="bg-gradient-to-r from-yellow-950/40 via-slate-900 to-slate-900 border border-yellow-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-yellow-400 flex items-center justify-center sm:justify-start gap-2">
              <Download className="w-4 h-4" />
              {isInstalled ? "Application Déjà Installée" : "Installation Rapide en 1 Clic"}
            </h4>
            <p className="text-xs text-slate-300">
              {isInstalled 
                ? "Le Conservatoire de Fossiles est déjà installé en mode autonome sur cet appareil." 
                : "Cliquez sur le bouton pour lancer l'invitation d'installation directe du navigateur."}
            </p>
          </div>
          
          <button
            onClick={handleTriggerInstall}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4" />
            {isInstalled ? "Réinstaller / Mettre à jour" : "Télécharger & Installer"}
          </button>
        </div>

        {/* OS SELECTOR TABS */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Instructions détaillées par appareil :
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => { playDinoSound(); setSelectedOs('android'); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedOs === 'android'
                  ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android</span>
            </button>

            <button
              onClick={() => { playDinoSound(); setSelectedOs('ios'); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedOs === 'ios'
                  ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>iPhone / iPad</span>
            </button>

            <button
              onClick={() => { playDinoSound(); setSelectedOs('desktop'); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedOs === 'desktop'
                  ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>PC / Mac</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          {selectedOs === 'android' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Smartphone className="w-4 h-4" />
                Installation sur smartphone & tablette Android (Chrome, Samsung Internet, Edge)
              </h3>
              
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    <strong className="text-white">Cliquez sur le bouton "Télécharger & Installer" ci-dessus</strong> ou ouvrez le menu de votre navigateur (les <span className="font-bold text-yellow-400">3 points verticaux ⋮</span> en haut à droite).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    Appuyez sur <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"Installer l'application"</span> ou <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"Ajouter à l'écran d'accueil"</span>.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    Confirmez en appuyant sur <strong className="text-white">"Installer"</strong>.
                  </div>
                </li>
              </ol>

              <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>L'icône dorée officielle s'installe directement dans votre tiroir d'applications et sur votre écran d'accueil, sans barre d'adresse.</span>
              </div>
            </div>
          )}

          {selectedOs === 'ios' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Share2 className="w-4 h-4" />
                Installation sur Apple iPhone & iPad (Safari)
              </h3>
              
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    Ouvrez le site dans le navigateur <strong className="text-white">Safari</strong> d'Apple.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    Appuyez sur le bouton de <strong className="text-white">Partage</strong> (l'icône <span className="inline-block bg-slate-800 text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[11px]">⎋ / carré avec flèche vers le haut</span> située en bas de l'écran).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    Faites défiler le menu vers le bas et sélectionnez <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"Sur l'écran d'accueil" ⊞</span>.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">4</span>
                  <div>
                    Appuyez sur <strong className="text-white">"Ajouter"</strong> en haut à droite.
                  </div>
                </li>
              </ol>

              <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>L'application s'ouvrira en plein écran sans aucune barre Safari, comme une application native iOS !</span>
              </div>
            </div>
          )}

          {selectedOs === 'desktop' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Laptop className="w-4 h-4" />
                Installation sur Ordinateur (Google Chrome, Microsoft Edge, Brave)
              </h3>
              
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    Cliquez sur le bouton <strong className="text-white">"Télécharger & Installer"</strong> ci-dessus.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    Ou cliquez sur la petite icône d'ordinateur avec une flèche qui apparaît à droite dans votre barre d'adresse URL.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    Cliquez sur <strong className="text-white">"Installer"</strong>. L'application devient une fenêtre de bureau indépendante.
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* TECHNICAL PWA INTEGRATION BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manifest.json</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Service Worker</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode Hors-Ligne</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Icônes HD Maskable</span>
          </div>
        </div>

        {/* FOOTER CLOSE */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Fermer le guide
          </button>
        </div>

      </div>
    </div>
  );
}
