"use client";

import { useEffect, useState } from "react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Manna Books ServiceWorker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("ServiceWorker registration failed:", err);
        });
    }

    // 2. Check if user previously dismissed or installed
    if (typeof window !== "undefined") {
      const isDismissed = localStorage.getItem("manna_pwa_dismissed") === "true";
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone || isDismissed) {
        setInstalled(true);
        return;
      }

      // Check for iOS Safari
      const ua = window.navigator.userAgent;
      const isIPhone = /iPhone|iPad|iPod/.test(ua);
      if (isIPhone) {
        setIsIOS(true);
      }
    }

    // 3. Listen for beforeinstallprompt event (Android, Chrome, Edge, Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const isDismissed = typeof window !== "undefined" && localStorage.getItem("manna_pwa_dismissed") === "true";
      if (!isDismissed) {
        setDeferredPrompt(e);
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  function handleDismiss() {
    setShowBanner(false);
    setIsIOS(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("manna_pwa_dismissed", "true");
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      handleDismiss();
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }

  if (installed) return null;

  return (
    <>
      {/* NATIVE PWA INSTALL PROMPT BANNER FOR CHROME / EDGE / ANDROID */}
      {showBanner && deferredPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-black text-white p-4 border border-white shadow-2xl font-mono text-xs animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-sm">📲 Install Manna Appliance</span>
              </div>
              <p className="font-sans text-[11px] text-zinc-300">
                Install Manna Books as a standalone desktop &amp; mobile PWA for instant access.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-white text-base font-bold"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-black py-1.5 px-3 font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors text-center"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="border border-zinc-700 text-zinc-300 py-1.5 px-3 uppercase text-[10px] hover:border-white hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* IOS SAFARI PWA INSTALLATION HELPER BANNER */}
      {isIOS && !installed && (
        <div className="hidden lg:hidden fixed bottom-2 left-2 right-2 z-40 bg-zinc-900 text-white p-3 border border-zinc-700 font-mono text-[10px] space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase text-amber-400">💡 Install on iPhone / iPad</span>
            <button onClick={handleDismiss} className="text-zinc-400">✕</button>
          </div>
          <p className="font-sans text-zinc-300 text-[11px]">
            Tap <strong className="text-white">Share</strong> button in Safari, then select <strong className="text-white">Add to Home Screen</strong>.
          </p>
        </div>
      )}
    </>
  );
}
