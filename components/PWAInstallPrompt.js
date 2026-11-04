"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    setIsMounting(false);
    console.log("PWAInstallPrompt mounted. Waiting for beforeinstallprompt event...");

    const handleBeforeInstallPrompt = (e) => {
      console.log("SUCCESS: beforeinstallprompt event fired!");
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleAppInstalled = () => {
      console.log("PWA already installed!");
      setShowInstallBtn(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  if (!showInstallBtn) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-all border border-gray-700 font-medium"
      >
        <Download className="w-4 h-4" />
        Install App
      </button>
    </div>
  );
}
