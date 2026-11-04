"use client"

import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import Header from "@/components/Header"
import CustomerHeaderMenu from "@/components/CustomerHeaderMenu"
import { X, Clock, RefreshCw } from "lucide-react"
import { useAuthToken } from "@/lib/useAuthToken";
// import { hasPermission } from "@/lib/rbac"
import {useAuth, userAuth} from "@/lib/auth"

export default function CustomerHomePage() {
  const { language } = useLanguage()
  const [settings, setSettings] = useState(null)
  const {user,hasPermission} = useAuth();
  // Modal state for My Orders overlay  
  const [showOrderStatus, setShowOrderStatus] = useState(false)
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false)
  const [orderHistory, setOrderHistory] = useState([])
  const [email, setEmail] = useState("")
const token = useAuthToken();
  useEffect(() => {
    // Fetch settings from API
    
          if (!token) return;
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings',{
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    fetchSettings()

    // Load email and order history for My Orders modal
    try {
      const storedEmail = localStorage.getItem('customerEmail')
      if (storedEmail) setEmail(storedEmail)
      const orders = JSON.parse(localStorage.getItem('customerOrderHistory') || '[]')
      setOrderHistory(Array.isArray(orders) ? orders : [])
    } catch {}
  }, [])

  return (
    hasPermission(user,["manage_customer","view_customer"]) && (
    <div>
      {/* <Header /> */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-xl shadow-lg overflow-hidden mb-8 sm:mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center">
          {/* <div className="p-6 sm:p-8 md:p-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              {language === "en" 
                ? (settings?.hotelName || "Hotel-POS") 
                : (settings?.hotelNameJa || "ホテルPOS")}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              {language === "en"
                ? "Experience exceptional dining with our digital menu system."
                : "デジタルメニューシステムで特別な食事体験を。"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/account"
                className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-md sm:text-base font-bold rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {language === "en" ? "My Account" : "マイプロフィール"}
              </Link>
            </div>
          </div> */}
          {/* Mobile hero image */}
          <div className="block md:hidden relative h-48 sm:h-64 mx-6 mb-6 rounded-xl overflow-hidden">
            <Image
              src="/placeholder.svg"
              alt="Hotel Restaurant"
              fill
              className="object-cover"
            />
          </div>
          {/* Desktop hero image */}
          <div className="hidden md:block relative h-96">
            <Image
              src="/placeholder.svg"
              alt="Hotel Restaurant"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-8 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-12">
          {language === "en" ? "Our Services" : "サービス"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
              {language === "en" ? "Digital Ordering" : "デジタル注文"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {language === "en"
                ? "Browse our menu and place orders directly from your device."
                : "デバイスから直接メニューを閲覧し、注文することができます。"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
              {language === "en" ? "Email Verification" : "メール認証"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {language === "en"
                ? "Secure ordering with email verification and order tracking."
                : "メール認証と注文追跡による安全な注文システム。"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1 mx-auto sm:mx-0 max-w-md sm:max-w-none">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
              {language === "en" ? "Order History" : "注文履歴"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {language === "en"
                ? "View your past orders and reorder your favorites easily."
                : "過去の注文を確認し、お気に入りを簡単に再注文できます。"}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-xl shadow-lg overflow-hidden text-white text-center py-8 sm:py-12 md:py-16 px-4 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
          {language === "en" ? "Ready to Order?" : "ご注文の準備はできましたか？"}
        </h2>
        <p className="text-base sm:text-lg md:text-xl opacity-90 mb-6 sm:mb-8 max-w-2xl mx-auto">
          {language === "en"
            ? "Browse our digital menu and place your order with just a few clicks."
            : "デジタルメニューを閲覧し、数回のクリックで注文できます。"}
        </p>
        {/* <Link
          href="/digital-menu"
          className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 transition-colors"
        >
          {language === "en" ? "Go to Digital Menu" : "デジタルメニューへ"}
        </Link> */}
      </div>
    </div>

    <div className="sticky bottom-3 mb-2">
    
     <CustomerHeaderMenu
     currTab="Home"
                showCart={true}
                showSearch={false}
                cartItemCount={0}
                onCartClick={() => {}}
                showMyOrders={true}
                onMyOrdersClick={() => setShowOrderStatus(true)}
                />

    </div>

    {showOrderStatus && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
          <div className="p-3 sm:p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">My Orders</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    try {
                      setIsRefreshingOrders(true)
                      const minDelay = new Promise((res) => setTimeout(res, 1500))
                      // Best-effort refresh: refetch account data endpoint if available
                      // Here we only reload from localStorage for quick UX
                      const orders = JSON.parse(localStorage.getItem('customerOrderHistory') || '[]')
                      setOrderHistory(Array.isArray(orders) ? orders : [])
                      await minDelay
                    } finally {
                      setIsRefreshingOrders(false)
                    }
                  }}
                  className="text-indigo-600 hover:text-indigo-800 p-1"
                  title="Refresh Orders"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowOrderStatus(false)} className="text-gray-500 hover:text-gray-700 p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {orderHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order, index) => (
                  <div key={order.id + 'oh' + index} className="border rounded-xl overflow-hidden">
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
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Items: {order.items}</span>
                        <span className="font-semibold">₹{order.total}</span>
                      </div>
                    </div>
                    


                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
    )
  )
}