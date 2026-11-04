"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import {X} from "lucide-react"
import {useAlert} from "@/context/AlertContext"
import { useRouter } from 'next/navigation'
import { useAuthToken } from "@/lib/useAuthToken";
import {useAuth} from "@/lib/auth";
import {subscribeToPush, unsubscribeFromPush} from '@/lib/webhook';
export default function Settings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState({
    general: {
      restaurantName: "",
      address: "",
      phone: "",
      email: "",
      currency: "USD",
      timezone: "UTC",
      language: "en",
      gst: "",
      fssai:"",
      adminName:"",
    },
    pos: {
      taxRate: 0,
      serviceCharge: 0,
      autoGenerateKOT: true,
      soundEnabled: true,
      receiptFooter: "",
    },
    notifications: {
      pushNotifications: false,
      emailNotifications: true,
      smsNotifications: false,
      lowStockAlerts: true,
      orderAlerts: true,
    },
    integrations: {
      printerIP: "",
      paymentGateway: "",
      emailProvider: "",
    },
  })

  const [categories, setCategories] = useState({
    menu: [],
    inventory: [],
    supplier: [],
  })

  const [loading,setLoading] = useState(true)




  const inventoryIconOptions = [
  { id: 1, icon: "🥦", name: "Vegetables" },
  { id: 2, icon: "🍎", name: "Fruits" },
  { id: 3, icon: "🍗", name: "Meat & Poultry" },
  { id: 4, icon: "🐟", name: "Seafood" },
  { id: 5, icon: "🥛", name: "Dairy & Eggs" },
  { id: 6, icon: "🥖", name: "Bakery" },
  { id: 7, icon: "🌾", name: "Grains & Dry Goods" },
  { id: 8, icon: "🧂", name: "Spices & Seasonings" },
  { id: 9, icon: "🫙", name: "Oils & Sauces" },
  { id: 10, icon: "🥤", name: "Beverages" },
  { id: 11, icon: "🍪", name: "Snacks & Chips" },
  { id: 12, icon: "❄️", name: "Frozen Foods" },
  { id: 13, icon: "🥫", name: "Canned & Packaged Goods" },
  { id: 14, icon: "🍫", name: "Confectionery & Sweets" },
  { id: 15, icon: "🧽", name: "Cleaning Supplies" },
  { id: 16, icon: "🧴", name: "Personal Care" },
  { id: 17, icon: "🧻", name: "Paper Products" },
  { id: 18, icon: "🥪", name: "Deli & Ready-to-Eat" },
  { id: 19, icon: "💊", name: "Health & Supplements" },
  { id: 20, icon: "🛍️", name: "Specialty / Gourmet" },
]

const crockeryIconOptions = [
  { id: 1, icon: "🍽️", name: "Plates" },
  { id: 2, icon: "🥣", name: "Bowls" },
  { id: 3, icon: "☕", name: "Cups / Tea & Coffee" },
  { id: 4, icon: "🍷", name: "Glasses / Drinkware" },
  { id: 5, icon: "🍺", name: "Mugs / Beer" },
  { id: 6, icon: "🍴", name: "Cutlery / Utensils" },
  { id: 7, icon: "🥡", name: "Serving Dishes / Platters" },
  { id: 8, icon: "🫖", name: "Teapots / Kettles" },
  { id: 9, icon: "🧂", name: "Condiment Holders" },
  { id: 10, icon: "🥚", name: "Specialty Items" }
];

const housekeepingIconOptions = [
  { id: 1, icon: "🛏️", name: "Bed Linen" },
  { id: 2, icon: "🛁", name: "Bath Linen" },
  { id: 3, icon: "🧵", name: "Table Linen" },
  { id: 4, icon: "🧺", name: "Laundry / Uniforms" },
  { id: 5, icon: "🧹", name: "Brooms & Brushes" },
  { id: 6, icon: "🪣", name: "Mops & Buckets" },
  { id: 7, icon: "🧴", name: "Cleaning Chemicals" },
  { id: 8, icon: "🧽", name: "Sponges / Scrubbers" },
  { id: 9, icon: "🧻", name: "Paper Products" },
  { id: 10, icon: "🧼", name: "Soaps & Sanitizers" },
  { id: 11, icon: "🪥", name: "Guest Amenities" },
  { id: 12, icon: "🗑️", name: "Trash Bags" },
  { id: 13, icon: "⚗️", name: "Hazardous Chemicals" },
  { id: 14, icon: "🪟", name: "Glass Cleaners" },
  { id: 15, icon: "🧰", name: "Tools & Equipment" }
];


