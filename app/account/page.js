"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import Header from "@/components/Header"
import Link from "next/link"
import { Pencil, X, Clock, RefreshCw, Download, ChevronDown  } from "lucide-react";
import CustomerHeaderMenu from "@/components/CustomerHeaderMenu"
import { useOrders } from "@/context/OrdersContext"
import {useAlert} from '@/context/AlertContext'
import {useAuth} from '@/lib/auth'
import {removeCookie} from "@/lib/cookieHelper"
import useAuthToken from "@/lib/useAuthToken"

export default function AccountPage() {
  const { language } = useLanguage()
  const { orderHistory, setOrderHistory } = useOrders()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [activeTaxes, setActiveTaxes] = useState([])
  const {setAlert} = useAlert();
  const token = useAuthToken();
  const {user, hasPermission} = useAuth();
  const {showAlert} = useAlert();
  const [settings, setSettings] = useState(null);
  


    useEffect(() => {
      const es = new EventSource('/api/events');
  
      const onUpdate = async (e) => {
        // console.log('Order update listened')
          // showAlert("error", "OTP Error", 'Failed to verify OTP. Please try again.', [{text: "Okay"}])
        try {
          const storedEmail = localStorage.getItem('customerEmail')
          await fetchCustomerProfile(storedEmail);
  
        } catch (err) {
          console.error('orders:update parse error', err);
        }
      };
  
      es.addEventListener('orders:update', onUpdate);
  
      return () => {
        es.removeEventListener('orders:update', onUpdate);
        es.close();
      };
    }, []);
  

  // Modal state for My Orders overlay
  const [showOrderStatus, setShowOrderStatus] = useState(false)
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false)
  
  // useEffect(() => {
  //   // Load active taxes/GST once
  //   const loadTaxes = async () => {
  //     if(!token) return;
  //     try {
  //       const res = await fetch('/api/taxes?active=true',{
  //         headers: {
  //           Authorization: `Bearer ${token}`
  //         }
  //       })
  //       if (!res.ok) return
  //       const data = await res.json()
  //       setActiveTaxes(Array.isArray(data) ? data.filter(t => t?.active) : [])
  //     } catch (e) {
  //       console.error('Failed to load taxes', e)
  //     }
  //   }
  //   loadTaxes()
  // }, [token])
  
      useEffect(() => {
        // if (!token) return;
        const fetchSettings = async () => {
        
          try {
            const response = await fetch("/api/settings",{
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              }
            });
            const data = await response.json();
            // console.log("Fetched Settings:", data);
            setSettings(data); // only general settings.general
            // setSettings(data.general); // only general settings.general
          } catch (error) {
            console.error("Error fetching settings.general:", error);
          }
        };
        fetchSettings();
      }, [token]);

  // Login and OTP state
  const [loginStep, setLoginStep] = useState("email") // email, otp, verified
  const [otp, setOtp] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [otpSent, setOtpSent] = useState(false)

  
  // Profile state
  const [profile, setProfile] = useState({
    name: " ",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    email: "",
    preferences: {
      notifications: true,
      marketing: false
    }
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Translations
  const t = {
    title: language === "en" ? "My Account" : "マイアカウント",
    profile: language === "en" ? "Profile" : "プロフィール",
    noOrders: language === "en" ? "No orders found" : "注文が見つかりません",
    viewDetails: language === "en" ? "View Details" : "詳細を見る",
    orderNumber: language === "en" ? "Order #" : "注文番号 #",
    date: language === "en" ? "Date" : "日付",
    status: language === "en" ? "Status" : "状態",
    total: language === "en" ? "Total" : "合計",
    items: language === "en" ? "Items" : "商品",
    checkStatus: language === "en" ? "Check Status" : "状態を確認",
    emailLabel: language === "en" ? "Email Address" : "メールアドレス",
    loginPrompt: language === "en" 
      ? "Enter your email to access your account" 
      : "アカウントにアクセスするにはメールアドレスを入力してください",
    loading: language === "en" ? "Loading..." : "読み込み中...",
    pending: language === "en" ? "Pending" : "保留中",
    confirmed: language === "en" ? "Confirmed" : "確認済み",
    preparing: language === "en" ? "Preparing" : "準備中",
    ready: language === "en" ? "Ready" : "準備完了",
    delivered: language === "en" ? "Delivered" : "配達済み",
    completed: language === "en" ? "Completed" : "完了",
    cancelled: language === "en" ? "Cancelled" : "キャンセル",
    // OTP related translations
    sendOtp: language === "en" ? "Send OTP" : "OTPを送信",
    verifyOtp: language === "en" ? "Verify OTP" : "OTPを確認",
    otpSent: language === "en" ? "OTP sent to your email" : "メールにOTPが送信されました",
    otpLabel: language === "en" ? "Enter OTP" : "OTPを入力",
    otpInvalid: language === "en" ? "Invalid OTP. Please try again." : "無効なOTPです。もう一度お試しください。",
    otpResend: language === "en" ? "Resend OTP" : "OTPを再送信",
    otpInfo: language === "en" 
      ? "A one-time password has been sent to your email" 
      : "ワンタイムパスワードがメールに送信されました",
    backToEmail: language === "en" ? "Back to Email" : "メールに戻る",
    logout: language === "en" ? "Logout" : "ログアウト",
    // Profile translations
    personalInfo: language === "en" ? "Personal Information" : "個人情報",
    firstName: language === "en" ? "First Name" : "名",
    lastName: language === "en" ? "Last Name" : "姓",
    phone: language === "en" ? "Phone Number" : "電話番号",
    address: language === "en" ? "Address" : "住所",
    city: language === "en" ? "City" : "市区町村",
    postalCode: language === "en" ? "Postal Code" : "郵便番号",
    country: language === "en" ? "Country" : "国",
    preferences: language === "en" ? "Preferences" : "設定",
    notificationsLabel: language === "en" ? "Receive order notifications" : "注文通知を受け取る",
    marketingLabel: language === "en" ? "Receive marketing emails" : "マーケティングメールを受け取る",
    editProfile: language === "en" ? "Edit Profile" : "プロフィールを編集",
    saveProfile: language === "en" ? "Save Profile" : "プロフィールを保存",
    cancelEdit: language === "en" ? "Cancel" : "キャンセル",
    profileSaved: language === "en" ? "Profile saved successfully!" : "プロフィールが正常に保存されました！",
    accountInfo: language === "en" ? "Account Information" : "アカウント情報",
    totalOrders: language === "en" ? "Total orders" : "注文総数",
    recentOrders: language === "en" ? "Recent Orders" : "最近の注文",
    viewAllOrders: language === "en" ? "View All Orders" : "すべての注文を見る",
  }

  // Load user data and fetch profile from API if logged in
  // useEffect(() => {
  //   const loadUserData = async () => {
  //     try {
  //       // Check if we have a stored email and verified status
  //       const storedToken = localStorage.getItem('token');
  //       const storedEmail = localStorage.getItem('customerEmail')
  //       const isVerified = localStorage.getItem('customerVerified') === 'true'
      
  //     console.log("Account load check:", { storedToken: !!storedToken, storedEmail, isVerified });
  //       // Priority 1: If we have a valid token → auto-login (skip everything)
  //     if (storedToken && storedEmail) {
  //       setEmail(storedEmail);
  //       setIsLoggedIn(true);
  //       setLoginStep('verified');
  //       fetchCustomerProfile(storedEmail);
  //       return;
  //     }

  //     // Priority 2: Old flow — email + verified flag (for backward compatibility)
  //       // if (storedEmail) {
  //       //   setEmail(storedEmail)
  //       //   if (isVerified) {
  //       //     setIsLoggedIn(true);
  //       //     setLoginStep('verified');
  //       //     // Fetch customer profile from API
  //       //     await fetchCustomerProfile();
  //       //   } else {
  //       //     // Email exists but not verified
  //       //     setLoginStep('email')
  //       //   }
  //       // }
  //       // Case 2: Has email + verified flag → logged in (old flow)
  //     if (storedEmail && isVerified) {
  //       setEmail(storedEmail);
  //       setIsLoggedIn(true);
  //       setLoginStep("verified");
  //       fetchCustomerProfile(storedEmail);
  //       return;
  //     }

  //     // Case 3: Only email → show OTP step
  //     if (storedEmail ) {
  //       setEmail(storedEmail);
  //       setLoginStep("otp"); // or "email" if you want to re-ask
  //       return;
  //     }

  //     // Case 4: Nothing → show email input
  //     setLoginStep("email");
  //     } catch (error) {
  //       console.error("Error loading user data:", error);
  //       setLoginStep("email");
  //     }
  //   }
    
  //   loadUserData()
  // }, [])

  useEffect(() => {
  const loadUserData = () => {
    // Small delay to ensure localStorage is synced (common Next.js issue)
    setTimeout(() => {
      const storedToken = localStorage.getItem("token");
      const storedEmail = localStorage.getItem("customerEmail");
      const isVerified = localStorage.getItem("customerVerified") === "true";

      // console.log("Account load check:", { storedToken: !!storedToken, storedEmail, isVerified });

      if (storedToken && storedEmail) {
        // Highest priority: valid token = fully logged in
        setEmail(storedEmail);
        setIsLoggedIn(true);
        setLoginStep("verified");
        fetchCustomerProfile(storedEmail);
        return;
      }

      if (storedEmail && isVerified) {
        // Fallback: verified flag (for older orders)
        setEmail(storedEmail);
        setIsLoggedIn(true);
        setLoginStep("verified");
        fetchCustomerProfile(storedEmail);
        return;
      }

      if (storedEmail) {
        // Email exists but not verified → show OTP step
        setEmail(storedEmail);
        setLoginStep("otp"); // or "email" if you want to re-enter
        return;
      }

      // Nothing → show email input
      setLoginStep("email");
    }, 150); // 150ms delay fixes race condition
  };

  loadUserData();
}, []); // ← Run ONLY once on mount

  // Function to handle email submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) return
    
    setIsLoading(true)
    
    try {
      // Store email in localStorage
      localStorage.setItem('customerEmail', email)
      
      // Generate a random 6-digit OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(randomOtp)
      
      // Send OTP to user's email using our API
      const response = await fetch('/api/customers/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: randomOtp
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }
      
      // Move to OTP verification step
      setLoginStep('otp')
      setOtpSent(true)
      
      // Auto-hide the OTP sent message after 5 seconds
      setTimeout(() => {
        setOtpSent(false)
      }, 5000)
    } catch (error) {
      console.error("Error sending OTP:", error)
      showAlert("error1", "OTP Error", 'Failed to send OTP. Please try again.', [{text: "Okay"}])
    } finally {
      setIsLoading(false)
    }
  }
  
  
const handleVerifyOTP = async () => {
  if (!otpInput) {
    showAlert("error", "OTP Error", language === "en" ? "Please enter the verification code" : "確認コードを入力してください", [{text: "Okay"}])
    return
  }

  if (!pendingOrderData) {
    showAlert("error", "Order Error", "Order data not found. Please try again.", [{text: "Okay"}])
    return
  }

  setIsVerifying(true)
  try {
    const verifyResult = await apiCall("/api/orders/verify-otp", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        email: pendingOrderData.customerInfo.email,  // or customerInfo.email
        otp: otpInput.trim(),
      }),
    })

    if (verifyResult?.success || verifyResult?.orderId) {
      // SUCCESS — your server already returns { success: true, orderId: "..." }
      localStorage.setItem("customerEmail", pendingOrderData.customerInfo.email)
      localStorage.setItem("customerVerified", "true")

      showAlert("success", "Order Placed", 
        `Order placed successfully! Order ID: ${verifyResult.orderId?.slice(-6)}`, 
        [{text: "Okay"}]
      )

      setCart([])
      setShowOtpVerification(false)
      setOtpInput("")
      setPendingOrderData(null)
      await fetchOrderHistory()
      setTimeout(() => setShowOrderStatus(true), 500)
    }
  } catch (error) {
    console.error("OTP verification failed:", error)
    showAlert("error", "Invalid OTP", "Wrong or expired code. Please try again.", [{text: "Okay"}])
  } finally {
    setIsVerifying(false)
  }
}

  
const fetchCustomerProfile = async (emailToUse = email) => {
  if (!token && !localStorage.getItem("token")) {
    console.warn("No token – skipping profile fetch");
    return;
  }
const authToken = token || localStorage.getItem("token");
  if (!authToken) return;
  try {
    const response = await fetch('/api/customers/profile', {
      method: 'POST',  // Your endpoint uses POST with { email }
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ email: emailToUse || localStorage.getItem("customerEmail") }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.customer) {
      setProfile({
        name: data.customer.name || "Guest",
        firstName: data.customer.firstName || "",
        lastName: data.customer.lastName || "",
        phone: data.customer.phone || "",
        address: data.customer.address || "",
        city: data.customer.city || "",
        postalCode: data.customer.postalCode || "",
        country: data.customer.country || "",
        email: data.customer.email,
        preferences: data.customer.preferences || {
          notifications: true,
          marketing: false
        }
      });
    }

    if (Array.isArray(data.orders)) {
      const mappedOrders = data.orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber || order._id.slice(-6),
        date: order.createdAt,
        status: order.status,
        total: order.totalAmount || order.total.toFixed(2) || 0,
        items: order.items?.length || 0,
        orderItems: order.items || [],
        tableNumber: order.tableNumber,
        paymentMethod: order.paymentMethod,
        settlementNo: order.settlementNo,
        settledAt: order.settledAt,
        settled: order.settled
      }));
      setOrderHistory(mappedOrders);
    } else {
      setOrderHistory([]);
    }
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    setOrderHistory([]);
  }
};

  // Function to resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true)
    
    try {
      // Generate a new random 6-digit OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(randomOtp)
      
      // Send OTP to user's email using our API
      const response = await fetch('/api/customers/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: randomOtp
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }
      
      setOtpSent(true)
      
      // Auto-hide the OTP sent message after 5 seconds
      setTimeout(() => {
        setOtpSent(false)
      }, 5000)
    } catch (error) {
      console.error("Error resending OTP:", error)
      // alert(error.message || 'Failed to resend OTP. Please try again.')
      showAlert("error", "OTP Error", 'Failed to resend OTP. Please try again.', [{text: "Okay"}])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.includes('.')) {
      // Handle nested properties like preferences.notifications
      const [parent, child] = name.split('.')
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      // Handle top-level properties
      setProfile(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }
  
  // Function to save profile
  const saveProfile = async () => {
    if(!token) return;
    setIsLoading(true)
    
    try {
      // First, get the customer ID by fetching profile
      const response = await fetch('/api/customers/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email
        }),
      })
      
      const data = await response.json()
      // console.log("Fetching customer profile:", data);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile')
      }
      
      if (!data.customer) {
        throw new Error('Customer not found')
      }
      
      // Now update the customer profile
      const customerId = data.customer._id
      
      const updateResponse = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profile,
          email // Make sure email is included
        }),
      })
      
      const updateData = await updateResponse.json()
      
      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Failed to update profile')
      }
      
      // Show success message and exit edit mode
      setProfileSaved(true)
      setIsEditingProfile(false)
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setProfileSaved(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving profile:", error)
      // alert(error.message || 'Failed to save profile. Please try again.')
      showAlert("error", "Profile Error", 'Failed to save profile. Please try again.', [{text: "Okay"}])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle logout
  const handleLogout = () => {
    // Remove verification status but keep email for convenience
    removeCookie("hotel_pos_jwt");
    localStorage.removeItem('customerVerified')
    localStorage.removeItem('token');
    setIsLoggedIn(false)
    setLoginStep('email')

    
    // Reset order history
    setOrderHistory([])
    
    // Reset profile to default values
    setProfile({
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      preferences: {
        notifications: true,
        marketing: false
      }
    })
  }

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-indigo-100 text-indigo-800'
      case 'ready':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Function to translate status
  const translateStatus = (status) => {
    switch (status) {
      case 'pending':
        return t.pending
      case 'confirmed':
        return t.confirmed
      case 'preparing':
        return t.preparing
      case 'ready':
        return t.ready
      case 'delivered':
        return t.delivered
      case 'completed':
        return t.completed
      case 'cancelled':
        return t.cancelled
      default:
        return status
    }
  }

  // ===== Invoice helpers =====
  
  const getComputedRates = () => {
    // If taxes are configured, compute effective rates with flexible GST detection
    if (activeTaxes && activeTaxes.length) {
      const percentageTaxes = activeTaxes.filter(t => t?.type === 'percentage')
      const fixedTaxes = activeTaxes.filter(t => t?.type === 'fixed')

      const isGSTTax = (t) => {
        const n = (t?.name || '').toString()
        return t?.isGST === true || /gst/i.test(n)
      }

      const gstParts = percentageTaxes.filter(isGSTTax)
      const otherParts = percentageTaxes.filter(t => !isGSTTax(t))

      const gstRate = gstParts.reduce((sum, t) => sum + Number(t?.rate || 0), 0) / 100 // fraction
      const otherPctRate = otherParts.reduce((sum, t) => sum + Number(t?.rate || 0), 0) / 100
      const fixedSum = fixedTaxes.reduce((sum, t) => sum + Number(t?.rate || 0), 0)

      // Keep name+rate for later breakup calculation
      const gstBreakup = gstParts.map(p => ({ name: p?.name || 'GST', rate: Number(p?.rate || 0) }))

      return { gstRate, otherPctRate, fixedSum, configured: true, gstBreakup }
    }
    // Fallback GST if none configured
    return { gstRate: 0.18, otherPctRate: 0, fixedSum: 0, configured: false, gstBreakup: [] }
  }
  
  const formatINR = (amount) => {
    try {
      return Math.round(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
    } catch (e) {
      return `${Number(amount || 0).toLocaleString()}`
    }
  }
  
  const computeInvoice = (order) => {
    const items = order?.orderItems || []
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
    const reportedTotal = Number(order.total || order.totalAmount || 0)
    const { gstRate, otherPctRate, fixedSum, configured, gstBreakup } = getComputedRates()
    
    // Apply percentage taxes on subtotal
    let gst = subtotal * gstRate
    let otherTaxes = subtotal * otherPctRate
    let fixedTaxes = fixedSum
    
    let total = subtotal + gst + otherTaxes + fixedTaxes
    
    // If taxes are NOT configured, respect the reported total (if present) and backfill GST as difference
    if (!configured && reportedTotal > 0) {
      if (Math.abs(reportedTotal - total) > 0.01) {
        total = reportedTotal
        // Assume reported total already includes taxes; derive gst as the difference if positive
        const diff = Math.max(total - subtotal, 0)
        gst = diff
        otherTaxes = 0
        fixedTaxes = 0
      }
    }
    
    return { subtotal, gst, otherTaxes, fixedTaxes, total, configured, gstBreakup }
  }
  
  const handleDownloadInvoice = (order) => {
    const { subtotal, gst, otherTaxes, fixedTaxes, total, configured, gstBreakup } = computeInvoice(order);
    const discount = Number(order?.discount || 0);

    // Prepare display fields similar to Bills modal
    let customerName = `${profile.name}`.trim();
    // if (!customerName) customerName = email || 'Customer';
    let customerEmail = profile.email || 'null';
    let tableNumber = order?.tableNumber || 'null';
    const customerPhone = profile.phone || 'null';
    const customerRoom = order?.customerRoom || 'null';
    const customerTable = order?.customerTable || order?.tableNumber || order?.table || 'null';
    const billNumber = order?.orderNumber || (order?.id ? String(order.id).slice(-6) : 'N/A');
    const createdAt = order?.date || order?.createdAt || new Date().toISOString();
    const orderType = order?.orderType || 'Dine-in';
    const paymentMethod = order?.paymentMethod || 'pending';
    const settlementNo = order?.settlementNo || 'null';
    const settledAt = order?.settledAt || 'null';

    // console.log("Account Page",order)
    // Calculate CGST & SGST totals
  let totalCGST = 0;
  let totalSGST = 0;
    // Build items rows like Bills (Item, Qty, Price, Total)
    const itemsRows = (order?.orderItems || []).map((item) => {
 const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 1);
      const taxRate = Number(item.tax || 0); // e.g. 18%
      const lineTotal = price * quantity;
      const taxAmount = (lineTotal * taxRate) / 100;
      const halfTaxAmount = taxAmount / 2; // Split equally

      totalCGST += halfTaxAmount;
      totalSGST += halfTaxAmount;

      // const halfTaxRate = taxRate / 2;
    
    return`
      <tr class="border-b border-gray-100 bg-red-700">
        <td class="">
          ${(item?.name?.en ?? item?.name ?? item?.nameEn ?? '').slice(0, 25)}
          ${(item?.name?.en ?? item?.name ?? item?.nameEn ?? '').length > 25 ? '...' : ''}
        </td>
        <td class="text-right" style="text-align:right; font-size:12px">${Number(item?.quantity || 1)}</td>
        <td class="text-right" style="text-align:right; font-size:12px">₹${Number(taxAmount.toFixed(2) || 0)}</td>
        <td class="text-right" style="text-align:right; font-size:12px">${Number(taxRate || 0)}%</td>
        <td class="text-right" style="text-align:right; font-size:12px">₹${Number(item?.price || 0)}</td>
        <td class="text-right" style="text-align:right; font-size:12px">₹${lineTotal + taxAmount }</td>
      </tr> 
    `;
  }).join('');

    const taxRows = `
      <div class="totals-row">
        <span>CGST:</span>
        <span>${totalCGST.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>SGST:</span>
        <span>${totalSGST.toFixed(2)}</span>
      </div>
    `;

    const d = new Date(createdAt);

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice #${billNumber}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Poppins', sans-serif; background: #f3f4f6; margin: 0; padding:0 }
  .container { max-width: 100vw; margin: 0 5px; padding: 0 1px; }
  .card { background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
  .header { padding: 2px 2px; border-bottom: 1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; }
  .header h2 { margin: 0; font-size: 20px; font-weight: 700; color: #111827; }
  .content { padding: 5px 15px; }
  .center { text-align: center; margin-bottom: 15px; }
  .title { font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 6px; }
  .muted { color: #4b5563; margin: 2px 0; font-size:10px; }
  .section { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { text-align: left; padding: 8px 0; font-weight: 700; border-bottom: 1px solid #e5e7eb; font-size:12px;}
  tbody td { padding: 3px 0; border-bottom: 1px solid #f3f4f6; font-size:12px;}
  .totals { border-top: 1px solid #e5e7eb; padding-top: 12px; }
  .totals-inner { width: 256px; margin-left: auto; }
  .totals-row { display:flex; justify-content:space-between; padding: 4px 0; font-size:13px; }
  .totals-row.bold { font-weight: 700; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #4b5563; }
  @media print { body { background: #fff; } .container { margin: 0; } .card { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
  <div class="container">
    <div class="card" id="bill-content">


      <div class="content">
        <div class="center">
            <h1 class="text-2xl max-sm:text-xl font-semibold text-gray-900">${settings?.general?.restaurantName}</h1>
            <p class="muted">${settings?.general?.address}</p>
            <p class="muted">📞 ${settings?.general?.phone} | ✉️ ${settings?.general?.email}</p>
        </div>

        <div class="section">
          <div class="" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <div>
              <p class="muted" style="margin-bottom:2px;"><strong>Bill To:</strong> ${customerEmail}</p>
              <p class="muted" style="margin-bottom:2px;"><strong>Name:</strong> ${customerName}</p>
              ${customerPhone ? `<p class="muted" style="margin:2px 0;"><strong>Phone:</strong> ${customerPhone}</p>` : ''}
              ${customerPhone ? `<p class="muted" style="margin:2px 0;"><strong>Table number:</strong> ${tableNumber}</p>` : ''}
            </div>
            <div style="">
              <p class="muted" style="margin:2px 0;"><strong>Bill no.:</strong> #${billNumber}</p>
              <p class="muted" style="margin:2px 0;"><strong>Date:</strong> ${d.toLocaleDateString()}</p>
              <p class="muted" style="margin:2px 0;"><strong>Time:</strong> ${d.toLocaleTimeString()}</p>
              <p class="muted" style="margin:2px 0;"><strong>Order Type:</strong> ${orderType}</p>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Item Tax</th>
              <th style="text-align:right;">Tax(%)</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-inner">
            <div class="totals-row">
            <span>Payment Method:</span>
            <span>${paymentMethod}</span>
          </div>
          ${settlementNo && settlementNo !== 'null' ? `
          <div class="totals-row">
            <span>Settlement No:</span>
            <span>${settlementNo}</span>
          </div>` : ''}
          ${settledAt && settledAt !== 'null' ? `
          <div class="totals-row">
            <span>Settled On:</span>
            <span>${new Date(settledAt).toLocaleString()}</span>
          </div>` : ''}
          </div>
        </div>
        <div class="totals">
          <div class="totals-inner">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatINR(subtotal)}</span>
            </div>
            ${discount > 0 ? `
            <div class="totals-row" style="color:#dc2626;">
              <span>Discount:</span>
              <span>-₹${formatINR(discount)}</span>
            </div>` : ''}

            ${taxRows}

            <div class="totals-row bold">
              <span>Total:</span>
              <span>${formatINR(total)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div style="font-size:12px;">${settings?.pos?.receiptFooter}</div>
          <div style="font-size:10px; color:#6b7280; margin-top:1px; text-align:center; margin-top:12px;">GST No: ${settings?.general?.gst} | FSSAI No: ${settings?.general?.fssai}</div>
        </div>
        
      </div>
    </div>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
      // return alert('Pop-up blocked. Please allow pop-ups to download the invoice.');
      showAlert("error", "Pop-up Blocked", 'Please allow pop-ups to download the invoice.', [{text: "Okay"}])
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  }
  // ===== End invoice helpers =====
  
  return (

    <div className="h-screen bg-red-900 overflow-hidden">
      {/* <Header /> */}
      
      {/* <main className="max-w-7xl mx-auto h-full lg:px-8 py-3"> */}
      <main className="flex flex-col items-center justify-center h-full max-w-7xl mx-auto lg:px-8">
        <div className="shadow w-full h-full px-4 bg-gray-50 py-4 pb-10  h-screen overflow-hidden overflow-y-auto ">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center rounded-2xl mb-0  shadow-lg">
            <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
            {isLoggedIn && (
             
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t.logout}
              </button>

            
            

            )}
          </div>
          
          {/* Content */}
          <div className="rounded-xl py-4 px-0">
            {!isLoggedIn ? (
              <div className="max-w-md mx-auto">
                {loginStep === 'email' && (
                  <>
                    <p className="text-gray-600 mb-4 ">{t.loginPrompt}</p>
                    {otpSent && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">{t.otpSent}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleEmailSubmit}>
                      <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          {t.emailLabel}
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-2 py-2 border border-gray-300  rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-md hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {isLoading ? t.loading : t.sendOtp}
                      </button>
                    </form>
                  </>
                )}
                
                {loginStep === 'otp' && (
                  <>
                    <div className="bg-gray-50  border-l-4 border-blue-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">{t.otpInfo}</p>
                          <p className="text-sm text-blue-700 mt-1 font-medium">{email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {otpSent && (
                      <div className="bg-green-50   border-l-4 border-green-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">{t.otpSent}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {otpError && (
                      <div className="bg-red-50  border-l-4 border-red-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{otpError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <form onSubmit={handleOtpVerify}>
                      <div className="mb-4">
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                          {t.otpLabel}
                        </label>
                        <input
                          type="text"
                          id="otp"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                          maxLength={6}
                          pattern="[0-9]{6}"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-3">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-md hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {isLoading ? t.loading : t.verifyOtp}
                        </button>
                        
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => setLoginStep('email')}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            {t.backToEmail}
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-sm text-red-600 hover:text-red-900"
                          >
                            {t.otpResend}
                          </button>
                        </div>
                      </div>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <div className="px-0 h-full">
                {/* Success message */}
                {profileSaved && (
                  <div className="bg-green-50  border-l-4 border-green-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{t.profileSaved}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Profile Information */}
                <div className="flex flex-row gap-4 justify-between items-center px-4 py-4 bg-white rounded-t-2xl">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">
                      {email}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {orderHistory.length > 0 ? 
                        `${t.totalOrders}: ${orderHistory.length}` : 
                        language === "en" ? "No orders yet" : "まだ注文はありません"}
                    </p>
                  </div>
                  <div>
                  {!isEditingProfile && (
                   <button
                     onClick={() => setIsEditingProfile(true)}
                     className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                     aria-label={t.editProfile} // still accessible
                   >
                     <Pencil className="w-4 h-4" />
                   </button>
                  )}
                  </div>
                </div>
                
                {isEditingProfile ? (
                  <div className="bg-white shadow overflow-hidden sm:rounded-xl">
                    <div className="p-4">
                      <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                              {t.firstName}
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="firstName"
                                id="firstName"
                                value={profile.firstName}
                                onChange={handleProfileChange}
                                className="px-2 py-1 border border-gray-300 rounded-md font-light text-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                              {t.lastName}
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="lastName"
                                id="lastName"
                                value={profile.lastName}
                                onChange={handleProfileChange}
                                className="px-2 py-1 border border-gray-300 rounded-md font-light text-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-4">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              {t.phone}
                            </label>
                            <div className="mt-1">
                              <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={profile.phone}
                                onChange={handleProfileChange}
                                className="px-2 py-1 border border-gray-300 rounded-md font-light text-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-6">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                              {t.address}
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="address"
                                id="address"
                                value={profile.address}
                                onChange={handleProfileChange}
                                className="px-2 py-1 border border-gray-300 rounded-md font-light text-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                              {t.city}
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="city"
                                id="city"
                                value={profile.city}
                                onChange={handleProfileChange}
                                className="px-2 py-1 border border-gray-300 rounded-md font-light text-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                              {t.postalCode}
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="postalCode"
                                id="postalCode"
                                value={profile.postalCode}
                                onChange={handleProfileChange}
                                className="px-2 py-1 border border-gray-300 rounded-md font-light text-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                              {t.country}
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="country"
                                id="country"
                                value={profile.country}
                                onChange={handleProfileChange}
                                className="px-2 py-1 border border-gray-300 rounded-md font-light text-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700">{t.preferences}</h4>
                          <div className="mt-2 space-y-4">
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="notifications"
                                  name="preferences.notifications"
                                  type="checkbox"
                                  checked={profile.preferences.notifications}
                                  onChange={handleProfileChange}
                                  className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="notifications" className="font-medium text-gray-700">
                                  {t.notificationsLabel}
                                </label>
                              </div>
                            </div>
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="marketing"
                                  name="preferences.marketing"
                                  type="checkbox"
                                  checked={profile.preferences.marketing}
                                  onChange={handleProfileChange}
                                  className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="marketing" className="font-medium text-gray-700">
                                  {t.marketingLabel}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            {t.cancelEdit}
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {isLoading ? t.loading : t.saveProfile}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                 <div className="overflow-hidden rounded-b-3xl bg-white mb-5 shadow-lg">
                   <div className="space-y-2 border-t border-slate-200/70 p-6">
                                 
                     {profile.firstName && profile.lastName && (
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-slate-900">
                           {language === "en" ? "Name" : "名前"}
                         </span>
                         <span className="text-sm text-slate-600 font-medium">
                           {profile.firstName} {profile.lastName}
                         </span>
                       </div>
                     )}
                 
                     {profile.phone && (
                       <div className="flex justify-between py-2 border-t border-slate-100/70">
                         <span className="text-sm font-medium text-slate-900">
                           {t.phone}
                         </span>
                         <span className="text-sm text-slate-600 font-medium">
                           {profile.phone}
                         </span>
                       </div>
                     )}
                 
                     {profile.address && (
                       <div className="py-2 border-t border-slate-100/70">
                         <div className="flex justify-between mb-1">
                           <span className="text-sm font-medium text-slate-900">
                             {t.address}
                           </span>
                         </div>
                         <p className="text-sm text-slate-600">
                           {profile.address}
                           {profile.city && `, ${profile.city}`}
                           {profile.postalCode && ` ${profile.postalCode}`}
                           {profile.country && `, ${profile.country}`}
                         </p>
                       </div>
                     )}
                 
                     {/* Preferences */}
                     <div className="space-y-2 border-slate-100/70 ">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-slate-900">
                           {t.notificationsLabel}
                         </span>
                         <span
                           className={`px-2 py-1 rounded-full text-xs font-medium ${
                             profile.preferences.notifications
                               ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                               : 'bg-slate-50 text-slate-600 border border-slate-200'
                           }`}
                         >
                           {profile.preferences.notifications
                             ? language === "en" ? "Enabled" : "はい"
                             : language === "en" ? "Disabled" : "いいえ"}
                         </span>
                       </div>
                           
                       <div className="flex items-center justify-between border-t border-slate-100/70 pt-3">
                         <span className="text-sm font-medium text-slate-900">
                           {t.marketingLabel}
                         </span>
                         <span
                           className={`px-2 py-1 rounded-full text-xs font-medium ${
                             profile.preferences.marketing
                               ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                               : 'bg-slate-50 text-slate-600 border border-slate-200'
                           }`}
                         >
                           {profile.preferences.marketing
                             ? language === "en" ? "Enabled" : "はい"
                             : language === "en" ? "Disabled" : "いいえ"}
                         </span>
                       </div>
                     </div>
                           
                   </div>
                 </div>

                  
                )}
                
                {orderHistory.length > 0 && (
          <div className="rounded-2xl shadow-lg border border-gray-200 mb-10">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === "en" ? "Order History" : "注文履歴"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {language === "en" ? "Your recent orders" : "最近のご注文"}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {orderHistory.length} {language === "en" ? "orders" : "件の注文"}
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {/* { console.log('order', expandedOrderId, order.id)} */}
              {orderHistory.map((order, index) => (
                <div 
                key={order.id}
                onClick={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                className="px-4 py-5 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-base font-medium text-gray-900 mb-1">
                          {language === "en" ? "Order" : "注文"} #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {new Date(order.date).toLocaleDateString(language === "en" ? "en-US" : "ja-JP")}
                          <span className="mx-2">•</span>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          {order.items} {language === "en" ? "items" : "品目"}
                          <span className="mx-2 rounded-lg bg-gray-600"><ChevronDown className="text-white stroke-current" strokeWidth={3} size={14}/></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-md font-semibold text-gray-900">
                        ₹{(Math.round(order.total) || 0).toLocaleString()}
                      </div>
                     <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : order.status === 'preparing'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : order.status === 'ready'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : order.status === 'delivered'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : order.status === 'completed'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {order.status === 'pending'
                        ? language === "en" ? "Pending" : "保留中"
                        : order.status === 'preparing'
                        ? language === "en" ? "Preparing" : "調理中"
                        : order.status === 'ready'
                        ? language === "en" ? "Ready" : "準備完了"
                        : order.status === 'delivered'
                        ? language === "en" ? "Delivered" : "配達済み"
                        : order.status === 'completed'
                        ? language === "en" ? "Completed" : "完了"
                        : order.status === 'cancelled'
                        ? language === "en" ? "Cancelled" : "キャンセル済み"
                        : order.status}
                    </div>

                    </div>
                  </div>

                  {expandedOrderId === order.id &&  (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{language === "en" ? "Items" : "品目"}</h4>
                      {/* {order.paymentMethod !== "pending" && ( */}
                    {/* {    console.log("expandedOrderId", order.paymentMethod)} */}
                      {order.billPay === true && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order); }}
                          className="text-xs text-blue-600 flex space-between gap-1"
                        >
                          {language === "en" ? "Download Invoice" : "請求書をダウンロード"}
                          <Download size={14} />
                        </button>
                      )}
                      </div>
                      <div className="space-y-2">
                        {order.orderItems.map((item, index) => (
                          <div key={item.name + 'oiha' + index} className="flex justify-between text-sm">
                            <span>
                              <span>{index + 1}. {item.name?.en ?? item?.name ?? item.nameEn} </span>
                              <span className="text-amber-600">x{item.quantity}</span>
                            </span>
                            <span className="font-medium">₹{(item.price || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}



              </div>
            )}
          </div>
        </div>
      </main>

{showOrderStatus && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
    <div className="bg-white rounded-xl sm:rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
      <div className="p-3 sm:p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">My Orders </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  setIsRefreshingOrders(true)
                  const minDelay = new Promise((res) => setTimeout(res, 1500))
                  await fetchCustomerProfile(email)
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
            {orderHistory  .filter(order =>
    ["pending", "preparing", "ready"].includes((order.status || "Unknown").toLowerCase())
  ).map((order, index) => (
              <div 
              onClick={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
              key={order.id + 'oha' + index} className="border border-orange-500 rounded-xl overflow-hidden">
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
                <div className="p-2">
                  <div className="flex justify-between ">
                    <span className="text-sm text-gray-600">Items: {order.items}</span>
                    <span className="font-semibold">₹{(Math.round(order.total) || 0).toLocaleString()}</span>
                    {/* <span className="font-semibold">₹{order.total}</span> */}
                  </div>
                </div>
                {/* {console.log('order',expandedOrderId,  order.id)} */}
                  {expandedOrderId === order.id && (
                    <div className="mt-1 p-2 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-900">{language === "en" ? "Items" : "品目"}</h4>
                        {/* {order.paymentMethod && order.paymentMethod !== "pending" && ( */}
                        {order.settlementNo && order.settlementNo !== 'null' && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order); }}
                          className="text-xs text-blue-600"
                        >
                          {language === "en" ? "Download Invoice" : "請求書をダウンロード"}
                        </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {order.orderItems.map((item, index) => (
                          <div key={item.name + "oihao" + index} className="flex justify-between text-sm">
                            <span>
                              <span>{index + 1}. {item.name?.en ?? item?.name ?? item.nameEn} </span>
                              <span className="text-amber-600">x{item.quantity}</span>
                            </span>
                            <span className="font-medium">₹{(item.price || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


              </div>
            ))}
          </div>
        )}
      </div>
      

    </div>
  </div>
)}

<div className="fixed bottom-4 w-full">
  <CustomerHeaderMenu
    currTab="Account"
    showCart={true}
    showSearch={false}
    cartItemCount={0}
    // onCartClick={() => setShowCart(true)}
    onCartClick={() => {}}
    // onMyOrdersClick={() => setShowOrderStatus(true)}            
    // showSearch={true}
    // searchTerm={'searchTerm'}
    // onSearchChange={setSearchTerm}
    // searchPlaceholder={t.searchPlaceholder}
    showMyOrders={true}
    onMyOrdersClick={() => setShowOrderStatus(true)}
    // tableNumber={tableNumber}
  />
</div>

    </div>
  )

}