"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import {useAuthToken} from '@/lib/useAuthToken'
export default function DebtorsManagement() {
  const [debtors, setDebtors] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDebtor, setEditingDebtor] = useState(null)
  const [filter, setFilter] = useState("all")
  const token = useAuthToken();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    amount: 0,
    dueDate: "",
    description: "",
    status: "pending",
    invoiceNumber: "",
    outlet: "",
  })

  const [ageing, setAgeing] = useState(null)

  useEffect(() => {
    if (token) fetchDebtors()
  }, [token])

  const fetchDebtors = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/debtors?ageing=true", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.debtors) {
        setDebtors(data.debtors);
        setAgeing(data.ageing);
      } else if (Array.isArray(data)) {
        setDebtors(data);
      }
    } catch (error) {
      console.error("Error fetching debtors:", error);
    }
  }

  const handleSubmit = async (e) => {
  
          if (!token) return;
    e.preventDefault()
    try {
      const url = editingDebtor ? `/api/debtors/${editingDebtor._id}` : "/api/debtors"
      const method = editingDebtor ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchDebtors()
        setShowAddForm(false)
        setEditingDebtor(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving debtor:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      amount: 0,
      dueDate: "",
      description: "",
      status: "pending",
      invoiceNumber: "",
      outlet: "",
    })
  }

  const handleEdit = (debtor) => {
    setEditingDebtor(debtor)
    setFormData(debtor)
    setShowAddForm(true)
  }

  const handlePayment = async (id, paymentAmount) => {
  
          if (!token) return;
    try {
      const response = await fetch(`/api/debtors/${id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount: paymentAmount }),
      })

      if (response.ok) {
        fetchDebtors()
      }
    } catch (error) {
      console.error("Error processing payment:", error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const filteredDebtors = debtors.filter((debtor) => {
    if (filter === "all") return true
    if (filter === "overdue") return new Date(debtor.dueDate) < new Date() && debtor.status !== "paid"
    if (filter === "pending") return debtor.status === "pending"
    if (filter === "paid") return debtor.status === "paid"
    return true
  })

  const totalOutstanding = debtors.filter((d) => d.status !== "paid").reduce((sum, d) => sum + d.amount, 0)

  return (
    //"manage_debtors">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-red-600 hover:text-red-800 mr-4 transition-colors">
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
                  <h1 className="text-3xl font-bold text-gray-900">Debtors Management</h1>
                  <p className="text-gray-600">Track outstanding payments and receivables</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                Add New Debtor
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-xl">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalOutstanding.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {debtors.filter((d) => d.status === "pending").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
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
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {debtors.filter((d) => new Date(d.dueDate) < new Date() && d.status !== "paid").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {debtors.filter((d) => d.status === "paid").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Receivables Ageing Breakdown Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Receivables Ageing Analysis</h3>
                <p className="text-xs text-gray-500">Breakdown of outstanding debtor accounts by days past due</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded text-gray-600">
                As of Today
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800 uppercase">Current (0-30 Days)</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">₹{ageing?.display?.current || "0.00"}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Healthy receivables</p>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <span className="text-xs font-semibold text-blue-800 uppercase">31 - 60 Days</span>
                <p className="text-xl font-bold text-blue-700 mt-1">₹{ageing?.display?.days31_60 || "0.00"}</p>
                <p className="text-[11px] text-blue-600 mt-0.5">Reminder due</p>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                <span className="text-xs font-semibold text-amber-800 uppercase">61 - 90 Days</span>
                <p className="text-xl font-bold text-amber-700 mt-1">₹{ageing?.display?.days61_90 || "0.00"}</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Follow-up required</p>
              </div>

              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100">
                <span className="text-xs font-semibold text-rose-800 uppercase">91+ Days (High Risk)</span>
                <p className="text-xl font-bold text-rose-700 mt-1">₹{ageing?.display?.days90Plus || "0.00"}</p>
                <p className="text-[11px] text-rose-600 mt-0.5">Escalation required</p>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  filter === "all" ? "bg-red-600 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({debtors.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  filter === "pending"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending ({debtors.filter((d) => d.status === "pending").length})
              </button>
              <button
                onClick={() => setFilter("overdue")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  filter === "overdue"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Overdue ({debtors.filter((d) => new Date(d.dueDate) < new Date() && d.status !== "paid").length})
              </button>
              <button
                onClick={() => setFilter("paid")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  filter === "paid" ? "bg-red-600 text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Paid ({debtors.filter((d) => d.status === "paid").length})
              </button>
            </div>
          </div>

          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingDebtor ? "Edit Debtor" : "Add New Debtor"}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                      <input
                        type="text"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingDebtor(null)
                        resetForm()
                      }}
                      className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold transition-all"
                    >
                      {editingDebtor ? "Update" : "Add"} Debtor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Debtors Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDebtors.map((debtor) => (
                    <tr key={debtor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{debtor.customerName}</div>
                          <div className="text-sm text-gray-500">{debtor.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">${debtor.amount.toFixed(2)}</div>
                        {debtor.invoiceNumber && <div className="text-sm text-gray-500">#{debtor.invoiceNumber}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(debtor.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(debtor.status)}`}>
                          {debtor.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(debtor)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Edit
                        </button>
                        {debtor.status !== "paid" && (
                          <button
                            onClick={() => {
                              const amount = prompt("Enter payment amount:", debtor.amount)
                              if (amount) {
                                handlePayment(debtor._id, Number.parseFloat(amount))
                              }
                            }}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredDebtors.length === 0 && (
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No debtors found</h3>
                <p className="text-gray-500 mb-6">Start by adding your first debtor record.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold transition-all"
                >
                  Add First Debtor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    //
  )
}
