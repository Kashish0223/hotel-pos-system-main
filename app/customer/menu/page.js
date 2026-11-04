    "use client"

    import { useState, useEffect, useCallback, useMemo, useRef } from "react"
    import { useSearchParams, useRouter } from "next/navigation"
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
    import {useAlert} from '@/context/AlertContext'
    import { Poppins } from 'next/font/google'

    import localFont from "next/font/local";
    import {useAuthToken} from "@/lib/useAuthToken"
 

    const minigap = localFont({
      src: "../../../public/fonts/minigap.ttf", 
      variable: "--font-minigap",  // optional CSS variable
    });

    const poppins = Poppins({
      subsets: ['latin'],
      weight: ['400', '500', '600', '700'], // Add the weights you need
    })

    // Single unified component with header and menu functionality
    export default function CustomerMenu() {
      const searchParams = useSearchParams()
      const router = useRouter()
      const [tableNumber, setTableNumber] = useState(searchParams.get("table"))
      // let tableNumber = searchParams.get("table")
      // console.log(`Table Number: ${tableNumber}`)
        // const tableNumber = searchParams.get("table");
      const token = useAuthToken(); //112233
      const {showAlert} = useAlert();
      useEffect(() => {
        if (tableNumber) {
          localStorage.setItem("tableNumber", tableNumber);
        } else {
          const tn = localStorage.getItem("tableNumber");
          setTableNumber(tn)
          // console.log(`Got tablenum from local storage: ${tn}`)
        }
      }, [tableNumber]);


          const { cart, setCart ,addToCart, increaseQuantity, decreaseQuantity, updateQuantity } = useCart();

      // Menu state management
      const [menuItems, setMenuItems] = useState([])
     const [cursor, setCursor] = useState(null);
      const [hasMore, setHasMore] = useState(true);
      const loaderRef = useRef(null);

      const [categories, setCategories] = useState([])
      const [selectedCategory, setSelectedCategory] = useState("all")
      // const [cart, setCart] = useState([])
      const [showCart, setShowCart] = useState(false)
      const [showCartButton, setShowCartButton] = useState(true)
      const [searchTerm, setSearchTerm] = useState("")
      const [expandedOrderId, setExpandedOrderId] = useState(null)
      const [customerInfo, setCustomerInfo] = useState({
        name: "",
        phone: "",
        email: "",
        tableNumber: tableNumber || "",
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
      const [loadingMore, setLoadingMore] = useState(false)
      const [error, setError] = useState(null)
      const [showLoader, setShowLoader] = useState(false)
      const [isRefreshingOrders, setIsRefreshingOrders] = useState(false)
      // Add these new states near your other useState declarations
const [isFinalConfirm, setIsFinalConfirm] = useState(false);
const [partialAlerts, setPartialAlerts] = useState(null); // Store alerts from dry-run
const [isConfirmingPartial, setIsConfirmingPartial] = useState(false);
const [emailError, setEmailError] = useState("");

// Email validation function
const validateEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
};


const isOutOfStock = (item) => {
return item.itemType === "retail" && (item.currentStock ?? 0) <= 0;};

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
      // const apiCall = useCallback(async (url, options = {}) => {
      //   try {
      //     const response = await fetch(url, {
      //       headers: {
      //         "Content-Type": "application/json",
      //         "Authorization": `Bearer ${token}`,
      //         ...options.headers,
      //       },
      //       ...options,
      //     })

      //     if (!response.ok) {
      //       throw new Error(`HTTP error! status: ${response.status}`)
      //     }

      //     return await response.json()
      //   } catch (err) {
      //     console.error("API Error:", err)
      //     throw err
      //   }
      // }, [token])

      // Unified API call function — FIXED VERSION (Pure JavaScript)------------------------------LAST USED CODE--------------------------------------------
// const apiCall = useCallback(async (url, options = {}) => {
//   const headers = new Headers(options.headers || {});

//   // Only add Authorization header if we actually have a token
//   const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
//   const activeToken = token || storedToken;

//   if (activeToken) {
//     headers.set("Authorization", `Bearer ${activeToken}`);
//   }

//   // Set Content-Type to JSON only when there's a body and it's not already set
//   if (!headers.has("Content-Type") && options.body) {
//     headers.set("Content-Type", "application/json");
//   }

//   try {
//     const response = await fetch(url, {
//       ...options,
//       headers,
//     });

//     // if (!response.ok) {
//     //   // Gracefully handle 401 on customer pages (very common & expected)
//     //   if (response.status === 401 && !url.includes("/auth")) {
//     //     console.warn("401 on customer page – normal when no staff token");
//     //     // Return empty array for table/orders endpoints so UI doesn't break
//     //     if (url.includes("/tables") || url.includes("/orders")) {
//     //       return [];
//     //     }
//     //     return null;
//     //   }
//     //   throw new Error(`HTTP error! status: ${response.status}`);
//     // }

// if (!response.ok) {
//   if (response.status === 401) {
//     console.warn("401 on customer endpoint – treating as public access");

//     // Special case: public table lookup via QR code
//     if (url.includes("/tables") && url.includes("tableNumber=")) {
//       const match = url.match(/tableNumber=([^&]+)/);
//       const tn = match ? match[1] : tableNumber;
//       return [{ tableNumber: tn, status: "available", _id: "public" }];
//     }

//     // For orders/history on fresh session, return empty (safe)
//     if (url.includes("/orders")) {
//       return [];
//     }

//     // For other 401s, fall through to error
//   }
//   throw new Error(`HTTP error! status: ${response.status}`);
// }

//     return await response.json();
//   } catch (err) {
//     console.error("API Error:", url, err);

//     // Extra safety: if it's okay if these endpoints 401 on customer side
//     if (err.message && err.message.includes("401")) {
//       if (url.includes("/tables") || url.includes("/orders")) {
//         return [];
//       }
//     }

//     // Re-throw other errors so real problems are still visible
//     throw err;
//   }
// }, [token]);

const apiCall = useCallback(async (url, options = {}) => {
  const headers = new Headers(options.headers || {});

  const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const activeToken = token || storedToken;

  // === NEW: Do NOT send token for order placement flow ===
  const isOrderPlacementFlow =
    url.includes("/api/orders/send-otp") ||
    url.includes("/api/orders/verify-otp") ||
    (url.includes("/api/orders") && options.method === "POST" && options.body);

  if (activeToken && !isOrderPlacementFlow) {
    headers.set("Authorization", `Bearer ${activeToken}`);
  }
  // === END NEW ===

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("401 on customer endpoint – treating as public access");

        // Table lookup
        if (url.includes("/tables") && url.includes("tableNumber=")) {
          const match = url.match(/tableNumber=([^&]+)/);
          const tn = match ? decodeURIComponent(match[1]) : tableNumber;
          return [{ tableNumber: tn, status: "available", _id: "public" }];
        }

        // Order history – return empty (safe)
        if (url.includes("/orders")) {
          return [];
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("API Error:", url, err);

    if (err.message?.includes("401")) {
      if (url.includes("/tables") || url.includes("/orders")) {
        return [];
      }
    }
    throw err;
  }
}, [token, tableNumber]); // Add tableNumber to deps because we use it in fallback


// 150 -221


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
        let test =  menuItems.filter((item) => {
          const matchesCategory = selectedCategory.toLowerCase() === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase()
          // console.log(`Selected category: ${selectedCategory}, Categores: ${item.category}`)
          const matchesSearch =
            item.name[language]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description[language]?.toLowerCase().includes(searchTerm.toLowerCase())
          return matchesCategory && matchesSearch && item.available
        })
        // console.log(`new Filtered Items are: ${JSON.stringify(test,(key, value) => {
        //   if(typeof value === 'string' && value.startsWith('data:image')) return "Url_Truncated"
        //   return value
        // },2)}`)
        return test;
      }, [menuItems, selectedCategory, searchTerm, language])


      const groupedItems = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
          const categoryName = categories.find((cat) => cat.id === item.category)?.name[language] || item.category
          if (!acc[categoryName]) {
            acc[categoryName] = []
          }
          acc[categoryName].push(item)
          return acc
        }, {})
      }, [filteredItems, categories, language])

      const [loadingTaxes, setLoadingTaxes] = useState(false);
      const [addedTax, setAddedTax] = useState(0);
      const [onlyTax, setOnlyTax] = useState(0);
      const [taxes, setTaxes] = useState([]);

      const getSubtotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0)
      
      // const fetchTaxes = useCallback(async () => {
      //   if(!token) return;
      //   try {
      //     setLoadingTaxes(true)
      //     const response = await fetch("/api/taxes?active=true")
      //     const data = await response.json()
      //     setTaxes(Array.isArray(data) ? data : [])
      //   } catch (error) {
      //     console.error("Error fetching taxes:", error)
      //     setTaxes([])
      //   } finally {
      //     setLoadingTaxes(false)
      //   }
      // }, [token])

      useEffect(() => {
        // fetchTaxes();
        const initializeData = async () => {
          // if(!token) return;
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

            // Load order history from server + check table
            if (tableNumber) {
              await fetchOrderHistory();
              await checkTableStatus();
            }
          } catch (error) {
            setError(error.message);
          } finally {
            setLoading(false);
          }
        };

        initializeData();
      }, [ apiCall, tableNumber]);
      // }, [token, apiCall, tableNumber, fetchTaxes]);

      //===============================Addding Taxes================




      
      const getTaxLines = () => {
        // const subtotal = addedTax
        const subtotal = getSubtotal()
        // console.log(`Subtotal: ${subtotal} and taxes: ${JSON.stringify(taxes,null,2)}`)
        return taxes.map((tax) => {
          const isPercentage = tax.type === "percentage"
          const amount = isPercentage ? (subtotal * Number(tax.rate || 0)) / 100 : Number(tax.rate || 0)
        
          return {
            id: tax._id,
            name: tax.name || (isPercentage ? `Tax ${tax.rate}%` : `Tax ₹${tax.rate}`),
            label: isPercentage ? `${tax.name || "Tax"} ${tax.rate}%` : `${tax.name || "Tax"}`,
            amount,
          }
        })
      }


      useEffect(() => {
      const finalAmount = cart.reduce(
        (acc, item) => {
          const itemTax = (item.price * (item.tax || 0) / 100) * item.quantity;
          const itemTotal = (item.price * item.quantity) + itemTax;

          const updated = {
            withTax: acc.withTax + itemTotal,
            withoutTax: acc.withoutTax + itemTax,
          };

          return updated;
        },
        { withTax: 0, withoutTax: 0 } // initial value is always an object
      );

      setAddedTax(finalAmount.withTax);
      setOnlyTax(finalAmount.withoutTax);
    }, [cart]);


      const getTotalTaxAmount = () => getTaxLines().reduce((sum, t) => sum + t.amount, 0)
      const getTotalAmount = () => getSubtotal() + getTotalTaxAmount()





    // ---------------------------
    // 2. Paginated menu fetch
    // ---------------------------
    // useEffect(() => {
    //   const fetchMenu = async () => {
    //     try {
    //       setLoading(true);
    //       // console.log("Fetching page:", page); // Move this up
          
    //       const menuData = await apiCall(`/api/menu/pag?page=${page}&limit=20`);

    //       // console.log(`Menu Data: ${JSON.stringify(menuData, (key, value) => {
    //       //   if(typeof value === 'string' && value.startsWith('data:image')) return "Url_Truncated"
    //       //   return value
    //       // },2)}}`)
          
    //       if (menuData && Array.isArray(menuData) && menuData.length > 0) {
    //         const formattedItems = menuData.map((item) => ({
    //           id: item._id || item.id,
    //           category: item.category?.toLowerCase(),
    //           // name: typeof item.name === "object" ? item.name : {
    //           //   en: item.name,
    //           //   ja: item.nameJa || item.name,
    //           // },
    //           name: typeof item.name === "object" ? item.name.en || item.name.ja : item.name || item.nameEn,
    //           price: item.price || 0,
    //           description: typeof item.description === "object" ? item.description : {
    //             en: item.description || "",
    //             ja: item.descriptionJa || item.description || "",
    //           },
    //           // description: typeof item.description === "object" ? item.description.en || item.description.ja : item.description || item.descriptionEn,
    //           available: item.available !== false,
    //           prepTime: item.preparationTime || 10,
    //           image: item.image,
    //           itemType: item.itemType,
    //           tax: item.tax  || 0
    //         }));

    //         // Check for duplicates before appending
    //         setMenuItems((prev) => {
    //           const existingIds = new Set(prev.map(item => item.id));
    //           const newItems = formattedItems.filter(item => !existingIds.has(item.id));
    //           // console.log("Adding new items:", newItems.length);
    //           return [...prev, ...newItems];
    //         });

    //         // Update hasMore based on API response or item count
    //         if (menuData.hasMore !== undefined) {
    //           setHasMore(menuData.hasMore);
    //         } else {
    //           // Fallback: if we got less than requested, no more items
    //           setHasMore(menuData.length === 20);
    //         }
    //       } else {
    //         // console.log("No more items or empty response");
    //         setHasMore(false);
    //       }
    //     } catch (error) {
    //       console.error("Error fetching menu items:", error);
    //       if (page === 1) setMenuItems([]);
    //     } finally {
    //       setLoading(false);
    //     }
    //   };
                                      
    //   if (hasMore || page === 1) { // Always fetch page 1
    //     fetchMenu();
    //   }
    // }, [page, apiCall]); // Remove hasMore from dependencies to avoid infinite loops

    // -------------------comment because only load 20 data---------------------------------------
