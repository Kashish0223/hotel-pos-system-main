"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {useAlert} from "@/context/AlertContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuthToken } from "@/lib/useAuthToken";
import { useAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export default function EditOrder() {
  const rowId = uuidv4();
  const params = useParams()
  const router = useRouter()
  const orderId = params.id
  const {showAlert} = useAlert();
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
    const [billStatus, setBillStatus] = useState("unpaid")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    table: "",
    room: ""
  })
  const [orderType, setOrderType] = useState("dine-in");
  const [orderTotals, setOrderTotals] = useState({
  subtotal: 0,
  itemTaxes: 0,
  totalAmount: 0,
});
  const [items, setItems] = useState([])
  const [taxes, setTaxes] = useState([])
  const [status, setStatus] = useState("pending")
  const [specialRequests, setSpecialRequests] = useState("")
  const token = useAuthToken();
  const {user,hasPermission} = useAuth();
  const [checkingStock, setCheckingStock] = useState(false);
  const billPay = order?.billPay === true;

  // useEffect(() => {
  //   // Update bill status whenever the selected order changes
  //   setBillStatus(paymentStatus || "unpaid")
  // }, [order])

  // Fetch order data
  useEffect(() => {
    if (!token) return;
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${orderId}`,{
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch order")
        }
        
        const data = await response.json()
        setOrder(data)
        // console.log("Edit Order Data:",data)
        // Initialize form with order data
        setCustomerInfo({
          name: data.customerInfo?.name || "",
          phone: data.customerInfo?.phone || "",
          // table: data.customerInfo?.table || "",
          table: data.tableNumber || "",
          room: data.customerInfo?.room || "",
        })
        setOrderType(data.orderType || "dine-in")
        setOrderTotals({
  subTotal: Number(data.subtotal) || 0,
  itemTaxes: Number(data.itemTaxes) || 0,
  totalAmount: Number(data.totalAmount) || 0,
});
        
        // Process items to handle multilingual names
        const processedTaxes = (data.taxes || []).map(tax => ({
           ...tax,
           rowId:uuidv4(),
        }));
        const processedItems = (data.items || []).map(item => ({
  ...item,
  rowId: uuidv4(),
    inventoryId: item.inventoryId || item.linkedInventory || null, // unique for each row
    originalQuantity: item.quantity,
}));

        
        setTaxes(processedTaxes)
        setItems(processedItems)
        setStatus(data.status || "pending")
        setBillStatus(data.paymentStatus || "unpaid")
        setSpecialRequests(data.specialRequests || "")
        
      } catch (err) {
        console.error("Error fetching order:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    if (orderId) {
      if(!token) return;
      fetchOrder()
    }
  }, [orderId,token])
  

  //   const generateBill = async (orderId, status) => {
  //   if (!token) return;
  //   try {
  //     const response = await fetch("/api/bills/generate", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "Authorization": `Bearer ${token}`
  //       },
  //       body: JSON.stringify({ orderId, status }),
  //     })

  //     if (response.ok) {
  //       const bill = await response.json()
  //       // setSelectedBill(bill)
  //       // setShowBillModal(true)
  //       // fetchBills()
  //     }
  //   } catch (error) {
  //     console.error("Error generating bill:", error)
  //   }
  // }



  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // const handleItemQuantityChange = (itemId, newQuantity) => {
  //   if (newQuantity < 0) return
    
  //   setItems(prevItems => 
  //     prevItems.map(item => 
  //       item._id === itemId ? { ...item, quantity: newQuantity } : item
  //     )
  //   )
  // }
  
  // const removeItem = (itemId) => {
  //   setItems(prevItems => prevItems.filter(item => item._id !== itemId))
  // }
  
// const handleItemQuantityChange = (rowId, newQuantity) => {
//   if (newQuantity < 0) return;

//   setItems(prev =>
//     prev.map(item =>
//       item.rowId === rowId ? { ...item, quantity: newQuantity } : item
//     )
//   );
// };

// === NEW: Stock-safe quantity handler (same logic as orders/new) ===

// const handleItemQuantityChange = async (rowId, newQuantity) => {
//   if (newQuantity < 0) return;
//   if (checkingStock) return; // prevent double calls

//   const item = items.find(i => i.rowId === rowId);
//   if (!item || item.itemType !== "retail") {
//     // Non-retail items (like custom) → allow any quantity
//     setItems(prev => prev.map(i => i.rowId === rowId ? { ...i, quantity: newQuantity } : i));
//     return;
//   }

//   // Only check stock when increasing
//   if (newQuantity <= item.quantity) {
//     setItems(prev => prev.map(i => i.rowId === rowId ? { ...i, quantity: newQuantity } : i));
//     return;
//   }

//   try {
//     setCheckingStock(true);

//     const res = await fetch(`/api/inventory/${item._id}/stock`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     if (!res.ok) throw new Error("Stock check failed");

//     const { available = 0 } = await res.json();

//     if (newQuantity > available) {
//       // Show same warning as in orders/new
//       showAlert(
//         "warning",
//         "Low Stock",
//         `${getItemName(item.name)}: Only ${available} available (you requested ${newQuantity}). Quantity adjusted automatically.`,
//         [{ text: "OK" }]
//       );

//       // Force back to max available
//       setItems(prev =>
//         prev.map(i =>
//           i.rowId === rowId ? { ...i, quantity: available } : i
//         )
//       );
//     } else {
//       // Stock is sufficient → allow increase
//       // setItems(prev =>
//       //   prev.map(i =>
//       //     i.rowId === rowId ? { ...i, quantity: newQuantity } : i
//       //   )
//       // );
//       setItems(prev => {
//   const updated = prev.map(i =>
//     i.rowId === rowId ? { ...i, quantity: newQuantity } : i
//   );
//   recalculateTotals(updated);
//   return updated;
// });

//     }
//   } catch (err) {
//     console.error("Stock check error:", err);
//     showAlert("error", "Error", "Could not check stock. Quantity not changed.", [{ text: "OK" }]);
//     // Revert to old value on error
//     setItems(prev =>
//       prev.map(i =>
//         i.rowId === rowId ? { ...i, quantity: item.quantity } : i
//       )
//     );
//   } finally {
//     setCheckingStock(false);
//   }
// };

// const handleItemQuantityChange = async (rowId, newQuantity) => {
//   if (newQuantity < 0 ||checkingStock ) return;
//   // if (checkingStock) return;

//   const item = items.find(i => i.rowId === rowId);

//   if (!item || item.itemType !== "retail") {
//     // Non-retail: just update and recalculate
//     setItems(prev => {
//       const updated = prev.map(i =>
//         i.rowId === rowId ? { ...i, quantity: newQuantity } : i
//       );
//       recalculateTotals(updated);
//       return updated;
//     });
//     return;
//   }

//   // For retail items: only check stock when increasing
//   if (newQuantity <= item.quantity) {
//     // Decrease or same → safe, no stock check
//     setItems(prev => {
//       const updated = prev.map(i =>
//         i.rowId === rowId ? { ...i, quantity: newQuantity } : i
//       );
//       recalculateTotals(updated);
//       return updated;
//     });
//     return;
//   }

//   // Only reaches here if newQuantity > current (increase)
//   try {
//     setCheckingStock(true);
//     if (!item.inventoryId) {
//   // No inventory → skip stock check (kitchen items)
//   allowUpdate();
//   return;
// }
//     const res = await fetch(`/api/inventory/stock/${item.inventoryId}`, {
//     // const res = await fetch(`/api/inventory/${item._id}/stock`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     if (!res.ok) throw new Error("Stock check failed");

//     const { available = 0 } = await res.json();

//     if (newQuantity > available) {
//       showAlert(
//         "warning",
//         "Low Stock",
//         `${getItemName(item.name)}: Only ${available} available. Quantity adjusted to max.`,
//         [{ text: "OK" }]
//       );

//       setItems(prev => {
//         const updated = prev.map(i =>
//           i.rowId === rowId ? { ...i, quantity: available } : i
//         );
//         recalculateTotals(updated);
//         return updated;
//       });
//     } else {
//       // Sufficient stock → allow
//       setItems(prev => {
//         const updated = prev.map(i =>
//           i.rowId === rowId ? { ...i, quantity: newQuantity } : i
//         );
//         recalculateTotals(updated);
//         return updated;
//       });
//     }
//   } catch (err) {
//     console.error("Stock check error:", err);
//     showAlert("error", "Error", "Could not check stock.", [{ text: "OK" }]);
//     // Revert on error
//     setItems(prev => {
//       const updated = prev.map(i =>
//         i.rowId === rowId ? { ...i, quantity: item.quantity } : i
//       );
//       recalculateTotals(updated);
//       return updated;
//     });
//   } finally {
//     setCheckingStock(false);
//   }
// };

// const handleItemQuantityChange = async (rowId, newQuantity) => {
//   if (newQuantity < 0 || checkingStock) return;

//   const item = items.find(i => i.rowId === rowId);
//   if (!item) return;

//   // Non-retail OR no inventory → allow freely
//   if (item.itemType !== "retail" || !item.inventoryId) {
//     updateQty(rowId, newQuantity);
//     return;
//   }

//   // Decrease → always allow
//   if (newQuantity <= item.quantity) {
//     updateQty(rowId, newQuantity);
//     return;
//   }

//   try {
//     setCheckingStock(true);

//     const res = await fetch(`/api/stock/${item.inventoryId}`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     if (!res.ok) {
//       const err = await res.json();
//       throw new Error(err.error || "Stock check failed");
//     }

//     const { available = 0 } = await res.json();
//     setItems(prev =>
//   prev.map(i =>
//     i.rowId === rowId
//       ? { ...i, maxStock: available }
//       : i
//   )
// );

//     // 🚫 OUT OF STOCK
//     if (available <= 0) {
//       showAlert(
//         "warning",
//         "Out of Stock",
//         `${getItemName(item.name)} is currently out of stock.`,
//         [{ text: "OK" }]
//       );
//       updateQty(rowId, item.quantity);
//       return;
//     }

//     // 🚫 Exceeds available stock
//     if (newQuantity > available) {
//       showAlert(
//         "warning",
//         "Low Stock",
//         `${getItemName(item.name)}: Only ${available} available.`,
//         [{ text: "OK" }]
//       );
//       updateQty(rowId, available);
//       return;
//     }

//     // ✅ Stock sufficient
//     updateQty(rowId, newQuantity);

//   } catch (e) {
//     console.error(e);
//     showAlert("error", "Error", e.message, [{ text: "OK" }]);
//     updateQty(rowId, item.quantity);
//   } finally {
//     setCheckingStock(false);
//   }
// };

const handleItemQuantityChange = async (rowId, newQuantity) => {
  if (newQuantity < 0 || checkingStock) return;

  const item = items.find(i => i.rowId === rowId);
  if (!item) return;

  // Non-retail OR no inventory → allow freely
  if (item.itemType !== "retail" || !item.inventoryId) {
    updateQty(rowId, newQuantity);
    return;
  }

  // Decrease → always allow
  if (newQuantity <= item.quantity) {
    updateQty(rowId, newQuantity);
    return;
  }

  const originalQty = item.originalQuantity !== undefined ? item.originalQuantity : 0;

  try {
    setCheckingStock(true);

    // Fetch current stock
    const res = await fetch(`/api/inventory/stock/${item.inventoryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Stock check failed");
    }

    const { available = 0 } = await res.json();
    
    // Update maxStock for button disabling
    setItems(prev =>
      prev.map(i =>
        i.rowId === rowId ? { ...i, maxStock: originalQty + available } : i
        // i.rowId === rowId ? { ...i, maxStock: available } : i
      )
    );

    const maxAllowed = originalQty + available;

    // 🚫 Exceeds available stock → show warning
    if (newQuantity > maxAllowed) {
      showAlert(
        "warning",
        "Low Stock",
        `${getItemName(item.name)}: Only ${available} more available.`,
        [{ text: "OK" }]
      );
      updateQty(rowId, maxAllowed);
      return;
    }

    // ✅ Stock sufficient
    updateQty(rowId, newQuantity);

  } catch (e) {
    console.error(e);
    showAlert("error", "Error", e.message, [{ text: "OK" }]);
    updateQty(rowId, item.quantity);
  } finally {
    setCheckingStock(false);
  }
};



