"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuthToken } from "@/lib/useAuthToken";
export default function AdminOrdersManagement() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")
  const [loading, setLoading] = useState(true)
  const token = useAuthToken();

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, tableFilter, dateFilter])

  const fetchOrders = async () => {
  
          if (!token) return;
    try {
      const response = await fetch("/api/orders",{
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      })
      const data = await response.json()
      setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      setLoading(false)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Table filter
    if (tableFilter !== "all") {
      filtered = filtered.filter((order) => order.tableNumber === tableFilter)
    }

    // Date filter
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    if (dateFilter === "today") {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.toDateString() === today.toDateString()
      })
    } else if (dateFilter === "yesterday") {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.toDateString() === yesterday.toDateString()
      })
    } else if (dateFilter === "week") {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= weekAgo
      })
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId, newStatus) => {
      
          if (!token) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "preparing":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ready":
        return "bg-green-100 text-green-800 border-green-200"
      case "served":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getUniqueTableNumbers = () => {
    const tables = [...new Set(orders.map((order) => order.tableNumber).filter(Boolean))]
    return tables.sort()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    //"view_orders">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
                <p className="text-gray-600">Monitor and manage all customer orders</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                  {filteredOrders.length} Orders
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Orders</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Table Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
                <select
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tables</option>
                  {getUniqueTableNumbers().map((table) => (
                    <option key={table} value={table}>
                      Table {table}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <button
                  onClick={fetchOrders}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Order #{order.orderNumber || order._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>

                {/* Customer & Table Info */}
                <div className="space-y-2 mb-4">
                  {order.customerInfo?.name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {order.customerInfo.name}
                    </div>
                  )}

                  {order.customerInfo?.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {order.customerInfo.phone}
                    </div>
                  )}

                  {order.tableNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Table {order.tableNumber}
                    </div>
                  )}

                  {order.source && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      {order.source === "qr-code" ? "QR Code Order" : "Manual Order"}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>SR {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">SR {order.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order._id, "confirmed")}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order._id, "cancelled")}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-xl hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {order.status === "confirmed" && (
                    <button
                      onClick={() => updateOrderStatus(order._id, "preparing")}
                      className="w-full bg-orange-600 text-white py-2 px-3 rounded-xl hover:bg-orange-700 text-sm font-medium transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}

                  {order.status === "preparing" && (
                    <button
                      onClick={() => updateOrderStatus(order._id, "ready")}
                      className="w-full bg-green-600 text-white py-2 px-3 rounded-xl hover:bg-green-700 text-sm font-medium transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}

                  {order.status === "ready" && (
                    <button
                      onClick={() => updateOrderStatus(order._id, "served")}
                      className="w-full bg-gray-600 text-white py-2 px-3 rounded-xl hover:bg-gray-700 text-sm font-medium transition-colors"
                    >
                      Mark Served
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">No orders match your current filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    //
  )
}
