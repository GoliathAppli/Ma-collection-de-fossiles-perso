import { useState, useEffect } from 'react';

// Capture interface for native Chrome beforeinstallprompt
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  if ((window as any).deferredPrompt) {
    deferredPrompt = (window as any).deferredPrompt;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    (window as any).deferredPrompt = deferredPrompt;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (typeof window !== 'undefined') {
      (window as any).deferredPrompt = null;
    }
  });
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const doRegister = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[PWA] Service Worker registered with scope:', reg.scope);
        
        if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then((persistent) => {
            console.log('[PWA] Storage persistence granted:', persistent);
          });
        }
      } catch (err) {
        console.warn('[PWA] Service Worker registration warning:', err);
      }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      doRegister();
    } else {
      window.addEventListener('DOMContentLoaded', doRegister);
      window.addEventListener('load', doRegister);
    }
  }
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

export async function triggerPWAInstall(): Promise<'accepted' | 'downloaded' | 'standalone'> {
  // 1. Trigger direct file download in Chrome
  try {
    const link = document.createElement('a');
    link.href = '/api/download-app';
    link.download = 'Conservatoire_de_Fossiles.html';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);
  } catch (downloadErr) {
    console.warn('[PWA] Direct link download failed, trying fetch fallback:', downloadErr);
    try {
      const resp = await fetch('/api/download-app');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'Conservatoire_de_Fossiles.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 1000);
    } catch (fetchErr) {
      console.warn('[PWA] Fetch download fallback warning:', fetchErr);
    }
  }

  // 2. Ensure Service Worker is registered & request Persistent Storage permission
  if (typeof window !== 'undefined') {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // Ignored
      }
    }
    
    // Explicitly request persistent storage permissions (Autorisation d'écriture/stockage permanent Chrome)
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        console.log('[PWA] Storage permission persistent:', isPersisted);
      } catch (err) {
        console.warn('[PWA] Storage persist error:', err);
      }
    }
  }

  // 3. Trigger native Chrome WebAPK install prompt if captured
  const promptEvent: BeforeInstallPromptEvent | null =
    deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPrompt : null);

  if (promptEvent) {
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      deferredPrompt = null;
      if (typeof window !== 'undefined') {
        (window as any).deferredPrompt = null;
      }
      return choice.outcome === 'accepted' ? 'accepted' : 'downloaded';
    } catch (e) {
      console.warn('[PWA] Error launching prompt:', e);
    }
  }

  return 'downloaded';
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
  const [isInstalled, setIsInstalled] = useState<boolean>(isAppStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(isIOSDevice());
  const [inIframe, setInIframe] = useState<boolean>(isInsideIframe());

  useEffect(() => {
    const update = () => {
      setIsInstalled(isAppStandalone());
      setIsIOS(isIOSDevice());
      setInIframe(isInsideIframe());
    };

    update();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => update();
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = async () => {
    return await triggerPWAInstall();
  };

  return {
    isInstallable: true,
    isInstalled,
    isIOS,
    inIframe,
    install,
    openInExternalBrowser
  };
}

