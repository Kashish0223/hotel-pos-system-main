"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import DashboardActionsMenu from "./DashboardActionsMenu";
import { Search, Sun, Moon, LogOut } from "lucide-react";

export default function DashboardTopbar({
  theme,
  onToggleTheme,
  onOpenSearch,
  logout,
  restaurantName,
  user,
}) {
  const router = useRouter();
  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (e) {
      console.error("Logout error:", e);
    }
    router.push("/login");
  };

  return (
    <header className={styles.topbarContainer} role="banner">
      {/* Breadcrumb Area */}
      <div className={styles.breadcrumbArea}>
        <span>{restaurantName || "Hotel-POS"}</span>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>Today</span>
        <span className="hidden md:inline-block text-xs opacity-60 ml-2">
          ({currentDate})
        </span>
      </div>

      {/* Topbar Actions */}
      <div className={styles.topbarActions}>
        {/* Search Pill */}
        <div
          className={styles.searchPill}
          onClick={onOpenSearch}
          role="button"
          tabIndex={0}
          title="Search items, tables, orders (⌘K)"
        >
          <div className="flex items-center gap-2">
            <Search size={16} />
            <span>Search menu, orders, tables...</span>
          </div>
          <span className={styles.searchKeyBadge}>⌘K</span>
        </div>

        {/* Theme Switcher Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={styles.iconButton}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* + New Actions Popover Menu */}
        <DashboardActionsMenu user={user} />

        {/* Logout Button */}
        {logout && (
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutButton}
            title="Sign out of current terminal"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
