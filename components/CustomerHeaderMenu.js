"use client"

import { useState, useEffect, useCallback, useMemo, useRef, use } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link";
import {useAuthToken} from "@/lib/useAuthToken";
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
  Utensils, 
  Languages
} from "lucide-react"
export default function CustomerHeaderMenu({ 
  currTab = "Menu",
  showCart = false, 
  cartItemCount = 0, 
  onCartClick = null,
  showSearch = false,
  searchTerm = "",
  onSearchChange = null,
  searchPlaceholder = "Search...",
  showMyOrders = false,
  onMyOrdersClick = null,
  tableNumber = null,
  allDisabled = false
}) {
  // State management
  const [language, setLanguage] = useState("en")
  const [settings, setSettings] = useState(null)
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

    const [showSearchBar, setShowSearchBar] = useState(showSearch);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchBarTerm, setSearchBarTerm] = useState('');
  const searchBarPlaceholder = "Search...";
  const token = useAuthToken();

  // Refs for outside click detection
  const dropdownRef = useRef()
  const mobileMenuRef = useRef()


    const [lang, setLang] = useState("en");

  const googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  useEffect(() => {
    // Inject Google Translate script
    const addScript = document.createElement("script");
    addScript.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = googleTranslateElementInit;
    // handleTranslate();
  }, []);

  
  // Function to trigger translation
  const handleTranslate = () => {
  const newLang = lang === "en" ? "ja" : "en";
  setLang(newLang);

  // Small delay to ensure state + DOM are ready
  setTimeout(() => {
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = newLang;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      console.warn("Google Translate dropdown not ready yet");
    }
  }, 10); // tweak delay if needed
};




  // const handleTranslate = () => {
  //   const newLang = lang === "en" ? "ja" : "en";
  //   setLang(newLang);

  //   const select = document.querySelector(".goog-te-combo");
  //   if (select) {
  //     select.value = newLang;
  //     select.dispatchEvent(new Event("change"));
  //   }
  // };


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
  // const apiCall = useCallback(async (url, options = {}) => {
  //   try {
  //     const response = await fetch(url, {
  //       headers: {
  //         "Content-Type": "application/json",
  //         ...options.headers,
  //       },
  //       ...options,
  //     })
  const apiCall = useCallback(async (url, options = {}) => {
    // if(!token) return;
    try {
      const response = await fetch(url, {
        // headers: {
        //   "Content-Type": "application/json",
        //   "Authorization": `Bearer ${token}`,
        // },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error("API Error:", err)
      throw err
    }
  }, [token])

  // Memoized navigation items
  const navigationItems = useMemo(
    () => [
      {
        href: "/customer",
        icon: Home,
        label: language === "en" ? "Home" : "ホーム",
        tab: 'Home'
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
        tab: 'Account'
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
    // if(!token) return;
    try {
      const data = await apiCall("/api/settings",{
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      })
      const newData = {
        ...data,
        hotelName: data?.hotelName || "Hotel-POS"
      }
      setSettings(newData)
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
  }, [apiCall,token])

  // Initialize language from localStorage and fetch settings
  useEffect(() => {
    if (!token) return;

    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
    fetchSettings()
  }, [fetchSettings, token])

  // Event handlers
  const handleLanguageToggle = useCallback(() => {
    const newLanguage = language === "en" ? "ja" : "en"
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
    // setMobileMenuOpen(false)
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
  const MobileNavItem = ({ href, icon: Icon, label, onClick, tab }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center text-gray-700 px-2 py-2 rounded-xl transition-all duration-200 group ${currTab == tab ? 'bg-gray-700' : ' '}`}
    >
      <Icon className={`w-6 h-6 mx-1 text-white group-hover:scale-110 transition-transform`} />
      {/* <span className="text-white text-sm font-medium">{label}</span> */}
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
        <MapPin className="w-6 h-6 text-gray-400 mt-1 flex-shrink-0" />
      </div>
    </div>
  )

  // Loading Skeleton
  // if (loading && !settings) {
  if (loading && !settings) {
    return (
      <header className="bg-[#0c1222] shadow-lg sticky top-0 z-50">
          {/* <div className="flex justify-between items-center py-3 sm:py-4"> */}
        {/* <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-1 md:py-3">
            <div className="flex items-center">
              <div className="w-10 sm:w-6 h-10 sm:h-6 bg-gray-200 rounded-xl animate-pulse mr-2 sm:mr-3" />
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
        )} */}

        <button onClick={() => alert("Hello mobile!")} className="px-4 text-white " >
  {loading?"true":"false"}
</button>
      </header>
    )
  }

  return (

    <>


      {/* <div className="sticky top-0 bg-[#0c1222] px-4"> */}
      <div className="sticky top-0 bg-transparent px-4 pb-0">
      <div className="max-w-7xl mx-auto">
        {/* <h1 className="text-2xl font-bold mb-8 text-center">Expandable Search Bar Demo</h1> */}
        <div id="google_translate_element" style={{ 
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0
        }}></div>
        
        {showSearchBar && (
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-end items-center">
                <div className={`relative transition-all duration-500 ease-in-out transform ${
                  isExpanded 
                    ? 'w-full lg:w-[30%] scale-100 opacity-100' 
                    : 'w-12 sm:w-14 scale-95 opacity-90'
                }`}>
                  {isExpanded ? (
                    <div className="relative animate-in slide-in-from-right-2 fade-in duration-300">
                      <Search className="w-5 sm:w-5 sm:h-5 text-white absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200" />
                      <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchBarTerm}
                        onChange={(e) => {
                          handleSearchChange(e.target.value)
                          onSearchChange(e.target.value)
                        }}
                        className="search-input text-white w-full pl-10 sm:pl-10 pr-10 sm:pr-12 py-3 sm:py-2 my-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-sm bg-gray-800"
                      />
                      <button
                        onClick={handleSearchToggle}
                        className="bg-gray-500 absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-105"
                      >
                        <X className="w-5 sm:w-5 h-5 sm:h-5 text-white transition-colors duration-200" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSearchToggle}
                      className="bg-[#0c1222] p-4 sm:p-3 hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-101 shadow-black shadow-lg hover:shadow-md group border border-gray-400"
                    >
                      <Search className="w-6 sm:w-5 h-6 sm:h-5 text-white group-hover:text-white transition-colors duration-200" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

       
      </div>
    </div>


     {/* <header className="bg-white shadow-lg sticky top-0 z-50"> */}
    <header className="bg-[#0c1222] shadow-lg z-50 mx-[4vw] px-2 rounded-full border border-gray-500">
    {/* <header
       className={`bg-[#0c1222] sticky top-0 z-50 mx-4 transition-shadow duration-300 rounded-full border border-gray-500 ${
    scrollY > 10 ? "shadow-lg" : ""
  }`}> */}
      <div className="max-w-7xl  px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">


          {/* {mobileMenuOpen && ( */}
          {true && (
          <div ref={mobileMenuRef} className="lg:hidden w-full">
            {/* <nav className="flex justify-between items-center bg-red-700 min-w-full"> */}
              <nav className="flex justify-between items-center">

              {/* <Link
                href={'/customer'}
                className={`flex items-center text-gray-700 px-1 py-1 rounded-xl transition-all duration-200 group ${currTab == 'Home' ? 'bg-gray-700' : ' '}`}
              > */}
              <Link
                href={'/customer/menu'}
                className="relative text-white p-2 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                aria-label="Open cart"
              >
                <Home className={`w-6 h-6 text-white group-hover:scale-110 transition-transform`} />
              </Link>

     {/* Mobile Cart Button - Outside navbar */}
                {(currTab == 'Menu') && showCart && onCartClick && (
                  <button
                    onClick={onCartClick}
                    className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white p-1 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                    aria-label="Open cart"
                  >
                    <div className="flex">
                
                    <ShoppingCart className="w-6 h-6" />
                    {/* {cartItemCount != 0 && (
                      <span className="mx-2">Place order</span>
                      )} */}
                    </div>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-800 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </span>
                    )}
                  </button>
                )}
              <button onClick={handleTranslate}>
            
                <Languages className={`w-6 h-6 text-white group-hover:scale-110 transition-transform`} />
              </button>

              {/* Mobile My Orders */}
              {showMyOrders && onMyOrdersClick && (
                <button
                  disabled={false}
                  onClick={() => {
                    onMyOrdersClick()
                    closeMobileMenu()
                  }}
                  className="flex items-center px-1 py-1 rounded-xl transition-all duration-200 group text-white"
                >
                  <Clock className="w-6 h-6 group-hover:scale-110 transition-transform text-white" />
                  {/* <span className="text-white text-sm font-medium">{language === "en" ? "My Orders" : "注文履歴"}</span> */}
                </button>
              )}
        
              {/* <div className="lg:hidden flex items-center"> */}
           
              
                    <Link
                        href={`/account`}
                className="relative text-white p-2 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                      >
                        <User className={`w-6 h-6 text-white group-hover:scale-110 transition-transform`} />
                      </Link>
              
                 {/* {(currTab = 'Menu') && showCart && onCartClick && (
                  <Link
                    href={'/customer/menu'}
                    className="relative text-white p-2 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                    aria-label="Open cart"
                  >
                    <div className="flex">
                
                    <Utensils className="w-6 h-6" /> */}
                    {/* {cartItemCount != 0 && (
                      <span className="mx-2">Place order</span>
                    )} */}
                    {/* </div>
                    {cartItemCount > 0 && (
                      <span className="bg-yellow-400 text-red-800 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </span>
                    )}
                  </Link>
                )} */}
              {/* </div> */}

            </nav>
          </div>
          )}



          
         

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}

    

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
        
        </div>

        {/* Mobile Navigation Menu */}
        
      </div>





    </header>

    </>

  )
}