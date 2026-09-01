import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Share2, 
  Laptop, 
  X, 
  Sparkles, 
  Check, 
  QrCode,
  ExternalLink,
  FolderPlus,
  Copy,
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import QRCode from 'qrcode';
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  // Generate QR Code with the direct app URL
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const url = window.location.origin;
      QRCode.toDataURL(url, {
        width: 256,
        margin: 1.5,
        color: {
          dark: '#020617',
          light: '#fde047'
        }
      })
        .then(setQrCodeDataUrl)
        .catch((err) => console.warn('QR Code generation failed:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    playDinoSound();
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('✅ L\'application a été installée avec succès dans votre tiroir d\'applications !');
    } else if (result === 'manual_ios') {
      setSelectedOs('ios');
      setInstallStatus('ℹ️ Sur iOS Safari, utilisez le bouton Partager ⎋ puis "Sur l\'écran d\'accueil".');
    } else if (result === 'dismissed') {
      setInstallStatus('Installation annulée. Vous pouvez relancer quand vous le souhaitez.');
    } else {
      if (inIframe) {
        setInstallStatus('⚠️ Le navigateur bloque l\'installation directe depuis l\'aperçu intégré. Flashez le QR code ou ouvrez le lien dans un nouvel onglet.');
      } else {
        setInstallStatus('ℹ️ Suivez les instructions ci-dessous selon votre modèle de téléphone.');
      }
    }
  };

  const handleCopyUrl = async () => {
    playDinoSound();
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
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
                Installation Mobile (WebAPK & PWA)
              </h2>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold">
                Véritable App
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              S'installe comme Facebook ou WhatsApp : intégrée au tiroir d'applications, reconnue par Android/iOS, et rangeable dans vos dossiers d'écran d'accueil.
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

        {/* NATIVE 1-CLICK OR IFRAME HANDLING */}
        <div className="bg-gradient-to-r from-yellow-950/40 via-slate-900 to-slate-900 border border-yellow-500/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-bold text-white">
                  {isInstalled 
                    ? "Application Actuellement Installée" 
                    : isInstallable 
                      ? "Installation Immédiate en 1 Clic" 
                      : "Installation Native sur Téléphone"}
                </h4>
              </div>
              <p className="text-xs text-slate-300">
                {isInstalled 
                  ? "L'application fonctionne en mode autonome hors-ligne." 
                  : isInstallable 
                    ? "Votre navigateur est prêt : cliquez ci-contre pour générer le paquet d'application." 
                    : "Pour une installation complète dans le tiroir d'applications, ouvrez l'application directement dans votre navigateur mobile."}
              </p>
            </div>

            {isInstallable ? (
              <button
                onClick={handleTriggerInstall}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Installer Directement</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  playDinoSound();
                  openInExternalBrowser();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir dans le Navigateur</span>
              </button>
            )}
          </div>
        </div>

        {/* QR CODE & DIRECT LINK FOR SMARTPHONES */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Flasher avec l'appareil photo de votre smartphone</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {qrCodeDataUrl && (
              <div className="p-2 bg-yellow-400 rounded-2xl shadow-xl flex-shrink-0">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code Installation" 
                  className="w-32 h-32 rounded-xl object-contain"
                />
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-300 w-full">
              <p>
                Pointez l'appareil photo de votre téléphone sur ce QR code pour ouvrir l'application directement dans <strong>Chrome (Android)</strong> ou <strong>Safari (iPhone)</strong>.
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 px-3 py-2 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}
                  <span>{copied ? "Lien copié !" : "Copier le lien direct"}</span>
                </button>

                <button
                  onClick={() => {
                    playDinoSound();
                    openInExternalBrowser();
                  }}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 px-3 py-2 rounded-xl text-xs text-slate-200 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Nouvel onglet</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* WHY IT IS A TRUE APP & FOLDER STORAGE */}
        <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            <FolderPlus className="w-4 h-4 text-yellow-400" />
            <span>Rangement dans les dossiers d'applications :</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Sur Android, lors de l'installation depuis Chrome, le service <strong>WebAPK</strong> de Google compile l'application et l'ajoute directement dans la <strong>liste complète de vos applications</strong> (tiroir d'apps). Vous pouvez alors :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
            <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Maintenir l'icône et la glisser dans un dossier</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Retrouver l'application dans Paramètres &gt; Apps</span>
            </div>
          </div>
        </div>

        {/* OS SELECTOR TABS */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Instructions manuelles selon le modèle :
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
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          {selectedOs === 'android' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Smartphone className="w-4 h-4" />
                Installation sur Android (Google Chrome & Samsung Internet)
              </h3>
              
              <ol className="space-y-2.5 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>Ouvrez l'application dans <strong className="text-white">Google Chrome</strong> (directement ou via le QR Code ci-dessus).</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>Une invite <strong className="text-yellow-400">"Ajouter à l'écran d'accueil / Installer l'application"</strong> apparaît automatiquement en bas de l'écran, ou appuyez sur les <strong className="text-white">3 points ⋮</strong> en haut à droite.</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>Touchez <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"Installer l'application"</span>. Android génère le paquet natif et l'insère dans votre tiroir d'applications.</div>
                </li>
              </ol>
            </div>
          )}

          {selectedOs === 'ios' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Share2 className="w-4 h-4" />
                Apple iPhone & iPad (Safari)
              </h3>
              
              <ol className="space-y-2.5 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>Ouvrez le lien dans le navigateur <strong className="text-white">Safari</strong> d'Apple (via le QR Code).</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>Touchez le bouton de <strong className="text-white">Partage</strong> (icône <span className="text-yellow-400 font-mono">⎋</span> en bas).</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">3</span>
                  <div>Faites défiler et choisissez <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">"Sur l'écran d'accueil" ⊞</span> puis <strong className="text-white">"Ajouter"</strong>.</div>
                </li>
              </ol>
            </div>
          )}

          {selectedOs === 'desktop' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-yellow-400">
                <Laptop className="w-4 h-4" />
                Ordinateur (Chrome, Edge, Brave)
              </h3>
              
              <ol className="space-y-2.5 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">1</span>
                  <div>Cliquez sur l'icône d'installation dans la barre d'adresse du navigateur en haut à droite.</div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">2</span>
                  <div>Confirmez pour lancer l'application en fenêtre indépendante sur votre bureau.</div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Compatible hors-ligne & WebAPK
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
