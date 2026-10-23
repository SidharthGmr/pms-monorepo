'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker. Renders nothing.
 *
 * Production only: `next dev` serves unhashed, constantly changing assets, and a worker
 * registered against localhost outlives the dev session and shadows later work. In development
 * this actively unregisters anything already installed instead.
 */

const KILL_SWITCH = 'nosw';
const REFRESHED_KEY = 'pms-offline-refreshed';

/** The refresh costs a fetch of the offline page, so once per browser session is enough. */
function shouldRefresh() {
  try {
    if (sessionStorage.getItem(REFRESHED_KEY)) return false;
    sessionStorage.setItem(REFRESHED_KEY, '1');
  } catch {
    // Private mode or blocked storage: refresh anyway rather than never.
  }
  return true;
}

async function unregisterAll() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Hand someone https://<host>/?nosw=1 to clean a bad worker off their device without a deploy.
    const killed = new URLSearchParams(window.location.search).has(KILL_SWITCH);

    if (killed || process.env.NODE_ENV !== 'production') {
      void unregisterAll();
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // sw.js never changes between deploys, so its install hook does not re-run and the
        // cached page would go stale forever. Asking once a session is what keeps it current.
        if (!shouldRefresh()) return;
        const ready = await navigator.serviceWorker.ready;
        ready.active?.postMessage({ type: 'REFRESH_OFFLINE' });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    // After load, so installing the worker never competes with first paint on a slow connection.
    if (document.readyState === 'complete') {
      void register();
      return;
    }

    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
