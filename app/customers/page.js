"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {X} from 'lucide-react'
import {useAlert} from "../../context/AlertContext";
import { useAuth} from "@/lib/auth"
import {useAuthToken} from "@/lib/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";
export default function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [filter, setFilter] = useState("all")
  const token = useAuthToken();
  const {user, hasPermission} = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    loyaltyPoints: 0,
    totalSpent: 0,
    visitCount: 0,
    lastVisit: "",
    preferences: "",
    allergies: "",
    status: "active",
    membershipTier: "bronze",
  })

    const {showAlert} = useAlert();
  
  useEffect(() => {
    if(!token) return;
    setLoading(true);
    fetchCustomers()
  }, [token])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/customers",{
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return;
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer._id}` : "/api/customers"
      const method = editingCustomer ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCustomers()
        setShowAddForm(false)
        setEditingCustomer(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving customer:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      loyaltyPoints: 0,
      totalSpent: 0,
      visitCount: 0,
      lastVisit: "",
      preferences: "",
      allergies: "",
      status: "active",
      membershipTier: "bronze",
    })
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData(customer)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!token) return;
    // if (confirm("Are you sure you want to delete this customer?")) {
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })
        if (response.ok) {
          fetchCustomers()
        }
      } catch (error) {
        console.error("Error deleting customer:", error)
      }
    // }
  }

  const getMembershipColor = (tier) => {
    switch (tier) {
      case "bronze":
        return "bg-amber-100 text-amber-800"
      case "silver":
        return "bg-gray-100 text-gray-800"
      case "gold":
        return "bg-yellow-100 text-yellow-800"
      case "platinum":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    if (filter === "all") return true
    if (filter === "vip") return customer.membershipTier === "gold" || customer.membershipTier === "platinum"
    if (filter === "new") return customer.visitCount <= 3
    return customer.membershipTier === filter
  })

  return (
  //{"manage_customers"}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Link href="/" className="text-orange-500 hover:text-orange-600 mr-4 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Customer Management</h1>
                {/* <p className="text-gray-600">Manage your customer database and loyalty program</p> */}
              </div>
            </div>
          {hasPermission(user,'add_customer') &&
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded text-xs hover:from-orange-600 hover:to-orange-600 font-medium shadow-lg transition-all transform hover:scale-105"
            >
              Add New Customer
            </button>
          }
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Filter Buttons */}
        <div className="bg-white rounded shadow-sm border border-gray-100 px-6 py-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                filter === "all" ? "bg-orange-500 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Customers ({customers.length})
            </button>
            <button
              onClick={() => setFilter("vip")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                filter === "vip" ? "bg-orange-500 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              VIP Customers
            </button>
            <button
              onClick={() => setFilter("new")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                filter === "new" ? "bg-orange-500 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              New Customers
            </button>
            <button
              onClick={() => setFilter("bronze")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                filter === "bronze" ? "bg-orange-500 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bronze
            </button>
            <button
              onClick={() => setFilter("silver")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                filter === "silver" ? "bg-orange-500 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Silver
            </button>
            <button
              onClick={() => setFilter("gold")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all ${
                filter === "gold" ? "bg-orange-500 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Gold
            </button>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded overflow-hidden bg-white px-1 shadow-2xl max-w-xl w-full">
              <div className="bg-white rounded w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar">
              <div className="px-6 py-3 border-b border-gray-200 flex justify-between">
                <h2 className="text-sm font-bold text-gray-900">
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </h2>
                <X 
                onClick={() => {
                      setShowAddForm(false)
                      setEditingCustomer(null)
                      resetForm()
                    }}
                className="w-4 h-4 text-orange-500 hover:text-orange-600 cursor-pointer"/>
              </div>
              <form onSubmit={handleSubmit} className="px-3 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Membership Tier</label>
                    <select
                      value={formData.membershipTier}
                      onChange={(e) => setFormData({ ...formData, membershipTier: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Loyalty Points</label>
                    <input
                      type="number"
                      value={formData.loyaltyPoints}
                      onChange={(e) => setFormData({ ...formData, loyaltyPoints: Number.parseInt(e.target.value) })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total Spent (₹)</label>
                    <input
                      type="number"
                      value={formData.totalSpent}
                      onChange={(e) => setFormData({ ...formData, totalSpent: Number.parseFloat(e.target.value) })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Preferences</label>
                    <textarea
                      value={formData.preferences}
                      onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows="2"
                      placeholder="Food, seating preferences, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Allergies</label>
                    <textarea
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className="w-full px-4 text-xs py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows="2"
                      placeholder="Food allergies and dietary restrictions"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-3 p-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingCustomer(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded hover:from-orange-600 hover:to-orange-600 text-xs font-medium transition-all"
                  >
                    {editingCustomer ? "Update" : "Add"} Customer
                  </button>
                </div>
              </form>
              </div>
            </div>

          </div>
        )}

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredCustomers.map((customer) => (
            <div key={customer._id} className="bg-white scale-100 rounded shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-xs text-gray-600">{customer.email}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0 text-xs rounded font-medium ${getMembershipColor(customer.membershipTier)}`}
                >
                  {/* {customer.membershipTier.toUpperCase()} */}
                  {(customer.membershipTier || "bronze").toUpperCase()}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Phone:</span>
                  <span className="text-xs font-medium">{customer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Loyalty Points:</span>
                  <span className="text-xs font-medium text-pink-600">{customer.loyaltyPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Total Spent:</span>
                  <span className="text-xs font-medium text-green-600">₹{customer.totalSpent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Visits:</span>
                  <span className="text-xs font-medium">{customer.visitCount}</span>
                </div>
                {customer.lastVisit && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Last Visit:</span>
                    <span className="text-xs font-medium">{new Date(customer.lastVisit).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {customer.allergies && (
                <div className="mb-2">
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Allergies: {customer.allergies}
                  </span>
                </div>
              )}

              <div className="flex space-x-2">
              {hasPermission(user,'edit_customer') && 
                <button
                  onClick={() => handleEdit(customer)}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 text-xs font-medium transition-colors"
                >
                  Edit
                </button>
                }
              {hasPermission(user,'delete_customer') && 
                <button
                  onClick={() => showAlert("question","Delete this customer?","Are you sure you want to delete this customer?",[{ text: "Yes", onPress: () => handleDelete(customer._id) },{ text: "No" }]) }
                  
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 text-xs font-medium transition-colors"
                >
                  Delete
                </button>
                }
              </div>
            </div>
          ))}
        </div>


         { loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <div className="animate-spin h-10 w-10 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading cutomers...</p>
            </div>
          </div>
          )
        } 




        {filteredCustomers.length === 0 && !loading && (
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-6">Start building your customer database.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-rose-700 font-semibold transition-all"
              >
                Add First Customer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  //
  )
}
