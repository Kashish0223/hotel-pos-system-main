// lib/dashboard/navigation.js
import { hasPermission } from "@/lib/rbac";

export const NAVIGATION_CONFIG = [
  {
    group: "Main",
    items: [
      {
        id: "today",
        label: "Today",
        href: "/",
        icon: "LayoutDashboard",
        exact: true,
      },
      {
        id: "pos-register",
        label: "New Order",
        href: "/orders/new",
        icon: "PlusCircle",
        permission: ["add_orders", "manage_orders"],
      },
      {
        id: "orders",
        label: "Orders",
        href: "/orders",
        icon: "ClipboardList",
        permission: ["view_orders", "manage_orders", "edit_orders"],
      },
      {
        id: "tables",
        label: "Tables",
        href: "/admin/tables",
        icon: "Grid",
        permission: ["view_table", "manage_table", "add_table", "edit_table"],
      },
      {
        id: "kitchen",
        label: "Kitchen Display",
        href: "/kitchen-display",
        icon: "Flame",
        permission: "kitchen_display",
      },
    ],
  },
  {
    group: "Culinary & Stock",
    items: [
      {
        id: "menu",
        label: "Menu",
        href: "/menu",
        icon: "BookOpen",
        permission: ["view_menu", "manage_menu", "add_menu", "edit_menu"],
      },
      {
        id: "categories",
        label: "Categories",
        href: "/categories",
        icon: "Layers",
        permission: ["view_category", "manage_category", "add_category", "edit_category"],
      },
      {
        id: "inventory",
        label: "Inventory",
        href: "/inventory",
        icon: "Package",
        permission: ["view_inventory", "manage_inventory", "add_inventory", "edit_inventory"],
      },
    ],
  },
  {
    group: "Finance & Accounts",
    items: [
      {
        id: "bills",
        label: "Bills",
        href: "/bills",
        icon: "Receipt",
        permission: "view_bill",
      },
      {
        id: "settlements",
        label: "Settlements",
        href: "/settlements",
        icon: "Wallet",
        permission: ["view_settlements", "manage_settlements", "edit_settlements"],
      },
      {
        id: "expenses",
        label: "Expenses",
        href: "/expenses",
        icon: "TrendingDown",
        permission: ["view_expenses", "manage_expenses", "add_expenses", "edit_expenses"],
      },
    ],
  },
  {
    group: "Operations & Admin",
    items: [
      {
        id: "reports",
        label: "Reports",
        href: "/reports",
        icon: "BarChart3",
        permission: "view_reports",
      },
      {
        id: "analysis",
        label: "Analysis",
        href: "/analysis",
        icon: "LineChart",
        permission: ["view_analysis", "manage_analysis"],
      },
      {
        id: "customers",
        label: "Customers",
        href: "/customers",
        icon: "Users",
        permission: ["view_customer", "manage_customer", "add_customer"],
      },
      {
        id: "staff",
        label: "Staff",
        href: "/staff",
        icon: "UserCheck",
        permission: ["view_staff", "manage_staff", "add_staff", "edit_staff"],
      },
      {
        id: "feedback-qr",
        label: "Feedback QR",
        href: "/feedback-qr",
        icon: "QrCode",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: "Settings",
        permission: ["manage_settings", "edit_settings"],
      },
    ],
  },
];

export function getFilteredNavigation(user) {
  if (!user) return [];

  return NAVIGATION_CONFIG.map((group) => {
    const filteredItems = group.items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(user, item.permission);
    });
    return {
      ...group,
      items: filteredItems,
    };
  }).filter((group) => group.items.length > 0);
}
