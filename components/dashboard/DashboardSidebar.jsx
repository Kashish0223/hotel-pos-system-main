"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./dashboard.module.css";
import { getFilteredNavigation } from "@/lib/dashboard/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Grid,
  Flame,
  BookOpen,
  Layers,
  Package,
  Receipt,
  Wallet,
  TrendingDown,
  BarChart3,
  LineChart,
  Users,
  UserCheck,
  QrCode,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Grid,
  Flame,
  BookOpen,
  Layers,
  Package,
  Receipt,
  Wallet,
  TrendingDown,
  BarChart3,
  LineChart,
  Users,
  UserCheck,
  QrCode,
  Settings,
};

export default function DashboardSidebar({
  user,
  settings,
  collapsed,
  onToggleCollapse,
}) {
  const pathname = usePathname();
  const navigationGroups = getFilteredNavigation(user);

  const restaurantName =
    settings?.general?.restaurantName ||
    settings?.general?.name ||
    "Hotel-POS";

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "HP";

  return (
    <aside
      className={`${styles.sidebarContainer} ${
        collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
      }`}
      aria-label="Sidebar navigation"
    >
      {/* Sidebar Header */}
      <div className={styles.sidebarHeader}>
        <Link href="/" className={styles.sidebarBrand}>
          <img
            src="/images/logo.png"
            alt={restaurantName}
            className={styles.brandLogo}
          />
          {!collapsed && (
            <span className={styles.brandName}>{restaurantName}</span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={styles.collapseButton}
          title={collapsed ? "Expand sidebar (252px)" : "Collapse sidebar (84px)"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className={styles.sidebarNav}>
        {navigationGroups.map((group) => (
          <div key={group.group} className={styles.navGroup}>
            {!collapsed && (
              <span className={styles.navGroupTitle}>{group.group}</span>
            )}
            {group.items.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`${styles.navItem} ${
                    isActive ? styles.navItemActive : ""
                  } ${collapsed ? styles.navItemCollapsed : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <IconComponent className={styles.navItemIcon} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className={styles.sidebarFooter}>
        {!collapsed && (
          <div className={styles.serviceStatusBadge}>
            <span className={styles.pulseDot}></span>
            <span>Live Service • Active</span>
          </div>
        )}
        <div className={styles.userCard}>
          <div className={styles.userAvatar} title={user?.name || "Staff"}>
            {userInitials}
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || "Staff Member"}</span>
              <span className={styles.userRole}>{user?.role || "Staff"}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
