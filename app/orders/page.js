"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link";
import './print.css';
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Eye, Pencil, ArrowUpDown, Plus, Loader } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuthToken } from "@/lib/useAuthToken";
import { useCallback } from "react";
import { useAlert } from "@/context/AlertContext";
 
export default function OrderManagement() {
  const { user, loading: authLoading, hasPermission } = useAuth()
  const { showAlert } = useAlert()
  const router = useRouter()
  const token = useAuthToken();

  const [orders, setOrders] = useState([])
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [selectedRange, setSelectedRange] = useState("custom")
  const [billStatus, setBillStatus] = useState("unpaid")
  const [sortOrder, setSortOrder] = useState("desc");
  // const {user, hasPermission} = useAuth()

  const [ordersLoading, setOrdersLoading] = useState()
  // Sound & Audio Unlock
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const statusOptions = ["All", "Pending", "Preparing", "Ready", "Delivered", "Completed", "Cancelled"];

  // Debounce hook
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  }
  const debouncedSearch = useDebounce(searchQuery, 800);

  // === AUDIO UNLOCK ON USER INTERACTION ===
  useEffect(() => {
    const unlock = () => {
      const audio = new Audio("/sounds/not_a_problem_pubg.mp3");
      audio.play().catch(() => {});
      setAudioUnlocked(true);
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  // === MAIN FETCH FUNCTION ===
  // const fetchOrders = async ({ cursor: nextCursor, reset = false } = {}) => {
  //   if (isLoading || !token || (!hasMore && !reset)) return;

  //   setIsLoading(true);
  //   const params = new URLSearchParams({
  //     limit: "20",
  //     ...(nextCursor && { cursor: nextCursor }),
  //     ...(filterStatus !== "all" && { status: filterStatus }),
  //     ...(sortOrder && { sort: sortOrder }),
  //     ...(debouncedSearch && { search: debouncedSearch }),
  //     ...(dateRange.start && { startDate: dateRange.start }),
  //     ...(dateRange.end && { endDate: dateRange.end }),
  //   });

  //   try {
  //     const res = await fetch(`/api/orders?${params.toString()}`, {
  //       headers: { "Authorization": `Bearer ${token}` }
  //     });

  //     if (!res.ok) throw new Error("Failed to fetch");

  //     const data = await res.json();

  //     setOrders(prev => {
  //       const newOrders = reset ? data.orders || [] : [...prev, ...(data.orders || [])];
  //       const unique = Array.from(new Map(newOrders.map(o => [o._id, o])).values());
  //       return unique;
  //     });

  //     setCursor(data.nextCursor || null);
  //     setHasMore(!!data.nextCursor);
  //   } catch (err) {
  //     console.error("Fetch orders error:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
    // === MAIN FETCH FUNCTION ===
  // const fetchOrders = useCallback(async ({ cursor: nextCursor, reset = false } = {}) => {
  //   if (isLoading || !token || (!hasMore && !reset)) return;

  //   setIsLoading(true);
  //   const params = new URLSearchParams({
  //     limit: "20",
  //     ...(nextCursor && { cursor: nextCursor }),
  //     ...(filterStatus !== "all" && { status: filterStatus }),
  //     ...(sortOrder && { sort: sortOrder }),
  //     ...(debouncedSearch && { search: debouncedSearch }),
  //     ...(dateRange.start && { startDate: dateRange.start }),
  //     ...(dateRange.end && { endDate: dateRange.end }),
  //   });

  //   try {
  //     const res = await fetch(`/api/orders?${params.toString()}`, {
  //       headers: { "Authorization": `Bearer ${token}` }
  //     });

  //     if (!res.ok) throw new Error("Failed to fetch");

  //     const data = await res.json();

  //     setOrders(prev => {
  //       const newOrders = reset ? data.orders || [] : [...prev, ...(data.orders || [])];
  //       const unique = Array.from(new Map(newOrders.map(o => [o._id, o])).values());
  //       return unique;
  //     });

  //     setCursor(data.nextCursor || null);
  //     setHasMore(!!data.nextCursor);
  //   } catch (err) {
  //     console.error("Fetch orders error:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [token, isLoading, hasMore, filterStatus, sortOrder, debouncedSearch, dateRange]);

  const fetchOrders = useCallback(async ({
    cursor: nextCursor,
    status,
    sort,
    search,
    startDate,
    endDate,
  } = {}) => {
    if (!token) return;
    
    setOrdersLoading(true);

    const params = new URLSearchParams({
      limit: 20,
      ...(nextCursor && { cursor: nextCursor }),
      ...(status && { status }),
      ...(sort && { sort }),
      ...(search && { search }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    try {
      const url = (`/api/orders?${params.toString()}`);
      // console.log("📤 Fetching orders with cursor:", nextCursor ? "YES" : "NO", { status, sort, search, startDate, endDate });
      
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();

      setOrders((prev) => {
        const combined = nextCursor ? [...prev, ...(data.orders || [])] : data.orders || [];
        // console.log("📊 Total orders after fetch:", combined.length);

        const uniqueOrders = Array.from(
          new Map(combined.map((o) => [o._id.toString(), o])).values()
        );

        return uniqueOrders;
      });

      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.nextCursor));
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      setHasMore(false);
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);



  // === INITIAL LOAD WHEN USER + TOKEN READY ===
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (token) {
      setOrders([]);
      setCursor(null);
      setHasMore(true);
      fetchOrders({});
    }
  }, [user, authLoading, token, fetchOrders]);

  // === REFETCH ON FILTERS CHANGE ===
  useEffect(() => {
    if (!token) return;
    setOrders([]);
    setCursor(null);
    setHasMore(true);
    fetchOrders({
      status: filterStatus === "all" ? null : filterStatus,
      sort: sortOrder,
      search: debouncedSearch || null,
      startDate: dateRange.start || null,
      endDate: dateRange.end || null,
    });
  }, [filterStatus, sortOrder, debouncedSearch, dateRange.start, dateRange.end, token, fetchOrders]);

  // === INFINITE SCROLL OBSERVER ===
  // useEffect(() => {
  //   if (!loaderRef.current || !hasMore || isLoading) return;

  //   const observer = new IntersectionObserver(
  //     entries => {
  //       if (entries[0].isIntersecting && token) {
  //         fetchOrders({ cursor });
  //       }
  //     },
  //     { threshold: 0.1 }
  //   );

  //   observer.observe(loaderRef.current);
  //   return () => observer.disconnect();
  // }, [cursor, hasMore, isLoading, token, filterStatus, sortOrder, debouncedSearch, dateRange]);

// === INFINITE SCROLL OBSERVER ===
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !hasMore || ordersLoading) {
      // console.log("🔒 Scroll observer disabled:", { 
      //   loader: !!loader, 
      //   hasMore, 
      //   ordersLoading, 
      //   cursor 
      // });
      return;
    }

    // console.log("👁️ Setting up scroll observer. hasMore:", hasMore, "cursor:", cursor?.substring(0, 20) + "...");

    const observer = new IntersectionObserver(
      ([entry]) => {
  
        if (entry.isIntersecting && hasMore && !ordersLoading && token) {
          // console.log("✅ Triggering fetch for next page with cursor");
          fetchOrders({
            cursor,
            status: filterStatus === "all" ? null : filterStatus,
            sort: sortOrder,
            search: debouncedSearch || null,
            startDate: dateRange.start || null,
            endDate: dateRange.end || null,
          });
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loader);

    return () => observer.disconnect();
  }, [hasMore, ordersLoading, token, cursor, filterStatus, sortOrder, debouncedSearch, dateRange.start, dateRange.end, fetchOrders]);
  // === REAL-TIME UPDATES VIA SSE ===
  useEffect(() => {
    if (!token) return;

    const es = new EventSource(`/api/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const handleUpdate = (e) => {
      setOrders([]);
      setCursor(null);
      setHasMore(true);
      fetchOrders({ reset: true });
      
      try {
        const payload = JSON.parse(e.data);
        showAlert("info", "New Order", `Order update received!`, [{ text: "Refresh" }]);
      } catch (err) {
        showAlert("info", "New Order", "A new order has been received!");
      }
    };

    const handleSound = () => {
      if (soundEnabled && audioUnlocked) {
        const audio = new Audio("/sounds/not_a_problem_pubg.mp3");
        audio.play().catch(() => {});
      }
    };

    es.addEventListener("orders:update", handleUpdate);
    es.addEventListener("orders1:update", handleUpdate);
    es.addEventListener("orders:sound1", handleSound);

    return () => {
      es.removeEventListener("orders:update", handleUpdate);
      es.removeEventListener("orders1:update", handleUpdate);
      es.removeEventListener("orders:sound1", handleSound);
      es.close();
    };
  }, [token, soundEnabled, audioUnlocked]);

  // === HELPER FUNCTIONS (unchanged) ===
  const handleSort = () => setSortOrder(prev => prev === "asc" ? "desc" : "asc");

  const getDateRange = (type) => {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    let startDate;
    switch (type) {
      case "all": startDate = new Date(today.getFullYear() - 2, 0, 1).toISOString().split("T")[0]; break;
      case "2w": startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; break;
      case "1m": startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split("T")[0]; break;
      case "1y": startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split("T")[0]; break;
      default: return { startDate: dateRange.start, endDate: dateRange.end };
    }
    return { startDate, endDate };
  };

  const handleDateRangeClick = (rangeType) => {
    setSelectedRange(rangeType);
    const { startDate, endDate } = getDateRange(rangeType);
    setDateRange({ start: startDate, end: endDate });
  };

  // const handlePrint = () => setTimeout(() => window.print(), 100);

      const printBill = () => {
  const printContent = document.getElementById("bill-content");
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = printContent.innerHTML;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload(); // optional if UI breaks on return
};

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      preparing: "bg-blue-100 text-blue-800",
      ready: "bg-green-100 text-green-800",
      delivered: "bg-purple-100 text-purple-800",
      completed: "bg-indigo-100 text-indigo-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };
  const getPaymentMethodColor = (paymentMethod) => {
    const colors = {
      btc: "bg-yellow-100 text-yellow-800",
      upi: "bg-blue-100 text-blue-800",
      cash: "bg-green-100 text-green-800",
      card: "bg-purple-100 text-purple-800",
      pending: "bg-red-100 text-red-800",
    };
    return colors[paymentMethod] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // const calculateTotal = (items) => items.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2);
  const calculateTotal = (items = []) =>
  items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );


  const getItemName = (name) => {
    if (!name) return "Unknown Item";
    if (typeof name === 'object') return name.en || Object.values(name)[0] || "Unknown Item";
    return name;
  };

  // const handleStatusChange = async (orderId, newStatus) => {
  //   if (!token) return;
  //   try {
  //     await fetch(`/api/orders/${orderId}`, {
  //       method: "PUT",
  //       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  //       body: JSON.stringify({ status: newStatus })
  //     });
  //     setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
  //     if (selectedOrder?._id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
  //   } catch (err) { console.error(err); }
  // };

  // const generateBill = async (orderId, status) => {
  //   if (!token) return;
  //   await fetch("/api/bills/generate", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  //     body: JSON.stringify({ orderId, status })
  //   });
  // };

//     const subtotal = items.reduce((sum, item) => sum + (((item.price * item.quantity)*(item.tax)/100)+ (item.price*item.quantity)),0).toFixed(2);
//   // console.log("Subtotal:-->>",subtotal)
//  const taxLines = taxes.map(tax => {
//   const taxRate = Number(tax.taxRate || 0);
//   const amount = tax.type === "percentage"
//     ? (subtotal * taxRate) / 100
//     : taxRate;

//   return {
//     name: tax.name || "Tax",
//     rate: taxRate,
//     amount,
//     isPercentage: tax.type === "percentage",
//   };
// });

  if (authLoading || (!user && !token)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-10 w-10 text-orange-600" />
      </div>
    );
  }

  return (
  // <ProtectedRoute userPermission={"manage_orders"} >
  hasPermission(user,["manage_orders","view_orders"]) && (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-full mx-auto px-4">
          <div className="flex justify-between py-3">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-orange-500 hover:text-orange-600 mr-4"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-sm font-bold text-gray-900">
                Order Management
              </h1>
            </div>
            <div className="flex items-center space-x-2">
            {hasPermission(user,"add_orders") && (
              <Link
                href="/orders/new"
                className="flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-2 rounded hover:from-orange-600 hover:to-orange-600 font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                {/* <Plus className="w-4 h-4 text-white mr-1"/> */}
                Create New Order
              </Link>
            )}
            </div>
          </div>
        </div>
      </nav>

      <div className="py-2 sm:px-3 lg:px-4 bg-gray-50">
        <div className="px-3 py-1 sm:px-4">
          {/* Action Buttons */}
          {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
              <p className="text-gray-600">Manage and track customer orders</p>
            </div>            
          </div> */}

          {/* Filters */}
          <div className="rounded px-0 py-0 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white shadow border border-gray-100 rounded px-3 flex items-center">
                <div className="w-full">
                  <label className="block text-xs text-xs font-medium text-gray-700 mb-2">
                    Search by order ID, customer name, or table number:
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Order ID, Customer, Table #"
                    className="w-full text-xs text-black px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-gray-100"
                  />
                </div>  
              </div>

              {/* <div className="bg-white">
                <label className="block text-xs text-xs font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div> */}

              <div className="bg-white rounded shadow px-4 h-auto flex items-center justify-center">
                {/* <label className="block text-xs text-xs font-medium text-gray-700 mr-3">
        Status:
      </label> */}
                <div className="flex flex-wrap justify-center gap-2">
                  {statusOptions.map((status) => {
                    // const isSelected = filterStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() =>
                          setFilterStatus(status.toLocaleLowerCase())
                        }
                        className={`px-3 py-1 text-xs rounded border transition ${
                          filterStatus === status.toLocaleLowerCase()
                            ? "bg-green-100 text-green-600 border-green-500"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* <div className="grid grid-cols-2 gap-2 bg-white">
                <div>
                  <label className="block text-xs text-xs font-medium text-gray-700 mb-2">From</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-xs font-medium text-gray-700 mb-2">To</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div> */}

              <div className="bg-white rounded shadow px-4 h-auto flex max-md:flex-col items-center">
                <div className="py-3">
                  <div className="flex justify-between mt-2 items-center">
                    <label className="block text-xs text-xs font-medium text-gray-700 mb-2 me-2">
                      Start:
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between mt-2 items-center">
                    <label className="block text-xs text-xs font-medium text-gray-700 mb-2">
                      End:
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* <div className="grid md:grid-cols-4 lg:grid-cols-2 gap-x-1 gap-y-1 ml-3 py-3 px-1 items-center justify-items-center"> */}
<div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-2 gap-x-1 gap-y-1 ml-3 py-3 px-1 items-center justify-items-center">
                  {/* All */}
                  <div className="relative group w-full">
                    <button
                      onClick={() => handleDateRangeClick("all")}
                      className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                        selectedRange === "all"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                      All time
                    </span>
                  </div>

                  {/* 2w */}
                  <div className="relative group w-full">
                    <button
                      onClick={() => handleDateRangeClick("2w")}
                      className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                        selectedRange === "2w"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      2w
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                      2 weeks
                    </span>
                  </div>

                  {/* 1m */}
                  <div className="relative group w-full">
                    <button
                      onClick={() => handleDateRangeClick("1m")}
                      className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                        selectedRange === "1m"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      1m
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                      1 month
                    </span>
                  </div>

                  {/* 1y */}
                  <div className="relative group w-full">
                    <button
                      onClick={() => handleDateRangeClick("1y")}
                      className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                        selectedRange === "1y"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      1y
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                      1 year
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white shadow-lg rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-500">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider flex items-center"
                    >
                      Date & Time
                      <button
                        onClick={handleSort}
                        className="inline-flex items-center ml-2"
                      >
                        <ArrowUpDown color="currentColor" size={15} />
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Table/Room
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Payment Method
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordersLoading && (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <Loader className="animate-spin rounded-full h-8 w-8 text-orange-600" />
                          <p className="text-sm text-xs font-medium">
                            Loading Orders....
                          </p>
                          {/* <p className="text-sm">Try adjusting your search or filter criteria</p> */}
                        </div>
                      </td>
                    </tr>
                  )}
                  {!ordersLoading &&
                  (orders?.length === 0 || orders === null || undefined) ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <svg
                            className="w-12 h-12 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <p className="text-sm text-xs font-medium">
                            No orders found
                          </p>
                          <p className="text-sm">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      // console.log("Order:", order),
                      <tr key={order._id} className="hover:bg-gray-50">
                        {/* {console.log('Order:', order)} */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-xs font-medium text-blue-600">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                          {order.customerInfo?.name || "Guest"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {order.orderType === "room-service"
                            ? `Room ${order.customerInfo?.room || "—"}`
                            : order.orderType === "dine-in" || ""
                            ? `Table ${order.customerInfo?.table || order.customerInfo?.tableNumber || order.tableNumber || order.table || "—"}`
                            : "Takeaway"}
                          {/* {order.customerInfo?.table || (order.orderType === "room-service" ? `Room ${order.customerInfo?.room}` : "Takeaway")} */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {order.items?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-xs font-medium text-gray-900">
                          ₹{Math.round(parseFloat(order.totalAmount || 0)).toFixed(2)}
                          {/* {(order.items
                              ? calculateTotal(order.items)
                              : "0.00")} */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0 inline-flex text-xs leading-5 text-xs font-medium rounded-xl ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status?.charAt(0).toUpperCase() +
                              order.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0 inline-flex text-xs leading-5 text-xs font-medium rounded-xl ${getPaymentMethodColor(
                              order.paymentMethod
                            )}`}
                          >
                            {order.paymentMethod?.charAt(0).toUpperCase() +
                              order.paymentMethod?.slice(1) || "Pending"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
  <div className="flex space-x-3">
    {/* View */}
    <button
      onClick={() => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
      }}
      className="relative group text-indigo-600 hover:text-indigo-900 transition-colors"
    >
      <Eye size={18} />
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
        View
      </span>
    </button>

    {/* Edit - Only if user has edit_orders permission */}
    {hasPermission(user,"edit_orders") && (
      <button
        onClick={() => order._id && router.push(`/orders/edit/${order._id}`)}
        className="relative group text-blue-600 hover:text-blue-900 transition-colors"
      >
        <Pencil size={18} />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
          Edit
        </span>
      </button>
    )}

    {/* BILL ICON - Only if status is completed or delivered */}
     {hasPermission(user,"edit_orders") && 
      order.billPay === true && (      
      <button
        onClick={() => {
          // Navigate to Bills page with billId in URL
          const billId = order.billId || order._id;
          router.push(`/bills?billId=${billId}`);
        }}
        className="relative group text-green-600 hover:text-green-800 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
          View Bill
        </span>
      </button>
      
     )}
    {/* Settlement ICON - At same time they can settle the bill */}
     {/* {hasPermission(user,"edit_orders") &&  
      (order.paymentStatus?.toLowerCase() === "unpaid") && (
      <button
        onClick={() => {
          // Navigate to Bills page with billId in URL
          const billId = order.billId || order._id;
          router.push(`/settlements`);
        }}
        className="relative group text-yellow-600 hover:text-yellow-800 transition-colors"
      >
<svg 
  className="w-5 h-5" 
  fill="none" 
  stroke="currentColor" 
  viewBox="0 0 24 24"
>
  <circle cx="12" cy="12" r="8" strokeWidth="2" />
  <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    strokeWidth="2"
    d="M9 12h3m0 0h3m-3 0v3m0-3V9"
  />
  <path 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    strokeWidth="2"
    d="M16 16l2 2 4-4"
  />
</svg>

        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
          Settlement Bill
        </span>
      </button>
     ) } */}
  </div>
</td>

                        {/* <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex space-x-3">
                            {/* View 
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
                              className="relative group text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              <Eye size={18} />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                                View
                              </span>
                            </button>

                            {/* Edit 
                            <button
                              onClick={() =>
                                order._id &&
                                router.push(`/orders/edit/${order._id}`)
                              }
                              className="relative group text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              <Pencil size={18} />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                                Edit
                              </span>
                            </button>
                          </div>
                        </td> */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* {ordersLoading && <p className="text-center py-4">Loading...</p>} */}
              <div ref={loaderRef} className="h-10" />{" "}
              {/* Sentinel for observer */}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 print-hide" id="bill-content">
          <div className="rounded overflow-hidden bg-white px-1 shadow-2xl">
            <div className="bg-white rounded w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar print-receipt" id="bill-content">
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-900">
                    Order #
                    {selectedOrder._id
                      ? selectedOrder._id.slice(-6)
                      : "Unknown"}
                  </h2>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-500 hover:text-gray-700 print-hide"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-xs text-xs font-medium text-gray-900 mb-1">
                      Order Information
                    </h3>
                    <div className="bg-gray-50 rounded p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Date & Time</p>
                          <p className="text-xs font-medium">
                            {formatDate(selectedOrder.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span
                            className={`px-1 py-0 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(
                              selectedOrder.status
                            )}`}
                          >
                            {selectedOrder.status?.charAt(0).toUpperCase() +
                              selectedOrder.status?.slice(1)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Order Type</p>
                          <p className="text-xs font-medium">
                            {selectedOrder.orderType || "Standard"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {selectedOrder.orderType === "room-service"
                              ? "Room"
                              : "Table"}
                          </p>
                          <p className="text-xs font-medium">
                            {selectedOrder.orderType === "room-service"
                              ? selectedOrder.customerInfo?.room
                              : selectedOrder.customerInfo?.table || "Takeaway"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs text-xs font-medium text-gray-900 mb-1">
                      Customer Information
                    </h3>
                    <div className="bg-gray-50 rounded p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-xs font-medium">
                            {selectedOrder.customerInfo?.name || "Guest"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-xs font-medium">
                            {selectedOrder.customerInfo?.phone ||
                              "Not provided"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">
                            Special Requests
                          </p>
                        
                          <p className="text-xs font-medium">
                            {selectedOrder.specialRequests || "None"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">
                            Payment Method
                          </p>
                        
                          <p className="text-xs font-medium">
                            {selectedOrder.paymentMethod || "None"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xs text-xs font-medium text-gray-900 mb-1">
                  Order Items
                </h3>
                <div className="bg-gray-50 rounded overflow-hidden mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Item
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Price
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Quantity
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Item Tax
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-xs font-medium text-gray-900">
                            {getItemName(item.name)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            ₹{item.price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-xs font-medium text-gray-900">
                            ₹{((item.price * item.quantity)* item.tax / 100).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-xs font-medium text-gray-900">
                            ₹{((item.price * item.quantity) + (item.price * item.quantity)* item.tax / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
  {/* === NEW: Show Each Tax Line from taxes[] array === */}
  {selectedOrder?.taxes && selectedOrder.taxes.length > 0 &&  (
    <>
      {selectedOrder.taxes.map((tax) => (
        <tr key={tax._id}>
          <td colSpan="4" className="px-6 py-1 text-right text-xs font-medium text-gray-700">
            {tax.name}
            {tax.type === "percentage" && tax.taxRate ? ` (${tax.taxRate}%)` : ""}
            {tax.gstType && <span className="ml-1 text-gray-500">({tax.gstType})</span>}
          </td>
          <td className="px-6 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
            ₹{parseFloat(tax.amount || 0).toFixed(2)}
          </td>
        </tr>
      ))}

      {/* Optional: Total Tax Line */}
      <tr className="border-t border-gray-300">
        <td colSpan="4" className="px-6 py-1 text-right text-xs font-semibold text-gray-900">
          Total Tax
        </td>
        <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
          ₹{parseFloat(selectedOrder.taxAmount || 0).toFixed(2)}
        </td>
      </tr>
    </>
  )}

  {/* === ItemTaxes (Items Only) === */}
  <tr className="border-t border-gray-300">
    <td colSpan="4" className="px-6 py-1 text-right text-xs font-medium text-gray-900">
      ItemTaxes:
    </td>
    <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
      ₹{parseFloat(selectedOrder.itemTaxes).toFixed(2) }
    </td>
  </tr>
  {/* === Subtotal (Items Only) === */}
  <tr className="border-t border-gray-300">
    <td colSpan="4" className="px-6 py-1 text-right text-xs font-medium text-gray-900">
      Subtotal
    </td>
    <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
      ₹{selectedOrder.subtotal || calculateTotal(selectedOrder.items || []).toFixed(2)}
    </td>
  </tr>
  {/* === Grand Total === */}
  <tr className="bg-orange-50 border-t-2 border-orange-600">
    <td colSpan="4" className="px-6 py-1 text-right text-sm font-bold text-gray-900">
      Grand Total
    </td>
    <td className="px-6 py-1 whitespace-nowrap text-sm font-bold text-orange-600">
      {/* ₹{parseFloat(selectedOrder.totalAmount + selectedOrder.taxAmount + selectedOrder.itemTaxes || 0).toFixed(2)} */}
      {/* ₹{Math.round(parseFloat(selectedOrder.totalAmount || 0)+(selectedOrder.itemTaxes)).toFixed(2)} */}
      ₹{Math.round(parseFloat(selectedOrder.totalAmount || 0)).toFixed(2)}

    </td>
  </tr>
</tfoot>
                    {/* <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-right text-sm text-xs font-medium text-gray-900"
                        >
                          Total Tax (inclusive of GST): ₹
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ₹
                          {selectedOrder.totalAmount ||
                            (selectedOrder.items
                              ? calculateTotal(selectedOrder.items)
                              : "0.00")}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-right text-sm text-xs font-medium text-gray-900"
                        >
                          Total
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ₹
                          {selectedOrder.totalAmount ||
                            (selectedOrder.items
                              ? calculateTotal(selectedOrder.items)
                              : "0.00")}
                        </td>
                      </tr>
                    </tfoot> */}
                  </table>
                </div>

                {/* {hasPermission(user,"edit_orders") && (
                  <div className="border-t border-gray-200 pt-6 print-hide">
                    <h3 className="text-xs text-xs font-medium text-gray-900 mb-1">
                      Update Status
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          selectedOrder._id &&
                          handleStatusChange(selectedOrder._id, "pending")
                        }
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedOrder.status === "pending"
                            ? "bg-yellow-500 text-white"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() =>
                          selectedOrder._id &&
                          handleStatusChange(selectedOrder._id, "preparing")
                        }
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedOrder.status === "preparing"
                            ? "bg-blue-500 text-white"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                      >
                        Preparing
                      </button>
                      <button
                        onClick={() =>
                          selectedOrder._id &&
                          handleStatusChange(selectedOrder._id, "ready")
                        }
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedOrder.status === "ready"
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        Ready
                      </button>
                      <button
                        onClick={() =>
                          selectedOrder._id &&
                          handleStatusChange(selectedOrder._id, "delivered")
                        }
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedOrder.status === "delivered"
                            ? "bg-purple-500 text-white"
                            : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                        }`}
                      >
                        Delivered
                      </button>
                      <button
                        onClick={() =>
                          selectedOrder._id &&
                          handleStatusChange(selectedOrder._id, "completed")
                        }
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedOrder.status === "completed"
                            ? "bg-indigo-500 text-white"
                            : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                        }`}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() =>
                          selectedOrder._id &&
                          handleStatusChange(selectedOrder._id, "cancelled")
                        }
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedOrder.status === "cancelled"
                            ? "bg-red-500 text-white"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>
                )} */}

                {/* <div className="border-t border-gray-200 pt-3 print-hide mt-2">
                  <h3 className="text-xs text-xs font-medium text-gray-900 mb-1">
                    Payment Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setBillStatus("unpaid");
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        // selectedOrder.paymentStatus === "unpaid"
                        billStatus === "unpaid"
                          ? "bg-yellow-400 text-white"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      }`}
                    >
                      unpaid
                    </button>

                    <button
                      onClick={() => {
                        setBillStatus("Paid");
                        selectedOrder._id &&
                          generateBill(selectedOrder._id, "Paid");
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        // selectedOrder.paymentStatus === "Paid"
                        billStatus === "Paid"
                          ? "bg-green-600 text-white"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      Paid
                    </button>
                  </div>
                </div> */}

                <div className="flex justify-end mt-6 space-x-3 print-hide">
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs font-medium"
                  >
                    Close
                  </button>
                  {/* <Link
                    href={
                      selectedOrder._id
                        ? `/orders/edit/${selectedOrder._id}`
                        : "#"
                    }
                    className={`px-4 py-2 ${
                      selectedOrder._id
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white rounded text-xs font-medium`}
                  >
                    Edit Order
                  </Link> */}
                  <button
                    // onClick={() => {
                    //   // Print functionality would go here
                    //   handlePrint();
                    // }}
                                onClick={printBill}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
              {/* </div> */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
  );

}