const updateQty = (rowId, qty) => {
  setItems(prev => {
    const updated = prev.map(i =>
      i.rowId === rowId ? { ...i, quantity: qty } : i
    );
    recalculateTotals(updated);
    return updated;
  });
};


const recalculateTotals = (updatedItems, updatedTaxes = taxes) => {
  // 1️⃣ Subtotal (price * qty)
  const subTotal = updatedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 2️⃣ Item taxes
  const itemTaxes = updatedItems.reduce(
    (sum, item) =>
      sum + ((item.price * item.quantity * (item.tax || 0)) / 100),
    0
  );

  // 3️⃣ Order-level taxes
  // const orderTaxTotal = updatedTaxes.reduce((sum, tax) => {
  //   const rate = Number(tax.taxRate || 0);
  //   return sum + (tax.type === "percentage" ? (subTotal * rate) / 100 : rate);
  // }, 0);

  // 4️⃣ Grand total
  const totalAmount = subTotal + itemTaxes;

  setOrderTotals({
    subTotal,
    itemTaxes,
    totalAmount,
  });
};

const removeItem = (rowId) => {
  const updatedItems = items.filter(item => item.rowId !== rowId);
  setItems(updatedItems);

  recalculateTotals(updatedItems);
};
const removeTax = (rowId) => {
  const updatedTaxes = taxes.filter(tax => tax.rowId !== rowId);
  setTaxes(updatedTaxes);

  recalculateTotals(items, updatedTaxes);
};