//     useEffect(() => {
//   const fetchMenu = async () => {
//     try {
//       // setLoading(true);
//       if (page === 1) {
//        setLoading(true);
//      } else {
//        setLoadingMore(true);
//      }
//       const response = await apiCall(`/api/menu?limit=20`);
//       // const response = await apiCall(`/api/menu/pag?page=${page}&limit=20`);
      
//       // response is now { items: [...], hasMore: boolean, ... }
//       const menuItemsArray = response?.items || [];
      
//       if (Array.isArray(menuItemsArray) && menuItemsArray.length > 0) {
//         const formattedItems = menuItemsArray.map((item) => ({
//           id: item._id || item.id,
//           category: item.category?.toLowerCase(),
//           name: typeof item.name === "object" ? item.name.en || item.name.ja : item.name || item.nameEn,
//           price: item.price || 0,
//           description: typeof item.description === "object" ? item.description : {
//             en: item.description || "",
//             ja: item.descriptionJa || item.description || "",
//           },
//           available: item.available !== false,
//           prepTime: item.preparationTime || 10,
//           image: item.image,
//           itemType: item.itemType,
//           tax: item.tax || 0,
//           currentStock: item.currentStock ?? 0, // ← Important for stock display
//         }));
        
//         setMenuItems((prev) => {
//           const existingIds = new Set(prev.map(item => item.id));
//           const newItems = formattedItems.filter(item => !existingIds.has(item.id));
//           return [...prev, ...newItems];
//         });
        
