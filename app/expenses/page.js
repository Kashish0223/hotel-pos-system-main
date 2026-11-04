"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Pencil, Check, X, DollarSign, Trash2 } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useAuthToken } from "@/lib/useAuthToken";
import {useAuth} from "@/lib/auth"
import ProtectedRoute from "@/components/ProtectedRoute";
export default function ExpensesManagement() {
  const { showAlert } = useAlert();
  const [expenses, setExpenses] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingExpense, setEditingExpense] = useState(null)
  const [filter, setFilter] = useState("all")
  const token = useAuthToken();
  const {user, hasPermission} = useAuth();
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    category: "",
    date: "",
    vendor: "",
    paymentMethod: "pending",
    receipt: "",
    status: "pending",
    orderType: "expense",
    approvedBy: "",
    notes: "",
  })

  const categories = [
    "Food & Ingredients",
    "Utilities",
    "Rent",
    "Staff Salaries",
    "Equipment",
    "Marketing",
    "Maintenance",
    "Insurance",
    "Licenses",
    "Transportation",
    "Office Supplies",
    "Professional Services",
    "Other",
  ]

  const paymentMethods = ["Pending"]

  useEffect(() => {
    if(!token) return;
    fetchExpenses()
  }, [token])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/expenses",{
        headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense._id}` : "/api/expenses"
      const method = editingExpense ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchExpenses()
        setShowAddForm(false)
        setEditingExpense(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving expense:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      description: "",
      amount: 0,
      category: "",
      date: "",
      vendor: "",
      paymentMethod: "",
      orderType:"",
      receipt: "",
      status: "pending",
      approvedBy: "",
      notes: "",
    })
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData(expense)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    
          if (!token) return;
    // if (confirm("Are you sure you want to delete this expense?")) {
      try {
        const response = await fetch(`/api/expenses/${id}`, {
          method: "DELETE",
          headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
        })
        if (response.ok) {
          fetchExpenses()
        }
      } catch (error) {
        console.error("Error deleting expense:", error)
      }
    // }
  }

  const updateStatus = async (id, status) => {
    
          if (!token) return;
    try {
      const response = await fetch(`/api/expenses/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        fetchExpenses()
      }
    } catch (error) {
      console.error("Error updating expense status:", error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (filter === "all") return true
    return expense.status === filter
  })

  // const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
  const amount = parseFloat(expense.amount) || 0;
  return sum + amount;
}, 0);
  return (
  //{"manage_expenses"}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white  border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Link href="/" className="text-orange-500 hover:text-orange-600 mr-4 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Expenses Management</h1>
                {/* <p className="text-gray-600">Track and manage business expenses</p> */}
              </div>
            </div>
          {hasPermission(user,"add_expenses") && 
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-xs text-white px-4 py-2 rounded hover:from-orange-600 hover:to-orange-500 font-medium shadow-md transition-all transform hover:scale-105"
            >
              Add New Expense
            </button>
          }
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center">

          {/* Filter Buttons */}  
        <div className="bg-white rounded border border-gray-200 px-4 py-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all w-full ${
                filter === "all" ? "bg-red-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-2 rounded text-xs font-medium transition-all w-full ${
                filter === "pending" ? "bg-red-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            {/* <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all w-full ${
                filter === "approved"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Approved
            </button> */}
            <button
              onClick={() => setFilter("paid")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all w-full ${
                filter === "paid" ? "bg-red-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Paid
            </button>
            {/* <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded text-xs font-medium transition-all w-full ${
                filter === "rejected"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Rejected
            </button> */}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5  gap-4 bg-white border border-gray-200 h-full py-2 px-3 rounded">
          <div className="bg-white rounded-xl shadow-sm px-4 py-5 border-l-4 text-xs border border-gray-100 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Expenses</p>
                <p className="text-xs font-bold text-gray-900">₹{(totalExpenses || 0 ).toFixed(2)}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded ml-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm px-4 py-5 border-l-4 text-xs border border-gray-100  border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-xs font-bold text-gray-900">
                  {expenses.filter((e) => e.status === "pending").length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-5 border-l-4 text-xs border border-gray-100  border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Paid</p>
                <p className="text-xs font-bold text-gray-900">
                  {expenses.filter((e) => e.status === "paid").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-xl shadow-sm px-4 py-5 border-l-4 text-xs border border-gray-100 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-xs font-bold text-gray-900">
                  {expenses.filter((e) => e.status === "approved").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-4 py-5 border-l-4 text-xs border border-gray-100 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Rejected</p>
                <p className="text-xs font-bold text-gray-900">
                  {expenses.filter((e) => e.status === "rejected").length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div> */}

          {/* <div className="bg-white rounded-xl shadow-sm px-4 py-5 border-l-4 text-xs border border-gray-100  border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Paid</p>
                <p className="text-xs font-bold text-gray-900">{expenses.filter((e) => e.status === "paid").length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div> */}
        </div>

        

        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded overflow-hidden bg-white px-1 shadow-2xl">
              <div className="bg-white rounded w-[50vw] max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </h2>
                <X className="w-4 h-4 text-orange-500 cursor-pointer hover:text-orange-600" 
                onClick={() => {
                      setShowAddForm(false)
                      setEditingExpense(null)
                      resetForm()
                }}
                />
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                      placeholder="Brief description of the expense"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vendor/Supplier</label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Vendor or supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {/* <option value=""></option> */}
                      <option value="pending">Pending</option>
                      {/* <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="paid">Paid</option> */}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Receipt/Invoice #</label>
                    <input
                      type="text"
                      value={formData.receipt}
                      onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Receipt or invoice number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expense Type</label>
                    <input
                      type="text"
                      value={formData.orderType}
                      onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="expense"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows="3"
                      placeholder="Additional notes or comments"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingExpense(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded hover:from-orange-600 hover:to-orange-500 font-medium transition-all"
                  >
                    {editingExpense ? "Update" : "Add"} Expense
                  </button>
                </div>
              </form>
              </div>
            </div>

          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded shadow-sm overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-500">
                <tr>
                  <th className="px-6 py-3 text-left text-white text-xs font-medium text-gray-500 tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-white text-xs font-medium text-gray-500 tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-white text-xs font-medium text-gray-500 tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-white text-xs font-medium text-gray-500 tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-white text-xs font-medium text-gray-500 tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-white text-xs font-medium text-gray-500 tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-gray-900">{expense.description}</div>
                        <div className="text-xs text-gray-500">{expense.vendor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                      ₹{(expense.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(expense.status)}`}>
                        {(expense.status || "UNKNOWN").toUpperCase()}
                      </span>
                    </td>
                    {/* <td className="px-6 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Edit
                      </button>
                      {expense.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(expense._id, "approved")}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(expense._id, "rejected")}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {expense.status === "approved" && (
                        <button
                          onClick={() => updateStatus(expense._id, "paid")}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td> */}

                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium space-x-3">
  {/* Edit */}
  {hasPermission(user,"edit_expenses") && (
  <button
    onClick={() => handleEdit(expense)}
    className="relative group text-red-600 hover:text-red-900 transition-colors"
  >
    <Pencil size={18} />
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
      Edit
    </span>
  </button>
  )}

  {/* If pending → Approve & Reject */}
  {/* {expense.status === "pending" &&
   hasPermission(user,"edit_expenses") &&(
    <>
      <button
        onClick={() => updateStatus(expense._id, "approved")}
        className="relative group text-green-600 hover:text-green-900 transition-colors"
      >
        <Check size={18} />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
          Approve
        </span>
      </button>

      <button
        onClick={() => updateStatus(expense._id, "rejected")}
        className="relative group text-red-600 hover:text-red-900 transition-colors"
      >
        <X size={18} />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
          Reject
        </span>
      </button>
    </>
  )} */}

  {/* If approved → Mark Paid */}
  {/* {expense.status === "approved" && 
     hasPermission(user,"edit_expenses") &&(
    <button
      onClick={() => updateStatus(expense._id, "paid")}
      className="relative group text-blue-600 hover:text-blue-900 transition-colors"
    >
      <DollarSign size={18} />
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
        Mark Paid
      </span>
    </button>
  )} */}

  {/* Delete */}
  {hasPermission(user,"edit_expenses") &&(
  <button
    onClick={() => showAlert("question","Delete this expense?","Are you sure you want to delete this expense?",[{ text: "Yes", onPress: () => handleDelete(expense._id) },{ text: "No" }]) } 
    className="relative group text-red-600 hover:text-red-900 transition-colors"
  >
    <Trash2 size={18} />
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
      Delete
    </span>
  </button>
  )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        { loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <div className="animate-spin h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading expenses...</p>
            </div>
          </div>
          )
        }    



        {filteredExpenses.length === 0 && !loading && (
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
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-6">Start tracking your business expenses.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-orange-700 font-semibold transition-all"
              >
                Add First Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  //
  )
}
