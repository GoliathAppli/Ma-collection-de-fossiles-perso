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
  FolderPlus,
  AlertTriangle
} from 'lucide-react';
import { usePWAInstall } from '../utils/pwa';
import { playDinoSound } from '../utils/data/audio';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const { isInstallable, isInstalled, isIOS, inIframe, install, openInExternalBrowser } = usePWAInstall();
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
      setInstallStatus('ℹ️ Sur iPhone/iPad, suivez les étapes Safari ci-dessous.');
    } else if (result === 'dismissed') {
      setInstallStatus('Installation annulée. Vous pouvez réessayer à tout moment.');
    } else {
      setInstallStatus('ℹ️ Suivez le guide ci-dessous pour déclencher l\'installation dans votre navigateur.');
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
                Application Mobile & Dossiers
              </h2>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold">
                PWA / WebAPK
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Véritable application autonome avec icône officielle à ranger dans vos dossiers d'applications à côté de Facebook, Instagram ou WhatsApp.
            </p>
          </div>
        </div>

        {/* IFRAME NOTICE */}
        {inIframe && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Vous consultez l'aperçu dans l'éditeur :</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Pour que votre téléphone (Android ou iPhone) crée le véritable paquet d'application installable et l'ajoute au tiroir d'applications, ouvrez d'abord le lien dans un nouvel onglet :
            </p>
            <button
              onClick={() => {
                playDinoSound();
                openInExternalBrowser();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ouvrir l'App en Plein Écran (Nouvel Onglet)</span>
            </button>
          </div>
        )}

        {/* HIGHLIGHT: VÉRITABLE APPLICATION vs SIMPLE RACCOURCI */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <FolderPlus className="w-4 h-4 text-yellow-400" />
            <span>Comment ranger l'application dans vos dossiers de smartphone :</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Grâce au protocole <strong>WebAPK & PWA</strong>, cette application est enregistrée par le système Android & iOS comme une <strong>véritable application native</strong>. Vous pouvez :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>La glisser dans des dossiers d'applications</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>La retrouver dans le tiroir d'applications</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>L'ouvrir en plein écran sans barre d'adresse</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>L'utiliser 100% hors-ligne sans connexion</span>
            </div>
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

        {/* PRIMARY 1-CLICK ACTION */}
        <div className="bg-gradient-to-r from-yellow-950/40 via-slate-900 to-slate-900 border border-yellow-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-yellow-400 flex items-center justify-center sm:justify-start gap-2">
              <Download className="w-4 h-4" />
              {isInstalled ? "Application Déjà Installée" : "Installation Directe"}
            </h4>
            <p className="text-xs text-slate-300">
              {isInstalled 
                ? "L'application est déjà installée et prête à être rangée dans vos dossiers." 
                : "Cliquez sur le bouton ci-contre pour déclencher l'installation native du système."}
            </p>
          </div>
          
          <button
            onClick={handleTriggerInstall}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4" />
            {isInstalled ? "Réinstaller / Mettre à jour" : "Télécharger & Installer l'App"}
          </button>
        </div>

        {/* OS SELECTOR TABS */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Instructions détaillées par système :
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
                Android (Google Chrome & Samsung Internet)
              </h3>
              
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    Ouvrez le site dans <strong className="text-white">Google Chrome</strong> ou <strong className="text-white">Samsung Internet</strong>.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    Appuyez sur le menu (les <span className="font-bold text-yellow-400">3 points verticaux ⋮</span> en haut à droite).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    Sélectionnez <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"Installer l'application"</span> (l'icône avec la flèche vers le bas).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">4</span>
                  <div>
                    Confirmez avec <strong className="text-white">"Installer"</strong>. Android télécharge et génère le paquet officiel dans votre <span className="text-yellow-400 font-bold">tiroir d'applications</span>.
                  </div>
                </li>
              </ol>

              <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Vous pouvez maintenant maintenir votre doigt sur l'icône pour la glisser dans n'importe quel dossier de votre écran d'accueil.</span>
              </div>
            </div>
          )}

          {selectedOs === 'ios' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Share2 className="w-4 h-4" />
                Apple iPhone & iPad (Safari)
              </h3>
              
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    Ouvrez le lien dans le navigateur <strong className="text-white">Safari</strong> d'Apple.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    Appuyez sur le bouton de <strong className="text-white">Partage</strong> (l'icône <span className="inline-block bg-slate-800 text-yellow-400 px-1.5 py-0.5 rounded font-mono text-[11px]">⎋ carré avec flèche</span> en bas).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    Sélectionnez <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"Sur l'écran d'accueil" ⊞</span>.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">4</span>
                  <div>
                    Touchez <strong className="text-white">"Ajouter"</strong> en haut à droite.
                  </div>
                </li>
              </ol>

              <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>L'icône s'ajoute à votre écran iOS et peut être glissée dans vos dossiers d'applications Apple en restant appuyé dessus.</span>
              </div>
            </div>
          )}

          {selectedOs === 'desktop' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Laptop className="w-4 h-4" />
                Ordinateur (Chrome, Edge, Brave)
              </h3>
              
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    Cliquez sur le bouton <strong className="text-white">"Télécharger & Installer l'App"</strong> ci-dessus.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    Ou cliquez sur l'icône d'écran avec une flèche située à droite dans votre barre d'adresse URL.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    Cliquez sur <strong className="text-white">"Installer"</strong> pour obtenir une fenêtre d'application autonome sur votre bureau.
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
            <span>WebAPK Android</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tiroir & Dossiers d'Apps</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode Hors-Ligne 100%</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Icônes Maskable HD</span>
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
