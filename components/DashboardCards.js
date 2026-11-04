"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./dashboard/dashboard.module.css";
import {
  Receipt,
  UtensilsCrossed,
  Boxes,
  Users,
  BarChart3,
  Settings,
  UserCheck,
  TrendingUp,
  LayoutGrid,
  ChefHat,
  CreditCard,
  Layers,
  MessageSquareQuote,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardCards({ user }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const allCards = [
    {
      id: "order-management",
      title: "Order Management",
      description: "Create, track, and manage active restaurant tickets",
      icon: Receipt,
      href: "/orders",
      permission: ["edit_orders", "view_orders", "add_orders", "manage_orders"],
      category: "Operations",
      theme: "Sage",
    },
    {
      id: "menu",
      title: "Menu Management",
      description: "Manage dishes, portions, pricing & recipes",
      icon: UtensilsCrossed,
      href: "/menu",
      permission: ["edit_menu", "view_menu", "add_menu", "delete_menu", "manage_menu"],
      category: "Culinary",
      theme: "Clay",
    },
    {
      id: "inventory",
      title: "Inventory & Stock",
      description: "Track raw supplies, batch alerts, & purchase orders",
      icon: Boxes,
      href: "/inventory",
      permission: ["edit_inventory", "view_inventory", "add_inventory", "delete_inventory", "manage_inventory"],
      category: "Operations",
      theme: "Sage",
    },
    {
      id: "tables",
      title: "Floor & Table Map",
      description: "Table occupancy, dining sections & QR codes",
      icon: LayoutGrid,
      href: "/admin/tables",
      permission: ["edit_table", "view_table", "add_table", "delete_table", "manage_table"],
      category: "Culinary",
      theme: "Clay",
    },
    {
      id: "kitchen_display",
      title: "Kitchen Display (KDS)",
      description: "Live culinary workstation ticket queue",
      icon: ChefHat,
      href: "/kitchen-display",
      permission: "kitchen_display",
      category: "Culinary",
      theme: "Clay",
    },
    {
      id: "bills",
      title: "Bills & Settlements",
      description: "Generate, split, discount, & collect invoices",
      icon: CreditCard,
      href: "/bills",
      permission: "view_bill",
      category: "Finance",
      theme: "Sky",
    },
    {
      id: "staff",
      title: "Staff & Permissions",
      description: "Manage shifts, team roles, & terminal pins",
      icon: Users,
      href: "/staff",
      permission: ["edit_staff", "view_staff", "add_staff", "delete_staff", "manage_staff"],
      category: "Management",
      theme: "Sand",
    },
    {
      id: "reports",
      title: "Financial Reports",
      description: "Daily summaries, tax registers & payment audits",
      icon: BarChart3,
      href: "/reports",
      permission: "view_reports",
      category: "Analytics",
      theme: "Sand",
    },
    {
      id: "analysis",
      title: "Business Analytics",
      description: "Revenue trends, peak hours, & menu item performance",
      icon: TrendingUp,
      href: "/analysis",
      permission: ["view_analysis", "manage_analysis"],
      category: "Analytics",
      theme: "Sand",
    },
    {
      id: "categories",
      title: "Categories & Courses",
      description: "Organize food departments & kitchen prep groups",
      icon: Layers,
      href: "/categories",
      permission: ["edit_category", "view_category", "add_category", "delete_category", "manage_category"],
      category: "Culinary",
      theme: "Clay",
    },
    {
      id: "customers",
      title: "Guest Relations",
      description: "Customer database, order history & loyalty profiles",
      icon: UserCheck,
      href: "/customers",
      permission: ["manage_customer", "view_customer", "add_customer", "delete_customer", "edit_customer"],
      category: "Hospitality",
      theme: "Sage",
    },
    {
      id: "feedback",
      title: "Feedback & Reviews",
      description: "Guest QR surveys, ratings, & dining feedback",
      icon: MessageSquareQuote,
      href: "/feedback-qr",
      permission: "manage_feedback",
      category: "Hospitality",
      theme: "Sage",
    },
    {
      id: "settings",
      title: "System Settings",
      description: "Restaurant profile, taxes, printers, & POS options",
      icon: Settings,
      href: "/settings",
      permission: ["manage_settings", "edit_settings"],
      category: "System",
      theme: "Clay",
    },
  ];

  // RBAC Filter
  const filteredCards = allCards.filter((card) => {
    if (!user) return false;
    if (user.role === "superadmin" || user.isSuperAdmin) return true;
    if (user.permissions?.includes("*")) return true;

    if (Array.isArray(card.permission)) {
      return card.permission.some((p) => user.permissions?.includes(p));
    }
    if (typeof card.permission === "string") {
      return user.permissions?.includes(card.permission);
    }
    return true;
  });

  return (
    <div className={styles.moduleGrid} role="region" aria-label="Quick Access POS Modules">
      {filteredCards.map((card, idx) => {
        const IconComponent = card.icon;
        const iconThemeClass = styles[`moduleTheme${card.theme}`] || styles.moduleThemeClay;
        const badgeThemeClass = styles[`moduleBadge${card.theme}`] || styles.moduleBadgeClay;

        return (
          <Link
            key={card.id}
            href={card.href}
            className={styles.moduleCard}
            style={{ animationDelay: `${idx * 40}ms` }}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            title={`Open ${card.title}`}
          >
            <div className={styles.moduleCardTop}>
              <div className={`${styles.moduleIconBox} ${iconThemeClass}`}>
                <IconComponent size={20} />
              </div>
              <div className={styles.moduleMeta}>
                <span className={`${styles.moduleBadge} ${badgeThemeClass}`}>
                  {card.category}
                </span>
                <ArrowUpRight size={16} className={styles.moduleArrow} />
              </div>
            </div>

            <div>
              <h3 className={styles.moduleTitle}>{card.title}</h3>
              <p className={styles.moduleDesc}>{card.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
