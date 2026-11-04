"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export default function DashboardCards({ user }) {
  const [hoveredCard, setHoveredCard] = useState(null)


  // Define all possible cards with luxury styling
  const allCards = [
    {
      id: "order-management",
      title: "Order Management",
      description: "Create, track and manage orders",
      icon: "🧾",
      iconGradient: "from-amber-400 to-yellow-600",
      href: "/orders",
      permission: ["edit_orders","view_orders","add_orders","manage_orders"],
      category: "Operations"
    }, 
    {
      id: "menu",
      title: "Menu Management",
      description: "Manage menu items/categories",
      icon: "📋",
      iconGradient: "from-emerald-400 to-green-600",
      href: "/menu",
      permission: ["edit_menu","view_menu","add_menu","delete_menu","manage_menu"],
      category: "Culinary"
    },
    {
      id: "inventory",
      title: "Inventory",
      description: "Track stock and supplies",
      icon: "📦",
      iconGradient: "from-blue-400 to-indigo-600",
      href: "/inventory",
      permission: ["edit_inventory","view_inventory","add_inventory","delete_inventory","manage_inventory"],
      category: "Operations"
    },
    {
      id: "staff",
      title: "Staff Management",
      description: "Manage staff and permissions",
      icon: "👥",
      iconGradient: "from-purple-400 to-violet-600",
      href: "/staff",
      permission: ["edit_staff","view_staff","add_staff","delete_staff","manage_staff"],
      category: "Management"
    },
    {
      id: "reports",
      title: "Reports",
      description: "View sales/performance reports",
      icon: "📊",
      iconGradient: "from-rose-400 to-pink-600",
      href: "/reports",
      permission: "view_reports",
      category: "Analytics"
    },
    {
      id: "settings",
      title: "Settings",
      description: "Configure system settings",
      icon: "⚙️",
      iconGradient: "from-slate-400 to-gray-600",
      href: "/settings",
      permission: ["manage_settings","edit_settings"],
      category: "System"
    },
    {
      id: "customers",
      title: "Customers",
      description: "Manage customer database",
      icon: "🧑",
      iconGradient: "from-teal-400 to-cyan-600",
      href: "/customers",
      permission: ["manage_customer","view_customer","add_customer","delete_customer","edit_customer"],
      category: "Hospitality"
    },
    {
      id: "analysis",
      title: "Analysis",
      description: "Advanced business analytics",
      icon: "📈",
      iconGradient: "from-red-400 to-orange-600",
      href: "/analysis",
      permission: ["view_analysis","manage_analysis"],
      category: "Analytics"
    },
    {
      id: "tables",
      title: "Table Management",
      description: "Manage tables and QR codes",
      icon: "🍽️",
      iconGradient: "from-lime-400 to-green-600",
      href: "/admin/tables",
      permission: ["edit_table","view_table","add_table","delete_table","manage_table"],
      category: "Culinary"
    },
    {
      id: "kitchen_display",
      title: "Kitchen Display",
      description: "View/manage orders in kitchen",
      icon: "🍳",
      iconGradient: "from-orange-400 to-red-600",
      href: "/kitchen-display",
      permission: "kitchen_display",
      category: "Culinary"
    },
    {
      id: "bills",
      title: "Bills",
      description: "Manage and generate bills",
      icon: "💰",
      iconGradient: "from-green-400 to-emerald-600",
      href: "/bills",
      permission: "view_bill",
      category: "Finance"
    },
    {
      id: "categories",
      title: "Categories",
      description: "Manage product categories",
      icon: "🗂️",
      iconGradient: "from-cyan-400 to-blue-600",
      href: "/categories",
      permission: ["edit_category","view_category","add_category","delete_category","manage_category"],
      category: "Culinary"
    },
    // {
    //   id: "expenses",
    //   title: "Expenses",
    //   description: "Track and manage expenses",
    //   icon: "💸",
    //   iconGradient: "from-pink-400 to-rose-600",
    //   href: "/expenses",
    //   permission: ["manage_expenses","add_expenses","delete_expenses","edit_expenses"],
    //   category: "Finance"
    // },
    {
      id: "feedback",
      title: "Feedback",
      description: "Manage Feedback QR",
      icon: "💬",
      iconGradient: "from-indigo-400 to-purple-600",
      href: "/feedback-qr",
      permission: "manage_feedback",
      // category: "Finance"
    },
    // {
    //   id: "settlements",
    //   title: "Settlements",
    //   description: "Manage financial settlements",
    //   icon: "🏦",
    //   iconGradient: "from-indigo-400 to-purple-600",
    //   href: "/settlements",
    //   permission: "manage_settlements",
    //   category: "Finance"
    // },
    
    // {
    //   id: "taxes",
    //   title: "Taxes",
    //   description: "Configure tax settings",
    //   icon: "📊",
    //   iconGradient: "from-violet-400 to-indigo-600",
    //   href: "/taxes",
    //   permission: ["manage_taxes","add_taxes","delete_taxes","edit_taxes"],
    //   category: "Finance"
    // },
  ]

  // const filteredCards = allCards.filter(card => {
  //   if (card.permission === null) return true
  //   if (card.superAdminOnly && (user.role === "superadmin" || user.isSuperAdmin)) return true
    
  //   if (user.role === "superadmin" || 
  //       user.isSuperAdmin || 
  //       user.permissions?.includes("*") || 
  //       (card.permission !== "*" && user.permissions?.includes(card.permission))) {
  //     return true
  //   }
    
  //   return false
  // })
