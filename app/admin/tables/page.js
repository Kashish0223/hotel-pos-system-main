"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminHeader from "@/components/AdminHeader";
import QRCode from "qrcode";
import { useAlert } from "../../../context/AlertContext";
import { X } from "lucide-react";
import { useAuthToken } from "@/lib/useAuthToken";
export default function AdminTablesManagement() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [qrCodes, setQrCodes] = useState({});
  const [showQRModal, setShowQRModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    tableNumber: "",
    capacity: 4,
    location: "",
    status: "available",
    type: "regular", // regular, vip, outdoor
  });
  const { showAlert } = useAlert();
  const token = useAuthToken();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchTables();
  }, [token]);

  const fetchTables = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/tables", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTables(data);

      // Generate QR codes for all tables
      const qrPromises = data.map(async (table) => {
        const qrUrl = `${window.location.origin}/customer/menu?table=${table.tableNumber}`;
        const qrCode = await QRCode.toDataURL(qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: "#ea580c", // Orange color for Hotel-POS branding
            light: "#FFFFFF",
          },
        });
        return { tableId: table._id, qrCode, url: qrUrl };
      });

      const qrResults = await Promise.all(qrPromises);
      const qrMap = {};
      qrResults.forEach(({ tableId, qrCode, url }) => {
        qrMap[tableId] = { qrCode, url };
      });
      setQrCodes(qrMap);
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return;
    try {
      const url = editingTable
        ? `/api/admin/tables/${editingTable._id}`
        : "/api/admin/tables";
      const method = editingTable ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTables();
        setShowAddForm(false);
        setEditingTable(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving table:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      tableNumber: "",
      capacity: 4,
      location: "",
      status: "available",
      type: "regular",
    });
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData(table);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    // if (confirm("Are you sure you want to delete this table?")) {
    // showAlert({
    //   'question',
    //   'Delete this table?',
    //   'Are you sure you want to delete this table?',
    //   [{text: 'Cancel', onPress: () => { return}, {'text': 'Yes'}]

    // })

    if (!token) return;
    try {
      const response = await fetch(`/api/admin/tables/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        fetchTables();
      }
    } catch (error) {
      console.error("Error deleting table:", error);
    }
    // }
  };

  const downloadQR = (table) => {
    const qrData = qrCodes[table._id];
    if (qrData) {
      const link = document.createElement("a");
      link.download = `table-${table.tableNumber}-qr.png`;
      link.href = qrData.qrCode;
      link.click();
    }
  };

  const printQR = (table) => {
    const qrData = qrCodes[table._id];
    if (qrData) {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Hotel-POS - Table ${table.tableNumber} QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                background: linear-gradient(135deg, #FEF2F2 0%, #FED7AA 100%);
              }
              .qr-container {
                border: 3px solid #DC2626;
                padding: 30px;
                margin: 20px auto;
                width: fit-content;
                border-radius: 15px;
                background: white;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              }
              .hotel-header {
                color: #DC2626;
                margin-bottom: 10px;
                font-size: 24px;
                font-weight: bold;
              }
              .hotel-subtitle {
                color: #EA580C;
                margin-bottom: 20px;
                font-size: 14px;
              }
              .table-info {
                color: #374151;
                margin: 10px 0;
                font-size: 16px;
              }
              img { 
                margin: 20px 0;
                border: 2px solid #FEE2E2;
                border-radius: 10px;
              }
              .scan-text {
                color: #DC2626;
                font-weight: bold;
                font-size: 18px;
                margin: 15px 0;
              }
              .footer {
                font-size: 12px;
                color: #6B7280;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="hotel-header">Hotel-POS</div>
              <div class="hotel-subtitle">Point of Sale System</div>
              <div class="table-info"><strong>Table ${table.tableNumber}</strong></div>
              <div class="table-info">Capacity: ${table.capacity} people | Location: ${table.location}</div>
              <img src="${qrData.qrCode}" alt="QR Code" />
              <div class="scan-text">Scan to view menu and place order</div>
              <div class="scan-text" style="font-size: 14px;">Contactless Digital Ordering</div>
              <div class="footer">
                <p>Hotel-POS Hospitality System</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200";
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTableTypeIcon = (type) => {
    switch (type) {
      case "vip":
        return "👑";
      case "outdoor":
        return "🌿";
      default:
        return "🍽️";
    }
  };

  return (
    hasPermission(user, "view_table") && (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader
          title="Table Management"
          subtitle="Manage tables and generate QR codes for digital menu access"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Table Management" },
          ]}
          actionButton={
            hasPermission(user, "add_table") && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-6 py-2 sm:py-2 rounded text-xs hover:from-ornage-600 hover:to-orange-600 font-medium shadow-lg transition-all transform hover:scale-105 w-full sm:w-auto"
              >
                Add New Table
              </button>
            )
          }
        />

        <div className="max-w-full mx-auto px-4 sm:px-4 lg:px-8 py-5 bg-gray-50">
          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="rounded overflow-hidden bg-white px-1 shadow-2xl w-full max-w-lg">
                <div className="bg-white rounded max-h-[95vh] w-full overflow-y-auto custom-scrollbar">
                  <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {editingTable ? "Edit Table" : "Add New Table"}
                    </h2>
                    <X
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingTable(null);
                        resetForm();
                      }}
                      className="w-4 h-4 text-orange-500 hover:text-orange-600 cursor-pointer"
                    />
                  </div>
                  <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Table Number
                        </label>
                        <input
                          type="text"
                          value={formData.tableNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tableNumber: e.target.value,
                            })
                          }
                          className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          required
                          placeholder="e.g., T001, A1, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Capacity
                        </label>
                        <input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              capacity: Number.parseInt(e.target.value),
                            })
                          }
                          className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          required
                          min="1"
                          max="20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                          className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="e.g., Main Hall, Terrace, VIP Section"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Table Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="regular">Regular</option>
                          <option value="vip">VIP</option>
                          <option value="outdoor">Outdoor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value })
                          }
                          className="w-full text-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="reserved">Reserved</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingTable(null);
                          resetForm();
                        }}
                        className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded hover:from-orange-600 hover:to-orange-600 font-medium transition-all"
                      >
                        {editingTable ? "Update" : "Add"} Table
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Modal */}
          {showQRModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
                <div className="px-6 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-gray-900">
                      Table {showQRModal.tableNumber} QR Code
                    </h2>
                    <button
                      onClick={() => setShowQRModal(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6 text-center">
                  {qrCodes[showQRModal._id] && (
                    <>
                      <img
                        src={
                          qrCodes[showQRModal._id].qrCode || "/placeholder.svg"
                        }
                        alt="QR Code"
                        className="mx-auto mb-4 border-2 border-red-200 rounded-xl"
                      />
                      <p className="text-xs text-gray-600 mb-4">
                        You can scan this QR code to access the Hotel-POS
                        digital menu for this table
                      </p>
                      <p className="text-xs text-gray-500 mb-6 ">
                        URL: {qrCodes[showQRModal._id].url}
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => downloadQR(showQRModal)}
                          className="flex-1 bg-blue-600 text-white text-xs py-2 px-4 rounded hover:bg-blue-500 font-medium transition-colors"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => printQR(showQRModal)}
                          className="flex-1 bg-orange-500 text-white text-xs py-2 px-4 rounded hover:bg-orange-500 font-medium transition-colors"
                        >
                          Print
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tables.map((table) => (
              <div
                key={table._id}
                className="bg-white rounded shadow-lg p-6 scale-100 hover:scale-105 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">
                      {getTableTypeIcon(table.type)}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Table {table.tableNumber}
                      </h3>
                      <p className="text-xs text-gray-600">{table.location}</p>
                    </div>
                  </div>
                  <span
                    className={`px-1 py-0 text-xs rounded font-medium border ${getTableStatusColor(
                      table.status || "Unknown"
                    )}`}
                  >
                    {(table.status || "Unknown").toLowerCase()}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
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
                    <span className="text-xs">
                      Capacity: {table.capacity} people
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <span className="text-xs">Type: {table.type}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mb-2">
                  <button
                    onClick={() => setShowQRModal(table)}
                    className="flex-1 bg-gradient-to-r text-xs from-red-500 to-orange-500 text-white py-2 px-4 rounded hover:from-red-600 hover:to-orange-600 text-sm font-medium transition-all flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m0 0V4m0 4h4m0 0V4m0 4v4m0 0h4m-4 0v4"
                      />
                    </svg>
                    QR Code
                  </button>
                  {hasPermission(user, "edit_table") && (
                    <button
                      onClick={() => handleEdit(table)}
                      className="flex-1 bg-orange-500 text-white py-2 px-4 rounded text-xs hover:bg-orange-600 text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {hasPermission(user, "delete_table") && (
                  <button
                    onClick={() => {
                      // showAlert("question", "Delete this table?", 'Are you sure you want to delete this table?', [{text: "Yes", onPress: () => handleDelete(table._id)}, {text: "No"}])
                      showAlert(
                        "question",
                        "Delete this category?",
                        "Are you sure you want to delete this category?",
                        [
                          {
                            text: "Yes",
                            onPress: () => handleDelete(table._id),
                          },
                          { text: "No" },
                        ]
                      );
                      // handleDelete(category._id)}
                      // handleDelete(table._id)
                    }}
                    className="w-full bg-red-600 text-white text-xs py-2 px-4 rounded hover:bg-red-700 text-sm font-medium transition-colors"
                  >
                    Delete Table
                  </button>
                )}
              </div>
            ))}
          </div>

          {loading && (
            <div className="text-center py-16">
              <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
                <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading tables...</p>
              </div>
            </div>
          )}

          {tables.length === 0 && !loading && (
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tables found
                </h3>
                <p className="text-gray-500 mb-6">
                  Start by adding your first table to generate QR codes for
                  Hotel-POS.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-orange-700 font-semibold transition-all"
                >
                  Add First Table
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
}
