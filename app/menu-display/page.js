"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import CustomerHeaderMenu from "@/components/CustomerHeaderMenu"
import c from 'ansi-colors'
import {
  Search,
  ShoppingCart,
  X,
  RefreshCw,
  Clock,
  LoaderCircle 
} from "lucide-react"
import { useCart } from "@/context/CartContext"

import { Poppins } from 'next/font/google'

import localFont from "next/font/local";
import { verify } from "crypto"

const minigap = localFont({
  src: "../../public/fonts/minigap.ttf", 
  variable: "--font-minigap",  // optional CSS variable
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Add the weights you need
})

// Single unified component with header and menu functionality
export default function CustomerMenu() {
  const router = useRouter()

    const { cart, setCart ,addToCart, increaseQuantity, decreaseQuantity, updateQuantity } = useCart();

  // Menu state management
  const [menuItems, setMenuItems] = useState([])
    const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  // const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showCartButton, setShowCartButton] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: ""
  })
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [showMobileCategories, setShowMobileCategories] = useState(false)
  const [showOrderStatus, setShowOrderStatus] = useState(false)
  const [orderHistory, setOrderHistory] = useState([])
  const [devOtp, setDevOtp] = useState(null)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [otpInput, setOtpInput] = useState("")
  const [pendingOrderData, setPendingOrderData] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [tableStatus, setTableStatus] = useState("available")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLoader, setShowLoader] = useState(false)

  // Helper function to get category-specific default image
  const getDefaultImage = (category) => {
    const categoryImages = {
      'salad': '/images/salad-default.svg',
      'ramen': '/images/ramen-default.svg',
      'sushi': '/images/sushi-default.svg',
      'chinese': '/images/default-food.svg',
      'karaage_fried': '/images/default-food.svg',
      'seafood': '/images/default-food.svg',
      'pork': '/images/default-food.svg',
      'chicken': '/images/default-food.svg',
      'noodles': '/images/ramen-default.svg',
      'pasta': '/images/default-food.svg',
      'curry_rice': '/images/default-food.svg',
      'omurice_chahan': '/images/default-food.svg',
      'tempura': '/images/default-food.svg',
      'donburi': '/images/default-food.svg'
    }
    return categoryImages[category] || '/images/default-food.svg'
  }

  // Unified API call function
  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${token}`,
          ...options.headers,
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



  // Memoized cart calculations
  const cartItemCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart])
  const totalAmount = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2),
    [cart],
  )

  // Get language from localStorage
  const [language, setLanguage] = useState("en")
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory.toLowerCase() === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase()
      // console.log(`Selected category: ${selectedCategory}, Categores: ${item.category}`)
      const matchesSearch =
        item.name[language]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description[language]?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch && item.available
    })
  }, [menuItems, selectedCategory, searchTerm, language])



  useEffect(() => {
  const initializeData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      try {
        const categoriesData = await apiCall("/api/categories");
        if (categoriesData && Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }

      // Load order history + check table
      loadOrderHistory();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  initializeData();
}, []);



// ---------------------------
// 2. Paginated menu fetch
// ---------------------------
useEffect(() => {
  const fetchMenu = async () => {
    try {
      // setLoading(true);
      // console.log("Fetching page:", page); // Move this up
      
      const menuData = await apiCall(`/api/menu/pag?page=${page}&limit=20`);
      
      if (menuData && Array.isArray(menuData) && menuData.length > 0) {
        const formattedItems = menuData.map((item) => ({
          id: item._id || item.id,
          category: item.category?.toLowerCase(),
          name: typeof item.name === "object" ? item.name : {
            en: item.name,
            ja: item.nameJa || item.name,
          },
          price: item.price || 0,
          description: typeof item.description === "object" ? item.description : {
            en: item.description || "",
            ja: item.descriptionJa || item.description || "",
          },
          available: item.available !== false,
          prepTime: item.preparationTime || 10,
          image: item.image,
        }));

        // Check for duplicates before appending
        setMenuItems((prev) => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = formattedItems.filter(item => !existingIds.has(item.id));
          // console.log("Adding new items:", newItems.length);
          return [...prev, ...newItems];
        });

        // Update hasMore based on API response or item count
        if (menuData.hasMore !== undefined) {
          setHasMore(menuData.hasMore);
        } else {
          // Fallback: if we got less than requested, no more items
          setHasMore(menuData.length === 20);
        }
      } else {
        // console.log("No more items or empty response");
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      if (page === 1) setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (hasMore || page === 1) { // Always fetch page 1
    fetchMenu();
  }
}, [page]); // Remove hasMore from dependencies to avoid infinite loops


useEffect(() => {
  if (!loaderRef.current || !hasMore || loading) return;

  const currentRef = loaderRef.current;
  let timeoutId;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        // Debounce to prevent rapid firing
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // console.log("Intersection triggered, loading next page");
          setPage((prev) => prev + 1);
        }, 100);
      }
    },
    { 
      threshold: 1.0,
      rootMargin: '100px' // Load slightly before the element is visible
    }
  );

  observer.observe(currentRef);

  return () => {
    clearTimeout(timeoutId);
    observer.unobserve(currentRef);
    observer.disconnect();
  };
}, [hasMore, loading]);




  const handleItemClick = useCallback((item) => {
    router.push(`/menu-display/${item.id}`)
  }, [router])


  // Text translations
  const texts = {
    en: {
      title: "Hotel-POS",
      subtitle: "Digital Menu",
      searchPlaceholder: "Search menu items...",
      cart: "Cart",
      allItems: "All Items",
      yourOrder: "Your Order",
      cartEmpty: "Your cart is empty",
      total: "Total",
      placeOrder: "Order",
      completeOrder: "Complete Your Order",
      name: "Name",
      phone: "Phone Number",
      email: "Email Address",
      tableNumber: "Table Number",
      orderSummary: "Order Summary",
      cancel: "Cancel",
      available: "Available",
      unavailable: "Unavailable",
      addToCart: "Add to Cart",
      myOrders: "My Orders",
      categories: "Categories",
      verifyOrder: "Verify Your Order",
      verificationCode: "Verification Code",
      enterCode: "Enter code",
      verifyAndPlaceOrder: "Verify & Place Order",
      verifying: "Verifying...",
      enterVerificationCode: "Please enter the verification code sent to your email.",
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      noItemsFound: "No items found",
      refreshOrders: "Refresh Orders",
    },
    ja: {
      title: "アジュ インペリアル ホテル",
      subtitle: "デジタルメニュー",
      searchPlaceholder: "メニューを検索...",
      cart: "カート",
      allItems: "全商品",
      yourOrder: "ご注文",
      cartEmpty: "カートは空です",
      total: "合計",
      placeOrder: "注文する",
      completeOrder: "ご注文を完了",
      name: "お名前",
      phone: "電話番号",
      email: "メールアドレス",
      tableNumber: "テーブル番号",
      orderSummary: "注文概要",
      cancel: "キャンセル",
      available: "利用可能",
      unavailable: "利用不可",
      addToCart: "カートに追加",
      myOrders: "注文履歴",
      categories: "カテゴリー",
      verifyOrder: "注文を確認する",
      verificationCode: "確認コード",
      enterCode: "コードを入力",
      verifyAndPlaceOrder: "確認して注文する",
      verifying: "確認中...",
      enterVerificationCode: "メールに送信された確認コードを入力してください。",
      loading: "読み込み中...",
      error: "エラー",
      retry: "再試行",
      noItemsFound: "商品が見つかりません",
      refreshOrders: "注文を更新",
    },
  }

  const t = texts[language]



  // Luxury Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
        {/* Luxury Loading Header */}
        <div className="relative bg-gradient-to-r from-amber-900 via-yellow-800 to-amber-900 shadow-2xl">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10">

            <div className="relative h-[20vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-black">

            <div className="relative z-10 text-center py-4 sm:py-6 px-4 w-full">
              <div className="max-w-6xl mx-auto">
          {/* Main title with enhanced typography */}
          <div className="mb-2 sm:mb-3">
            <h1 className="text-3xl sm:text-4xl md:text-6xl text-white mb-2 tracking-wide font-light relative">
              <span className={`inline-block transform transition-all duration-700 hover:scale-105 ${minigap.className} font-bold text-amber-400`}>
                Hotel-POS
              </span>
            </h1>
          </div>

          {/* Decorative divider */}
          <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3 sm:mb-4"></div>

              </div>
            </div>

            <style jsx>{`
        @keyframes expandLine {
          0% {
            width: 0;
          }
          100% {
            width: 200px;
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 640px) {
          @keyframes expandLine {
            100% {
              width: 120px;
            }
          }
        }
            `}</style>
          </div>


          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white" />
              </div>
              <p className="text-white text-lg sm:text-xl font-light">{t.loading}</p>
              <div className="w-24 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"></div>
            </div>
          </div>
        </div>

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
              {true && <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />}
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        {true && (
          <div className="border-t border-gray-200 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
            <div className="max-w-7xl mx-auto">
              <div className="h-10 sm:h-12 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        )}
      </header>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black pb-3">
      {/* Luxury Header */}
      <div className="relative bg-gradient-to-r from-amber-900 via-yellow-800 to-amber-900 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10">
        

          <div className="relative h-auto flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-black">

            <div className="relative z-10 text-center py-6 sm:py-6 px-4 w-full">
              <div className="max-w-6xl mx-auto">
          {/* Main title with enhanced typography */}
          <div className="mb-2 sm:mb-3">
            <h1 className="text-3xl sm:text-4xl md:text-6xl text-white mb-2 tracking-wide font-light relative">
              <span className={`inline-block transform transition-all duration-700 hover:scale-105 ${minigap.className} font-bold text-amber-400`}>
                Hotel-POS
              </span>
            </h1>
          </div>

          {/* Decorative divider */}
          <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3 sm:mb-4"></div>

              </div>
            </div>

            <style jsx>{`
        @keyframes expandLine {
          0% {
            width: 0;
          }
          100% {
            width: 200px;
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 640px) {
          @keyframes expandLine {
            100% {
              width: 120px;
            }
          }
        }
            `}</style>
          </div>


        </div>
      </div>

      {/* Mobile-Friendly Category Filters */}
      <div className="sticky top-0 z-30 bg-black bg-opacity-80 backdrop-blur-sm border-b border-amber-600">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-1 py-0 text-sm font-medium transition-all ${
                selectedCategory === "all"
                  ? "text-white shadow-lg border-b border-amber-200"
                  : "bg-white bg-opacity-0 text-amber-200 hover:bg-opacity-20"
              }`}
            >
              {t.allItems}
            </button>
     
             {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex-shrink-0 px-1 mx-4 text-sm font-medium transition-all ${
                  selectedCategory === category.name
                    ? "text-white shadow-lg border-b border-amber-200"
                    : "bg-white bg-opacity-0 text-amber-200 hover:bg-opacity-20"
                }`}
              >
                {category.name[language] || category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Direct Product Display */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
              <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-amber-400 mb-4 sm:mb-6" />
              <p className="text-white text-lg sm:text-xl font-light">{t.noItemsFound}</p>
            </div>
          </div>
        )}

        {/* Direct Product Grid - Mobile First */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredItems.map((item) => {          
            const itemInCart = cart.find((cartItem) => cartItem.id === item.id)

            return(
              // <>
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="group min-h-[20vh] max-h-[20vh] sm:min-h-auto relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 hover:border-amber-300 cursor-pointer"
            >
              {/* Mobile-Optimized Card Image Header */}
              <div className="relative h-full w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 overflow-hidden">
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-20"></div>

                
                
                {/* Dynamic Image Display */}
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name[language] || item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      // If dynamic image fails, hide image and show fallback
                      e.target.style.display = 'none';
                      const fallbackDiv = e.target.parentElement.querySelector('.fallback-display');
                      if (fallbackDiv) {
                        fallbackDiv.style.display = 'flex';
                      }
                    }}
                  />
                )}

                
                
                {/* Fallback for items without dynamic images - show category-specific default image */}
                {!item.image && (
                  <img
                    src={getDefaultImage(item.category)}
                    alt={item.name[language] || item.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                )}
                <div className={`fallback-display relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-4 ${item.image && item.image !== '/placeholder.svg?height=200&width=200' && !item.image.includes('placeholder') ? 'hidden' : 'flex'}`}>
                </div>
                </div>
           
              <div className="absolute bottom-0 w-full">
                 {item.image && item.image !== '/placeholder.svg?height=200&width=200' && !item.image.includes('placeholder') && (
                  <div className="px-3 bg-gradient-to-t from-black via-black/70 to-transparent p-2 sm:p-3">
                    <h3 className="flex items-center justify-center text-xs sm:text-sm md:text-base text-white text-center leading-tight line-clamp-2">
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1"></span>
                      {item.name[language] || item.name}
                    </h3>
                  </div>
                )}
                {/* Price and Time - Mobile Layout */}
                <div className="flex items-center justify-between bg-white px-3">
                  {/* <div className="flex flex-row w-full items-center justify-between"> */}
                    <span className="text-md sm:text-lg md:text-xl font-medium text-gray-800">₹{item.price}</span>
                    <span className="text-sm text-gray-500 font-light">{item.prepTime}min</span>             
                </div>  

                {itemInCart ? (
                  <div className="bg-white text-amber-800 px-3 pb-1">
                  <div className="flex items-center justify-between bg-amber-100 text-amber-800 rounded-xl px-2 py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        decreaseQuantity(item.id)
                      }}
                      className="px-2 font-bold bg-red-600 text-white rounded-xl shadow hover:bg-amber-700 transition-all duration-300"
                    >
                      −
                    </button>
                    <span className="text-red-700 font-bold">{itemInCart.quantity}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        increaseQuantity(item.id)
                        // console.log("ON CLICK Increasing quantity for item:", item.id)
                      }}
                      className="px-2 font-bold bg-red-600 text-white rounded-xl shadow hover:bg-amber-700 transition-all duration-300"
                    >
                      +
                    </button>
                  </div>
                  </div>
                ) : (
       
                  null
                )}
              </div>  


              {/* Luxury Border Effect */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-0 transition-opacity duration-500 pointer-events-none"></div>

              </div>  
            )
          })}


</div>


{loading && page === 1 && <div className="text-center bg-red-700 w-full flex">Loading...</div>}
{loading && page > 1 && <div className="text-center bg-red-700 min-w-full flex text-white">Loading more...</div>}
{hasMore && !loading && (
  <div
    className="flex items-center justify-center w-full mt-8 text-white text-xl"
    ref={loaderRef}
  >
    <LoaderCircle className="w-7 h-7 mr-2 animate-spin" />
    Loading...
  </div>
)}
          

        {/* Show category count at bottom */}
        {filteredItems.length > 0 && (
          <div className="text-center mt-8 sm:mt-12">
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-full border border-amber-600">
              <span className="text-amber-200 text-sm sm:text-base font-medium">
                Showing {filteredItems.length} {language === "en" ? "dishes" : "料理が利用可能"}
              </span>
            </div>
          </div>
        )}
      </main>


{showLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}


    </div>
  )
}