const [iconOptions, setIconOptions] = useState(inventoryIconOptions);



const {showAlert} = useAlert();

  const {user, hasPermission} = useAuth();
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryType, setCategoryType] = useState("inventory")
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", icon: iconOptions[0].icon, type: "inventory" })
const token = useAuthToken();

  useEffect(() => {
    setCategoryForm({...categoryForm, icon: iconOptions[0].icon})
  }, [iconOptions]) 


  useEffect(() => {
    if (!token){
          setLoading(true)
       return;
    }
    const fetchAllData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchSettings(),
          fetchCategories()
        ])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [token])

  const fetchSettings = async () => {
          if (!token) return Promise.resolve();
          try {
      const response = await fetch("/api/settings",{
        headers:{
          "Content-Type":"application/json",
          "Authorization": `Bearer ${token}`
        }
      })
      if (!response.ok) {
        console.error("Settings fetch error:", response.status, response.statusText);
        return;
      }
      const data = await response.json()
      setSettings(prev => ({
  ...prev,
  general:       { ...prev.general,       ...(data.general       || {}) },
  pos:           { ...prev.pos,           ...(data.pos           || {}) },
notifications: { 
    ...prev.notifications, 
    pushNotifications: data?.notifications?.pushNotifications ,  // force boolean
    ...(data.notifications || {}) 
  },
  integrations:  { ...prev.integrations,  ...(data.integrations || {}) },
  // ...data
}));
console.log("Current pushNotifications value:", settings.notifications.pushNotifications);
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const fetchCategories = async () => {
    if (!token) return Promise.resolve();
    try {
      const [menuRes, inventoryRes, supplierRes] = await Promise.all([
        fetch("/api/categories/menu",{
          headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          }
        }),
        fetch("/api/categories/inventory",{
          headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          }
        }),
        fetch("/api/categories/supplier",{
          headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          }
        }),
      ])

      const [menuData, inventoryData, supplierData] = await Promise.all([
        menuRes.json(),
        inventoryRes.json(),
        supplierRes.json(),
      ])

      setCategories({
        menu: menuData,
        inventory: inventoryData,
        supplier: supplierData,
      })
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories({
        menu: [],
        inventory: [],
        supplier: [],
      })
    }
  }

  const saveSettings = async (section) => {
    
          if (!token) return;
        setLoading(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ section, data: settings[section] }),
      })

      if (response.ok) {
        // alert("Settings saved successfully!")
        showAlert("success", "Success", "Settings saved successfully!", [{text: "Okay"}])
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    }finally {
      setLoading(false)
    }
  }

const handlePushToggle = async (checked) => {
  updateSetting("notifications", "pushNotifications", checked);

  if (checked) {
    const success = await subscribeToPush();
    if (!success) {
      // Revert UI if failed
      updateSetting("notifications", "pushNotifications", false);
    }
  } else {
    await unsubscribeFromPush();
  }
};