// const removeItem = (rowId) => {
//   const updatedItems = items.filter(item => item.rowId !== rowId);
//   setItems(updatedItems);

//   // Update taxes based on updated items
//   const updatedSubtotal = updatedItems.reduce(
//     (sum, item) => sum + ((item.price * item.quantity) + ((item.price * item.quantity) * item.tax)/100),
//     0
//   );

//   const updatedTaxes = taxes.map(tax => {
//     const taxRate = Number(tax.taxRate || 0);
//     const amount = tax.type === "percentage"
//       ? (updatedSubtotal * taxRate) / 100
//       : taxRate;

//     return {
//       ...tax,
//       amount
//     };
//   });
  
//   console.log("Updated Taxes:", updatedTaxes);
//   setTaxes(updatedTaxes);
// };

//   const calculateTotal = () => {
//     return items.reduce((total, item) => total + (((item.price * item.quantity)*(item.tax)/100) + (item.price*item.quantity)), 0).toFixed(2)
//   }

//   const subtotal = items.reduce((sum, item) => sum + (((item.price * item.quantity)*(item.tax)/100)+ (item.price*item.quantity)),0).toFixed(2);


// const taxLines = taxes.map(tax => ({
//   name: tax.name || "Tax",
//   rate: Number(tax.taxRate || 0),
//   amount: Number(tax.amount || 0),
//   isPercentage: tax.type === "percentage",
// }));


