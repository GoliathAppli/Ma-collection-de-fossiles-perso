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
        const reg = await navigator.serviceWorker.register('./sw.js');
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

export async function triggerPWAInstall(): Promise<'accepted' | 'dismissed' | 'unsupported' | 'opened_top'> {
  // 1. If inside an iframe (like AI Studio preview), browser security restricts native install prompt
  // Open top-level URL directly so Chrome can display the native WebAPK install prompt
  if (isInsideIframe()) {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
    return 'opened_top';
  }

  // 2. Ensure Service Worker is registered & request Persistent Storage permission
  if (typeof window !== 'undefined') {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js');
      } catch (e) {
        console.warn('[PWA] SW register warning:', e);
      }
    }
    
    // Explicitly request persistent storage permissions
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
      return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch (e) {
      console.warn('[PWA] Error launching prompt:', e);
    }
  }

  // If prompt is not yet ready or unsupported on this platform/browser
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
  const [isInstalled, setIsInstalled] = useState<boolean>(isAppStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(isIOSDevice());
  const [inIframe, setInIframe] = useState<boolean>(isInsideIframe());
  const [canInstall, setCanInstall] = useState<boolean>(!!deferredPrompt || !!(typeof window !== 'undefined' && (window as any).deferredPrompt));

  useEffect(() => {
    const update = () => {
      setIsInstalled(isAppStandalone());
      setIsIOS(isIOSDevice());
      setInIframe(isInsideIframe());
      setCanInstall(!!deferredPrompt || !!(window as any).deferredPrompt);
    };

    update();

    const handlePromptReady = () => {
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handlePromptReady);
    window.addEventListener('pwa-ready-to-install', handlePromptReady);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => update();
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePromptReady);
      window.removeEventListener('pwa-ready-to-install', handlePromptReady);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = async () => {
    return await triggerPWAInstall();
  };

  return {
    isInstallable: canInstall || !isInstalled,
    canInstall,
    isInstalled,
    isIOS,
    inIframe,
    install,
    openInExternalBrowser
  };
}

