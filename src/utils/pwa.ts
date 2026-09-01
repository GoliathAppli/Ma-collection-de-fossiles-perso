import { useState, useEffect } from 'react';

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

export async function triggerPWAInstall(): Promise<'activated' | 'standalone'> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      if (reg.update) {
        await reg.update();
      }
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }
    } catch (e) {
      console.warn('[PWA] Registration:', e);
    }
  }

  // If already standalone
  if (isAppStandalone()) {
    return 'standalone';
  }

  return 'activated';
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

