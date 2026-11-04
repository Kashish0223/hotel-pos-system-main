"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Clock,
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
export default function CustomerHeader({ 
  showCart = false, 
  cartItemCount = 0, 
  onCartClick = null,
  showSearch = false,
  searchTerm = "",
  onSearchChange = null,
  searchPlaceholder = "Search...",
  showMyOrders = false,
  onMyOrdersClick = null,
  tableNumber = null
}) {
  // State management
  const [language, setLanguage] = useState("en")
  const [settings, setSettings] = useState(null)
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

    const [showSearchBar, setShowSearchBar] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchBarTerm, setSearchBarTerm] = useState('');
  const searchBarPlaceholder = "Search...";

  // Refs for outside click detection
  const dropdownRef = useRef()
  const mobileMenuRef = useRef()


  const handleSearchToggle = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      // Focus the input when expanding with a slight delay for smooth animation
      setTimeout(() => {
        const input = document.querySelector('.search-input');
        if (input) input.focus();
      }, 250);
    } else {
      // Clear search term when collapsing
      setSearchBarTerm('');
      setIsExpanded(false);
      onSearchChange('')
    }
  };

  const handleSearchChange = (value) => {
    setSearchBarTerm(value);
  };




  // API call function
  const apiCall = useCallback(async (url, options = {}) => {
    // try {
    //   const response = await fetch(url, {
    //     headers: {
    //       "Content-Type": "application/json",
    //       ...options.headers,
    //     },
    //     ...options,
    //   })
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error("API Error:", err)
      throw err
    }
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

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiCall("/api/settings")
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
      // Minimal fallback data
      setSettings({
        hotelName: "Hotel-POS",
        hotelNameJa: "ホテルPOS",
        hotelGroup: "Hotel-POS Management",
        hotelGroupJa: "ホテルPOSマネジメント",
        addresses: [],
      })
    } finally {
      setLoading(false)
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
      className={`flex items-center text-white hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all duration-200 group ${className}`}
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
      <span className="text-white text-sm font-medium">{label}</span>
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
                className="inline-flex items-center text-xs text-white hover:text-blue-800 transition-colors"
              >
                <Mail className="text-white w-3 h-3 mr-1" />
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
      <header className="bg-[#0c1222] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-200 rounded-xl animate-pulse mr-2 sm:mr-3" />
              <div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-32 sm:w-48 mb-2" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-24 sm:w-32 hidden sm:block" />
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse w-20" />
              ))}
            </div>
            <div className="lg:hidden flex items-center space-x-2">
              {showCart && <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />}
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        {showSearch && (
          <div className="border-t border-gray-200 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
            <div className="max-w-7xl mx-auto">
              <div className="h-10 sm:h-12 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        )}
      </header>
    )
  }

  return (
    // <header className="bg-white shadow-lg sticky top-0 z-50">
    <header className="bg-[#0c1222] shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo and Hotel Name */}
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/" className="flex items-center group">
              <div className="mr-2 sm:mr-3 flex-shrink-0">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-white font-bold text-xs sm:text-sm">POS</span>
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                  {language === "en" ? settings?.hotelName || "Hotel-POS" : settings?.hotelNameJa || "ホテルPOS"}
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block truncate">
                  {language === "en" ? settings?.hotelGroup || "Point of Sale Management" : settings?.hotelGroupJa || "ホテルPOSシステム"}
                  {tableNumber && ` - Table ${tableNumber}`}
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
            {/* {settings?.addresses && settings.addresses.length > 0 && (
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
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-10">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {language === "en" ? "Our Locations" : "店舗一覧"}
                        </h3>
                      </div>
                      {settings.addresses.map((address, index) => (
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
            )} */}

            {/* My Orders Button */}
            {showMyOrders && onMyOrdersClick && (
              <button
                onClick={onMyOrdersClick}
                className="flex items-center bg-purple-100 text-purple-700 px-3 py-2 rounded-xl hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span>{language === "en" ? "My Orders" : "注文履歴"}</span>
              </button>
            )}

            {/* Language Toggle */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all duration-200 group"
            >
              <Globe className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{language === "en" ? "日本語" : "English"}</span>
            </button>

            {/* Cart Button */}
            {showCart && onCartClick && (
              <button
                onClick={onCartClick}
                className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-orange-600 font-medium transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 text-sm"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{language === "en" ? "Cart" : "カート"}</span>
                <span>({cartItemCount})</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-800 text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Mobile menu button and cart */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Cart Button - Outside navbar */}
            {showCart && onCartClick && (
              <button
                onClick={onCartClick}
                className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white p-2 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-800 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </button>
            )}
            
            <button
              onClick={handleMobileMenuToggle}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="text-white w-6 h-6" /> : <Menu className="text-white w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="lg:hidden py-3 sm:py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-1 sm:space-y-2">
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
              {settings?.addresses && settings.addresses.length > 0 && (
                <div className="px-4 py-3">
                  <div className="flex items-center text-gray-700 mb-3">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span className="text-white text-sm font-medium">{language === "en" ? "Locations" : "ロケーション"}</span>
                  </div>
                  <div className="ml-8 space-y-3">
                    {settings.addresses.map((address, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                        <p className="text-white text-sm font-semibold text-gray-900">{address.location}</p>
                        <p className="text-white text-xs text-gray-600 mt-1 mb-2">{address.address}</p>
                        <div className="flex flex-col space-y-1">
                          {address.email && (
                            <a
                              href={`mailto:${address.email}`}
                              className="inline-flex items-center text-xs text-gray-500 hover:text-blue-800"
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
              )}

              {/* Mobile My Orders */}
              {showMyOrders && onMyOrdersClick && (
                <button
                  onClick={() => {
                    onMyOrdersClick()
                    closeMobileMenu()
                  }}
                  className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl transition-all duration-200 group"
                >
                  <Clock className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  <span className="text-white text-sm font-medium">{language === "en" ? "My Orders" : "注文履歴"}</span>
                </button>
              )}

              {/* Mobile Language Toggle */}
              <button
                onClick={handleLanguageToggle}
                className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl transition-all duration-200 group"
              >
                <Globe className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                <span className="text-white text-sm font-medium">{language === "en" ? "日本語" : "English"}</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {/* {showSearch && (
        <div className="border-t border-gray-200 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <Search className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      )} */}

  {/* <div className="sticky top-0 bg-[#0c1222] px-4">
      <div className="max-w-7xl mx-auto">
        
        {showSearchBar && false && (
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-end items-center">
                <div className={`relative transition-all duration-500 ease-in-out transform ${
                  isExpanded 
                    ? 'w-full lg:w-[30%] scale-100 opacity-100' 
                    : 'w-12 sm:w-14 scale-95 opacity-90'
                }`}>
                  {isExpanded ? (
                    <div className="relative animate-in slide-in-from-right-2 fade-in duration-300">
                      <Search className="w-4 sm:w-5 sm:h-5 text-black absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200" />
                      <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchBarTerm}
                        onChange={(e) => {
                          handleSearchChange(e.target.value)
                          onSearchChange(e.target.value)
                        }}
                        className="search-input w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2 my-1 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base transition-all duration-200 hover:border-gray-400 hover:shadow-sm"
                      />
                      <button
                        onClick={handleSearchToggle}
                        className="bg-gray-500 absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-500 rounded-full transition-all duration-200 hover:scale-105"
                      >
                        <X className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSearchToggle}
                      className="bg-white p-2 sm:p-3 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-101 hover:shadow-md group"
                    >
                      <Search className="w-4 sm:w-5 h-4 sm:h-5 text-gray group-hover:text-gray-600 transition-colors duration-200" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

       
      </div>
    </div> */}


    </header>
  )
}