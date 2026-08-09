"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // One-time cleanup: unregisters any previously-installed service worker
    // (from the now-removed PWA setup) and clears its caches, for anyone
    // who already has the broken one stuck on their device. Safe to leave
    // in permanently — it's a no-op once there's nothing left to clean up.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}