//         // Use hasMore from response
//         setHasMore(response.hasMore ?? false);
//       } else {
//         setHasMore(false);
//       }
//     } catch (error) {
//       console.error("Error fetching menu items:", error);
//       if (page === 1) setMenuItems([]);
//       setHasMore(false);
//     } finally {
//       setLoading(false);
//      if (page === 1) {
//        setLoading(false);
//      } else {
//        setLoadingMore(false);
//      }
//     }
//     }
  
  
//   if (hasMore || page === 1) {
//     fetchMenu();
//   }
// }, [page, apiCall]);

      const fetchMenu = useCallback(async () => {
        // Prevent duplicate calls
        if (loading || loadingMore) return;
        
        try {
          if (!cursor) {
            setLoading(true);
          } else {
            setLoadingMore(true);
          }

          const params = new URLSearchParams({
            limit: "20",
          });

          if (cursor) {
            params.set("cursor", cursor);
          }

          const url = `/api/menu?${params.toString()}`;
          const response = await apiCall(url);

          const menuItemsArray = response?.items || [];
          const nextCursor = response?.nextCursor || null;

          if (Array.isArray(menuItemsArray) && menuItemsArray.length > 0) {
            const formattedItems = menuItemsArray.map((item) => ({
              id: item._id || item.id,
              category: item.category?.toLowerCase(),
              name: typeof item.name === "object" ? item.name.en || item.name.ja : item.name || item.nameEn,
              price: item.price || 0,
              description: typeof item.description === "object" ? item.description : {
                en: item.description || "",
                ja: item.descriptionJa || item.description || "",
              },
              available: item.available !== false,
              prepTime: item.preparationTime || 10,
              image: item.image,
              itemType: item.itemType,
              tax: item.tax || 0,
              currentStock: item.currentStock ?? 0,
            }));

            setMenuItems((prev) => {
              const existingIds = new Set(prev.map(i => i.id));
              const newItems = formattedItems.filter(item => !existingIds.has(item.id));
              return [...prev, ...newItems];
            });

            setHasMore(!!nextCursor);
            setCursor(nextCursor);
          } else {
            setHasMore(false);
          }
        } catch (error) {
          console.error("Error fetching menu items:", error);
          if (!cursor) setMenuItems([]);
          setHasMore(false);
        } finally {
          setLoading(false);
          setLoadingMore(false);
        }
      }, [cursor, apiCall, loading, loadingMore]);

      useEffect(() => {
        // Reset and fetch when filters change
        setMenuItems([]);
        setCursor(null);
        setHasMore(true);
        // We don't call fetchMenu directly here because the effect below 
        // will handle it when cursor is null and menuItems is empty
      }, [searchTerm, selectedCategory]);

      useEffect(() => {
        // Only run initial fetch
        if (!cursor && menuItems.length === 0) {
          fetchMenu();
        }
      }, [fetchMenu, cursor, menuItems.length]);

      useEffect(() => {
        if (!loaderRef.current || !hasMore || loading || loadingMore) return;

        const currentRef = loaderRef.current;

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
              fetchMenu();
            }
          },
          { 
            threshold: 0.1,
            rootMargin: '200px'
          }
        );

        observer.observe(currentRef);

        return () => {
          observer.unobserve(currentRef);
          observer.disconnect();
        };
      }, [hasMore, loading, loadingMore, fetchMenu]);

      // Update customer info when table number changes
      useEffect(() => {
        setCustomerInfo((prev) => ({ ...prev, tableNumber: tableNumber || "" }))
      }, [tableNumber])

      // Periodic order status check (server-sourced, no localStorage)
      useEffect(() => {
        if (!tableNumber) return

      const checkAllOrdersStatus = async () => {
        try{
          await checkTableStatus()
          const orders = await fetchOrderHistory()
          const activeOrders = orders.filter((order) => order.status !== "completed" && order.status !== "cancelled")

          if (activeOrders.length > 0 && tableStatus !== "occupied") {
            await updateTableStatus("occupied")
          }

          if (activeOrders.length === 0 && tableStatus !== "available") {
            await updateTableStatus("available")
          }

          for (const order of activeOrders) {
            await checkOrderStatus(order.id)
          }
        }catch (err) {
           console.warn("Error in periodic order check (safe to ignore):", err);
      // Don't crash the whole customer menu if something fails here
      }

        checkAllOrdersStatus()
        const intervalId = setInterval(checkAllOrdersStatus, 30000)
        return () => clearInterval(intervalId)
      }}, [tableNumber, tableStatus]);



      const handleItemClick = useCallback((item) => {
        const queryParams = tableNumber ? `?table=${tableNumber}` : ''
        router.push(`/customer/menu/${item.id}${queryParams}`)
      }, [router, tableNumber])


      const checkTableStatus = async () => {
        if (!tableNumber) return;
        try {
          const tables = await apiCall(`/api/tables?tableNumber=${tableNumber}`)
          if (tables && tables.length > 0) {
            const table = tables[0]
            setTableStatus(table.status || "available")
            return table.status
          }
        } catch (error) {
          console.error("Error checking table status:", error)
        }

        return "available"
      }

      const updateTableStatus = async (status) => {
        if (!tableNumber) return     

        try {
          const tables = await apiCall(`/api/tables?tableNumber=${tableNumber}`)
          if (tables && tables.length > 0) {
            const table = tables[0]
            await apiCall(`/api/tables/${table._id}`, {
              method: "PATCH",
              body: JSON.stringify({ status }),
            })
            setTableStatus(status)
          }
        } catch (error) {
          console.error("Error updating table status:", error)
        }
      }

      const checkOrderStatus = async (orderId) => {
        try {
          const data = await apiCall(`/api/orders/${orderId}`)
          const orderHistory = JSON.parse(localStorage.getItem("customerOrderHistory") || "[]")
          const updatedHistory = orderHistory.map((o) => (o.id === orderId ? { ...o, status: data.status } : o))
          localStorage.setItem("customerOrderHistory", JSON.stringify(updatedHistory))
      //  console.log(`Updated order history: ${JSON.stringify(updatedHistory, null, 2)}`)
          if (data.status === "completed" || data.status === "cancelled") {
            const allOrders = JSON.parse(localStorage.getItem("customerOrderHistory") || "[]")
            const activeOrders = allOrders.filter(
              (o) => o.table === tableNumber && o.id !== orderId && o.status !== "completed" && o.status !== "cancelled",
            )

            if (activeOrders.length === 0) {
              await updateTableStatus("available")
            }
          }

          return data
        } catch (error) {
          console.error("Error checking order status:", error)
        }
        return null
      }

      // Live order updates via SSE: auto-refresh order statuses without manual refresh
      useEffect(() => {
        const es = new EventSource('/api/events');

        const onUpdate = async (e) => {

          // console.log('Order update listened')
          // showAlert("error", "OTP Error", 'Failed to verify OTP. Please try again.', [{text: "Okay"}])


          try {
            const payload = JSON.parse(e.data);
            const updatedId = payload?.id || payload?.orderId
            if (!updatedId) return;

            // Only react to orders related to this table
            if (payload.tableNumber && String(payload.tableNumber) !== String(tableNumber)) return;

            // Refetch orders for this table from server (authoritative)
            await fetchOrderHistory();

            // alert('heelow')

            // If finished/cancelled, re-check table status
            if (["completed", "cancelled", "delivered"].includes(payload.status)) {
              checkTableStatus();
            }
          } catch (err) {
            console.error('orders:update parse error', err);
          }
        };

        es.addEventListener('orders:update', onUpdate);

        return () => {
          es.removeEventListener('orders:update', onUpdate);
          es.close();
        };
      }, [tableNumber]);

      // Fetch order history from server for current table
      const fetchOrderHistory = async (emailOverride = null) => {
        // if (!token) return;
        if (!tableNumber) return []
        const customerEmail = emailOverride || localStorage.getItem("customerEmail") || customerInfo.email
        
        const emailParam = customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : '';

        // if (!customerEmail) return []
        try {
          const orders = await apiCall(`/api/orders?tableNumber=${encodeURIComponent(tableNumber)}&history=true${emailParam}`)
          // console.log(`Fetched order history: ${JSON.stringify(orders, null, 2)}`)
          // Normalize to shape used in UI
          const orderArray = Array.isArray(orders) ? orders : [];
          const normalized = (orderArray).map(o => ({
            id: o._id || o.id,
            orderNumber: o.orderNumber || (o._id ? String(o._id).slice(-6) : ''),
            date: o.createdAt,
            status: o.status,
            total: o.totalAmount || o.total,
            items: (o.items || o.orderItems || []).length,
            orderItems: o.items || o.orderItems || [],
            table: o.tableNumber || o?.customerInfo?.table || tableNumber,
          }))

        // De-duplicate by ID
    const uniqueIds = new Set();
    const uniqueOrders = normalized.filter((order) => {
      if (uniqueIds.has(order.id)) return false;
      uniqueIds.add(order.id);
      return true;
    });
    // Show ONLY after final confirm (exclude pending)
    // const confirmedOrders = uniqueOrders.filter((order) => order.status !== "pending");
    // Show all orders that are not yet completed or cancelled
const confirmedOrders = uniqueOrders.filter(
  (order) => !["completed", "cancelled"].includes(order.status)
);
    // Sort newest first
    confirmedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    setOrderHistory(confirmedOrders);
    return confirmedOrders;
        } catch (error) {
          console.error("Error fetching order history:", error)
          setOrderHistory([])
          return [];
        }
      }