useEffect(() => {
  const checkPushSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Optionally verify with backend, but for UI we can optimistically set true
        updateSetting("notifications", "pushNotifications", true);
      }
    } catch (err) {
      console.log("No active subscription", err);
    }
  };

  checkPushSubscription();
}, []);
  // const addCategory = async () => {
  //       setLoading(true)
  //   try {
  //      // create a copy of categoryForm
  //   let payload = { ...categoryForm }

  //   // remove icon field if not inventory
  //   if (categoryType !== "inventory") {
  //     const { icon, ...rest } = payload
  //     payload = rest
  //   }

  //     const response = await fetch(`/api/categories/${categoryType}`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(payload),
  //     })

  //     if (response.ok) {
  //       fetchCategories()
  //       setShowCategoryForm(false)
  //       setCategoryForm({ name: "", description: "", icon: "", type: "inventory" })
  //     }
  //   } catch (error) {
  //     console.error("Error adding category:", error)
  //   }finally {
  //     setLoading(false)
  //   }
  // }
  const addCategory = async () => {
    
          if (!token) return;
  const trimmedName = categoryForm.name.trim()
  if (!trimmedName) {
    showAlert("error", "Invalid Name", "Category name is required.")
    return
  }

  // Prevent duplicate names (case-insensitive, same type)
  const exists = categories[categoryType].some(cat =>
    cat.name.trim().toLowerCase() === trimmedName.toLowerCase()
  )

  if (exists) {
    showAlert("error", "Duplicate Name", `This ${categoryType} category already exists.`)
    return
  }

  setLoading(true)
 
  try {
    let payload = { 
      name: trimmedName, 
      description: categoryForm.description || "",
      type: categoryForm.type || categoryType
    }

    // Only include icon for inventory-type categories
    if (categoryType === "inventory" || categoryForm.type === "supplier") {
      payload.icon = categoryForm.icon || inventoryIconOptions[0].icon
    }

    const response = await fetch(`/api/categories/${categoryType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
       },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json()
      showAlert("error", "Error", err.message || "Failed to add category")
      return
    }

    showAlert("success", "Success", "Category added successfully!")
    fetchCategories()
    setShowCategoryForm(false)
    setCategoryForm({ 
      name: "", 
      description: "", 
      icon: inventoryIconOptions[0].icon, 
      type: "inventory" 
    })
  } catch (error) {
    showAlert("error", "Error", "Failed to add category. Please try again.")
  } finally {
    setLoading(false)
  }
}

  const deleteCategory = async (type, id) => {
   
          if (!token) return;
        setLoading(true)
    // if (confirm("Are you sure you want to delete this category?")) {
      try {
        const response = await fetch(`/api/categories/${type}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          fetchCategories()
        }
      } catch (error) {
        console.error("Error deleting category:", error)
      }finally {
      setLoading(false)
    }
    // }
  }

  const updateSetting = (section, key, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    })
  }

  return (
    //"manage_settings">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center">
                <Link href="/" className="text-orange-500 hover:text-orange-600 mr-4 transition-colors">
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
                  <h1 className="text-base font-semibold text-gray-900">System Settings</h1>
                  {/* <p className="text-gray-600">Configure your POS system and manage categories</p> */}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="h-screen pb-10 w-30 bg-white border-r border-gray-200 flex flex-col overflow-x-hidden overflow-y-auto scrollbar-hide">
            <div className="flex flex-col border-b overflow-y-auto overflow-x-hidden scrollbar-hide">
              {[
                { id: "general", name: "General", icon: "⚙️" },
                { id: "pos", name: "POS Settings", icon: "🏪" },
                { id: "categories", name: "Categories", icon: "📂" },
                { id: "notifications", name: "Notifications", icon: "🔔" },
                // { id: "integrations", name: "Integrations", icon: "🔗" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium transition-colors whitespace-nowrap border-b border-gray-200 ${
                    activeTab === tab.id
                      ? "text-orange-500 border-l-4 border-l-orange-500"
                      : "text-gray-600 hover:text-orange-600"
                  }`}
                >
                  <div className="flex flex-col">
                  <span className="">{tab.icon}</span>
                  <span className="text-xs">{tab.name}</span>
                  </div>
                  {/* {tab.name} */}
                </button>
              ))}
            </div>
          </div>

          <div className="h-screen w-full px-4 sm:px-3 lg:px-5 py-3 bg-gray-50 overflow-x-hidden overflow-y-auto custom-scrollbar">


          {/* General Settings */}
          {activeTab === "general" && 
           hasPermission(user, "edit_settings") && (
            <div className="bg-white rounded shadow-lg px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={settings.general.restaurantName }
                    onChange={(e) => updateSetting("general", "restaurantName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={settings.general?.phone}
                    onChange={(e) => updateSetting("general", "phone", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.general.email}
                    onChange={(e) => updateSetting("general", "email", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => updateSetting("general", "currency", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">GST</label>
                  <input
                    type="text"
                    value={settings.general.gst}
                    onChange={(e) => updateSetting("general", "gst", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">FSSAI</label>
                  <input
                    type="text"
                    value={settings.general.fssai}
                    onChange={(e) => updateSetting("general", "fssai", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Admin Name</label>
                  <input
                    type="text"
                    value={settings.general.adminName}
                    onChange={(e) => updateSetting("general", "adminName", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={settings.general.address}
                    onChange={(e) => updateSetting("general", "address", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                    rows="3"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => saveSettings("general")}
                  className="bg-orange-500 text-white text-xs px-5 py-2 rounded hover:bg-orange-600 font-semibold transition-colors"
                >
                  Save General Settings
                </button>
              </div>
            </div>
          )}

          {/* POS Settings */}
          {activeTab === "pos" && 
          hasPermission(user, "edit_settings") &&(
            <div className="bg-white rounded shadow-lg py-5 px-6">
              <h3 className="text-base font-semibold text-gray-900 mb-6">POS Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.pos.taxRate || 0}
                    onChange={(e) => updateSetting("pos", "taxRate", Number.parseFloat(e.target.value))}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.pos.serviceCharge || 0}
                    onChange={(e) => updateSetting("pos", "serviceCharge", Number.parseFloat(e.target.value))}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div> */}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!settings.pos?.autoGenerateKOT}
                    onChange={(e) => updateSetting("pos", "autoGenerateKOT", e.target.checked)}
                    className="mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Auto-print receipts</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.pos.soundEnabled}
                    onChange={(e) => updateSetting("pos", "soundEnabled", e.target.checked)}
                    className="mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable sound notifications</label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Receipt Footer</label>
                  <textarea
                    value={settings.pos.receiptFooter}
                    onChange={(e) => updateSetting("pos", "receiptFooter", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows="3"
                    placeholder="Thank you for dining with us!"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => saveSettings("pos")}
                  className="bg-orange-500 text-xs text-white px-5 py-2 rounded hover:bg-orange-600 font-semibold transition-colors"
                >
                  Save POS Settings
                </button>
              </div>
            </div>
          )}

          { loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Adding Categories...</p>
            </div>
          </div>
          )
        } 


          {/* Categories */}
          {activeTab === "categories" && !loading &&
          hasPermission(user, "edit_settings") && (
            // <div className="space-y-8">
            <div>
              {/* Category Management */}
              <div className="bg-white rounded shadow-lg py-5 px-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Dynamic Categories</h3>
                  <button
                    onClick={() => setShowCategoryForm(true)}
                    className="bg-orange-500 text-white text-xs px-4 py-2 rounded hover:bg-orange-600 font-medium transition-colors"
                  >
                    Add {categoryType} 
                  </button>
                </div>

                {/* Category Type Tabs */}
                <div className="flex space-x-4 mb-6">
                  {[
                    // { id: "menu", name: "Menu Categories", count: categories.menu.length },
                    { id: "inventory", name: "Inventory Categories", count: categories.inventory.length },
                    { id: "supplier", name: "Supplier Categories", count: categories.supplier.length },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setCategoryType(type.id)}
                      className={`px-4 py-2 text-xs rounded font-medium transition-colors ${
                        categoryType === type.id
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type.name} ({type.count})
                    </button>
                  ))}
                </div>

                {/* Categories List */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories[categoryType].map((category) => (
                    <div key={category._id} onClick={() => router.push(`/suppliers/${category._id}`)} className="border border-orange-200 bg-orange-50 cursor-pointer rounded p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-xs text-gray-900">{category.name}</h4>
                          {category.description && <p className="text-xs text-gray-600 mt-1">{category.description}</p>}
                        </div>
                        <button
                          onClick={() => {
                            showAlert("question","Delete this category?","Are you sure you want to delete this category?",[{ text: "Yes", onPress: () => deleteCategory(categoryType, category._id) },{ text: "No" }]
)
                            // deleteCategory(categoryType, category._id)
                          }}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div> */}
                {/* Categories List */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {categories[categoryType].map((category) => {
    // Clickable only for supplier categories
    const isSupplier = categoryType === "supplier";

    return (
      <div
        key={category._id}
        onClick={() => isSupplier && router.push(`/suppliers/${category._id}`)}
        className={`
          border rounded p-4
          ${isSupplier
            ? "border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100"
            : "border-gray-200 bg-white"
          }
        `}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-xs text-gray-900">{category.name}</h4>
            {category.description && (
              <p className="text-xs text-gray-600 mt-1">{category.description}</p>
            )}
          </div>

          {/* Delete button – works for all types */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // stop navigation when clicking Delete
              showAlert(
                "question",
                "Delete this category?",
                "Are you sure you want to delete this category?",
                [
                  { text: "Yes", onPress: () => deleteCategory(categoryType, category._id) },
                  { text: "No" },
                ]
              );
            }}
            className="text-red-600 hover:text-red-800 text-xs font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    );
  })}
</div>

                {categories[categoryType].length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No {categoryType} categories found.</p>
                  </div>
                )}
              </div>

              {/* Add Category Modal */}
              {showCategoryForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded w-full max-w-[60vw] h-[90vh] shadow-2xl overflow-x-hidden overflow-y-auto scrollbar-hide px-2">
                    <div className="mx-5 px-0 pt-4 pb-2 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-sm font-semibold text-gray-900">Add {categoryType} Category</h2>
                      <X
                        size={20}
                        className="text-orange-500 hover:text-orange-600 cursor-pointer"
                        onClick={() => setShowCategoryForm(false)}
                      />

                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Category Name</label>
                          <input
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                            required
                          />
                        </div>



{/* Inventory Type Selector */}
<div className="flex space-x-2 mb-4">
  {["inventory", "crockery", "housekeeping"].map((type) => (
    <button
      key={type}
      type="button"
      onClick={() => {
        setCategoryForm({ ...categoryForm, type })
        setIconOptions(type === "inventory" ? inventoryIconOptions : type === "crockery" ? crockeryIconOptions : housekeepingIconOptions)
      }}
      className={`px-3 py-1 text-xs rounded border font-medium transition-colors ${
        categoryForm.type === type
          ? "bg-orange-200 text-orange-500 border-orange-500"
          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
      }`}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  ))}
</div>



                        {categoryType === 'inventory' && (

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Choose Icon</label>
                        <div className="grid grid-cols-10 gap-3">
                          { iconOptions.map((option) => (
                            <div key={option.id} className="relative flex justify-center items-center group">
                              {/* Icon button */}
                              <button
                                type="button"
                                onClick={() => setCategoryForm({ ...categoryForm, icon: option.icon })}
                                className={`flex items-center justify-center w-10 h-10 border rounded-lg text-2xl transition-colors relative z-10 ${
                                  categoryForm.icon === option.icon
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {option.icon}
                              </button>
                              
                              {/* Tooltip */}
                              <span className="absolute bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                                {option.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                        )}


                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                            rows="2"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setShowCategoryForm(false)
                            setCategoryForm({ name: "", description: "" })
                          }}
                          className="px-4 py-2 text-gray-600 text-xs border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addCategory}
                          className="px-4 py-2 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 font-medium transition-colors"
                        >
                          Add Category
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && 
          hasPermission(user, "edit_settings") &&(
            <div className="bg-white rounded shadow-lg py-5 px-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                {/* ← Add this new block */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-xs text-gray-900">Browser Push Notifications</h4>
          <p className="text-xs text-gray-600">
            Receive important updates even when the app is closed
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings?.notifications?.pushNotifications}
          // onChange={(e) => updateSetting("notifications", "pushNotification", e.target.checked)}
           onChange={(e) => handlePushToggle(e.target.checked)}
          className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
        />
      </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-xs text-gray-900">Email Notifications</h4>
                    <p className="text-xs text-gray-600">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => updateSetting("notifications", "emailNotifications", e.target.checked)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-xs">SMS Notifications</h4>
                    <p className="text-xs text-gray-600">Receive notifications via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsNotifications}
                    onChange={(e) => updateSetting("notifications", "smsNotifications", e.target.checked)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-xs">Low Stock Alerts</h4>
                    <p className="text-xs text-gray-600">Get notified when inventory is low</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.lowStockAlerts}
                    onChange={(e) => updateSetting("notifications", "lowStockAlerts", e.target.checked)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-xs">Order Alerts</h4>
                    <p className="text-xs text-gray-600">Get notified about new orders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.orderAlerts}
                    onChange={(e) => updateSetting("notifications", "orderAlerts", e.target.checked)}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => saveSettings("notifications")}
                  className="bg-orange-500 text-white text-xs px-5 py-2 rounded hover:bg-orange-600 font-medium transition-colors"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === "integrations" && 
          hasPermission(user, "edit_settings") &&(
            <div className="bg-white rounded shadow-lg py-5 px-6">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Integration Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Printer IP Address</label>
                  <input
                    type="text"
                    value={settings.integrations.printerIP}
                    onChange={(e) => updateSetting("integrations", "printerIP", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Gateway</label>
                  <select
                    value={settings.integrations.paymentGateway}
                    onChange={(e) => updateSetting("integrations", "paymentGateway", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Payment Gateway</option>
                    <option value="stripe">Stripe</option>
                    <option value="square">Square</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Provider</label>
                  <select
                    value={settings.integrations.emailProvider}
                    onChange={(e) => updateSetting("integrations", "emailProvider", e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Email Provider</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => saveSettings("integrations")}
                  className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-orange-600 font-semibold transition-colors"
                >
                  Save Integration Settings
                </button>
              </div>
            </div>
          )}
          </div>

        </div>
      </div>
    //
  )
}
