"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { removeCookie } from "@/lib/cookieHelper"
import {
  ArrowLeft,
  Settings,
  Users,
  ShoppingBag,
  BarChart3,
  Menu,
  X,
  LogOut,
  Home,
} from "lucide-react"

export default function AdminHeader({ 
  title, 
  subtitle, 
  showBackButton = true, 
  actionButton = null,
  breadcrumbs = []
}) {
  const router = useRouter()
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Navigation items for admin
  const navigationItems = [
    // {
    //   href: "/",
    //   icon: Home,
    //   label: "Dashboard",
    // },
    {
      href: "/menu",
      icon: ShoppingBag,
      label: "Menu Management",
    },
    {
      href: "/admin/tables",
      icon: Settings,
      label: "Table Management",
    },
    {
      href: "/staff",
      icon: Users,
      label: "Staff Management",
    },
    {
      href: "/analysis",
      icon: BarChart3,
      label: "Analytics",
    },
  ]

  // Get user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    removeCookie("hotel_pos_jwt");
    router.push("/login")
  }, [logout, router])

  const handleBackClick = useCallback(() => {
    router.back()
  }, [router])

  const NavItem = ({ href, icon: Icon, label, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center text-gray-700 hover:text-[#ad4b24] hover:bg-[#f2dccd]/40 px-3 py-2 rounded-xl transition-all duration-200 group"
    >
      <Icon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )

  const MobileNavItem = ({ href, icon: Icon, label, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center text-gray-700 hover:text-[#ad4b24] hover:bg-[#f2dccd]/40 px-4 py-3 rounded-xl transition-all duration-200 group"
    >
      <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )

  return (
    // <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
    <header className="bg-white border-b border-gray-200 z-50">
      <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-2 md:py-3">
          {/* Left side - Back button and Title */}
          <div className="flex items-center min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="text-red-600 hover:text-red-800 mr-2 sm:mr-2 transition-colors p-1 hover:bg-red-50 rounded-xl"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <div className="min-w-0 flex-1">
              {/* {breadcrumbs.length > 0 && (
                <nav className="flex mb-0 sm:mb-0" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        {index > 0 && <span className="text-gray-400 mx-1 sm:mx-2">/</span>}
                        {crumb.href ? (
                          <Link
                            href={crumb.href}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="text-gray-900 font-medium">{crumb.label}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )} */}
              
              <div>
                <h1 className="text-sm font-semibold text-gray-900 truncate">
                  {title}
                </h1>
                {/* {subtitle && (
                  <p className="text-sm sm:text-base text-gray-600 mt-0 truncate">
                    {subtitle}
                  </p>
                )} */}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          {/* <nav className="hidden lg:flex items-center space-x-2 mr-4">
            {navigationItems.map((item) => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </nav> */}

          {/* Right side - Action button and user menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Action Button */}
            {actionButton && (
              <div className="hidden sm:block">
                {actionButton}
              </div>
            )}

            {/* User Info */}
            {user && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-xl"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Action Button */}
        {actionButton && (
          <div className="sm:hidden pb-3">
            {actionButton}
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 sm:py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-1 sm:space-y-2">
              {navigationItems.map((item) => (
                <MobileNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}

              {/* Mobile User Info and Logout */}
              {user && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-3 rounded-xl transition-all duration-200 group w-full"
                  >
                    <LogOut className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}