import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Share2, 
  Laptop, 
  X, 
  Sparkles, 
  Check, 
  FolderPlus,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle
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
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) return 'android';
    return 'android';
  });
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    playDinoSound();
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('✅ L\'application s\'installe sur votre téléphone et apparaîtra dans votre tiroir d\'applications !');
    } else if (result === 'manual_ios') {
      setSelectedOs('ios');
      setInstallStatus('ℹ️ Sur iOS Safari, utilisez Partager ⎋ puis "Sur l\'écran d\'accueil".');
    } else if (result === 'dismissed') {
      setInstallStatus('Installation annulée. Vous pouvez relancer quand vous le souhaitez.');
    } else {
      if (inIframe) {
        setInstallStatus('⚠️ Pour installer l\'application sur votre téléphone, ouvrez le lien dans votre navigateur mobile.');
      } else {
        setInstallStatus('ℹ️ Ouvrez le menu de votre navigateur (3 points ⋮) et choisissez "Installer l\'application".');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
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
          <div className="relative flex-shrink-0">
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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-wide">
                Installation de l'Application
              </h2>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold">
                Application Complète
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Installation autonome dans la liste de vos applications smartphone, gérable dans les paramètres et rangeable dans vos dossiers d'applications.
            </p>
          </div>
        </div>

        {/* INSTALL STATUS NOTIFICATION */}
        {installStatus && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-yellow-500/50 text-yellow-300 text-xs font-semibold flex items-center justify-between">
            <span>{installStatus}</span>
            <button 
              onClick={() => setInstallStatus(null)}
              className="text-slate-400 hover:text-white text-[11px] underline ml-2 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* 1-CLICK ACTION */}
        <div className="bg-gradient-to-r from-yellow-950/40 via-slate-900 to-slate-900 border border-yellow-500/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-bold text-white">
                  {isInstalled 
                    ? "Application Installée" 
                    : "Installer sur votre appareil"}
                </h4>
              </div>
              <p className="text-xs text-slate-300">
                {isInstalled 
                  ? "L'application est installée et accessible depuis votre liste d'applications." 
                  : "Déclenchez l'installation pour l'ajouter à vos applications Android / iOS / PC."}
              </p>
            </div>

            <button
              id="btn-modal-install-pwa"
              onClick={handleTriggerInstall}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? "RÉINSTALLER L'APPLICATION" : "INSTALLER L'APPLICATION"}</span>
            </button>
          </div>
        </div>

        {/* EXPLANATION: VRAIE APPLICATION VS RACCOURCI */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider">
            <FolderPlus className="w-4 h-4" />
            <span>Présence dans la liste des applications & Dossiers</span>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            Pour qu'Android crée une <strong>vraie application</strong> (dans le tiroir d'applications et les paramètres système) plutôt qu'un simple raccourci d'URL :
          </p>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Dans Google Chrome :</strong> Appuyez sur le menu <span className="text-yellow-400 font-bold">⋮ (3 points)</span> et sélectionnez impérativement <strong className="text-yellow-400">"Installer l'application"</strong> (avec l'icône de téléchargement) et non pas "Ajouter un raccourci".
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Validation système (WebAPK) :</strong> Android génère automatiquement le paquet de l'application. Elle apparaît instantanément dans la <strong>liste complète de vos applications</strong> (tiroir d'apps) et dans <em>Paramètres &gt; Applications</em>.
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Rangement dans les dossiers :</strong> Vous pouvez glisser son icône dans n'importe quel dossier d'écran d'accueil exactement comme Facebook, WhatsApp ou vos jeux.
              </div>
            </div>
          </div>
        </div>

        {/* OS SELECTOR TABS */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Instructions par plateforme :
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => { playDinoSound(); setSelectedOs('android'); }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
          {selectedOs === 'android' && (
            <div className="space-y-2.5">
              <h3 className="font-bold text-white text-xs flex items-center gap-2 text-yellow-400">
                <Smartphone className="w-4 h-4" />
                Procédure Android (Chrome ou Samsung Internet)
              </h3>
              
              <ol className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>Cliquez sur le bouton jaune <strong className="text-white">"Installer l'Application"</strong> ci-dessus.</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>Si le bouton n'apparaît pas, ouvrez le menu Chrome <strong className="text-white">(3 points ⋮)</strong> et choisissez <strong className="text-yellow-400">"Installer l'application"</strong>.</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>Une fois l'installation terminée, l'application est présente dans le <strong>tiroir de toutes vos applications</strong>.</div>
                </li>
              </ol>
            </div>
          )}

          {selectedOs === 'ios' && (
            <div className="space-y-2.5">
              <h3 className="font-bold text-white text-xs flex items-center gap-2 text-yellow-400">
                <Share2 className="w-4 h-4" />
                Procédure iPhone & iPad (Safari)
              </h3>
              
              <ol className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>Ouvrez l'application dans <strong className="text-white">Safari</strong>.</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>Touchez l'icône <strong className="text-white">Partager ⎋</strong> en bas de l'écran.</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>Sélectionnez <strong className="text-white">"Sur l'écran d'accueil" ⊞</strong> puis validez avec <strong className="text-yellow-400">"Ajouter"</strong>.</div>
                </li>
              </ol>
            </div>
          )}

          {selectedOs === 'desktop' && (
            <div className="space-y-2.5">
              <h3 className="font-bold text-white text-xs flex items-center gap-2 text-yellow-400">
                <Laptop className="w-4 h-4" />
                Procédure PC / Mac
              </h3>
              
              <ol className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>Cliquez sur <strong className="text-white">"Installer l'Application"</strong> ou sur l'icône d'installation dans la barre d'adresse de votre navigateur.</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>L'application s'ouvrira dans sa propre fenêtre indépendante sur votre bureau.</div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            PWA & WebAPK
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
