"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuthToken } from "@/lib/useAuthToken";
export default function LoyaltyManagement() {
  const [loyaltyPrograms, setLoyaltyPrograms] = useState([])
  const [customers, setCustomers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [activeTab, setActiveTab] = useState("programs")
  const token = useAuthToken();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pointsPerDollar: 1,
    minimumSpend: 0,
    rewardTiers: [
      { name: "Bronze", minPoints: 0, discount: 5, benefits: [] },
      { name: "Silver", minPoints: 500, discount: 10, benefits: [] },
      { name: "Gold", minPoints: 1000, discount: 15, benefits: [] },
    ],
    status: "active",
  })

  useEffect(() => {
    fetchLoyaltyPrograms()
    fetchCustomers()
  }, [])

  const fetchLoyaltyPrograms = async () => {
    try {
      const response = await fetch("/api/loyalty",{
        headers:{
          "Authorization":`Bearer ${token}`
        }
      })
      const data = await response.json()
      setLoyaltyPrograms(data)
    } catch (error) {
      console.error("Error fetching loyalty programs:", error)
    }
  }

  const fetchCustomers = async () => {
   
          if (!token) return;
    try {
      const response = await fetch("/api/customers",{
        headers:{
          "Authorization":`Bearer ${token}`
        }
      })
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
   
          if (!token) return;
    try {
      const url = editingProgram ? `/api/loyalty/${editingProgram._id}` : "/api/loyalty"
      const method = editingProgram ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchLoyaltyPrograms()
        setShowAddForm(false)
        setEditingProgram(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving loyalty program:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      pointsPerDollar: 1,
      minimumSpend: 0,
      rewardTiers: [
        { name: "Bronze", minPoints: 0, discount: 5, benefits: [] },
        { name: "Silver", minPoints: 500, discount: 10, benefits: [] },
        { name: "Gold", minPoints: 1000, discount: 15, benefits: [] },
      ],
      status: "active",
    })
  }

  const handleEdit = (program) => {
    setEditingProgram(program)
    setFormData(program)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
   
          if (!token) return;
    // if (confirm("Are you sure you want to delete this loyalty program?")) {
      try {
        const response = await fetch(`/api/loyalty/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })
        if (response.ok) {
          fetchLoyaltyPrograms()
        }
      } catch (error) {
        console.error("Error deleting loyalty program:", error)
      }
    // }
  }

  const updateTier = (index, field, value) => {
    const updatedTiers = [...formData.rewardTiers]
    updatedTiers[index] = { ...updatedTiers[index], [field]: value }
    setFormData({ ...formData, rewardTiers: updatedTiers })
  }

  const addPoints = async (customerId, points, reason) => {
   
          if (!token) return;
    try {
      const response = await fetch("/api/loyalty/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ customerId, points, reason }),
      })

      if (response.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error("Error adding points:", error)
    }
  }

  const getCustomerTier = (points) => {
    if (points >= 1000) return { name: "Gold", color: "text-yellow-600 bg-yellow-100" }
    if (points >= 500) return { name: "Silver", color: "text-gray-600 bg-gray-100" }
    return { name: "Bronze", color: "text-orange-600 bg-orange-100" }
  }

  return (
    //"manage_loyalty">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-purple-600 hover:text-purple-800 mr-4 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Loyalty Management</h1>
                  <p className="text-gray-600">Manage customer loyalty programs and rewards</p>
                </div>
              </div>
              {activeTab === "programs" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  Add New Program
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg mb-8">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("programs")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "programs"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Loyalty Programs
              </button>
              <button
                onClick={() => setActiveTab("customers")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "customers"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Customer Points
              </button>
            </div>
          </div>

          {/* Programs Tab */}
          {activeTab === "programs" && (
            <>
              {/* Add/Edit Form Modal */}
              {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {editingProgram ? "Edit Loyalty Program" : "Add New Loyalty Program"}
                      </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Program Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Points per Dollar</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.pointsPerDollar}
                            onChange={(e) =>
                              setFormData({ ...formData, pointsPerDollar: Number.parseFloat(e.target.value) })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Spend ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.minimumSpend}
                            onChange={(e) =>
                              setFormData({ ...formData, minimumSpend: Number.parseFloat(e.target.value) })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows="3"
                          />
                        </div>
                      </div>

                      {/* Reward Tiers */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Tiers</h3>
                        <div className="space-y-4">
                          {formData.rewardTiers.map((tier, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-xl"
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                                <input
                                  type="text"
                                  value={tier.name}
                                  onChange={(e) => updateTier(index, "name", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
                                <input
                                  type="number"
                                  value={tier.minPoints}
                                  onChange={(e) => updateTier(index, "minPoints", Number.parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                                <input
                                  type="number"
                                  value={tier.discount}
                                  onChange={(e) => updateTier(index, "discount", Number.parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false)
                            setEditingProgram(null)
                            resetForm()
                          }}
                          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold transition-all"
                        >
                          {editingProgram ? "Update" : "Create"} Program
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Programs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loyaltyPrograms.map((program) => (
                  <div key={program._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          program.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {program.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{program.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Points per $1:</span>
                        <span className="text-sm font-medium">{program.pointsPerDollar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Min Spend:</span>
                        <span className="text-sm font-medium">${program.minimumSpend}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Reward Tiers:</h4>
                      <div className="space-y-1">
                        {program.rewardTiers.map((tier, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="font-medium">{tier.name}</span>
                            <span className="text-gray-600">
                              {tier.minPoints}+ pts • {tier.discount}% off
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(program)}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-xl hover:bg-purple-700 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => showAlert("question","Delete this loyalty program?","Are you sure you want to delete this loyalty program?",[{ text: "Yes", onPress: () =>  handleDelete(program._id)},{ text: "No" }]) }
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-xl hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {loyaltyPrograms.length === 0 && (
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No loyalty programs found</h3>
                    <p className="text-gray-500 mb-6">Start by creating your first loyalty program.</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold transition-all"
                    >
                      Create First Program
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => {
                      const tier = getCustomerTier(customer.loyaltyPoints || 0)
                      return (
                        <tr key={customer._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-purple-600">{customer.loyaltyPoints || 0}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${tier.color}`}>
                              {tier.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${customer.totalSpent || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                const points = prompt("Enter points to add:")
                                const reason = prompt("Reason for adding points:")
                                if (points && reason) {
                                  addPoints(customer._id, Number.parseInt(points), reason)
                                }
                              }}
                              className="text-purple-600 hover:text-purple-900 font-medium"
                            >
                              Add Points
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {customers.length === 0 && (
                <div className="text-center py-16">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-500">Customer loyalty data will appear here once you have customers.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    //
  )
}