// const handlePlaceOrder = async (e) => {
//   e.preventDefault();
//   setShowLoader(true);

//   // === Email Validation ===
//   if (!validateEmail(customerInfo.email)) {
//     showAlert("error", "Invalid Email", "Please enter a valid email address.", [{ text: "Okay" }]);
//     setShowLoader(false);
//     return;
//   }
//   if (cart.length === 0) {
//     showAlert("error", "Cart Empty", "Please add items to your cart.", [{ text: "Okay" }]);
//     setShowLoader(false);
//     return;
//   }

//   if (!customerInfo.email) {
//     showAlert("error", "Email Required", "Please enter your email.", [{ text: "Okay" }]);
//     setShowLoader(false);
//     return;
//   }

//   try {
//     // === DRY RUN: Check stock ===
//     const dryRunPayload = {
//       items: cart,
//       customerInfo,
//       orderType: "dine-in",
//       source: "qr-code",
//       isFinalConfirm: false,
//       paymentMethod: "pending",
//     };

//     const dryRunResponse = await apiCall("/api/orders", {
//       method: "POST",
//       body: JSON.stringify(dryRunPayload),
//     });

//     // === PARTIAL STOCK: Handle gracefully ===
//     if (dryRunResponse.partialAlerts && dryRunResponse.partialAlerts.length > 0) {
//       const alerts = dryRunResponse.partialAlerts;

//       // Update cart to available quantities
//       const updatedCart = cart
//         .map((cartItem) => {
//           const alert = alerts.find((a) => a.name === cartItem.name);
//           if (alert) {
//             return { ...cartItem, quantity: Math.max(0, alert.available) };
//           }
//           return cartItem;
//         })
//         .filter((item) => item.quantity > 0);

//       setCart(updatedCart);

//       const messages = alerts
//         .map((a) => `${a.name}: Only ${a.available} available (you requested ${a.requested})`)
//         .join("\n");

//       showAlert(
//         "warning",
//         "Low Stock – Cart Updated",
//         `${messages}\n\nYour cart has been automatically adjusted to available stock.\n\nPlease review and place order again to continue.`,
//         [{ text: "Got it" }]
//       );

//       setShowLoader(false);
//       setShowOrderForm(false); // Close form so user sees updated cart
//       return;
//     }

//     // === FULL STOCK: Send OTP ===
//     const otpData = await apiCall("/api/orders/send-otp", {
//       method: "POST",
//       body: JSON.stringify({
//         email: customerInfo.email,
//         orderItems: cart,
//         totalAmount: Number(getTotalAmount().toFixed(0)) + Number(onlyTax),
//         customerInfo,
//         tableNumber: customerInfo.tableNumber,
//         orderType: "dine-in",
//         source: "qr-code",
//         language,
//         paymentStatus: "unpaid",
//         paymentMethod: "pending",
//         itemTaxes: onlyTax,
//       }),
//     });

//     if (otpData.development?.otp) {
//       setDevOtp(otpData.development.otp);
//     }

//     setPendingOrderData({
//       customerInfo,
//       items: cart,
//       totalAmount: Number(getTotalAmount().toFixed(0)) + Number(onlyTax),
//       tableNumber: customerInfo.tableNumber,
//     });

//     setShowOrderForm(false);
//     setShowOtpVerification(true);
//     setShowLoader(false);

