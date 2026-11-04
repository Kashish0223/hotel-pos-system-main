"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./dashboard.module.css";
import { LayoutDashboard, PlusCircle, Receipt, BookOpen, Grid } from "lucide-react";

export default function DashboardMobileNav() {
  const pathname = usePathname();

  const mobileTabs = [
    { label: "Today", href: "/", icon: LayoutDashboard, exact: true },
    { label: "Register", href: "/orders/new", icon: PlusCircle },
    { label: "Bills", href: "/bills", icon: Receipt },
    { label: "Menu", href: "/menu", icon: BookOpen },
    { label: "Tables", href: "/admin/tables", icon: Grid },
  ];

  return (
    <nav className={styles.mobileNavContainer} aria-label="Mobile navigation">
      {mobileTabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname?.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.mobileNavItem} ${
              isActive ? styles.mobileNavItemActive : ""
            }`}
          >
            <IconComponent size={20} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
