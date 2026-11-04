
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AdminHeader from "@/components/AdminHeader"
import {useAlert} from '@/context/AlertContext'
import {X} from 'lucide-react'
import {ROLE_PERMISSIONS,PERMISSION_LEVELS,hasPermission} from '@/lib/rbac'
import {useAuthToken} from '@/lib/useAuthToken'
import {useAuth} from "@/lib/auth"
export default function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = useAuthToken();
  const {user, hasPermission} = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    department: "",
    salary: 0,
    joinDate: "",
    address: "",
    emergencyContact: "",
    status: "active",
    permissions: [],
  })
  const [showPassword, setShowPassword] = useState(false)
  const {showAlert} = useAlert();

  // const roles = [
  //   "Manager",
  //   "Chef",
  //   "Sous Chef",
  //   "Cook",
  //   "Waiter",
  //   "Bartender",
  //   "Cashier",
  //   "Cleaner",
  //   "Security",
  //   "Receptionist",
  // ]

  const departments = ["Kitchen", "Service", "Management", "Housekeeping", "Security", "Administration"]

  // Fixed: Define roles and permissions from rbac.js
  const roles = Object.values(PERMISSION_LEVELS).filter(r => r !== "superadmin")
  // const permissions = Object.keys(ROLE_PERMISSIONS)
  //   .flatMap(role => ROLE_PERMISSIONS[role])
  //   .filter(p => p !== "*")
  //   .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
  // Dynamically get permissions for the currently selected role
const selectedRolePermissions = formData.role 
  ? (ROLE_PERMISSIONS[formData.role] || []).filter(p => p !== "*")
  : []
 //   const ROLE_PERMISSIONS = {
//   Manager: [
//     "view_orders", "create_orders", "edit_orders", "view_menu", "view_inventory",
//     "view_reports", "manage_customers", "process_payments"
//   ],
//   Chef: ["view_orders", "view_menu"],
//   "Sous Chef": ["view_orders", "view_menu"],
//   Cook: ["view_orders", "view_menu", "kitchen_display"],
//   Waiter: ["view_orders", "create_orders", "view_menu", "process_payments"],
//   Bartender: ["view_orders", "create_orders", "view_menu"],
//   Cashier: ["view_orders", "process_payments", "view_reports"],
//   Cleaner: ["view_orders"],
//   Security: ["view_orders"],
//   Receptionist: ["view_orders", "manage_customers"],
// }

