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

export async function triggerPWAInstall(): Promise<'accepted' | 'dismissed' | 'standalone' | 'opened_top'> {
  // 1. If already installed and running standalone
  if (isAppStandalone()) {
    return 'standalone';
  }

  // 2. Ensure Service Worker is registered
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }
    } catch {
      // Ignored
    }
  }

  // 3. If inside an iframe (like AI Studio preview), browser security restricts native install prompt
  // Opening the direct top-level URL allows Chrome on Android / Desktop to immediately trigger the WebAPK dialog
  if (isInsideIframe()) {
    window.open(window.location.origin || window.location.href, '_blank', 'noopener,noreferrer');
    return 'opened_top';
  }

  // 4. Trigger native Chrome WebAPK install prompt if captured
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

  return 'accepted';
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

