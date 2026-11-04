// lib/rbac.js
export const PERMISSION_LEVELS = {
  SUPER_ADMIN: "superadmin",
  MANAGER: "Manager",
  CASHIER: "Cashier",
  CLEANER: "Cleaner",
  SECURITY: "Security",
  CHEF: "Chef",
  WAITER: "Waiter",
  BARTENDER: "Bartender",
  RECEPTIONIST: "Receptionist",
}

export const ROLE_PERMISSIONS = {
  superadmin: ["*"],
  customer: ["view_accounts"],

  Manager: [
    "view_orders", "add_orders", "edit_orders", "manage_orders",
    "add_menu", "view_menu", "edit_menu", "delete_menu", "manage_menu",
    "add_inventory", "view_inventory", "edit_inventory", "delete_inventory", "manage_inventory",
    "view_reports", "view_analysis",
    "add_staff", "edit_staff", "delete_staff", "view_staff", "manage_staff",
    "kitchen_display", "view_bill",
    "add_expenses", "view_expenses", "edit_expenses", "delete_expenses","manage_expenses",
    "edit_settings","manage_settings",
    "view_category", "add_category", "edit_category", "delete_category", "manage_category",
    "add_taxes", "view_taxes", "edit_taxes", "delete_taxes","manage_taxes",
    "add_table", "view_table", "edit_table", "delete_table",
    "add_customer", "view_customer", "edit_customer", "delete_customer", "manage_customer",
    "manage_settlements","view_settlements","edit_settlements",
  ],

  Cashier: ["view_orders", "view_reports", "view_bill"],
  Chef: ["view_orders", "view_menu", "kitchen_display"],
  Waiter: ["view_orders", "add_orders", "edit_orders", "view_menu", "process_payments"],
  Bartender: ["view_orders", "view_menu", "add_orders"],
  Receptionist: ["manage_customer", "view_orders", "view_reports", "add_table"],
  // Cleaner: ["view_cleaning_tasks", "update_cleaning_status"],
  // Security: ["view_security_logs", "manage_entry"],
}

// Critical Fix: Support both string and array
// In your auth context — make sure it handles arrays properly
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false

  if (user.permissions.includes("*")) return true  // <-- superadmin

  if (Array.isArray(permission)) {
    return permission.some(p => user.permissions.includes(p))
  }

  return user.permissions.includes(permission)
}

export const canManagePermissions = (user) => {
  if (!user) return false
  return user.role === "superadmin" || user.isSuperAdmin
}

//     // export const PERMISSION_LEVELS = {
//     //   SUPER_ADMIN: "superadmin",
//     //   ADMIN: "Admin",
//     //   MANAGER: "Manager",
//     // }
// export const PERMISSION_LEVELS = {
//   SUPER_ADMIN: "superadmin",
//   MANAGER: "Manager",
//   CASHIER: "Cashier",
//   CLEANER: "Cleaner",
//   SECURITY: "Security",
//   CHEF: "Chef",
//   WAITER: "Waiter",
//   BARTENDER: "Bartender",
//   RECEPTIONIST: "Receptionist",
// }


//     // export const ROLE_PERMISSIONS = {
//     //   superadmin: ["*"],
//     //   // Admin: [
//     //   //   "view_orders",
//     //   //   "add_orders",
//     //   //   "edit_orders",
//     //   //   "delete_orders",
//     //   //   "view_menu",
//     //   //   "edit_menu",
//     //   //   "view_inventory",
//     //   //   "edit_inventory",
//     //   //   "view_reports",
//     //   //   "manage_staff",
//     //   //   "manage_customers",
//     //   //   "process_payments",
//     //   // ],
//     //   Manager: [
//     //     "view_orders",
//     //     "create_orders",
//     //     "edit_orders",
//     //     "view_menu",
//     //     "view_inventory",
//     //     "view_reports",
//     //     "manage_customers",
//     //     "process_payments",
//     //   ],
//     //   Chef: ["view_orders", "view_menu", "kitchen_display"],
//     //   Waiter: ["view_orders", "create_orders", "view_menu", "process_payments"],
//     //   Cashier: ["view_orders","kitchen_display" , "view_reports","view_bill"],
//     // }

//     export const ROLE_PERMISSIONS = {
//   superadmin: ["*"],   // full access


//   Manager: [
//     // order management
//     "view_orders",
//     "add_orders",
//     "edit_orders",
//     "manage_orders",
//     // menu management
//     "add_menu",
//     "view_menu",
//     "edit_menu",
//     "delete_menu",
//     "manage_menu",
//     // inventory management
//     "add_inventory",
//     "view_inventory",
//     "edit_inventory",
//     "delete_inventory",
//     "manage_inventory",
//     // reports
//     "view_reports",
//     // staff management
//     "add_staff",
//     "edit_staff",
//     "delete_staff",
//     "view_staff",
//     "manage_staff",
//     // kitchen display system
//     "",
//     // view bill
//     "view_bill",
//     // expenses management
//     "add_expenses",
//     "view_expenses",
//     "edit_expenses",
//     "delete_expenses",
//     // settings
//     "edit_settings",
//     // analysis
//     "view_analysis",
//     // categories management
//     "view_category",
//     "add_category",
//     "edit_category",
//     "delete_category",
//     "manage_category",
//     // taxes management
//     "add_taxes",
//     "view_taxes",
//     "edit_taxes",
//     "delete_taxes",
//     // table reservations
//     "add_table",
//     "view_table",
//     "edit_table",
//     "delete_table",
//     // customers management
//     "add_customer",
//     "view_customer",
//     "edit_customer",
//     "delete_customer",
//     "manage_customer"
//   ],

//   Cashier: [
//     "view_orders",
//     "view_reports",
//     "view_bill",
//   ],

//   Chef: [
//     "view_orders",
//     "view_menu",
//     "kitchen_display",
//   ],

//   Waiter: [
//     "view_orders",
//     "add_orders",
//     "edit_orders",
//     "view_menu",
//     "process_payments",
//   ],

//   Bartender: [
//     "view_orders",
//     "view_menu",
//     "add_orders",
//   ],

//   Receptionist: [
//     "manage_customer",
//     "view_orders",
//     "view_reports",
//     "add_table",
//   ],

//   Cleaner: [
//     "view_cleaning_tasks",
//     "update_cleaning_status",
//   ],

//   Security: [
//     "view_security_logs",
//     "manage_entry",
//   ],
// }

// export const getAvailablePermissionsForRole = (userRole) => {
//   return ROLE_PERMISSIONS[userRole] || []
// }

// export const hasPermission = (user, permission) => {
//   if (!user) return false
//   if (user.role === "superadmin" || user.isSuperAdmin) return true
//   if (!user.permissions) return false
//   return user.permissions.includes(permission) || user.permissions.includes("*")
// }

// export const canManagePermissions = (user) => {
//   if (!user) return false
//   return user.role === "superadmin" || user.isSuperAdmin
// }


//     export const canEditStaff = (currentUser, targetStaffRole) => {
//       if (!currentUser) return false
      
//       if (currentUser.role === "superadmin" || currentUser.isSuperAdmin) {
//         return true
//       }
      
//       // if (currentUser.role === "Admin") {
//       //   return targetStaffRole !== "SuperAdmin"
//       // }
      
//       return false
//     }
