"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import {
  Menu,
  X,
  Home,
  FileText,
  User,
  MapPin,
  Mail,
  Globe,
  ChevronDown,
  Phone,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

// Single Header Component with all functionality
export default function Header() {
  // State management
  const [language, setLanguage] = useState("en")
  const [settings, setSettings] = useState(null)
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Refs for outside click detection
  const dropdownRef = useRef()
  const mobileMenuRef = useRef()

  // API call function
  const apiCall = useCallback(async (url, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Outside click detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAddressDropdown(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Memoized navigation items
  const navigationItems = useMemo(
    () => [
      {
        href: "/customer",
        icon: Home,
        label: language === "en" ? "Home" : "ホーム",
      },
      // {
      //   href: "/digital-menu",
      //   icon: FileText,
      //   label: language === "en" ? "Menu" : "メニュー",
      // },
      {
        href: "/account",
        icon: User,
        label: language === "en" ? "My Account" : "マイアカウント",
      },
    ],
    [language],
  )

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiCall("/api/settings")
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
      // Fallback data
      setSettings({
        hotelName: "Hotel-POS",
        hotelNameJa: "ホテルPOS",
        hotelGroup: "Hotel-POS Management Group",
        hotelGroupJa: "ホテルPOSマネジメントグループ",
        addresses: [
          {
            location: "Main Branch",
            address: "123 Hotel Street, City Center",
            email: "main@hotel-pos.com",
            phone: "+1-234-567-8900",
          },
          {
            location: "Downtown Branch",
            address: "456 Business District, Downtown",
            email: "downtown@hotel-pos.com",
            phone: "+1-234-567-8901",
          },
        ],
      })
    }
  }, [apiCall])

  // Initialize language from localStorage and fetch settings
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
    fetchSettings()
  }, [fetchSettings])

  // Close menus on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false)
      setShowAddressDropdown(false)
    }

    window.addEventListener("popstate", handleRouteChange)
    return () => window.removeEventListener("popstate", handleRouteChange)
  }, [])

  // Event handlers
  const handleLanguageToggle = useCallback(() => {
    const newLanguage = language === "en" ? "ja" : "en"
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
    setMobileMenuOpen(false)
  }, [language])

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
    setShowAddressDropdown(false)
  }, [])

  const handleAddressDropdownToggle = useCallback(() => {
    setShowAddressDropdown((prev) => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  // Navigation Item Component
  const NavItem = ({ href, icon: Icon, label, onClick, className = "" }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all duration-200 group ${className}`}
    >
      <Icon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )

  // Mobile Navigation Item Component
  const MobileNavItem = ({ href, icon: Icon, label, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl transition-all duration-200 group"
    >
      <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )

  // Location Card Component
  const LocationCard = ({ location, address, email, phone, isLast }) => (
    <div className={`px-4 py-4 ${!isLast ? "border-b border-gray-100" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{location}</h3>
          <p className="text-xs text-gray-600 mb-2 leading-relaxed">{address}</p>
          <div className="flex flex-col space-y-1">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Mail className="w-3 h-3 mr-1" />
                {email}
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center text-xs text-green-600 hover:text-green-800 transition-colors"
              >
                <Phone className="w-3 h-3 mr-1" />
                {phone}
              </a>
            )}
          </div>
        </div>
        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
      </div>
    </div>
  )

  // Loading Skeleton
  if (loading && !settings) {
    return (
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse mr-3" />
              <div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 hidden sm:block" />
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse w-20" />
              ))}
            </div>
            <div className="lg:hidden">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Error State
  if (error && !settings) {
    return (
      <header className="bg-red-50 border-b border-red-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Failed to load header data</span>
            </div>
            <button
              onClick={fetchSettings}
              className="flex items-center text-red-600 hover:text-red-800 text-sm underline"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Hotel Name */}
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/" className="flex items-center group">
              <div className="mr-3 flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-white font-bold text-sm">POS</span>
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {language === "en" ? settings?.hotelName : settings?.hotelNameJa}
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block truncate">
                  {language === "en" ? settings?.hotelGroup : settings?.hotelGroupJa}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}

            {/* Locations Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleAddressDropdownToggle}
                className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all duration-200 group"
              >
                <MapPin className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{language === "en" ? "Locations" : "ロケーション"}</span>
                <ChevronDown
                  className={`w-4 h-4 ml-1 transition-transform ${showAddressDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showAddressDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-10 animate-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {language === "en" ? "Our Locations" : "店舗一覧"}
                      </h3>
                    </div>
                    {settings?.addresses?.map((address, index) => (
                      <LocationCard
                        key={index}
                        location={address.location}
                        address={address.address}
                        email={address.email}
                        phone={address.phone}
                        isLast={index === settings.addresses.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Email Test Link (Development) */}
            {process.env.NODE_ENV === "development" && (
              <NavItem
                href="/email-test"
                icon={Mail}
                label={language === "en" ? "Test Email" : "メールテスト"}
                className="border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
              />
            )}

            {/* Language Toggle */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all duration-200 group"
            >
              <Globe className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{language === "en" ? "日本語" : "English"}</span>
            </button>
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={handleMobileMenuToggle}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200"
          >
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <MobileNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  onClick={closeMobileMenu}
                />
              ))}

              {/* Mobile Locations */}
              <div className="px-4 py-3">
                <div className="flex items-center text-gray-700 mb-3">
                  <MapPin className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{language === "en" ? "Locations" : "ロケーション"}</span>
                </div>
                <div className="ml-8 space-y-3">
                  {settings?.addresses?.map((address, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                      <p className="text-sm font-semibold text-gray-900">{address.location}</p>
                      <p className="text-xs text-gray-600 mt-1 mb-2">{address.address}</p>
                      <div className="flex flex-col space-y-1">
                        {address.email && (
                          <a
                            href={`mailto:${address.email}`}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            {address.email}
                          </a>
                        )}
                        {address.phone && (
                          <a
                            href={`tel:${address.phone}`}
                            className="inline-flex items-center text-xs text-green-600 hover:text-green-800"
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {address.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Email Test Link (Development) */}
              {process.env.NODE_ENV === "development" && (
                <MobileNavItem
                  href="/email-test"
                  icon={Mail}
                  label={language === "en" ? "Test Email" : "メールテスト"}
                  onClick={closeMobileMenu}
                />
              )}

              {/* Mobile Language Toggle */}
              <button
                onClick={handleLanguageToggle}
                className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl transition-all duration-200 group"
              >
                <Globe className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{language === "en" ? "日本語" : "English"}</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