// components/DashboardCards.jsx  (Only logic fixed — design untouched)

const filteredCards = allCards.filter(card => {
  if (!user) return false
  if (user.role === "superadmin" || user.isSuperAdmin) return true
  if (user.permissions?.includes("*")) return true

  // Fix: Support array of permissions
  if (Array.isArray(card.permission)) {
    return card.permission.some(p => user.permissions?.includes(p))
  }
  if (typeof card.permission === "string") {
    return user.permissions?.includes(card.permission)
  }
  return true // no permission required
})
  return (
    // <div className="min-h-screen bg-gradient-to-br from-white-900 via-gray to-white-800 relative overflow-hidden">
    <div className="min-h-screen relative overflow-hidden">
      {/* <div className="relative z-10 px-4 py-1"> */}
      <div className="relative z-10 py-1">

        {/* Cards Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-full mx-auto px-4 py-3 rounde d"> */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-full mx-auto py-3 max-md:px-2 rounded">
          {filteredCards.map(card => (
            <Link 
              key={card.id}
              href={card.href} 
              className="group block"
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`
                relative w-full h-auto bg-white/80
                backdrop-blur-xl rounded-xl border border-gray-100 cursor-pointer overflow-hidden
                transition-all duration-200 ease-out
                ${hoveredCard === card.id 
                  ? 'transform -translate-y-1 scale-105 shadow-lg shadow-black/40' 
                  : 'transform translate-y-0 scale-100 shadow-md shadow-black/20'
                }
              `}>
                
                {/* Shimmer Effect */}
                <div className={`
                  absolute top-0 left-0 w-full h-full 
                  bg-gradient-to-r from-transparent via-white/10 to-purple-500/5
                  transition-transform duration-1000 ease-out
                  ${hoveredCard === card.id ? 'transform translateX-0' : 'transform -translateX-full'}
                `} />
                
                {/* Glowing Border */}
                <div className={`
                  absolute inset-0 rounded-xl transition-opacity duration-100
                  ${hoveredCard === card.id ? 'opacity-100' : 'opacity-10'}
                `} 
                style={{
                  background: `linear-gradient(145deg, rgba(149, 55, 212, 0.6) 0%, transparent 30%, transparent 70%, rgba(196, 55, 212, 0.3) 100%)`,
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '2px'
                }} />

                <div className="relative z-10 py-4 px-3 h-full flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className={`
                      w-16 h-16 bg-gradient-to-br ${card.iconGradient} rounded-2xl
                      flex items-center justify-center shadow-lg transition-all duration-500
                      ${hoveredCard === card.id ? 'transform rotate-6 scale-110' : 'transform rotate-0 scale-100'}
                    `}
                    style={{
                      boxShadow: hoveredCard === card.id 
                        ? '0 12px 40px rgba(165, 55, 212, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                        : '0 8px 32px rgba(157, 55, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}>
                      <span className="text-2xl filter drop-shadow-sm">{card.icon}</span>
                    </div>

                    <div className="flex items-end flex-col space-x-2">   
                      <div className="text-red-400 text-xs font-medium px-1 py-1.5 rounded-xl uppercase items-start">
                        {/* <h3 className="text-l font-semibold text-white mb-0 font-sans leading-tight text-center"> */}
                        <h3 className="text-base font-semibold text-black mb-0 font-sans leading-tight text-center">
                          {card.title}
                        </h3>
                      </div>
                      {/* <div className="bg-green-500/20 border border-green-500/30 backdrop-blur-sm text-green-400 text-xs font-medium px-3 py-1 rounded-xl uppercase tracking-wider">
                        Active
                      </div> */}
                    </div>
                  </div>

                  <div className="flex-1 m-0">
                    <p className="text-gray-900 text-sm leading-relaxed font-light leading-tight">
                      {card.description}
                    </p>
                  </div>   
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>   
    </div>
  )
}

















// "use client"

// import Link from "next/link"

// export default function DashboardCards({ user }) {
//   // Define all possible cards - only including routes that exist in the app folder
//   const allCards = [
//     {
//       id: "order-management",
//       title: "Order Management",
//       description: "Create, track and manage orders",
//       icon: "🧾",
//       iconBg: "bg-blue-500",
//       href: "/orders",
//       permission: null, // Available to all users
//     }, 
//     {
//       id: "menu",
//       title: "Menu Management",
//       description: "Manage menu items and categories",
//       icon: "📋",
//       iconBg: "bg-green-500",
//       href: "/menu",
//       permission: "edit_menu",
//     },
//     {
//       id: "inventory",
//       title: "Inventory",
//       description: "Track stock and supplies",
//       icon: "📦",
//       iconBg: "bg-yellow-500",
//       href: "/inventory",
//       permission: "edit_inventory",
//     },
//     {
//       id: "staff",
//       title: "Staff Management",
//       description: "Manage staff and permissions",
//       icon: "👥",
//       iconBg: "bg-purple-500",
//       href: "/staff",
//       permission: "manage_staff",
//     },
//     {
//       id: "reports",
//       title: "Reports",
//       description: "View sales and performance reports",
//       icon: "📊",
//       iconBg: "bg-indigo-500",
//       href: "/reports",
//       permission: "view_reports",
//     },
//     {
//       id: "settings",
//       title: "Settings",
//       description: "Configure system settings",
//       icon: "⚙️",
//       iconBg: "bg-gray-500",
//       href: "/settings",
//       permission: "*",
//     },
//     {
//       id: "customers",
//       title: "Customers",
//       description: "Manage customer database",
//       icon: "🧑",
//       iconBg: "bg-pink-500",
//       href: "/customers",
//       permission: "*",
//     },
//     {
//       id: "analysis",
//       title: "Analysis",
//       description: "Advanced business analytics",
//       icon: "📈",
//       iconBg: "bg-red-500",
//       href: "/analysis",
//       permission: "*",
//     },
//     {
//       id: "tables",
//       title: "Tables",
//       description: "Manage tables and QR codes",
//       icon: "🍽️",
//       iconBg: "bg-teal-500",
//       href: "/admin/tables",
//       permission: "manage_tables",
//     },
//     {
//       id: "kitchen_display",
//       title: "Kitchen Display",
//       description: "View and manage orders in kitchen",
//       icon: "🍳",
//       iconBg: "bg-amber-500",
//       href: "/kitchen_display",
//       permission: "view_kitchen_display",
//     },
//     {
//       id: "bills",
//       title: "Bills",
//       description: "Manage and generate bills",
//       icon: "💰",
//       iconBg: "bg-emerald-500",
//       href: "/bills",
//       permission: "process_payments",
//     },
//     {
//       id: "categories",
//       title: "Categories",
//       description: "Manage product categories",
//       icon: "🗂️",
//       iconBg: "bg-orange-500",
//       href: "/categories",
//       permission: "edit_menu",
//     },
//     {
//       id: "expenses",
//       title: "Expenses",
//       description: "Track and manage expenses",
//       icon: "💸",
//       iconBg: "bg-rose-500",
//       href: "/expenses",
//       permission: "manage_finances",
//     },
//     // {
//     //   id: "debtors",
//     //   title: "Debtors",
//     //   description: "Manage customer debts",
//     //   icon: "�",
//     //   iconBg: "bg-cyan-500",
//     //   href: "/debtors",
//     //   permission: "manage_finances",
//     // },
//     {
//       id: "settlements",
//       title: "Settlements",
//       description: "Manage financial settlements",
//       icon: "🏦",
//       iconBg: "bg-lime-500",
//       href: "/settlements",
//       permission: "manage_finances",
//     },
//     // {
//     //   id: "outlets",
//     //   title: "Outlets",
//     //   description: "Manage multiple outlets",
//     //   icon: "🏪",
//     //   iconBg: "bg-violet-500",
//     //   href: "/outlets",
//     //   permission: "manage_outlets",
//     // },
//     {
//       id: "taxes",
//       title: "Taxes",
//       description: "Configure tax settings",
//       icon: "📊",
//       iconBg: "bg-slate-500",
//       href: "/taxes",
//       permission: "manage_finances",
//     },
//     // {
//     //   id: "superadmin",
//     //   title: "SuperAdmin",
//     //   description: "Access SuperAdmin dashboard",
//     //   icon: "👑",
//     //   iconBg: "bg-red-700",
//     //   href: "/superadmin/dashboard",
//     //   permission: "superadmin",
//     //   superAdminOnly: true,
//     // },
//   ]

//   // Filter cards based on user permissions
//   const filteredCards = allCards.filter(card => {
//     // Cards with no permission requirement are shown to everyone
//     if (card.permission === null) return true
    
//     // SuperAdmin only cards
//     if (card.superAdminOnly && (user.role === "SuperAdmin" || user.isSuperAdmin)) return true
    
//     // Cards that require specific permissions
//     if (user.role === "SuperAdmin" || 
//         user.isSuperAdmin || 
//         user.permissions?.includes("*") || 
//         (card.permission !== "*" && user.permissions?.includes(card.permission))) {
//       return true
//     }
    
//     return false
//   })

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
//       {filteredCards.map(card => (
//         <Link 
//           key={card.id}
//           href={card.href} 
//           className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow"
//         >
//           <div className="flex items-center">
//             <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
//               <span className="text-white text-xl">{card.icon}</span>
//             </div>
//             <div className="ml-4">
//               <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
//               <p className="text-gray-500">{card.description}</p>
//             </div>
//           </div>
//         </Link>
//       ))}
//     </div>
//   )
// }