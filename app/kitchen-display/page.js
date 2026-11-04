"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { X, Loader } from "lucide-react"
import { useAuthToken } from "@/lib/useAuthToken";
// import { hasPermission } from "@/lib/rbac"
import { useAuth } from "@/lib/auth"
import { useAlert } from "@/context/AlertContext";
export default function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const {user, hasPermission} = useAuth();
  const { showAlert } = useAlert();
  const [statusUpdating, setStatusUpdating] = useState(false)
const token = useAuthToken();
  // useEffect(() => {
  //   fetchOrders()

  //   // Subscribe to server-sent events for live updates
  //   const es = new EventSource('/api/events')
  //   const onUpdate = (e) => {
  //     try {
  //       const payload = JSON.parse(e.data)
  //       console.log('SSE orders1:update', payload)
  //     } catch {}
  //     fetchOrders()
  //   }
  //   es.addEventListener('orders1:update', onUpdate)

  //   // Fallback polling in case SSE is blocked by proxies
  //   // const interval = setInterval(fetchOrders, 30000)

  //   return () => {
  //     // clearInterval(interval)
  //     es.removeEventListener('orders1:update', onUpdate)
  //     es.close()
  //   }
  // }, [])

useEffect(() => {
  if(!token) return;
  fetchOrders();

  const es = new EventSource('/api/events');
  const onUpdate = (e) => {
    fetchOrders();
    try {
      const payload = JSON.parse(e.data);
      showAlert("info", "New Order", `A new order has been received!`, [{ text: "View Orders" }]);
    } catch (err) {
      // payload might not exist if it's just a trigger
      showAlert("info", "New Order", "A new order has been received!");
    }
  };
  const onSound = (e) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload.soundEnabled) {
        const audio = new Audio("/sounds/not_a_problem_pubg.mp3");
        audio.volume = 0.7;
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.error("Invalid SSE payload:", err);
    }
  };

  es.addEventListener('orders1:update', onUpdate);
  es.addEventListener('orders:sound1', onSound);

  return () => {
    es.removeEventListener('orders1:update', onUpdate);
    es.removeEventListener('orders:sound1', onSound);
    es.close();
  };
}, [token]);

  const fetchOrders = async () => {
    
          if (!token) return;
    setLoading(true)
    try {
      const response = await fetch("/api/kitchen/orders",{
        headers:{
          Authorization:`Bearer ${token}`
        }
      })
      const data = await response.json()
      // console.log("Fetched orders:", JSON.stringify(data, null, 2))
      // const modifiedData = {
      //   ...data,
      //   orderNumber: "121212",
      // }
      setOrders(data)
      // setOrders(modifiedData)
    } catch (error) {
      console.error("Error fetching kitchen orders:", error)
    } finally {
      setLoading(false)
      setStatusUpdating(false)
    }
  }

  // const updateOrderStatus = async (orderId, status) => {
  //   setStatusUpdating(true)
  //   try {
  //     const response = await fetch(`/api/orders/${orderId}`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ status }),
  //     })

  //     if (response.ok) {
  //       fetchOrders()
  //     }
  //   } catch (error) {
  //     console.error("Error updating order status:", error)
  //   }
  // }

  const updateOrderStatus = async (orderId, status) => {
  
      if (!token) return;
  setStatusUpdating(true);
  // Optimistic update: Update local state immediately
  setOrders((prevOrders) =>
    prevOrders.map((order) =>
      order._id === orderId ? { ...order, status } : order
    )
  );

  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      // Revert on failure
      fetchOrders();
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    // Revert on error
    fetchOrders();
  } finally {
    // Reset statusUpdating after a short timeout
    setTimeout(() => setStatusUpdating(false), 5000); // 2-second timeout
  }
};

  const getOrderPriority = (order) => {
    const orderTime = new Date(order.createdAt)
    const now = new Date()
    const minutesElapsed = Math.floor((now - orderTime) / (1000 * 60))

    if (minutesElapsed > 30) return "high"
    if (minutesElapsed > 15) return "medium"
    return "low"
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50"
      case "medium":
        return "border-l-yellow-500 bg-yellow-50"
      default:
        return "border-l-green-500 bg-green-50"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "ready":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const STATUSES = ["pending", "preparing", "ready", "completed"]

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true
    if (filter === "pending") return order.status === "pending"
    if (filter === "preparing") return order.status === "preparing"
    if (filter === "ready") return order.status === "ready"
    return true
  })

  return (
    hasPermission(user,"kitchen_display") && (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            {/* <div className="flex justify-between items-center py-5"> */}
            {/* <div className="flex lg:gap-4 items-center flex-row md:flex-col lg:flex-row"> */}
            <div className="flex justify-between py-3 ">
              <div className="flex items-center">
                <Link href="/" className="text-orange-600 hover:text-orange-800 mr-4 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">Kitchen Display System</h1>
                  {/* <p className="text-gray-600">Real-time order management for kitchen staff</p> */}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-600">Last updated: {new Date().toLocaleTimeString()}</div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-full mx-auto px-4 sm:px-5 lg:px-8 py-3">
          <div className="flex lg:gap-4 items-center flex-row md:flex-col lg:flex-row">

            <div className="bg-white rounded border border-gray-100 shadow-sm px-4 py-3 mb-4 md:mb-2">
            {/* <div className="flex flex-wrap gap-3"> */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2  gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                  filter === "all"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                  filter === "pending"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending ({orders.filter((o) => o.status === "pending").length})
              </button>
              <button
                onClick={() => setFilter("preparing")}
                className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                  filter === "preparing"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Preparing ({orders.filter((o) => o.status === "preparing").length})
              </button>
              <button
                onClick={() => setFilter("ready")}
                className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                  filter === "ready"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ready ({orders.filter((o) => o.status === "ready").length})
              </button>
            </div>
          </div>
            
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-white px-3 py-2 border border-gray-100">
            <div className="bg-white rounded border border-gray-100 px-6 py-4">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-xl">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">Pending Orders</p>
                  <p className="text-sm font-bold text-red-600">
                    {orders.filter((o) => o.status === "pending").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded border border-gray-100 px-6 py-4">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">Preparing</p>
                  <p className="text-sm font-bold text-yellow-600">
                    {orders.filter((o) => o.status === "preparing").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded border border-gray-100 px-6 py-4">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">Ready</p>
                  <p className="text-sm font-bold text-green-600">
                    {orders.filter((o) => o.status === "ready").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded border border-gray-100 px-6 py-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">Total Orders</p>
                  <p className="text-sm font-bold text-blue-600">{orders.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          

          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-white border border-gray-100 p-3 rounded">
            {filteredOrders.map((order) => {
              const priority = getOrderPriority(order)
              const orderTime = new Date(order.createdAt)
              const minutesElapsed = Math.floor((new Date() - orderTime) / (1000 * 60))

              return (
                <div
                  key={order._id}
                  className={`bg-white rounded-lg scale-100 shadow-md border border-gray-300 p-5 border-l-4 ${getPriorityColor(priority)} hover:shadow-lg hover:scale-105 transition-all`}
                >
                  <div className="flex justify-between items-start mb-2">
                    
                    <div>
                      {/* <h3 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h3> */}
                      <h3 className="text-sm font-semibold text-gray-900">Order #{order._id.slice(-6)}</h3>
                      {/* <p className="text-xs text-gray-600">{order.orderType}</p> */}
                      <p className="text-xs text-gray-600">{order.orderType && typeof order.orderType === "object"
    ? order.orderType.en || order.orderType.ja || "Dine-in"
    : order.orderType || "Dine-in"}</p>
                      
                    </div>
                    <div className="text-right">
                      <span className={`px-1 py-0 text-xs rounded font-medium ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-500">{minutesElapsed}m ago</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <h4 className="font-semibold text-xs text-gray-900 mb-2">Items:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="text-xs">{item?.name?.en ?? item.name ?? "Unknown Item"}</span>
                          <span className="text-xs text-gray-600">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-xl">
                      <h4 className="font-semibold text-yellow-800 text-xs mb-1">Special Instructions:</h4>
                      <p className="text-yellow-700 text-sm">{order.specialInstructions}</p>
                    </div>
                  )}

                  {/* Status Stepper */}
                  <div className="space-y-3">
                    <div className="relative h-12">
                      {/* Track */}
                      <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-200 rounded-full"></div>
                      {/* Filled portion based on current status */}
                      <div
                        className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-orange-500 rounded-full transition-all"
                        style={{ width: `${(STATUSES.indexOf(order.status) / (STATUSES.length - 1)) * 100}%` }}
                      ></div>
                      {/* Markers */}
                      <div className="absolute inset-0 flex justify-between items-center">
                        {STATUSES.map((s, idx) => {
                          const currentIdx = STATUSES.indexOf(order.status)
                          const isReached = idx <= currentIdx
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateOrderStatus(order._id, s)}
                              className="relative flex flex-col items-center focus:outline-none text-xs"
                              title={s}
                            >
                              <span
                                className={`w-5 h-5 rounded-full border-2 shadow transition-colors ${
                                  isReached
                                    ? "bg-orange-500 border-orange-600"
                                    : "bg-white border-gray-300 hover:border-orange-400"
                                }`}
                              ></span>
                              <span
                                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] uppercase font-medium ${
                                  isReached ? "text-gray-900 font-semibold" : "text-gray-500"
                                }`}
                              >
                                {s}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          { loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading kitchen display...</p>
            </div>
          </div>
          )
        } 



          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">All caught up! No orders to display for the selected filter.</p>
              </div>
            </div>
          )}


</div>

{statusUpdating && (
  <div className="bg-black/20 min-h-full min-w-full fixed top-0 left-0 flex items-center justify-center z-50">
    <div className="flex flex-col justify-center items-center space-y-2 bg-white py-10 px-16 rounded shadow border border-gray-300">
      <Loader className="w-5 h-5 text-orange-500 animate-spin" />
      <span className="text-xs font-medium text-gray-700">Updating status, please wait...</span>
    </div>
  </div>
)}

      </div>
    )
  )
}
