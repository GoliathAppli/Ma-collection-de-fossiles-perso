import { useState, useEffect } from 'react';

// Define BeforeInstallPromptEvent interface
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const doRegister = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
          // Check for updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version ready in cache.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      doRegister();
    } else {
      window.addEventListener('DOMContentLoaded', doRegister);
      window.addEventListener('load', doRegister);
    }
  }
}

// Global capture for beforeinstallprompt
if (typeof window !== 'undefined') {
  // Capture any existing prompt from index.html
  if ((window as any).deferredPrompt) {
    deferredPrompt = (window as any).deferredPrompt;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    (window as any).deferredPrompt = deferredPrompt;
    listeners.forEach((fn) => fn());
    console.log('[PWA] beforeinstallprompt captured, app is installable');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    (window as any).deferredPrompt = null;
    listeners.forEach((fn) => fn());
    console.log('[PWA] App successfully installed in standalone mode!');
  });
}

export function isAppStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  );
}

export async function triggerPWAInstall(): Promise<'accepted' | 'dismissed' | 'manual_ios' | 'unsupported'> {
  const promptEvent: BeforeInstallPromptEvent | null =
    deferredPrompt ||
    (typeof window !== 'undefined' && (window as any).deferredPrompt ? (window as any).deferredPrompt : null);

  if (promptEvent) {
    try {
      console.log('[PWA] Executing deferredPrompt.prompt()...');
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      console.log('[PWA] User choice outcome:', choice.outcome);
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        if (typeof window !== 'undefined') {
          (window as any).deferredPrompt = null;
        }
        listeners.forEach((fn) => fn());
        return 'accepted';
      } else {
        return 'dismissed';
      }
    } catch (e) {
      console.error('[PWA] Error triggering install prompt:', e);
    }
  }

  if (isInsideIframe() && !promptEvent) {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
    return 'unsupported';
  }

  if (isIOSDevice()) {
    alert("📱 Installation sur iOS / Safari :\nAppuyez sur le bouton de Partage (carré avec une flèche vers le haut ⎋) puis sélectionnez 'Sur l'écran d'accueil'.");
    return 'manual_ios';
  }

  // Fallback Chrome Android advice
  alert("ℹ️ Pour installer l'application en mode autonome :\n\nDans Google Chrome, appuyez sur le menu (les 3 points ⋮ en haut à droite) puis sélectionnez 'Installer l'application'.");
  return 'unsupported';
}

export function isInsideIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export function openInExternalBrowser() {
  if (typeof window !== 'undefined') {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  }
}

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState<boolean>(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(isAppStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(isIOSDevice());
  const [inIframe, setInIframe] = useState<boolean>(isInsideIframe());

  useEffect(() => {
    const update = () => {
      setIsInstallable(!!deferredPrompt);
      setIsInstalled(isAppStandalone());
      setIsIOS(isIOSDevice());
      setInIframe(isInsideIframe());
    };

    update();
    listeners.add(update);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => update();
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      listeners.delete(update);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = async () => {
    return await triggerPWAInstall();
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    inIframe,
    install,
    openInExternalBrowser
  };
}
