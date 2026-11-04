// app/purchases/add/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Plus, Trash2, Search, Upload, X } from "lucide-react";
import { useAuthToken } from "@/lib/useAuthToken";
// ──────────────────────────────────────
// 1. Inner Component (uses useSearchParams)
// ──────────────────────────────────────
function AddPurchaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ← Now safe
  const prefillSupplierId = searchParams.get("supplierId");

  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(prefillSupplierId || "");
  const [items, setItems] = useState([
    { itemName: "", quantity: "", unit: "kg", unitPrice: "", total: 0 },
  ]);
  const [invoicePhoto, setInvoicePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const token = useAuthToken();

  // Upload invoice
  const uploadInvoice = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploadMenuFile", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    return data.url;
  };

  useEffect(() => {
      if (!token) return; // wait for token 
    fetch("/api/categories/supplier",{
      headers: { 'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
       },
    }).then(r => r.json()).then(data=>{setSuppliers(Array.isArray(data) ? data : data.data || [])}).catch(console.error);

    // console.log("Suppliers=------>>>",setSuppliers)
  }, [token]);

  useEffect(() => {
    if (prefillSupplierId && suppliers.length) {
      setSelectedSupplier(prefillSupplierId);
    }
  }, [prefillSupplierId, suppliers]);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const grandTotal = items.reduce((s, i) => s + (i.total || 0), 0);

  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i][field] = val;
    if (field === "quantity" || field === "unitPrice") {
      const q = parseFloat(updated[i].quantity) || 0;
      const p = parseFloat(updated[i].unitPrice) || 0;
      updated[i].total = q * p;
    }
    setItems(updated);
  };

  const addRow = () => setItems([...items, { itemName: "", quantity: "", unit: "kg", unitPrice: "", total: 0 }]);
  const removeRow = (i) => setItems(items.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
   
          if (!token) return;
    e.preventDefault();
    if (!selectedSupplier || items.some(i => !i.itemName || !i.quantity || !i.unitPrice)) return;

    setLoading(true);
    let finalInvoiceUrl = "";

    try {
      if (invoicePhoto) {
        setUploading(true);
        finalInvoiceUrl = await uploadInvoice(invoicePhoto);
        setUploading(false);
      }

      const payload = items.map(item => ({
        supplierCategoryId: selectedSupplier,
        itemName: item.itemName,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice),
        invoicePhoto: finalInvoiceUrl,
      }));

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
         },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/suppliers/${selectedSupplier}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    //"manage_purchases">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center">
                <Link href="/settings" className="text-orange-500 hover:text-orange-600 mr-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-base font-semibold text-gray-900">Add Purchase</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          <div className="flex-1 p-4 sm:p-6">
            <div className="bg-white rounded-lg shadow p-5 max-w-full mx-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Supplier Search */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search supplier..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-md focus:ring-1 focus:ring-orange-500"
                    />
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-gray-400" />
                  </div>
                  {searchTerm && (
                    <div className="mt-1 max-h-40 overflow-y-auto border rounded-md bg-white shadow-sm text-sm">
                      {filtered.length === 0 ? (
                        <p className="p-2 text-gray-500">No results</p>
                      ) : (
                        filtered.map(s => (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => { setSelectedSupplier(s._id); setSearchTerm(""); }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-orange-50 ${selectedSupplier === s._id ? "bg-orange-100" : ""}`}
                          >
                            <span>{s.icon}</span> {s.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedSupplier && (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                      <span className="text-lg">{suppliers.find(s => s._id === selectedSupplier)?.icon}</span>
                      <span className="font-medium">{suppliers.find(s => s._id === selectedSupplier)?.name}</span>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span>Items</span>
                        <button type="button" onClick={addRow} className="text-orange-600 flex items-center gap-1">
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>

                      {items.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded border text-xs">
                          <input placeholder="Item" value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)} className="col-span-4 px-2 py-1.5 border rounded" required />
                          <input type="number" step="0.01" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} className="col-span-2 px-2 py-1.5 border rounded" required />
                          <select value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} className="col-span-2 px-2 py-1.5 border rounded">
                            {["kg", "gm", "liter", "piece", "box", "dozen"].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <input type="number" step="0.01" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} className="col-span-2 px-2 py-1.5 border rounded" required />
                          <div className="col-span-1 text-right font-medium text-green-600">₹{item.total.toFixed(2)}</div>
                          <div className="col-span-1 flex justify-end">
                            {items.length > 1 && (
                              <button type="button" onClick={() => removeRow(i)} className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invoice Upload */}
                    <div>
                      <label className="text-xs font-medium text-gray-700">Invoice Photo (optional)</label>
                      <div className="mt-1 flex items-center gap-3">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setInvoicePhoto(e.target.files[0])}
                            className="hidden"
                            disabled={uploading}
                          />
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border rounded text-xs">
                            <Upload className="h-4 w-4" />
                            {uploading ? "Uploading…" : "Choose File"}
                          </div>
                        </label>
                        {invoicePhoto && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600">{invoicePhoto.name}</span>
                            <button type="button" onClick={() => setInvoicePhoto(null)} className="text-red-500">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-green-50 border border-green-200 rounded px-4 py-2 text-right">
                        <p className="text-xs text-gray-600">Grand Total</p>
                        <p className="text-lg font-bold text-green-600">₹{grandTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedSupplier}
                      className="w-full bg-orange-500 text-white py-2.5 rounded font-medium text-sm hover:bg-orange-600 disabled:bg-gray-400"
                    >
                      {loading ? "Saving..." : "Save Purchase"}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    //
  );
}

// ──────────────────────────────────────
// 2. Export with Suspense (fixes build)
// ──────────────────────────────────────
export default function AddPurchase() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <AddPurchaseContent />
    </Suspense>
  );
}