//   } catch (error) {
//     console.error("Order placement error:", error);
//     showAlert("error", "Failed", "Unable to place order. Please try again.", [{ text: "Okay" }]);
//     setShowLoader(false);
//   }
// };
        //   const generateBill = async (orderId, status) => {
        //   try {
        //     const response = await fetch("/api/bills/generate", {
        //       method: "POST",
        //       headers: {
        //         "Content-Type": "application/json",
        //         "Authorization": `Bearer ${token}`
        //       },
        //       body: JSON.stringify({ orderId, status }),
        //     })

        //     if (response.ok) {
        //       const bill = await response.json()
        //       // setSelectedBill(bill)
        //       // setShowBillModal(true)
        //       // fetchBills()
        //     }
        //   } catch (error) {
        //     console.error("Error generating bill:", error)
        //   }
        // }

      // ===== Invoice helpers (aligned with Account page) =====
   
   const handlePlaceOrder = async (e) => {
  e.preventDefault();
  setShowLoader(true);

  if (!validateEmail(customerInfo.email)) {
    showAlert("error", "Invalid Email", "Please enter a valid email address.", [{ text: "Okay" }]);
    setShowLoader(false);
    return;
  }

  if (cart.length === 0) {
    showAlert("error", "Cart Empty", "Please add items to your cart.", [{ text: "Okay" }]);
    setShowLoader(false);
    return;
  }

  try {
    const response = await apiCall("/api/orders/send-otp", {
      method: "POST",
      body: JSON.stringify({
        email: customerInfo.email,
        orderItems: cart,
        totalAmount: Number(getTotalAmount().toFixed(0)) + Number(onlyTax),
        customerInfo,
        tableNumber: customerInfo.tableNumber,
        orderType: "dine-in",
        source: "qr-code",
        language,
        paymentStatus: "unpaid",
        paymentMethod: "pending",
        itemTaxes: onlyTax,
      }),
    });

    // === PARTIAL STOCK DETECTED ===
    if (response.partialAlerts && response.partialAlerts.length > 0) {
      const alerts = response.partialAlerts;

      // Update cart with adjusted quantities
      if (response.adjustedItems) {
        setCart(response.adjustedItems.filter(item => item.quantity > 0));
      }

      const messages = alerts
        .map(a => 
          a.outOfStock 
            ? `${a.name}: Out of stock (requested ${a.requested})`
            : `${a.name}: Only ${a.available} available (requested ${a.requested})`
        )
        .join("\n");

      showAlert(
        "warning",
        "Stock Updated",
        `${messages}\n\nYour cart has been adjusted to available stock.\n\nPlease review and confirm to proceed.`,
        [{ text: "OK" }]
      );

      setShowLoader(false);
      setShowOrderForm(false); // Close form so user sees updated cart
      return;
    }

    // === FULL STOCK → Show OTP Modal ===
    if (response.success) {
      if (response.development?.otp) {
        setDevOtp(response.development.otp);
      }

      setPendingOrderData({
        customerInfo,
        items: cart,
        totalAmount: Number(getTotalAmount().toFixed(0)) + Number(onlyTax),
        tableNumber: customerInfo.tableNumber,
      });

      setShowOrderForm(false);
      setShowOtpVerification(true);
    }

  } catch (error) {
    console.error("Error:", error);
    showAlert("error", "Failed", "Unable to process order. Please try again.", [{ text: "Okay" }]);
  } finally {
    setShowLoader(false);
  }
};

      const formatINR = (amount) => {
        try {
          return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
        } catch (e) {
          return `₹${Number(amount || 0).toLocaleString()}`
        }
      }

      const computeInvoice = (order) => {
        const items = order?.orderItems || []
        const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
        const reportedTotal = Number(order.total || order.totalAmount || 0)
        const total = reportedTotal > 0 ? reportedTotal : subtotal
        return { subtotal, total }
      }

      const handleDownloadInvoice = (order) => {
        const { subtotal, total } = computeInvoice(order)
        const itemsRows = (order?.orderItems || []).map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item?.name ?? item?.nameEn ?? item?.name?.en ?? item?.name?.ja ?? ""}</td>
            <td style="text-align:right;">${Number(item?.quantity || 1)}</td>
            <td style="text-align:right;">${formatINR(Number(item?.price || 0))}</td>
            <td style="text-align:right;">${formatINR((Number(item?.price || 0)) * (Number(item?.quantity || 1)))}</td>
          </tr>
        `).join('')
        const dateStr = new Date(order.date).toLocaleString(language === 'en' ? 'en-US' : 'ja-JP')
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice #${order.orderNumber}</title>
          <style> body{font-family: Arial, sans-serif; padding:24px; color:#111;}
            h1{margin:0 0 8px 0;} .muted{color:#666; font-size:12px;}
            table{width:100%; border-collapse:collapse; margin-top:12px;}
            th, td{border:1px solid #ddd; padding:8px; font-size:12px;}
            th{background:#f8f8f8; text-align:left;}
            .totals{margin-top:12px; width:100%; max-width:420px; margin-left:auto;}
            .totals td{border:none; padding:6px 0; font-size:13px;}
            .totals tr:last-child td{border-top:1px solid #ddd; font-weight:700; padding-top:10px;}
          </style></head><body>
            <div>
              <h1>Invoice</h1>
              <div class="muted">Order #${order.orderNumber} • ${dateStr}</div>
            </div>
            <div style="margin-top:16px;">
              <table>
                <thead><tr><th>#</th><th>Item</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Amount</th></tr></thead>
                <tbody>${itemsRows}</tbody>
              </table>
              <table class="totals">
                <tr><td>Subtotal</td><td style="text-align:right;">${formatINR(subtotal)}</td></tr>
                <tr><td>Total</td><td style="text-align:right;">${formatINR(total)}</td></tr>
              </table>
              <div class="muted" style="margin-top:12px;">Thank you for your order.</div>
            </div>
            <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
          </body></html>`
        const w = window.open('', '_blank')
        if (!w) {
          return showAlert("error", "Pop-up Blocked", 'Please allow pop-ups to download the invoice.', [{text: "Okay"}])
        }
        w.document.open()
        w.document.write(html)
        w.document.close()
        w.focus()
      }
      // ===== End invoice helpers =====

      const handleVerifyOTP = async () => {
          // if (!token) return;
        if (!otpInput || otpInput.length < 6) {
          showAlert("error", "OTP Error", language === "en" ? "Please enter the verification code" : "確認コードを入力してください", [{text: "Okay"}])
          return
        }

        if (!pendingOrderData) {
          showAlert("error", "Order Error", language === "en" ? "Order data not found. Please try again." : "注文データが見つかりません。もう一度お試しください。", [{text: "Okay"}])
          return
        }

        setIsVerifying(true)

        try {
          const verifyResult = await apiCall("/api/orders/verify-otp", {
            method: "POST",
            headers:{
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              email: customerInfo.email,
              otp: otpInput,
            }),
          })

          if (verifyResult.orderId && verifyResult.token) {
            // === FINAL CONFIRM: Now place real order with isFinalConfirm: true ===
      const finalPayload = {
        orderId: verifyResult.orderId,
        items: pendingOrderData.items,
        customerInfo: pendingOrderData.customerInfo,
        orderType: pendingOrderData.orderType,
        source: pendingOrderData.source || "qr-code",
        paymentMethod: "pending",
        isFinalConfirm: true, // ← Critical: saves order + deducts stock
        partialOrder: isConfirmingPartial,
        subtotal: getSubtotal().toFixed(2),
        itemTaxes: onlyTax.toFixed(2),
        totalAmount: pendingOrderData.totalAmount,
        taxes: getTaxLines().map(t => ({ ...t, amount: Number(t.amount) })),
      };

      const finalOrderResponse = await apiCall("/api/orders", {
        method: "POST",
        body: JSON.stringify(finalPayload),
      });

      if (!finalOrderResponse.success) {
        throw new Error(finalOrderResponse.error || "Final order failed");
      }

      // generateBill(verifyResult.orderId, "unpaid")
      // await checkOrderStatus(verifyResult.orderId)
      await updateTableStatus("occupied")
            
      
            // Set customer as verified for account access
            localStorage.setItem("customerEmail", customerInfo.email)
            localStorage.setItem("customerVerified", "true")
            localStorage.setItem("token", verifyResult.token);  // ← ADD THIS: Store the token
            setCart([]);
            localStorage.removeItem("cart");
           window.location.reload(); // ← Simple & effective
            // After order is created, fetch latest orders from server and show modal
            await fetchOrderHistory(customerInfo.email)
            // Show success message with account link
            // const message = language === "en"
            //   ? `Order placed successfully! Order ID: ${verifyResult.orderId.slice(-6)}\n\nYou can view your order status and history in \"My Account\".`
            //   : `ご注文が正常に送信されました！注文番号: ${verifyResult.orderId.slice(-6)}\n\n「マイアカウント」で注文状況と履歴を確認できます。`;

            let message;
            let title = "Order Placed";

            if (finalOrderResponse.order?.partialOrder) {
              // Partial order success message
              message = language === "en"
                ? `Order placed successfully! (Partial)\n\nSome items were adjusted due to low stock, but your order has been confirmed.\n\nOrder ID: ${verifyResult.orderId.slice(-6)}\n\nCheck "My Account" for details.`
                : `ご注文が完了しました！（一部調整あり）\n\n在庫不足のため一部商品の数量を調整しましたが、ご注文は確定しました。\n\n注文番号: ${verifyResult.orderId.slice(-6)}\n\n「マイアカウント」で詳細をご確認ください。`;
              title = "Order Placed (Partial)";
            } else {
              // Normal full order
              message = language === "en"
                ? `Order placed successfully!\n\nOrder ID: ${verifyResult.orderId.slice(-6)}\n\nYou can view your order status and history in "My Account".`
                : `ご注文が正常に送信されました！\n\n注文番号: ${verifyResult.orderId.slice(-6)}\n\n「マイアカウント」で注文状況と履歴を確認できます。`;
            }

            showAlert("success", title, message, [{ text: "Okay" }]);

            showAlert("success", "Order Placed", message, [{text: "Okay"}])

            setCart([])
            setShowCart(false)
            setShowOtpVerification(false)
            setShowOrderForm(false);
            setDevOtp(null)
            setOtpInput("")
            setPendingOrderData(null)
            setIsFinalConfirm(false);
      setPartialAlerts(null);
      setIsConfirmingPartial(false);

            setTimeout(() => setShowOrderStatus(true), 500)
          }
        } catch (error) {
          console.error("Error verifying OTP:", error)
          // alert(
          //   language === "en" ? "Failed to place order. Please try again." : "注文に失敗しました。もう一度お試しください。",
          // )
          showAlert("error", "Verification Error", language === "en" ? "Failed to place order. Please try again." : "注文に失敗しました。もう一度お試しください。", [{text: "Okay"}])
        } finally {
          setIsVerifying(false)
        }
      }



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
      // if (loading) {
      //   return (
      //     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      //       {/* Luxury Loading Header */}
      //       <div className="relative bg-gradient-to-r from-amber-900 via-yellow-800 to-amber-900 shadow-2xl">
      //         <div className="absolute inset-0 bg-black opacity-20"></div>
      //         <div className="relative z-10">

      //           <div className="relative h-[20vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-black">

      //           <div className="relative z-10 text-center py-4 sm:py-6 px-4 w-full">
      //             <div className="max-w-6xl mx-auto">
      //         {/* Main title with enhanced typography */}
      //         <div className="mb-2 sm:mb-3">
      //           <h1 className="text-3xl sm:text-4xl md:text-6xl  text-white mb-2 tracking-wide font-light relative">
      //             <span className={`inline-block transform transition-all duration-700 hover:scale-105 ${minigap.className} font-bold text-amber-400`}>
      //               Hotel-POS
      //             </span>
      //           </h1>
      //         </div>

      //         {/* Decorative divider */}
      //         <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3 sm:mb-4"></div>

      //         {/* Subtitle with improved styling */}
      //         {/* <p className="text-lg sm:text-xl md:text-2xl text-amber-200 font-light tracking-widest mb-4 sm:mb-6 opacity-90">
      //           CULINARY EXCELLENCE
      //         </p> */}

      //         {/* Enhanced table number display */}
      //         {tableNumber && (
      //           <div className="mt-4 mb-4 sm:mt-6">
      //             <div className="inline-flex items-center px-4 sm:px-6 py-2 bg-black bg-opacity-30 rounded-full border border-amber-400">
      //               <span className="text-amber-300 font-medium text-sm sm:text-base">Table {tableNumber}</span>
      //             </div>
      //           </div>
      //         )}
      //             </div>
      //           </div>

      //           <style jsx>{`
      //       @keyframes expandLine {
      //         0% {
      //           width: 0;
      //         }
      //         100% {
      //           width: 200px;
      //         }
      //       }
            
      //       @keyframes fadeInUp {
      //         0% {
      //           opacity: 0;
      //           transform: translateY(30px);
      //         }
      //         100% {
      //           opacity: 1;
      //           transform: translateY(0);
      //         }
      //       }
            
      //       @media (max-width: 640px) {
      //         @keyframes expandLine {
      //           100% {
      //             width: 120px;
      //           }
      //         }
      //       }
      //           `}</style>
      //         </div>


      //         </div>
      //       </div>

            // <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
            //   <div className="text-center">
            //     <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
            //       <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            //         <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white" />
            //       </div>
            //       <p className="text-white text-lg sm:text-xl font-light">{t.loading}</p>
            //       <div className="w-24 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"></div>
            //     </div>
            //   </div>
            // </div>

      //       <div className="sticky bottom-3">
      //        <div className="sticky top-0 bg-transparent px-4 pb-0">
      //         <header className="bg-[#0c1222] shadow-lg z-50 mx-[4vw] px-2 rounded-lg border border-gray-500">
      //        <div className="max-w-7xl  px-4 sm:px-4 md:px-6 lg:px-8">
      //         <div className="flex justify-between items-center py-2">
      //           <div className="lg:hidden w-full">
      //             <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-200 rounded-xl animate-pulse mr-2 sm:mr-3" />
      //             <div>
      //               <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-32 sm:w-48 mb-2" />
      //               <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-24 sm:w-32 hidden sm:block" />
      //             </div>
      //           </div>
      //           <div className="hidden lg:flex items-center space-x-2">
      //             {[...Array(5)].map((_, i) => (
      //               <div key={i} className="h-8 bg-gray-200 rounded animate-pulse w-20" />
      //             ))}
      //           </div>
      //           <div className="lg:hidden flex items-center space-x-2">
      //             {true && <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />}
      //             <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
      //           </div>
      //         </div>
      //        </div>
      //        {true && (
      //         <div className="border-t border-gray-200 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
      //           <div className="max-w-7xl mx-auto">
      //             <div className="h-10 sm:h-12 bg-gray-200 rounded-xl animate-pulse" />
      //           </div>
      //         </div>
      //        )}
      //         </header>
      //        </div>
      //       </div>
      //     </div>
      //   )
      // }

      if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col justify-between">
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

                    {/* Enhanced table number display */}
                    {tableNumber && (
                      <div className="mt-4 mb-4 sm:mt-6">
                        <div className="inline-flex items-center px-4 sm:px-6 py-2 bg-black bg-opacity-30 rounded-full border border-amber-400">
                          <span className="text-amber-300 font-medium text-sm sm:text-base">Table {tableNumber}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <style jsx>{`
                  @keyframes expandLine {
                    0% { width: 0; }
                    100% { width: 200px; }
                  }
                  
                  @keyframes fadeInUp {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                  }
                  
                  @media (max-width: 640px) {
                    @keyframes expandLine {
                      100% { width: 120px; }
                    }
                  }
                `}</style>
              </div>
            </div>
          </div>

          {/* Centered Loading Animation */}
        <div className="max-w-7xl mx-4 px-2 py-16 sm:py-2">
              {/* <div className="text-center">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 sm:px-2 sm:py-4 max-w-md mx-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white" />
                  </div>
                  <p className="text-white text-lg sm:text-xl font-light">{t.loading}</p>
                  <div className="w-24 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"></div>
                </div>
              </div> */}
            </div>
          {/* Sticky Menu Bar at Bottom */}
      
          <div className="sticky bottom-3 bg-[#0c1222] shadow-lg z-50 mx-[4vw] px-2 rounded-full border border-gray-500">
      <div className="max-w-7xl  px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          <div className="lg:hidden w-full">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" /> 
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" /> 
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" /> 
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" /> 
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" /> 
          </div>
        </div>
        </div>
          {/* Right: Icons (visible on all screens) */}
      </div>
          </div>
        </div>
      );
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

        
              {tableNumber && (
                <div className="mt-4 mb-1 sm:mt-6">
                  <div className="inline-flex items-center px-4 sm:px-6 py-2 bg-black bg-opacity-30 rounded-full border border-amber-400">
                    <span className="text-amber-300 font-medium text-sm sm:text-base">Table {tableNumber}</span>
                  </div>
                </div>
              )}
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
          {/* <div 
          className="sticky top-0 z-30 bg-black bg-opacity-80 backdrop-blur-sm border-b border-amber-600"> */}
          <div 
            className={`bg-[#0c1222] sticky top-0 z-50 transition-shadow duration-300 ${
        scrollY > 10 ? "shadow-lg" : ""
      }`}>
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
            {filteredItems.length === 0 && loading && (
              <div className="text-center py-16 sm:py-20">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 sm:p-12 max-w-md mx-auto">
                  <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-amber-400 mb-4 sm:mb-6" />
                  <p className="text-white text-lg sm:text-xl font-light">{t.noItemsFound}</p>
                </div>
              </div>
            )}
        

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {filteredItems.map((item) => {   
                const outOfStock = isOutOfStock(item);       
                const itemInCart = cart.find((cartItem) => cartItem.id === item.id)

                return(
                  // <>
                <div
                  key={item.id}
                  onClick={() => !outOfStock && handleItemClick(item)}
                  className="group min-h-[20vh] max-h-[20vh] sm:min-h-auto relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 hover:border-amber-300 cursor-pointer"
                >
                {/* Overlay for out of stock */}
      {outOfStock && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-20 flex items-center justify-center">
          <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded-lg">
            Out of Stock
          </span>
        </div>
      )}
      <div className="relative h-full w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-20"></div>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name[language] || item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallbackDiv = e.target.parentElement.querySelector('.fallback-display');
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'flex';
                          }
                        }}
                      />
                    ): (
          <img
            src={getDefaultImage(item.category)}
            alt={item.name[language] || item.name}
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
              )}
         <div className={`fallback-display relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-4 ${item.image && item.image !== '/placeholder.svg?height=200&width=200' && !item.image.includes('placeholder') ? 'hidden' : 'flex'}`}>
             </div>
                  {!outOfStock && !itemInCart && (
                      <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(item)
                      }}
                      className="py-2 sm:p-2.5 md:p-3 p-3 sm:p-4 bg-gradient-to-r from-red-500 to-amber-600 text-white rounded-xl sm:rounded-xl font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:from-amber-700 hover:to-yellow-700 transform hover:scale-105 active:scale-95 absolute top-2 right-2"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5"/>
                    </button>)
                    }               
                  </div>
              
                  <div className="absolute bottom-0 w-full">
                    {item.image && item.image !== '/placeholder.svg?height=200&width=200' && !item.image.includes('placeholder') && (
                      <div className="px-3 bg-gradient-to-t from-black via-black/70 to-transparent p-2 sm:p-3">
                        <h3 className="flex items-center justify-center text-xs sm:text-sm md:text-base text-white text-center leading-tight line-clamp-2">
                          {outOfStock && <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-1 animate-pulse"></span>}
                          {!outOfStock && <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1"></span>}
                          {item?.name ?? item?.nameEn ?? item?.name.en ?? item?.name.ja ?? item?.name[language]}
                        </h3>
                      </div>
                    )}
                    <div className="flex items-center justify-between bg-white px-3">
                        <span className="text-md sm:text-sm md:text-xl font-medium text-gray-800">₹{item.price}</span>
                        <span className="text-xs sm:text-xs text-gray-500 font-light">{item.prepTime}min</span>             
                    </div>  

                   {/* Quantity controls if already in cart */}      
                    {itemInCart && (
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
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation()
                            increaseQuantity(item.id)
                            // console.log("ON CLICK Increasing quantity for item:", item.id)
                          }}
                          className="px-2 font-bold bg-red-600 text-white rounded-xl shadow hover:bg-amber-700 transition-all duration-300"
                        >
                          +
                        </button> */}
         <button
        onClick={(e) => {
          e.stopPropagation();
          // Only limit for retail items
          if (item.itemType === "retail") {
            const availableStock = item.currentStock ?? 0;
            if (itemInCart.quantity < availableStock) {
              increaseQuantity(item.id);
            } else {
              // Optional: Show toast/alert when max reached
              showAlert(
                "info",
                "Stock Limit",
                `Only ${availableStock} unit(s) available for ${item.name?.en || item.name || "this item"}`,
                [{ text: "OK" }]
              );
            }
          } else {
            // Kitchen items → no stock limit
            increaseQuantity(item.id);
          }
        }}
        className={`px-2 font-bold rounded-xl shadow transition-all duration-300 ${
          item.itemType === "retail" && itemInCart.quantity >= (item.currentStock ?? 0)
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
        disabled={item.itemType === "retail" && itemInCart.quantity >= (item.currentStock ?? 0)}
      >
        +
      </button>
                      </div>
                      </div>
                    )}
                  </div>  

                {/* Hover glow effect - disabled when out of stock */}
      {!outOfStock && (
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-0 transition-opacity duration-500 pointer-events-none"></div>
                )}
                  </div>  
                )
              })}
            </div>


    {/* {loading && page === 1 && <div className="text-center bg-red-700 w-full flex">Loading...</div>}
    {loading && page > 1 && <div className="text-center bg-red-700 min-w-full flex text-white">Loading more...</div>} */}
    {/* Initial full-screen loading - only for page 1 */}
    {loading && page === 1 && (
      <div className="col-span-full text-center py-16">
        <div className="inline-flex items-center text-white">
          <LoaderCircle className="w-8 h-8 mr-3 animate-spin" />
          <span className="text-lg">{t.loading}...</span>
        </div>
      </div>
    )}

    {/* Infinite scroll loading indicator */}
    {loadingMore && (
      <div className="col-span-full text-center py-8">
        <div className="inline-flex items-center text-white">
          <LoaderCircle className="w-6 h-6 mr-2 animate-spin" />
          <span>Loading more...</span>
        </div>
      </div>
    )}
      <div className="max-w-7xl mx-4 px-2 py-16 sm:py-2">
      <div className="text-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 sm:px-2 sm:py-4 max-w-md mx-2">
          {hasMore && !loading && <div className="flex items-center justify-center w-full mt-8 text-white text-xl opacity-0" ref={loaderRef}> 
            <LoaderCircle className="w-7 h-7 mr-2 animate-spin" />
            Loading...</div> 
          }
          <div className="w-24 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"></div>
        </div>
      </div>
      </div>
      

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

          {showCart && (
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 px-4 min-h[100vh]">
              <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl w-full max-w-lg h-95vh max-h-[100vh] overflow-hidden shadow-2xl border border-amber-200">
                <div className="relative bg-gradient-to-r from-amber-900 via-yellow-800 to-amber-900 px-6 py-3">
                  <div className="absolute inset-0 bg-black opacity-20"></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl  text-white mb-1">{t.yourOrder}</h2>
                      {tableNumber && (
                        <p className="text-amber-200 text-sm font-light">Table {tableNumber}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowCart(false)} 
                      className="text-white hover:text-amber-200 p-2 rounded-full hover:bg-black hover:bg-opacity-20 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Cart Footer */}
                {cart.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl  text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-amber-600">₹{totalAmount}</span>
                    </div>

                  

                    <button
                      onClick={() => {
                        setShowCart(false)
                        setShowOrderForm(true)
                      }}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:from-amber-700 hover:to-yellow-700 transform hover:scale-105 active:scale-95"
                    >
                      {t.placeOrder}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Luxury Order Form Modal */}
          {showOrderForm && (
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="rounded overflow-hidden bg-white shadow-2xl w-auto">
                <div className="bg-white rounded w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar overflow-y-auto scrollbar-hide">
                {/* Form Header */}
                <div className="relative bg-orange-500 px-4 py-2">
                  <div className="absolute inset-0 bg-black/40 opacity-20"></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm text-white font-medium">{t.completeOrder}</h2>
                      <p className="text-amber-200 text-xs font-light">Please provide your details (Table {customerInfo.tableNumber})</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowOrderForm(false)
                        setDevOtp(null)
                      }}
                      className="text-white hover:text-amber-200 p-2 rounded-full hover:bg-black hover:bg-opacity-20 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="p-4">
                  <div className="space-y-2">
                    <div>
                      {/* <label className="block text-sm font-semibold text-gray-700 mb-3">{t.name}:</label> */}
                      <input
                        type="text"
                        required
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                        className="text-sm font-medium w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all bg-white shadow-sm"
                        placeholder={language === "en" ? "Your full name" : "お名前"}
                      />
                    </div>

                    {/* <div>
                      <input
                        type="tel"
                        required
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                        className="text-md font-semibold w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white shadow-sm"
                        placeholder={language === "en" ? "Your phone number" : "電話番号"}
                      />
                    </div> */}

                    <div>
                      {/* <label className="block text-sm font-semibold text-gray-700 mb-3">{t.email}</label> */}
                      <input
                        type="email"
                        required
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                        className="text-sm font-medium w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all bg-white shadow-sm"
                        placeholder={language === "en" ? "Your email address" : "メールアドレス"}
                      />
                    </div>

                    {/* <div>
                      <input
                        type="text"
                        required
                        value={customerInfo.tableNumber}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, tableNumber: e.target.value }))}
                        className="text-md font-semibold w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-gray-50 shadow-sm"
                        placeholder={language === "en" ? "Table number" : "テーブル番号"}
                        readOnly={!!tableNumber}
                      />
                    </div> */}
                    
                  </div>

                  {/* Luxury Order Summary */}
                  <div className="mt-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded px-4 pb-3 border border-amber-200">
                    <h3 className="text-sm text-gray-800 my-2 font-semibold border-b-2 border-b-amber-200">{t.orderSummary}</h3>
                    <div className="space-y-0">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-0 border-b border-gray-100  last:border-b-0">
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-800">
                              {item?.name ?? item?.nameEn ?? item?.name?.en ?? item?.name?.ja ?? ""}
                              {/* {item.name[language]} */}
                            </span>
                            <span className="text-xs font-semibold text-green-600 ml-1">x{item.quantity}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t-2 border-amber-200 mt-2 pt-2 flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-800">Sub{t.total}:</span>
                      <span className="text-xs font-semibold text-green-600">₹{totalAmount}</span>
                    </div>
                    {/* <div className="border-t-2 border-amber-300 mt-2 pt-2 flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-800">Discount:</span>
                      <span className="text-md font-bold text-green-600">{0}</span>
                    </div> */}
                    {/* 112233 */}


    <div className="border-t border-t-gray-100 mt-1 pt-1 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-800">Item Tax</span>
                    <span className="text-xs font-medium text-gray-800">₹{onlyTax.toFixed(2)}</span>
                  </div>

                  {loadingTaxes ? (
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    getTaxLines().map((tax) => (
                      <div key={tax.id} className="border-t border-t-gray-100 mt-1 pt-1 flex justify-between items-center ">
                        <span className="text-xs font-medium text-gray-800">{tax.label}</span>
                        <span className="text-xs font-medium text-gray-800">₹{tax.amount.toFixed(0) || 0}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 mt-2 border-t">
                    <span className="text-xs font-semibold text-gray-800">Total Amount</span>
                  <span className="text-xs font-semibold text-green-600">₹{Number(getTotalAmount().toFixed(0)) + Number(onlyTax)}</span>

                  </div>


                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-800">Payment status:</span>
                      <span className="text-xs font-semibold text-green-600">{'pending'}</span>
                    </div>

                  </div>

                  <div className="flex space-x-4 mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrderForm(false)
                        setDevOtp(null)
                      }}
                      className="flex-1 px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-2 text-sm bg-orange-500 text-white rounded font-semibold transition-all shadow hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                      {t.placeOrder}
                    </button>
                  </div>

                  {false && (
                  // {devOtp && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl">
                      <p className="text-sm text-yellow-800 font-semibold mb-2">
                        {language === "en" ? "Development Mode" : "開発モード"}
                      </p>
                      <p className="text-sm text-yellow-800">
                        {language === "en" ? "Verification Code: " : "確認コード: "}
                        <span className="font-mono font-bold text-lg bg-yellow-200 px-2 py-1 rounded">{devOtp}</span>
                      </p>
                    </div>
                  )}
                </form>
                </div>
              </div>

            </div>
          )}

          {/* Luxury OTP Verification Modal */}
          {showOtpVerification && (
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded w-full max-w-md shadow-2xl border border-amber-200">
                {/* OTP Header */}
                <div className="relative bg-orange-500 px-6 py-2">
                  <div className="absolute inset-0 bg-black opacity-20"></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-medium text-white ">{t.verifyOrder}</h2>
                      <p className="text-amber-200 text-xs font-light">Enter verification code</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowOtpVerification(false)
                        setOtpInput("")
                        setDevOtp(null)
                      }}
                      className="text-white hover:text-amber-200 p-2 rounded-full hover:bg-black hover:bg-opacity-20 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-2">
                  <p className="mb-2 text-xs text-gray-700 text-center font-light">{t.enterVerificationCode}</p>

                  <div className="mb-2">
                    {/* <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">{t.verificationCode}</label> */}
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all text-center font-mono tracking-widest bg-white shadow-sm"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  {/* {devOtp && ( */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="mb-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded">
                      <p className="text-xs text-yellow-800 font-semibold mb-2 text-center">
                        {language === "en" ? "Development Mode" : "開発モード"}
                      </p>
                      <p className="text-xs text-yellow-800 text-center">
                        {language === "en" ? "Verification Code: " : "確認コード: "}
                        <span className="font-mono font-bold text-xs bg-yellow-200 px-1 py-0 rounded">{devOtp}</span>
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpVerification(false)
                        setOtpInput("")
                        setDevOtp(null)
                      }}
                      className="flex-1 px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={isVerifying || !otpInput}
                      className="flex-1 px-6 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
                    >
                      {isVerifying ? (
                        <span className="flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        // t.verifyAndPlaceOrder
                        <span>Verify</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Status Modal */}
          {showOrderStatus && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-white rounded w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="p-3 sm:p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold">{t.myOrders}</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            setIsRefreshingOrders(true)
                            const minDelay = new Promise((res) => setTimeout(res, 2000))

                            // Fetch latest orders from server and filter active ones
                            const currentOrders = await fetchOrderHistory()
                            const toRefresh = (currentOrders || []).filter(
                              (o) => o.status !== "completed" && o.status !== "delivered"
                            )

                            // Optionally re-check each order status
                            if (toRefresh.length > 0) {
                              await Promise.all(toRefresh.map((o) => checkOrderStatus(o.id)))
                            }

                            // Update table status and refresh orders again to sync
                            await checkTableStatus()
                            await fetchOrderHistory()

                            // Ensure visual feedback spins at least 2s
                            await minDelay
                          } finally {
                            setIsRefreshingOrders(false)
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-800 p-1"
                        title={t.refreshOrders}
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => setShowOrderStatus(false)} className="text-gray-500 hover:text-gray-700 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {tableNumber && <p className="text-xs text-gray-600">Table {tableNumber}</p>}
                </div>

                <div className="p-3 sm:p-4">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-6 h-6 md:w-10 md:h-10 mx-auto text-gray-300 mb-3" />
                      <p className="text-xs text-gray-500">
                        {language === "en" ? "No orders found for this table" : "このテーブルの注文履歴はありません"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderHistory.map((order) => (
                        <div
                        onClick={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                        key={order.id} className="border rounded-xl overflow-hidden">
                          <div className="bg-gray-50 p-3 flex justify-between items-center">
                            <div>
                              <span className="font-semibold">#{order.orderNumber}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(order.date).toLocaleString(language === "en" ? "en-US" : "ja-JP")}
                              </span>
                            </div>
                            <div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "preparing"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "ready"
                                        ? "bg-green-100 text-green-800"
                                        : order.status === "delivered"
                                          ? "bg-purple-100 text-purple-800"
                                          : order.status === "completed"
                                            ? "bg-indigo-100 text-indigo-800"
                                            : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.status === "pending"
                                  ? language === "en"
                                    ? "Pending"
                                    : "保留中"
                                  : order.status === "preparing"
                                    ? language === "en"
                                      ? "Preparing"
                                      : "準備中"
                                    : order.status === "ready"
                                      ? language === "en"
                                        ? "Ready"
                                        : "準備完了"
                                      : order.status === "delivered"
                                        ? language === "en"
                                          ? "Delivered"
                                          : "配達済み"
                                        : order.status === "completed"
                                          ? language === "en"
                                            ? "Completed"
                                            : "完了"
                                          : language === "en"
                                            ? "Cancelled"
                                            : "キャンセル"}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">
                                {language === "en" ? "Items" : "商品"}: {order.items}
                              </span>
                              <span className="font-semibold">₹{order.total}</span>
                            </div>


    {expandedOrderId === order.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{language === "en" ? "Items" : "品目"}</h4>
                            {/* <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order); }}
                              className="text-xs text-blue-600"
                            >
                              {language === "en" ? "Download Invoice" : "請求書をダウンロード"}
                            </button> */}
                          </div>
                          <div className="space-y-2">
                            {order.orderItems.map((item, index) => (
                              <div key={item.name + "oihao" + index} className="flex justify-between text-sm">
                                <span>
                                  <span>{index + 1}. {item?.name ?? item?.nameEn ?? item?.name?.en ?? item?.name?.en ?? ""} </span>
                                  <span className="text-amber-600">x{item.quantity}</span>
                                </span>
                                <span className="font-medium">₹{item.price.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          <div className="sticky bottom-3">

            <CustomerHeaderMenu
              currTab="Menu"
              showCart={true}
              cartItemCount={cartItemCount}
              // onCartClick={() => setShowCart(true)}
              onCartClick={() => {
                if(cart.length > 0){
                  setShowOrderForm(true)
                } else {
                  // console.log("Cart is empty, not opening order form.", cart.length)
                  showAlert("error", "Cart is empty", "Please add items to your cart.", [{text: "Okay"}])
                }
              }}         
              showSearch={true}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder={t.searchPlaceholder}
              showMyOrders={true}
              onMyOrdersClick={() => setShowOrderStatus(true)}
              tableNumber={tableNumber}
            />
          </div>


    {showLoader && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}


        </div>
      )
    }
