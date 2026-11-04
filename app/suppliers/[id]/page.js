// app/settings/suppliers/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { X, ArrowLeft } from "lucide-react";
import {useAuthToken} from "@/lib/useAuthToken";
import { useAuth } from "@/lib/auth";

export default function SupplierProfile() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = useAuthToken();
  const {user, hasPermission} = useAuth();

  // console.log("Id ",id)
  useEffect(() => {
    if (!id && !token) return;
 
    const fetchData = async () => {
     
          if (!token) return;
      setLoading(true);
      try {
        // Fetch supplier
        const supRes = await fetch(`/api/categories/supplier/${id}`,{
          headers:{'Content-Type':'application/json',
            "Authorization": `Bearer ${token}`
          }
        });
        if (!supRes.ok) throw new Error("Supplier not found");
        const sup = await supRes.json();
        setSupplier(sup);

        // Fetch purchases
        const purRes = await fetch(`/api/purchases?supplierId=${id}`,{
          headers:{
            'Content-Type':'application/json',
            "Authorization": `Bearer ${token}`
          }
        });
        if (!purRes.ok) throw new Error("Purchases not found");
        const data = await purRes.json();

        const formatted = data.map((p) => ({
          _id: p._id,
          name: p.itemName,
          qty: p.quantity,
          unit: p.unit,
          price: p.unitPrice,
          total: p.quantity * p.unitPrice,
          invoicePhoto: p.invoicePhoto,
          date: new Date(p.createdAt).toLocaleDateString("en-IN"),
        }));

        setPurchases(formatted);
        setTotalSpent(formatted.reduce((sum, i) => sum + i.total, 0));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id,token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
        <div className="bg-white rounded shadow-lg p-8 text-center text-red-600">
          Supplier not found
        </div>
      </div>
    );
  }

  return (
    hasPermission(user,"manage_settings") && (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        {/* Header - Same as Settings */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center">
                <Link
                  href="/settings"
                  className="text-orange-500 hover:text-orange-600 mr-4 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-base font-semibold text-gray-900">
                    Supplier Profile
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Same as Settings */}
          {/* <div className="h-screen pb-10 w-30 bg-white border-r border-gray-200 flex flex-col overflow-y-auto scrollbar-hide">
            <div className="flex flex-col border-b">
              {[
                { id: "general", name: "General", icon: "Settings" },
                { id: "pos", name: "POS Settings", icon: "Store" },
                { id: "categories", name: "Categories", icon: "Folder" },
                { id: "notifications", name: "Notifications", icon: "Bell" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => router.push("/settings")}
                  className={`px-6 py-4 font-medium transition-colors whitespace-nowrap border-b border-gray-200 text-gray-600 hover:text-orange-600`}
                >
                  <div className="flex flex-col">
                    <span>{tab.icon}</span>
                    <span className="text-xs">{tab.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div> */}

          {/* Main Content */}
          <div className="h-screen w-full px-4 sm:px-3 lg:px-5 py-3 bg-gray-50 overflow-y-auto custom-scrollbar">
            <div className="bg-white rounded shadow-lg p-6">
              {/* Supplier Header */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b">
               <div className="flex items-center gap-4 ">
                <div className="text-4xl">{supplier.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {supplier.name}
                  </h2>
                  {supplier.description && (
                    <p className="text-sm text-gray-600">
                      {supplier.description}
                    </p>
                  )}
                </div>
               </div>
               <div className="flex-end">
                  <Link
                    href={`/purchases/add?supplierId=${id}`}
                    className="bg-orange-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-600"
                  >
                    + Add Purchase
                  </Link>
               </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded p-4 text-center">
                  <p className="text-xs text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{totalSpent.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                  <p className="text-xs text-gray-600">Total Items</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {purchases.length}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                  <p className="text-xs text-gray-600">Last Purchase</p>
                  <p className="text-sm font-medium text-green-600">
                    {purchases[0]?.date || "—"}
                  </p>
                </div>
              </div>

              {/* Purchases Table */}
              <div className="overflow-x-auto">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Purchase History
                </h3>
                {purchases.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No purchases recorded yet.
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Item
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Price
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Invoice Image
                        </th>
                      </tr>
                    </thead>
               
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchases.map((p) => (
                       
                        <tr key={p._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs text-gray-700">
                            {p.date}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-900">
                            {p.name}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-700">
                            {p.qty} 
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-700">
                            ₹{p.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-xs font-medium text-green-600">
                            ₹{p.total.toFixed(2)}
                          </td>
                          {/* Invoice Photo Column */}
  <td className="px-4 py-2 text-xs">
  {p.invoicePhoto ? (
    <a
      href={p.invoicePhoto}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 hover:opacity-80"
    >
      <img
        src={p.invoicePhoto}
        alt="Invoice"
        className="w-12 h-12 object-cover rounded border"
      />
      <span className="text-orange-600 text-xs">View</span>
    </a>
  ) : (
    <span className="text-gray-400">—</span>
  )}
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}