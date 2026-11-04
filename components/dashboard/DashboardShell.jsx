"use client";

import React, { useState, useEffect } from "react";
import styles from "./dashboard.module.css";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import DashboardMobileNav from "./DashboardMobileNav";
import DashboardSearchDialog from "./DashboardSearchDialog";

export default function DashboardShell({
  children,
  user,
  settings,
  logout,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("light");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Restore preferences from localStorage on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollapsed = localStorage.getItem("hotel_pos_sidebar_collapsed");
      if (savedCollapsed !== null) {
        setCollapsed(savedCollapsed === "true");
      }
      const savedTheme = localStorage.getItem("hotel_pos_dash_theme");
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (e) {
      // localStorage may fail in restricted sandbox
    }
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hotel_pos_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("hotel_pos_dash_theme", next);
      } catch (e) {}
      return next;
    });
  };

  const restaurantName =
    settings?.general?.restaurantName ||
    settings?.general?.name ||
    "Hotel-POS";

  return (
    <div
      className={styles.dashboardRoot}
      data-theme={theme}
      id="dashboard-scoped-shell"
    >
      <div className={styles.dashboardLayout}>
        {/* Scoped Ambrel Navigation Sidebar */}
        <DashboardSidebar
          user={user}
          settings={settings}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Right Shell Area */}
        <div className={styles.mainContentWrapper}>
          <DashboardTopbar
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenSearch={() => setIsSearchOpen(true)}
            logout={logout}
            restaurantName={restaurantName}
            user={user}
          />

          {/* Page Body Container (Main content without redundant <main> landmark) */}
          <div className={styles.pageBodyContainer} role="region" aria-label="Dashboard content">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <DashboardMobileNav />

      {/* Spotlight Search Modal Overlay (⌘K) */}
      <DashboardSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        user={user}
      />
    </div>
  );
}
