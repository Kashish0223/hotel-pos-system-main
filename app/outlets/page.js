"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ProtectedRoute from "@/components/ProtectedRoute"
import {useAuthToken} from "@/lib/useAuthToken";

export default function OutletsManagement() {
  const [outlets, setOutlets] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState(null)
  const token = useAuthToken();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    manager: "",
    status: "active",
    openingHours: {
      monday: { open: "09:00", close: "22:00", closed: false },
      tuesday: { open: "09:00", close: "22:00", closed: false },
      wednesday: { open: "09:00", close: "22:00", closed: false },
      thursday: { open: "09:00", close: "22:00", closed: false },
      friday: { open: "09:00", close: "22:00", closed: false },
      saturday: { open: "09:00", close: "22:00", closed: false },
      sunday: { open: "09:00", close: "22:00", closed: false },
    },
    capacity: 0,
    facilities: [],
  })

  const facilities = [
    "WiFi",
    "Parking",
    "Air Conditioning",
    "Outdoor Seating",
    "Private Dining",
    "Bar",
    "Live Music",
    "Delivery",
    "Takeaway",
    "Catering",
  ]

  useEffect(() => {
    fetchOutlets()
  }, [])

  const fetchOutlets = async () => {
   
          if (!token) return;
    try {
      const response = await fetch("/api/outlets",{
        headers:{
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setOutlets(data)
    } catch (error) {
      console.error("Error fetching outlets:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
   
          if (!token) return;
    try {
      const url = editingOutlet ? `/api/outlets/${editingOutlet._id}` : "/api/outlets"
      const method = editingOutlet ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchOutlets()
        setShowAddForm(false)
        setEditingOutlet(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving outlet:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      address: "",
      phone: "",
      email: "",
      manager: "",
      status: "active",
      openingHours: {
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "09:00", close: "22:00", closed: false },
        sunday: { open: "09:00", close: "22:00", closed: false },
      },
      capacity: 0,
      facilities: [],
    })
  }

  const handleEdit = (outlet) => {
    setEditingOutlet(outlet)
    setFormData(outlet)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
   
          if (!token) return;
    // if (confirm("Are you sure you want to delete this outlet?")) {
      try {
        const response = await fetch(`/api/outlets/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })
        if (response.ok) {
          fetchOutlets()
        }
      } catch (error) {
        console.error("Error deleting outlet:", error)
      }
    // }
  }

  const toggleFacility = (facility) => {
    const updatedFacilities = formData.facilities.includes(facility)
      ? formData.facilities.filter((f) => f !== facility)
      : [...formData.facilities, facility]
    setFormData({ ...formData, facilities: updatedFacilities })
  }

  const updateOpeningHours = (day, field, value) => {
    setFormData({
      ...formData,
      openingHours: {
        ...formData.openingHours,
        [day]: {
          ...formData.openingHours[day],
          [field]: value,
        },
      },
    })
  }

  return (
    //"manage_outlets">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-indigo-600 hover:text-indigo-800 mr-4 transition-colors">
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
                  <h1 className="text-3xl font-bold text-gray-900">Outlets Management</h1>
                  <p className="text-gray-600">Manage your restaurant locations and branches</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                Add New Outlet
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingOutlet ? "Edit Outlet" : "Add New Outlet"}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Outlet Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                        <input
                          type="text"
                          value={formData.manager}
                          onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                        <input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Under Maintenance</option>
                        </select>
                      </div>
                    </div>

                    {/* Opening Hours & Facilities */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Opening Hours</h3>
                      {Object.entries(formData.openingHours).map(([day, hours]) => (
                        <div key={day} className="flex items-center space-x-2">
                          <div className="w-20 text-sm font-medium text-gray-700 capitalize">{day}</div>
                          <input
                            type="checkbox"
                            checked={!hours.closed}
                            onChange={(e) => updateOpeningHours(day, "closed", !e.target.checked)}
                            className="mr-2"
                          />
                          {!hours.closed && (
                            <>
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) => updateOpeningHours(day, "open", e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) => updateOpeningHours(day, "close", e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </>
                          )}
                          {hours.closed && <span className="text-red-500 text-sm">Closed</span>}
                        </div>
                      ))}

                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Facilities</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {facilities.map((facility) => (
                          <label key={facility} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.facilities.includes(facility)}
                              onChange={() => toggleFacility(facility)}
                              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{facility}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingOutlet(null)
                        resetForm()
                      }}
                      className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all"
                    >
                      {editingOutlet ? "Update" : "Add"} Outlet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Outlets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outlets.map((outlet) => (
              <div key={outlet._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{outlet.name}</h3>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      outlet.status === "active"
                        ? "bg-green-100 text-green-800"
                        : outlet.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {outlet.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {outlet.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {outlet.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {outlet.manager || "No manager assigned"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Capacity: {outlet.capacity} people
                  </div>
                </div>

                {outlet.facilities && outlet.facilities.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {outlet.facilities.slice(0, 3).map((facility) => (
                        <span key={facility} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                          {facility}
                        </span>
                      ))}
                      {outlet.facilities.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{outlet.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(outlet)}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-xl hover:bg-indigo-700 text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => showAlert("question","Delete this outlet?","Are you sure you want to delete this outlet?",[{ text: "Yes", onPress: () => handleDelete(outlet._id)},{ text: "No" }]) }   
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-xl hover:bg-red-700 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {outlets.length === 0 && (
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No outlets found</h3>
                <p className="text-gray-500 mb-6">Start by adding your first outlet location.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all"
                >
                  Add First Outlet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    //
  )
}
