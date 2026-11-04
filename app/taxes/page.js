"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {X} from 'lucide-react'
import { useAlert } from "@/context/AlertContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth"
import { useAuthToken } from "@/lib/useAuthToken";
export default function TaxSettings() {
  const { showAlert } = useAlert();
  const { user, hasPermission } = useAuth()
  const [taxes, setTaxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTax, setEditingTax] = useState(null)
  const token = useAuthToken();
  const [formData, setFormData] = useState({
    name: "",
    type: "percentage",
    taxRate: 0,
    description: "",
    active: true,
    applicableOn: "subtotal",
    isGST: false,
    gstType: "",
  })
const [settings, setSettings] = useState(null);

 useEffect(() => {
  if (!token) return; // wait until token is loaded
  fetchTaxes();
}, [token]);


  
        useEffect(() => {
            
          if (!token) return; // wait for token

          const fetchSettings = async () => {
            try {
              const response = await fetch("/api/settings",{
                headers: {
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
  const fetchTaxes = async () => {
      
          if (!token) return;
    setLoading(true)
    try {
      const response = await fetch("/api/taxes",{
        headers:{'Authorization': `Bearer ${token}`}
        })
      const data = await response.json()
      setTaxes(data)
    } catch (error) {

      console.error("Error fetching taxes:", error)
    } finally {
      setLoading(false)
    }
  }

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   try {
  //     const url = editingTax ? `/api/taxes/${editingTax._id}` : "/api/taxes"
  //     const method = editingTax ? "PUT" : "POST"

  //     // console.log("🔵 Sending request:", method, url, formData); // 👈 add this
  //     const response = await fetch(url, {
  //       method,
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(formData),
  //     })


  //     if (response.ok) {
  //       fetchTaxes()
  //       setShowAddForm(false)
  //       setEditingTax(null)
  //       setFormData({
  //         name: "",
  //         type: "percentage",
  //         taxRate: 0,
  //         description: "",
  //         active: true,
  //         applicableOn: "subtotal",
  //         isGST: false,
  //         gstType: "",
  //       })
  //     }
  //   } catch (error) {
  //     console.error("Error saving tax:", error)
  //   }
  // }
const handleSubmit = async (e) => {
 
          if (!token) return;
  e.preventDefault();

  const trimmedName = formData.name.trim().toLowerCase();

  // 🔹 REQUIRED VALIDATION
  if (!trimmedName) {
    showAlert("warning", "Missing Field", "Tax name is required");
    return;
  }

  if (!formData.taxRate || formData.taxRate <= 0) {
    showAlert("warning", "Invalid Rate", "Please enter a valid tax rate greater than 0");
    return;
  }

  // 🔹 NEW VALIDATION — % rate should not exceed 100
  if (formData.type === "percentage" && formData.taxRate > 100) {
    showAlert("warning", "Invalid Rate", "Percentage tax rate cannot exceed 100%");
    return;
  }

  // 🔹 GST TYPE REQUIRED (when isGST is checked)
  if (formData.isGST && !formData.gstType) {
    showAlert("warning", "GST Type Required", "Please select GST type when GST is enabled");
    return;
  }

  // 🔹 DUPLICATE NAME VALIDATION
  const isDuplicate = taxes.some(
    (tax) =>
      tax.name.trim().toLowerCase() === trimmedName &&
      (!editingTax || editingTax._id !== tax._id)
  );

  if (isDuplicate) {
    showAlert("warning", "Duplicate Tax", "A tax with this name already exists");
    return;
  }

  // 🔹 SUBMIT DATA
     
  try {
    const url = editingTax ? `/api/taxes/${editingTax._id}` : "/api/taxes";
    const method = editingTax ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      showAlert(
        "success",
        editingTax ? "Updated Successfully" : "Created Successfully",
        `Tax has been ${editingTax ? "updated" : "created"} successfully`
      );

      fetchTaxes();
      setShowAddForm(false);
      setEditingTax(null);

      // reset form
      setFormData({
        name: "",
        type: "percentage",
        taxRate: 0,
        description: "",
        active: true,
        applicableOn: "subtotal",
        isGST: false,
        gstType: "",
      });
    }
  } catch (error) {
    console.error("Error saving tax:", error);
    showAlert("error", "Error", "Something went wrong while saving the tax");
  }
};



  const handleEdit = (tax) => {
    setEditingTax(tax)
    setFormData(tax)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
      
          if (!token) return;
    // if (confirm("Are you sure you want to delete this tax?")) {
      try {
        const response = await fetch(`/api/taxes/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        })
        if (response.ok) {
          fetchTaxes()
        }
      } catch (error) {
        console.error("Error deleting tax:", error)
      }
    // }
  }

  return (
  //{"manage_taxes"}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-b-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Link href="/" className="text-orange-500 hover:text-orange-600 mr-4 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-sm font-bold text-gray-900">Tax & GST Settings</h1>
                {/* <p className="text-gray-600">Configure taxes and GST rates</p> */}
              </div>
            </div>
          {hasPermission(user, "manage_taxes") && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-500 text-xs to-orange-600 text-white px-4 py-2 rounded hover:from-orange-600 hover:to-orange-500 font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              Add New Tax
            </button>
          )}
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-xl overflow-hidden bg-white px-1 shadow-2xl">
              <div className="bg-white rounded-xl w-full max-w-lg max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-900">{editingTax ? "Edit Tax" : "Add New Tax"}</h2>
                <X
                onClick={() => {
                      setShowAddForm(false)
                      setEditingTax(null)
                      setFormData({
                        name: "",
                        type: "percentage",
                        taxRate: 0,
                        description: "",
                        active: true,
                        applicableOn: "subtotal",
                        isGST: false,
                        gstType: "",
                      })
                    }}
                className="w-5 h-5 text-orange-500 cursor-pointer hover:text-orange-600" 
                />
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tax Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 text-xs border border-gray-300 rounded- focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                      placeholder="e.g., Service Tax, VAT, GST"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 text-xs border border-gray-300 rounded- focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Rate {formData.type === "percentage" ? "(%)" : "(₹)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: Number.parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 text-xs border border-gray-300 rounded- focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Applicable On</label>
                    <select
                      value={formData.applicableOn}
                      onChange={(e) => setFormData({ ...formData, applicableOn: e.target.value })}
                      className="w-full px-4 py-2 text-xs border border-gray-300 rounded- focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="subtotal">Subtotal</option>
                      <option value="total">Total (including other taxes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={formData.isGST}
                        onChange={(e) => setFormData({ ...formData, isGST: e.target.checked })}
                        className="mr-3 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">This is a GST</span>
                    </label>

                    {formData.isGST && (
                      <select
                        value={formData.gstType}
                        onChange={(e) => setFormData({ ...formData, gstType: e.target.value })}
                        className="w-full px-4 py-2 text-xs border border-gray-300 rounded- focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Select GST Type</option>
                        <option value="CGST">CGST (Central GST)</option>
                        <option value="SGST">SGST (State GST)</option>
                        <option value="IGST">IGST (Integrated GST)</option>
                        <option value="UTGST">UTGST (Union Territory GST)</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 text-xs border border-gray-300 rounded- focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows="3"
                      placeholder="Enter tax description"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">Active Tax</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingTax(null)
                      setFormData({
                        name: "",
                        type: "percentage",
                        taxRate: 0,
                        description: "",
                        active: true,
                        applicableOn: "subtotal",
                        isGST: false,
                        gstType: "",
                      })
                    }}
                    className="h-8 px-4 py-2 text-gray-600 border border-gray-300 rounded text-xs hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded text-xs hover:from-orange-600 hover:to-orange-500 font-medium transition-all"
                  >
                    {editingTax ? "Update" : "Create"} Tax
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Taxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {taxes.map((tax) => (
            <div key={tax._id} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{tax.name}</h3>
                  {tax.isGST && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-1 py-0 rounded-full mt-1">
                      {tax.gstType}
                    </span>
                  )}
                </div>
                <span
                  className={`px-1 py-0 text-xs rounded-full font-medium ${
                    tax.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {tax.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Rate:</span>
                  <span className="text-xs font-bold text-teal-600">
                    {/* {tax.type === "percentage"  ? `${settings.pos.taxRate || tax.taxRate}%`
            : `$${settings.pos.taxRate || tax.taxRate}`} */}
                    {tax.type === "percentage" ? `${tax.taxRate}%` : `$${tax.taxRate}${tax.taxRate}`}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Type:</span>
                  <span className="text-xs capitalize">{tax.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Applied on:</span>
                  <span className="text-xs capitalize">{tax.applicableOn}</span>
                </div>
              </div>

              <p className="text-gray-600 text-xs mb-3">{tax.description}</p>

              <div className="flex space-x-2">
              {hasPermission(user, "edit_taxes") && (
                <button
                  onClick={() => handleEdit(tax)}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 text-xs font-medium transition-colors"
                >
                  Edit
                </button>
              )}
              {hasPermission(user, "delete_taxes") && (
                <button
                  onClick={() => showAlert("question","Delete this tax?","Are you sure you want to delete this tax?",[{ text: "Yes", onPress: () =>  handleDelete(tax._id)},{ text: "No" }]) }
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              )}
              </div>
            </div>
          ))}
        </div>

        { loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
              <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading taxes...</p>
            </div>
          </div>
          )
        } 



        {taxes.length === 0 && !loading && (
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
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No taxes configured</h3>
              <p className="text-gray-500 mb-6">Set up your tax rates and GST configuration.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-teal-700 hover:to-cyan-700 font-semibold transition-all"
              >
                Add First Tax
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  //
  )
}
