"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import Header from "@/components/Header"
import { useAuthToken } from "@/lib/useAuthToken";
export default function UserProfile() {
  const [email, setEmail] = useState("")
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchSubmitted, setSearchSubmitted] = useState(false)
  const { language } = useLanguage()
  const token = useAuthToken();

  // Check if email is stored in localStorage on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email")
    if (storedEmail) {
      setEmail(storedEmail)
      fetchUserProfile(storedEmail)
    }
  }, [])

  const fetchUserProfile = async (emailToFetch) => {
    if (!emailToFetch) return
   
          if (!token) return;
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch(`/api/users/profile?email=${encodeURIComponent(emailToFetch)}`,{
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        localStorage.setItem("user_email", emailToFetch)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "User not found")
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError("An unexpected error occurred")
      setUserProfile(null)
    } finally {
      setLoading(false)
      setSearchSubmitted(true)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchUserProfile(email)
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          {language === "en" ? "User Profile" : "ユーザープロフィール"}
        </h1>
        
        <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-grow">
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "en" ? "Enter your email address" : "メールアドレスを入力してください"}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === "en" ? "Loading..." : "読み込み中..."}
                </span>
              ) : (
                language === "en" ? "Find My Profile" : "プロフィールを検索"
              )}
            </button>
          </div>
        </form>
        
        {error && searchSubmitted && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-md mb-5 sm:mb-6 text-sm sm:text-base">
            <p>{error}</p>
            <p className="mt-2 text-xs sm:text-sm">
              {language === "en" 
                ? "No profile found with this email. You may need to place an order first." 
                : "このメールアドレスのプロフィールが見つかりません。最初に注文する必要があるかもしれません。"}
            </p>
            <Link href="/digital-menu" className="text-blue-600 hover:text-blue-800 mt-2 inline-block text-sm">
              {language === "en" ? "Go to Menu" : "メニューへ"}
            </Link>
          </div>
        )}
        
        {userProfile && (
          <div>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                {language === "en" ? "Profile Information" : "プロフィール情報"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {language === "en" ? "Email" : "メール"}
                  </p>
                  <p className="font-medium text-sm sm:text-base break-all">{userProfile.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {language === "en" ? "Total Orders" : "注文総数"}
                  </p>
                  <p className="font-medium text-sm sm:text-base">{userProfile.orderCount}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {language === "en" ? "Member Since" : "登録日"}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {new Date(userProfile.createdAt).toLocaleDateString(
                      language === "en" ? "en-US" : "ja-JP",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              {language === "en" ? "Order History" : "注文履歴"}
            </h2>
            
            {userProfile.orders.length === 0 ? (
              <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm sm:text-base">
                  {language === "en" ? "No orders found" : "注文が見つかりません"}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {userProfile.orders.map((order) => (
                  <div key={order._id} className="bg-gray-50 p-4 sm:p-6 rounded-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {language === "en" ? "Order ID: " : "注文ID: "}
                          <span className="font-mono text-xs sm:text-sm break-all">{order._id}</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleString(
                            language === "en" ? "en-US" : "ja-JP",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }
                          )}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                        {language === "en" ? "Order Items" : "注文商品"}
                      </h4>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === "en" ? "Item" : "商品"}
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === "en" ? "Qty" : "数量"}
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {language === "en" ? "Price" : "価格"}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {order.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900">
                                    {item.nameEn && language === "en" ? item.nameEn : item.name}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 text-center">
                                    {item.quantity}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 text-right">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-100">
                                <td colSpan="2" className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900 text-right">
                                  {language === "en" ? "Total" : "合計"}:
                                </td>
                                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-gray-900 text-right">
                                  ₹{(order.totalAmount || 0).toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}