const [emailError, setEmailError] = useState("")
const validateEmailLive = async (email) => {
  if (!email || !email.includes("@")) {
    setEmailError("")
    return
  }


          if (!token) return;
   try {
    // console.log("Current User",currentUser)
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        excludeId: editingStaff?._id,
        dryRun: true  // This tells backend: just validate, don't create
      })
    })

    const result = await res.json()

    if (result.valid === false) {
      setEmailError(result.error)
    } else {
      setEmailError("")
    }
  } catch (err) {
    console.error("Email validation failed", err)
    setEmailError("")
  }
}

  const fetchStaff = async () =>{

  if (!token){
          console.error("No token found");
          return;
    }
    try {
      const response = await fetch("/api/staff",{
        method:"GET",
        headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}`
          // "Authorization": `Bearer ${currentUser?.token}`
         }
      })
      const data = await response.json()
     setStaff(Array.isArray(data) ? data : [])
      // setStaff(data)
    } catch (error) {
      console.error("Error fetching staff:", error)
    } finally {
      setLoading(false)
    }
  }


  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage("") // Clear any previous error messages
    
    if (emailError) {
    setErrorMessage("Please fix the email error before submitting.")
    showAlert("error", "Error", "Please fix the email error before submitting.", [{ text: "Okay" }])
    return
  } 
    try {

        if (!token){
          console.error("No token found");
          return;
        }
      const url = editingStaff ? `/api/staff/${editingStaff._id}` : "/api/staff"
      const method = editingStaff ? "PUT" : "POST"

      // Create a copy of the form data to avoid modifying the original
      const dataToSubmit = { ...formData }
      
      // Remove the _id field if it exists to prevent MongoDB immutable field error
      if (dataToSubmit._id) delete dataToSubmit._id
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          // Authorization: `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify(dataToSubmit),
      })

      const result = await response.json()
      // console.log("Response received:", result)
      if (response.ok) {
        // console.log("Staff saved successfully:", result)
        fetchStaff()
        setShowAddForm(false)
        setEditingStaff(null)
        resetForm()
        // Show success message
        // alert(editingStaff ? "Staff member updated successfully!" : "Staff member added successfully!")
        showAlert("success", "Success", editingStaff ? "Staff member updated successfully!" : "Staff member added successfully!", [{text: "Okay"}])
      } else {
        // Handle error response
        console.error("Error response:", result)
        setErrorMessage(result.error || "Failed to save staff member")
        // alert(result.error || "Failed to save staff member")
        showAlert("error", "Error", result.error || "Failed to save staff member", [{text: "Okay"}])
      }
    } catch (error) {
      console.error("Error saving staff:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
      // alert("An unexpected error occurred. Please try again.")
      showAlert("error", "Error", "An unexpected error occurred. Please try again.", [{text: "Okay"}])
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "",
      department: "",
      salary: 0,
      joinDate: "",
      address: "",
      emergencyContact: "",
      status: "active",
      permissions: [],
    })
    setShowPassword(false)
    setErrorMessage("")
  }

  const handleEdit = (staffMember) => {
    // Create a deep copy of the staff member data to avoid reference issues
    const staffData = JSON.parse(JSON.stringify(staffMember))
    
    // Store the original _id for reference
    const originalId = staffData._id
    
    // If there's no password, set it to an empty string to avoid "undefined" in the form
    if (!staffData.password) {
      staffData.password = ""
    }
    
    // Set the editing staff member with the original ID
    setEditingStaff({ ...staffData, _id: originalId })
    
    // Set the form data
    setFormData(staffData)
    
    // Reset error message
    setErrorMessage("")
    
    // Show the form
    setShowAddForm(true)
    
    // console.log("Editing staff member:", staffData)
  }

  const handleDelete = async (id) => {

        if (!token){
          console.error("No token found");
          return;
        }
    // if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        const response = await fetch(`/api/staff/${id}`, {
          method: "DELETE",
           headers: {
            "Authorization": `Bearer ${token}`
      //  Authorization: `Bearer ${currentUser?.token}`,
        }
        })
        if (response.ok) {
          fetchStaff()
        }
      } catch (error) {
        console.error("Error deleting staff:", error)
      }
    // }
  }

  const togglePermission = (permission) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p) => p !== permission)
      : [...formData.permissions, permission]
    setFormData({ ...formData, permissions: updatedPermissions })
  }

  // Get the current user from localStorage to check if they are SuperAdmin
  
  
  useEffect(() => {
    const storedUser = localStorage.getItem("hotel_pos_user")
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
  }, [])
    useEffect(() => {
  if (currentUser) fetchStaff();
}, [currentUser]);
  
  // Check if the current user is a SuperAdmin
  const isSuperAdmin = currentUser?.role === "superadmin" || currentUser?.isSuperAdmin
if (!currentUser) return null; // wait until user loads

  return (
  hasPermission(user,["manage_staff","view_staff"]) && (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title="Staff Management"
        subtitle="Manage your team and permissions"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Staff Management" }
        ]}
        actionButton={
        currentUser && hasPermission(currentUser, "add_staff") && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded hover:from-orange-500 hover:to-orange-600 font-semibold shadow-lg transition-all transform hover:scale-105 text-xs w-full sm:w-auto"
          >
            Add New Staff
          </button>
        )}
      />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
              <div className="px-6 py-3 border-b border-gray-200 flex justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                </h2>
                <X 
                className="w-4 h-4 text-orange-500 hover:text-orange-600 cursor-pointer"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingStaff(null)
                  resetForm()
                }}
                />
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                        {/* <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div> */}
                    <div>
  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
  <input
    type="email"
    value={formData.email}
    onChange={(e) => {
      const email = e.target.value
      setFormData({ ...formData, email })

      // Clear previous error
      setEmailError("")

      // Debounce: wait 400ms after typing stops
      clearTimeout(window.emailDebounce)
      window.emailDebounce = setTimeout(() => {
        validateEmailLive(email)
      }, 400)
    }}
    className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
    required
  />
  {/* Live validation message */}
  {emailError && (
    <p className="mt-1 text-xs text-red-600 flex items-center">
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      {emailError}
    </p>
  )}
</div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Password will be used for staff login</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Name and phone number"
                      />
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Work Information</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      {/* <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select> */}
                      <select
  value={formData.role}
  onChange={(e) => {
    const selectedRole = e.target.value
    const defaultPerms = ROLE_PERMISSIONS[selectedRole] || []
    setFormData({ ...formData, 
      role: selectedRole, 
      permissions: defaultPerms.filter(p => p !== "*") // remove wildcard if any
    })  
  }}
  className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
  required
