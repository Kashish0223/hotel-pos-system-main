"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { hasPermission } from "@/lib/rbac";
import {
  Search,
  PlusCircle,
  Grid,
  Receipt,
  BookOpen,
  ClipboardList,
  Flame,
  Package,
  BarChart3,
  Users,
  Settings,
  ArrowRight,
} from "lucide-react";

const ALL_SEARCHABLE_ITEMS = [
  {
    id: "act-new-order",
    title: "Create New Order (POS)",
    group: "Quick Actions",
    href: "/orders/new",
    icon: PlusCircle,
    permission: ["add_orders", "manage_orders"],
    badge: "Action",
  },
  {
    id: "act-tables",
    title: "Table Floor Plan",
    group: "Quick Actions",
    href: "/admin/tables",
    icon: Grid,
    permission: ["view_table", "manage_table"],
    badge: "Action",
  },
  {
    id: "act-bills",
    title: "Settle / Print Bills",
    group: "Quick Actions",
    href: "/bills",
    icon: Receipt,
    permission: "view_bill",
    badge: "Action",
  },
  {
    id: "nav-orders",
    title: "Order Management",
    group: "Navigation",
    href: "/orders",
    icon: ClipboardList,
    permission: ["view_orders", "manage_orders"],
    badge: "Module",
  },
  {
    id: "nav-kitchen",
    title: "Kitchen Display (KDS)",
    group: "Navigation",
    href: "/kitchen-display",
    icon: Flame,
    permission: "kitchen_display",
    badge: "Culinary",
  },
  {
    id: "nav-menu",
    title: "Menu Catalog & Recipes",
    group: "Navigation",
    href: "/menu",
    icon: BookOpen,
    permission: ["view_menu", "manage_menu"],
    badge: "Culinary",
  },
  {
    id: "nav-inventory",
    title: "Inventory & Stock Levels",
    group: "Navigation",
    href: "/inventory",
    icon: Package,
    permission: ["view_inventory", "manage_inventory"],
    badge: "Operations",
  },
  {
    id: "nav-reports",
    title: "Sales & Performance Reports",
    group: "Navigation",
    href: "/reports",
    icon: BarChart3,
    permission: "view_reports",
    badge: "Analytics",
  },
  {
    id: "nav-staff",
    title: "Staff & User Roles",
    group: "Navigation",
    href: "/staff",
    icon: Users,
    permission: ["view_staff", "manage_staff"],
    badge: "Admin",
  },
  {
    id: "nav-settings",
    title: "System & Restaurant Settings",
    group: "Navigation",
    href: "/settings",
    icon: Settings,
    permission: ["manage_settings", "edit_settings"],
    badge: "System",
  },
];

export default function DashboardSearchDialog({ isOpen, onClose, user }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Filter items by user role permissions
  const authorizedItems = ALL_SEARCHABLE_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(user, item.permission);
  });

  // Filter by search query
  const filteredItems = authorizedItems.filter((item) => {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(lowerQuery) ||
      item.group.toLowerCase().includes(lowerQuery)
    );
  });

  // Focus trap & restore focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
      setQuery("");
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus?.();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        onClose();
        router.push(selected.href);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.searchOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight Search"
    >
      <div className={styles.searchDialog}>
        {/* Search Header Input */}
        <div className={styles.searchInputHeader}>
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchDialogInput}
            placeholder="Type a command or search modules..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button
            type="button"
            className={styles.searchCloseBtn}
            onClick={onClose}
            aria-label="Close search"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className={styles.searchResultsList}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyStateContainer} style={{ padding: "30px 10px" }}>
              <p className="font-semibold text-gray-800">No results found</p>
              <p className="text-xs text-gray-500">
                No matching navigation items or authorized actions found.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const IconComponent = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  className={`${styles.searchItem} ${
                    isSelected ? styles.searchItemActive : ""
                  }`}
                  onClick={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.searchItemLeft}>
                    <IconComponent size={16} />
                    <span>{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={styles.searchItemBadge}>{item.badge}</span>
                    <ArrowRight size={13} className="text-gray-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Hints Footer */}
        <div className={styles.searchDialogFooter}>
          <div className={styles.keyboardShortcutHints}>
            <span>
              <span className={styles.kbdTag}>↑</span>
              <span className={styles.kbdTag}>↓</span> Navigate
            </span>
            <span>
              <span className={styles.kbdTag}>↵</span> Select
            </span>
            <span>
              <span className={styles.kbdTag}>esc</span> Close
            </span>
          </div>
          <span>Hotel-POS Spotlight</span>
        </div>
      </div>
    </div>
  );
}