// // 3️⃣ Total global tax
// const totalTax = taxLines.reduce((s, t) => s + t.amount, 0);

  
  // Helper function to safely display item names that might be multilingual
  const getItemName = (name) => {
    if (!name) return "Unknown Item";
    if (typeof name === 'string') return name;
    if (typeof name === 'object') {
      // Try English first, then fall back to any available language
      return name.en || Object.values(name)[0] || "Unknown Item";
    }
    return String(name);
  }
  
  const handleSubmit  = async (e) => {
    e.preventDefault()
    

    if (!token) return;
    try {
      const updatedOrder = {
        customerInfo,
        orderType,
        items,
        status,
        specialRequests,
        totalAmount: Number(orderTotals.totalAmount.toFixed(2)),
        subtotal: Number(orderTotals.subtotal),
        itemTaxes: Number(orderTotals.itemTaxes.toFixed(2)),
      }
      
// console.log("Sending to backend Order:", updatedOrder);
      // const response = await fetch(`/api/orders/${orderId}`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${token}`
      //   },
      //   body: JSON.stringify(updatedOrder)
      // })
      
      // if (!response.ok) {
      //   throw new Error("Failed to update order")
      // }
      
      // showAlert("success", "Success", "Order and bill updated successfully!", [{ text: "OK" }]);
      // // Redirect back to orders page
      // router.push("/orders")

      const response = await fetch(`/api/orders/${orderId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(updatedOrder)
})

if (!response.ok) {
  const err = await response.json();
  showAlert("error", "Update Failed", err.error || "Please try again.", [{text: "Okay"}])
  return;
}

const result = await response.json();

if (result.partialAlerts?.length > 0) {
  const messages = result.partialAlerts.map(a => 
    a.message ? `${a.name}: ${a.message}` : `${a.name}: Only ${a.available} more available (requested ${a.requested} → adjusted to ${a.adjustedTo})`
  ).join("\n");

  showAlert(
    "warning",
    "Low/Out of Stock",
    `Some items adjusted or not increased:\n\n${messages}\n\nOrder saved successfully.`,
    [{ text: "OK" }]
  );
}
else {
  showAlert("success", "Success", "Order updated successfully!", [{ text: "OK" }]);
}// REFETCH ORDER TO REFLECT CHANGES
const freshResponse = await fetch(`/api/orders/${orderId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const freshData = await freshResponse.json();

// Update all state with fresh data
setOrder(freshData);
setCustomerInfo({
  name: freshData.customerInfo?.name || "",
  phone: freshData.customerInfo?.phone || "",
  // table: freshData.customerInfo?.table || "",
  table: freshData.tableNumber || freshData.customerInfo?.table ||"",
  room: freshData.customerInfo?.room || "",
});
setOrderType(freshData.orderType || "dine-in");
setOrderTotals({
  subTotal: Number(freshData.subtotal) || 0,
  itemTaxes: Number(freshData.itemTaxes) || 0,
  totalAmount: Number(freshData.totalAmount) || 0,
});
setStatus(freshData.status || "pending");
setSpecialRequests(freshData.specialRequests || "");

// === REBUILD ITEMS WITH maxStock CALCULATED ===
const newItems = await Promise.all(
  (freshData.items || []).map(async (item) => {
    const baseItem = {
      ...item,
      rowId: uuidv4(),
      inventoryId: item.inventoryId || item.linkedInventory || null,
      originalQuantity: item.quantity,
    };

    // Default: unlimited
    let maxStock = Infinity;

    if (item.itemType === "retail" && baseItem.inventoryId) {
      try {
        const res = await fetch(`/api/inventory/stock/${baseItem.inventoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const { available = 0 } = await res.json();
          maxStock = item.quantity + available; // current (saved) + available more
        }
      } catch (e) {
        console.error("Failed to fetch stock for maxStock", e);
      }
    }

    return { ...baseItem, maxStock };
  })
);

setItems(newItems);
      
    } catch (err) {
      console.error("Error updating order:", err)
      // alert("Failed to update order. Please try again.")
      showAlert("error", "Update Failed", "Failed to update order. Please try again.", [{text: "Okay"}])
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/orders" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }
  
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
          <p className="text-gray-700 mb-4">The order you're looking for doesn't exist or has been deleted.</p>
          <Link href="/orders" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }
  
// ===== GST Split (DISPLAY ONLY) =====
// const totalItemTaxAmount = orderTotals.itemTaxes;

// // Amount split
// const cgstAmount = totalItemTaxAmount / 2;
// const sgstAmount = totalItemTaxAmount / 2;
// % split (assumes all items have same tax rate)
// const totalItemTaxPercent =
//   items.length > 0 ? Number(items[0].tax || 0) : 0;

// const cgstPercent = totalItemTaxPercent / 2;
// const sgstPercent = totalItemTaxPercent / 2;

// Replace the old cgst/sgst calculation with this:
const totalItemTaxAmount = orderTotals.itemTaxes;

const cgstAmount = totalItemTaxAmount / 2;
const sgstAmount = totalItemTaxAmount / 2;

// Better: calculate effective percentage from subtotal
const effectiveTaxPercent = orderTotals.subTotal > 0
  ? (totalItemTaxAmount / orderTotals.subTotal) * 100
  : 0;

const cgstPercent = effectiveTaxPercent / 2;
const sgstPercent = effectiveTaxPercent / 2;


  return (
hasPermission(user,"manage_orders") && (  
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-sm font-semibold text-gray-900">
                Hotel POS System
              </Link>
              <span className="text-gray-500">/</span>
              <Link href="/orders" className="text-sm font-semibold text-gray-900">
                Orders
              </Link>
              <span className="text-gray-500">/</span>
              <h1 className="text-sm font-semibold text-gray-900">Edit Order #{orderId.slice(-6)}</h1>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto py-4 sm:px-4 lg:px-6">
        <div className="px-4 py-0 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Customer Information */}
            <div className="bg-white shadow-md rounded px-4 py-3">
              <h2 className="text-xs font-semibold text-gray-900 mb-2">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleCustomerInfoChange}
                    className="w-full px-2 py-1 border border-gray-300 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleCustomerInfoChange}
                    className="w-full px-2 py-1 border border-gray-300 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="orderType" className="block text-xs font-medium text-gray-700 mb-1">
                    Order Type
                  </label>
                  <select
                    id="orderType"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dine-in">Dine In</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="room-service">Room Service</option>
                  </select>
                </div>
                {orderType === "dine-in" && (
                  <div>
                    <label htmlFor="table" className="block text-xs font-medium text-gray-700 mb-1">
                      Table Number
                    </label>
                    <input
                      type="text"
                      id="table"
                      name="table"
                      value={customerInfo.table}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-2 py-1 border border-gray-300 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {orderType === "room-service" && (
                  <div>
                    <label htmlFor="room" className="block text-xs font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      id="room"
                      name="room"
                      value={customerInfo.room}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-2 py-1 border border-gray-300 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Order Items */}
            <div className="bg-white shadow-md rounded px-4 py-3">
             <div className="mb-4 flex justify-between align-items-center">
              <h2 className="text-xs font-medium text-gray-900 mb-4">Order Items</h2>
                <button
                  type="button"
                  onClick={() => {
    const editData = {
      orderId: orderId,
      items: items,
      customerInfo: customerInfo,
      orderType: orderType,
      tableNumber: customerInfo.table || tableNumber || "",
      // paymentMethod: data.paymentMethod || "pending",
    };

    const encoded = encodeURIComponent(JSON.stringify(editData));
    router.push(`/orders/new?editOrder=${encoded}`);
  }}
                  className={`px-4 py-2 rounded text-xs font-medium bg-blue-500 text-white`}
                >
                  Add Items
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Tax
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  {/* <tbody className="bg-white divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No items in this order
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        // <tr key={item.id}>
                        <tr key={item._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                            {getItemName(item.name)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(item.id, item.quantity - 1)}
                                className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-sm text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(item.id, item.quantity + 1)}
                                className="bg-gray-200 text-gray-700 rounded-full w-6 h -6 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody> */}
                  <tbody className="bg-white divide-y divide-gray-200">
  {items.length === 0 ? (
    <tr>
      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
        No items in this order
      </td>
    </tr>
  ) : (
    items.map((item) => (
      <tr key={item.rowId}>
        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
          {getItemName(item.name)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ₹{item.price.toFixed(2)}
        </td>

        {/* <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() =>
                handleItemQuantityChange(item.rowId, item.quantity - 1)
                // handleItemQuantityChange(item._id, item.quantity - 1)
              }
              className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center"
            >
              -
            </button>

            <span className="text-sm text-gray-900">{item.quantity}</span>

            <button
              type="button"
              onClick={() =>
                handleItemQuantityChange(item.rowId, item.quantity + 1)
              }
              className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </td> */}
        <td className="px-6 py-4 whitespace-nowrap">
          {/* Quantity Controls - Disabled if settled */}
          {billPay ? (
            <span className="text-sm text-gray-700 font-medium">
              {item.quantity}
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleItemQuantityChange(item.rowId, item.quantity - 1)}
                className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={checkingStock}
              >
                -
              </button>

              <span className="text-sm text-gray-900 font-medium min-w-8 text-center">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() => handleItemQuantityChange(item.rowId, item.quantity + 1)}
                // disabled={checkingStock}
  disabled={
    checkingStock ||
    (item.itemType === "retail" &&
     item.maxStock !== undefined &&
     item.quantity >= item.maxStock)
  }
    className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"

                // className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          )}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
           ₹{((item.price * item.quantity)*(item.tax)/100).toFixed(2)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
           ₹{(((item.price * item.quantity)*(item.tax)/100) + (item.price*item.quantity)).toFixed(2)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {/* Remove Button - Disabled if settled */}
          {billPay ? (
            <span className="text-gray-400">—</span>
          ) : (
            <button
              type="button"
              onClick={() => removeItem(item.rowId)}
              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={checkingStock}
            >
              Remove
            </button>
          )}
        </td>

        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button
            type="button"
            onClick={() => removeItem(item.rowId)}
            className="text-red-600 hover:text-red-900"
          >
            Remove
          </button>
        </td> */}
      </tr>
    ))
  )}
</tbody>

                  {/* <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right text-xs font-medium text-gray-900">
                        Subtotal
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">
                        ₹{calculateTotal()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot> */}

<tfoot className="bg-gray-50">

  {/* Updated Tax Breakdown */}
  {/* {taxes.length > 0 && (
    <>
      {taxes.map((tax) => (
        <tr key={tax.rowId}>
          <td colSpan="4" className="px-6 text-right text-xs font-medium text-gray-700">
            {tax.name}
            {tax.type === "percentage" && tax.taxRate ? ` (${tax.taxRate}%)` : ""}
          </td>

          <td className="px-6 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
            ₹{parseFloat(tax.amount || 0).toFixed(2)}
          </td>

          <td></td>
        </tr>
      ))}

      <tr className="border-t border-gray-300">
        <td colSpan="4" className="px-6 py-1 text-right text-xs font-semibold text-gray-900">
          Total Tax
        </td>
        <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
          ₹{totalTax.toFixed(2)}
        </td>
      </tr>
    </>
  )} */}

  {/* Subtotal */}
  <tr className="border-t border-gray-300">
    <td colSpan="4" className="px-6 py-1 text-right text-xs font-medium text-gray-900">
      Subtotal
    </td>
    <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
      ₹{orderTotals.subTotal.toFixed(2)}
    </td>
  </tr>
  {/* Item Taxes */}
  {/* CGST */}
<tr className="border-t border-gray-300">
   <td colSpan="4" className="px-6 py-1 text-right text-xs font-medium text-gray-900">
    CGST {(effectiveTaxPercent.toFixed(2)) > 0 && `(${cgstPercent.toFixed(1)}%)`}
  </td>
  <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
    ₹{cgstAmount.toFixed(2)}
  </td>
</tr>

{/* SGST */}
<tr>
  <td colSpan="4" className="px-6 py-1 text-right text-xs font-medium text-gray-900">
    SGST {(effectiveTaxPercent.toFixed(2)) > 0 && `(${sgstPercent.toFixed(1)}%)`}
  </td>
  <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
    ₹{sgstAmount.toFixed(2)}
  </td>
</tr>

{/* Total Tax */}
<tr>
   <td colSpan="4" className="px-6 py-1 text-right text-xs font-medium text-gray-900">
    Total Taxes
  </td>
  <td className="px-6 py-1 whitespace-nowrap text-xs font-bold text-gray-900">
    ₹{totalItemTaxAmount.toFixed(2)}
  </td>
</tr>

  {/* </tr> */}

  {/* Grand Total */}
  <tr className="border-t-2 border-orange-600">
    <td colSpan="4" className="px-6 py-4 text-right text-sm font-bold text-gray-900">
      Grand Total
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
      {/* ₹{Math.round((orderTotals.totalAmount)+(orderTotals.itemTaxes)).toFixed(2)} */}
      ₹{Math.round(orderTotals.totalAmount).toFixed(2)}
    </td>
  </tr>

</tfoot>

                </table>
              </div>
            </div>
            
            {/* Order Status */}
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xs font-medium text-gray-900 mb-2">Order Status</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("pending")}
                  className={`px-4 py-2 rounded text-xs font-medium ${
                    status === "pending" 
                      ? "bg-yellow-500 text-white" 
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("preparing")}
                  className={`px-4 py-2 rounded text-xs font-medium ${
                    status === "preparing" 
                      ? "bg-blue-500 text-white" 
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                >
                  Preparing
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("ready")}
                  className={`px-4 py-2 rounded text-xs font-medium ${
                    status === "ready" 
                      ? "bg-green-500 text-white" 
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
                >
                  Ready
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("delivered")}
                  className={`px-4 py-2 rounded text-xs font-medium ${
                    status === "delivered" 
                      ? "bg-purple-500 text-white" 
                      : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                  }`}
                >
                  Delivered
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("completed")}
                  className={`px-4 py-2 rounded text-xs font-medium ${
                    status === "completed" 
                      ? "bg-indigo-500 text-white" 
                      : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("cancelled")}
                  className={`px-4 py-2 rounded text-xs font-medium ${
                    status === "cancelled" 
                      ? "bg-red-500 text-white" 
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  Cancelled
                </button>
              </div>


              {/* <div className="border-t border-gray-200 pt-3 print-hide mt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Status</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBillStatus("unpaid")
                      generateBill(orderId, "unpaid")
                    }}
                    className={`px-4 py-2 rounded text-xs font-medium ${
                      billStatus === "unpaid" 
                        ? "bg-yellow-400 text-white" 
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }`}
                  >
                    unpaid
                  </button>
        
                  <button
                  type="button"
                    onClick={() => {
                      setBillStatus("Paid")
                      generateBill(orderId, "Paid")
                    }}
                    className={`px-4 py-2 rounded text-xs font-medium ${
                      billStatus === "Paid" 
                        ? "bg-green-600 text-white" 
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    Paid
                  </button>
          
                </div>
              </div> */}
            </div>
            
            {/* Special Requests */}
            <div className="bg-white shadow-md rounded p-6">
              <h2 className="text-xs font-medium text-gray-900 mb-4">Special Requests</h2>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                className="w-full px-2 py-1 border border-gray-300 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any special requests or notes for this order"
              ></textarea>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-2">
              <Link
                href="/orders"
                className="px-4 py-2 bg-gray-200 text-xs text-gray-800 rounded hover:bg-gray-300 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-xs text-white rounded hover:bg-orange-600 font-medium"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
  )
}