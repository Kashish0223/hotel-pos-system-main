"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { subscribeToPush } from "@/lib/webhook";

export default function PushNotificationManager() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;

    const trySubscribe = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }

      try {
        // Register service worker if not already done
        // next-pwa by default registers /sw.js
        let registration = await navigator.serviceWorker.getRegistration('/sw.js') || 
                          await navigator.serviceWorker.getRegistration('/service-worker.js');
        
        if (!registration) {
          // Fallback if not registered by next-pwa automatically
          registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered manually:', registration);
        }

        // Wait for it to be ready
        await navigator.serviceWorker.ready;

        const permissions = user?.permissions || [];
        const role = (user?.role || "").toLowerCase();

        // Check both permissions and specific roles
        const hasPermission = 
          permissions.includes('*') || 
          ["superadmin", "manager", "chef", "waiter", "cashier", "bartender"].includes(role) ||
          permissions.some(p => ["manage_orders", "kitchen_display", "view_orders"].includes(p));

        if (!hasPermission) return;

        if (Notification.permission === 'denied') return;

        // Only auto-subscribe if already granted or default
        await subscribeToPush();
      } catch (error) {
        console.error("Push registration/subscription error:", error);
      }
    };

    trySubscribe();
  }, [user, loading]);

  return null;
}
