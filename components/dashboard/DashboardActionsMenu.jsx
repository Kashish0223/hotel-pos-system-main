"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { hasPermission } from "@/lib/rbac";
import {
  Plus,
  PlusCircle,
  Grid,
  Utensils,
  Receipt,
  PackagePlus,
  ChevronDown,
} from "lucide-react";

export default function DashboardActionsMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const actions = [
    {
      id: "action-order",
      label: "New POS Order",
      description: "Take table / takeaway order",
      href: "/orders/new",
      icon: PlusCircle,
      permission: ["add_orders", "manage_orders"],
    },
    {
      id: "action-table",
      label: "Floor Plan / Tables",
      description: "Manage tables & QR codes",
      href: "/admin/tables",
      icon: Grid,
      permission: ["view_table", "manage_table"],
    },
    {
      id: "action-dish",
      label: "Add Menu Dish",
      description: "Create new menu item",
      href: "/menu",
      icon: Utensils,
      permission: ["add_menu", "manage_menu"],
    },
    {
      id: "action-bill",
      label: "Settle Bill",
      description: "Generate & print invoice",
      href: "/bills",
      icon: Receipt,
      permission: "view_bill",
    },
    {
      id: "action-stock",
      label: "Receive Inventory",
      description: "Restock raw materials",
      href: "/inventory",
      icon: PackagePlus,
      permission: ["add_inventory", "manage_inventory"],
    },
  ];

  const authorizedActions = actions.filter((act) => {
    if (!act.permission) return true;
    return hasPermission(user, act.permission);
  });

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.actionsMenuWrapper} ref={containerRef}>
      {/* Trigger Button (+ New) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.newActionButton}
        title="Open Quick Actions Menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Plus size={16} />
        <span>New</span>
        <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className={styles.actionsDropdown} role="menu">
          {authorizedActions.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={styles.actionsMenuItem}
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <IconComponent className={styles.actionsMenuIcon} />
                <div className="flex flex-col">
                  <span className="font-semibold leading-tight">{item.label}</span>
                  <span className="text-[11px] text-gray-400 font-normal">{item.description}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