>
  <option value="">Select Role</option>
  {roles.map((role) => (
    <option key={role} value={role}>{role}</option>
  ))}
</select>

                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Salary</label>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: Number.parseFloat(e.target.value) })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Join Date</label>
                      <input
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Permissions - Only visible to SuperAdmin/Admin */}
                {isSuperAdmin && (
                  <div className="mt-6">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                      <p className="text-xs text-blue-700">
                        Only SuperAdmin and Admin users can assign permissions to staff members.
                      </p>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Permissions</h3>
                    {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {permissions.map((permission) => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            // checked={formData.permissions.includes(permission)}
                            checked={formData.permissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                            className="mr-2 h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-700 capitalize">{permission.replace("_", " ")}</span>
                        </label>
                      ))}
                    </div> */}
                    {selectedRolePermissions.length > 0 ? (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {selectedRolePermissions.map((permission) => (
      <label key={permission} className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.permissions.includes(permission)}
          onChange={() => togglePermission(permission)}
          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
        />
        <span className="text-xs text-gray-700 capitalize">
          {permission.replace(/_/g, " ")}
        </span>
      </label>
    ))}
  </div>
) : (
  <p className="text-xs text-gray-500 italic">
    Select a role to see available permissions
  </p>
)}
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errorMessage}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingStaff(null)
                      resetForm()
                    }}
                    className="text-xs px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded hover:from-orange-600 hover:to-orange-600 font-medium transition-all"
                  >
                    {editingStaff ? "Update" : "Add"} Staff Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Staff Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {staff.map((member) => (
            <div key={member._id} className="bg-white rounded scale-100 shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {member.name.charAt(0)}
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-bold text-gray-900">{member.name}</h3>
                  <p className="text-xs text-gray-600">{member.role}</p>
                </div>
              </div>

              <div className="space-y-0 mb-4">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Department:</span>
                  <span className="text-xs">{member.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Email:</span>
                  <span className="text-xs">{member.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Phone:</span>
                  <span className="text-xs">{member.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Salary:</span>
                  <span className="text-xs">
                    {/* ₹{member.salary.toLocaleString('en-IN')} */}
                    ₹{Number(member.salary || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Join Date:</span>
                  <span className="text-xs">{new Date(member.joinDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* <div className="mb-4">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    member.status === "active"
                      ? "bg-green-100 text-green-800"
                      : member.status === "on_leave"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {member.status.replace("_", " ").toUpperCase()}
                </span>
              </div> */}

              <div className="mb-2">
                 <span
  className={`px-2 py-0 text-xs rounded ${
    (member.status || "").toLowerCase() === "active"
      ? "bg-green-100 text-green-800"
      : (member.status || "").toLowerCase() === "on leave"
      ? "bg-yellow-100 text-yellow-800"
      : (member.status || "").toLowerCase() === "inactive"
      ? "bg-gray-100 text-gray-400"
      : "bg-red-100 text-red-800"
  }`}
>
  {member.status ? member.status.replace("_", " ").toUpperCase() : "UNKNOWN"}
</span>

                {/* <span
                  className={`px-2 py-0 text-xs rounded
                    ${member.status.toLowerCase() === "active"
                      ? "bg-green-100 text-green-800"
                      : member.status.toLowerCase() === "on leave"
                      ? "bg-yellow-100 text-yellow-800"
                      : member.status.toLowerCase() === "inactive"
                      ? "bg-gray-100 text-gray-400"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {member.status.replace("_", " ").toUpperCase()}
                </span> */}
              </div>


              <div className="flex space-x-2">

              {currentUser && hasPermission(currentUser,"edit_staff") && (
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 text-xs font-medium transition-colors"
                >
                  Edit
                </button>
              )}
              {currentUser && hasPermission(currentUser,"delete_staff") &&(
                <button
                  onClick={() => showAlert("question","Delete this staff?","Are you sure you want to delete this staff?",[{ text: "Yes", onPress: () =>  handleDelete(member._id)},{ text: "No" }]) }
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 text-xs font-medium transition-colors"
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
              <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading staffs...</p>
            </div>
          </div>
          )
        } 



        {staff.length === 0 && !loading && (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-500 mb-6">Start by adding your first staff member.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all"
              >
                Add First Staff Member
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
   )
    // //
  )
}
