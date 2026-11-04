"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAlert } from "../../context/AlertContext"
import { X } from 'lucide-react'
import {useAuthToken} from "@/lib/useAuthToken"
import ProtectedRoute from "@/components/ProtectedRoute"
import {useAuth} from "@/lib/auth"

export default function CategoriesManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const token = useAuthToken();
  const {user, hasPermission} = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "Plate",
    sortOrder: 0,
    active: true,
  })

  const { showAlert } = useAlert()

  // Only show active categories, sorted properly
  // const activeCategories = categories
  //   .filter(cat => cat.active)
  //   .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  //show all categories
  const sortedCategories = categories.sort(
  (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
  )
 

  useEffect(() => {
    if(!token) return;
    setLoading(true);
    fetchCategories()
  }, [token])

  
  const fetchCategories = async () => {
    if (!token) return;
    setLoading(true)
    try {
      const response = await fetch("/api/categories/manage",{
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      // console.log("Categories fetched:",data);
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      showAlert("error", "Error", "Failed to load categories.")
    } finally {
      setLoading(false)
    }
  }

  // const handleSubmit = async (e) => {
  //   e.preventDefault()

  //   const trimmedName = formData.name.trim()
  //   if (!trimmedName) {
  //     showAlert("error", "Invalid Name", "Category name cannot be empty.")
  //     return
  //   }

  //   // Prevent duplicate names (case-insensitive, ignore current editing category)
  //   const nameExists = categories.some(cat =>
  //     cat._id !== editingCategory?._id &&
  //     cat.name.trim().toLowerCase() === trimmedName.toLowerCase()
  //   )

  //   if (nameExists) {
  //     showAlert("error", "Duplicate Name", "A category with this name already exists.")
  //     return
  //   }

  //   try {
  //     const url = editingCategory
  //       ? `/api/categories/manage/${editingCategory._id}`
  //       : "/api/categories/manage"
  //     const method = editingCategory ? "PUT" : "POST"

  //     const response = await fetch(url, {
  //       method,
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ ...formData, name: trimmedName }),
  //     })

  //     if (!response.ok) {
  //       const error = await response.json()
  //       showAlert("error", "Failed", error.message || "Failed to save category")
  //       return
  //     }

  //     showAlert("success", "Success", editingCategory ? "Category updated!" : "Category created!")
  //     fetchCategories()
  //     closeForm()
  //   } catch (error) {
  //     showAlert("error", "Error", "Something went wrong. Please try again.")
  //   }
  // }

  const handleSubmit = async (e) => {
  e.preventDefault()

  const trimmedName = formData.name.trim()
  if (!trimmedName) {
    showAlert("error", "Invalid Name", "Category name cannot be empty.")
    return
  }

  // PREVENT DUPLICATES – case-insensitive & ignore the category being edited
  const nameExists = categories.some(cat =>
    cat._id !== editingCategory?._id &&
    cat.name.trim().toLowerCase() === trimmedName.toLowerCase()
  )

  if (nameExists) {
    showAlert("error", "Duplicate Name", "A category with this name already exists.")
    return
  }

  try {
    const url = editingCategory
      ? `/api/categories/manage/${editingCategory._id}`
      : "/api/categories/manage"
    const method = editingCategory ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json",
        "Authorization":`Bearer ${token}` },
      body: JSON.stringify({ ...formData, name: trimmedName }),
    })

    if (!response.ok) {
      const error = await response.json()
      showAlert("error", "Failed", error.message || "Failed to save category")
      return
    }

    showAlert("success", "Success", editingCategory ? "Category updated!" : "Category created!")
    fetchCategories()    // this refreshes the list
    closeForm()
  } catch (error) {
    showAlert("error", "Error", "Something went wrong. Please try again.")
  }
}
  const closeForm = () => {
    setShowAddForm(false)
    setEditingCategory(null)
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6",
      icon: "Plate",
      sortOrder: 0,
      active: true,
    })
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
      icon: category.icon || "Plate",
      sortOrder: category.sortOrder || 0,
      active: category.active,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    
          if (!token) return;
    try {
      const response = await fetch(`/api/categories/manage/${id}`, {
         method: "DELETE",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${token}` 
        }
        })
      if (response.ok) {
        fetchCategories()
        showAlert("success", "Deleted", "Category deleted successfully.")
      } else {
        showAlert("error", "Error", "Failed to delete category.")
      }
    } catch (error) {
      showAlert("error", "Error", "Something went wrong.")
    }
  }

  const iconOptions = ["🍽️", "🍕", "🍔", "🥗", "🍰", "☕", "🍷", "🥤", "🍜", "🍖", "🐟", "🥘"]

  return (
  //{"manage-categories"}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Link href="/" className="text-orange-500 hover:text-orange-600 mr-4 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-sm font-semibold text-gray-900">Categories Management</h1>
            </div>
          {hasPermission(user,"manage_category") &&
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-xs text-white px-4 py-2 rounded hover:from-orange-600 hover:to-orange-500 font-semibold shadow-md transition-all transform hover:scale-105"
            >
              Add New Category
            </button>
          }
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <X
                  onClick={closeForm}
                  className="w-5 h-5 text-orange-500 hover:text-orange-600 cursor-pointer"
                />
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    placeholder="e.g., Main Course, Beverages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <div className="grid grid-cols-6 gap-3">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-4 text-2xl border-2 rounded-xl transition-all ${
                          formData.icon === icon
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-orange-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Active (Visible on menu)</span>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    {editingCategory ? "Update" : "Create"} Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCategories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all transform hover:scale-105 duration-300"
            >
              <div className="h-2" style={{ backgroundColor: category.color }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{category.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{category.name}</h3>
                      <p className="text-xs text-gray-500">Order: {category.sortOrder}</p>
                    </div>
                  </div>
                  {/* <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {category.active === false ? "Inactive" : "Active"}
                  </span> */}
                  <span
  className={`px-2 py-1 text-xs font-medium rounded-full
    ${category.active
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"
    }`}
>
  {category.active ? "Active" : "Inactive"}
</span>
                </div>

                {category.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>
                )}

                <div className="flex space-x-2">
                {hasPermission(user,"edit_category") &&
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 font-medium text-sm transition-colors"
                  >
                    Edit
                  </button>
                }
                {hasPermission(user,"delete_category") && 
                  <button
                    onClick={() => {
                      showAlert("question", "Delete Category?", "This will permanently delete the category.", [
                        { text: "Cancel" },
                        { text: "Delete", onPress: () => handleDelete(category._id) }
                      ])
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                  >
                    Delete
                  </button>
                }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Loading categories...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedCategories.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2  dikk2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No active categories</h3>
              <p className="text-gray-500 mb-6">Create your first menu category to get started.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                Create First Category
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  //
  )
}

