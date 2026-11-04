    "use client"

    import { useState, useEffect, useRef, useCallback } from "react"
    import { ArrowLeft, Search, Plus, Minus, Trash2, Loader } from "lucide-react"
    import { useRouter } from "next/navigation"
    import { useAlert } from "@/context/AlertContext"

    // ---------- SAFE ARRAY HELPER ----------
    function toArray(value) {
    if (Array.isArray(value)) return value
    if (value == null) return []
    return [value]
    }

    export default function OrderEntry() {
    const [menuItems, setMenuItems] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [cart, setCart] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [tableNumber, setTableNumber] = useState("A1")
    const [itemType, setItemType] = useState("all")
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        room: "",
        phone: "",
        table: "",
    })
    const [orderType, setOrderType] = useState("dine-in")
    const { showAlert } = useAlert()
    const router = useRouter()

    // Loading states
    const [loadingMenu, setLoadingMenu] = useState(true)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [taxes, setTaxes] = useState([])
    const [loadingTaxes, setLoadingTaxes] = useState(true)
    const [showCustomerForm, setShowCustomerForm] = useState(false)

    // Infinite scroll
    const [cursor, setCursor] = useState('')
    const [hasMore, setHasMore] = useState(true)
    const loaderRef = useRef(null)

    // KOT Modal
    const [showKOTModal, setShowKOTModal] = useState(false)
    const [kotOrder, setKotOrder] = useState(null)
    const [kotPrintSize, setKotPrintSize] = useState("original") // "original" | "a4"

    // ------------------- COMPANY INFO (EDIT HERE) -------------------
    const COMPANY_NAME = "SPICE GARDEN RESTAURANT"
    const COMPANY_GST = "GSTIN: 22AAAAA0000A1Z5"
    const LOGO_URL = "/logo.png" // Must be in public/ folder

    // ------------------- DEBOUNCE -------------------
    const useDebounce = (value, delay) => {
        const [debouncedValue, setDebouncedValue] = useState(value)
        useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
        }, [value, delay])
        return debouncedValue
    }
    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    // ------------------- FETCH DATA -------------------
    useEffect(() => {
        fetchCategories()
        fetchTaxes()
    }, [])

    useEffect(() => {
        setMenuItems([])
        setHasMore(true)
        setCursor('')
        fetchMenuItems(false, '')
    }, [debouncedSearchTerm, selectedCategory, itemType])

    const fetchMenuItems = useCallback(async (append = false, cursorParam = '') => {
        try {
        setLoadingMenu(true)
        const queryParams = new URLSearchParams({
            searchTerm: debouncedSearchTerm,
            category: selectedCategory,
            itemType,
            cursor: cursorParam || cursor,
        })
        const response = await fetch(`/api/menu?${queryParams}&source=orders`)
        const data = await response.json()
        const filteredData = data.items?.filter(item => item.available) || []
        const combined = append ? [...menuItems, ...filteredData] : filteredData

        if (append) {
            setMenuItems(prev => {
            const unique = Array.from(new Map(combined.map(i => [i._id, i])).values())
            return unique
            })
        } else {
            setMenuItems(filteredData)
        }
        setCursor(data.nextCursor || '')
        setHasMore(!!data.nextCursor)
        } catch (error) {
        console.error("Error fetching menu:", error)
        } finally {
        setLoadingMenu(false)
        }
    }, [debouncedSearchTerm, selectedCategory, itemType, cursor, menuItems])

    const fetchCategories = async () => {
        try {
        setLoadingCategories(true)
        const res = await fetch("/api/categories")
        const data = await res.json()
        setCategories(data)
        } catch (error) {
        console.error("Error fetching categories:", error)
        } finally {
        setLoadingCategories(false)
        }
    }

    // const fetchTaxes = async () => {
    //     try {
    //     setLoadingTaxes(true)
    //     const res = await fetch("/api/taxes?active=true")
    //     const data = await res.json()
    //     setTaxes(Array.isArray(data) ? data : [])
    //     } catch (error) {
    //     console.error("Error fetching taxes:", error)
    //     } finally {
    //     setLoadingTaxes(false)
    //     }
    // }

    // ------------------- CART -------------------
    const addToCart = (item) => {
        const existing = cart.find(i => i._id === item._id)
        if (existing) {
        setCart(cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
        setCart([...cart, { ...item, quantity: 1 }])
        }
    }

    const updateQuantity = (id, qty) => {
        if (qty === 0) {
        setCart(cart.filter(i => i._id !== id))
        } else {
        setCart(cart.map(i => i._id === id ? { ...i, quantity: qty } : i))
        }
    }

    const removeFromCart = (id) => setCart(cart.filter(i => i._id !== id))

    const getSubtotal = () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const getTaxLines = () => {
        const subtotal = getSubtotal()
        return taxes.map(tax => {
        const isPct = tax.type === "percentage"
        const amount = isPct ? (subtotal * tax.rate) / 100 : tax.rate
        return { id: tax._id, label: isPct ? `${tax.name} ${tax.rate}%` : tax.name, amount }
        })
    }
    const getTotalTaxAmount = () => getTaxLines().reduce((sum, t) => sum + t.amount, 0)
    const getTotalAmount = () => getSubtotal() + getTotalTaxAmount()

    // ------------------- BILL & ORDER -------------------
    const generateBill = async (orderId, status) => {
        try {
        const res = await fetch("/api/bills/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, status }),
        })
        if (res.ok) {
            const bill = await res.json()
            showAlert("success", "Bill Generated", `Bill #${bill.billNumber}`, [{ text: "OK" }])
        }
        } catch (error) {
        console.error("Bill error:", error)
        }
    }

    const handleSubmitOrder = async () => {
        if (cart.length === 0) return showAlert("warning", "Empty Cart", "Add items first.", [{ text: "OK" }])
        if (!customerInfo.name || !customerInfo.phone) return showAlert("warning", "Customer Info", "Name & phone required.", [{ text: "OK" }])

        try {
        const subtotal = getSubtotal()
        const orderData = {
            items: cart,
            customerInfo: { ...customerInfo, table: tableNumber },
            orderType,
            paymentMethod: "cash",
            subtotal: subtotal.toFixed(2),
            taxes: getTaxLines().map(t => ({ ...t, amount: t.amount.toFixed(2) })),
            totalTaxAmount: getTotalTaxAmount().toFixed(2),
            totalAmount: getTotalAmount().toFixed(0),
            status: "pending",
            paymentStatus: "unpaid",
        }

        const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
        })

        if (res.ok) {
            const createdOrder = await res.json()
            await generateBill(createdOrder._id, "unpaid")
            generateKOT(createdOrder)
            showAlert("success", "Order Placed!", "KOT sent to kitchen.", [{ text: "OK" }])
            setCart([])
            setCustomerInfo({ name: "", room: "", phone: "", table: "" })
            setShowCustomerForm(false)
        }
        } catch (error) {
        console.error("Order error:", error)
        showAlert("error", "Failed", "Could not place order.", [{ text: "OK" }])
        }
    }

    // ------------------- KOT PRINT WITH LOGO -------------------
    const generateKOT = useCallback((order) => {
        if (!order || !Array.isArray(order.items)) {
        console.warn("KOT ignored – invalid items:", order)
        return
        }
        setKotOrder(order)
        setKotPrintSize("original")
        setShowKOTModal(true)
    }, [])

    const handlePrint = useCallback(() => {
        if (!kotOrder) return

        const isA4 = kotPrintSize === "a4"

        const formatPrice = (val) => Number(val || 0).toFixed(2)
        
        const itemsHTML = toArray(kotOrder?.items).map(i => {
          const itemPrice = Number(i.price || 0);
          const qty = Number(i.quantity || 1);
          const taxRate = Number(i.tax || 0) / 100;
          const itemTotal = itemPrice * qty;
          const taxAmount = itemTotal * taxRate;
          return `<tr style="border-bottom:1px solid #333;"><td>${i.name}</td><td style="text-align:right;">${qty}</td><td style="text-align:right;">${formatPrice(itemPrice)}</td><td style="text-align:right;">${formatPrice(taxAmount)}</td><td style="text-align:right;">${formatPrice(itemTotal + taxAmount)}</td></tr>`;
        }).join("");

        const totalItems = toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        const subtotal = toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
        const cgstAmount = subtotal * 0.025;
        const sgstAmount = subtotal * 0.025;

        const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>KOT</title>
            <style>
            body { margin:0; font-family: monospace; }
            .kot {
                ${isA4
                ? "width:190mm; margin:20mm auto; padding:15mm; font-size:12px; line-height:1.4;"
                : "width:80mm; padding:8mm; font-size:11px; line-height:1.3;"}
            }
            .header { text-align:center; margin-bottom:8px; }
            .company-name { font-weight:bold; font-size:${isA4 ? "14px" : "13px"}; margin:2px 0; }
            .company-info { font-size:${isA4 ? "11px" : "10px"}; margin:0; }
            .section-title { text-align:center; font-weight:bold; margin:8px 0 4px; border-bottom:1px solid #000; padding-bottom:2px; }
            .date-info { display:flex; justify-content:space-between; font-size:${isA4 ? "11px" : "10px"}; margin:4px 0; border-bottom:1px solid #333; padding-bottom:2px; }
            .items-table { width:100%; border-collapse:collapse; margin:4px 0; font-size:${isA4 ? "11px" : "10px"}; }
            .items-header { font-weight:bold; border-bottom:1px solid #000; }
            .items-header td { padding:2px; text-align:right; }
            .items-header td:first-child { text-align:left; }
            .items-header td:nth-child(2) { width:12%; }
            .items-header td:nth-child(3) { width:18%; }
            .items-header td:nth-child(4) { width:14%; }
            .items-header td:nth-child(5) { width:16%; }
            .tax-summary { font-size:${isA4 ? "11px" : "10px"}; margin:4px 0; border-bottom:1px solid #333; padding:2px 0; }
            .tax-line { display:flex; justify-content:space-between; }
            .footer { text-align:center; margin-top:8px; font-weight:bold; font-size:${isA4 ? "11px" : "10px"}; }
            @media print {
                ${isA4 
                ? "@page { size: A4; margin: 10mm; }" 
                : "@page { size: 80mm auto; margin: 5mm; }"
                }
            }
            </style>
        </head>
        <body>
            <div class="kot">
            <div class="header">
                <div class="company-info">GST INVOICE</div>
                <div class="company-name">${COMPANY_NAME}</div>
                <div class="company-info">RESTAURANT & BAR</div>
                <div class="company-info">ACROPOLIS5</div>
                <div class="company-info">THE FOOD COURT</div>
                <div class="company-info">KOLKATA - 700107, WEST BENGAL, INDIA</div>
            </div>
            <div class="date-info">
                <span>Date ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}</span>
                <span>KOT</span>
            </div>
            <div class="date-info">
                <span>Sale No: ${kotOrder?._id?.slice(-6) || 'N/A'}</span>
                <span>${kotOrder.orderType === "room-service" ? `Room ${kotOrder.customerInfo?.room || "-"}` : `Table ${kotOrder.customerInfo?.table || "-"}`}</span>
            </div>
            <table class="items-table">
                <tr class="items-header">
                    <td>Item</td>
                    <td>Qty</td>
                    <td>Rate</td>
                    <td>Tax</td>
                    <td>Total</td>
                </tr>
                ${itemsHTML}
            </table>
            <div class="date-info">
                <span>Total Items:</span>
                <span>${totalItems}</span>
            </div>
            <div class="tax-summary">
                <div style="font-weight:bold; margin-bottom:2px;">Tax Collection Summary</div>
                <div class="tax-line">
                    <span>CGST @ 2.50%:</span>
                    <span>${formatPrice(cgstAmount)}</span>
                </div>
                <div class="tax-line">
                    <span>SGST @ 2.50%:</span>
                    <span>${formatPrice(sgstAmount)}</span>
                </div>
            </div>
            <div class="footer">*** KITCHEN ORDER TICKET ***</div>
            <div style="text-align:center; font-size:${isA4 ? "10px" : "9px"}; margin-top:4px;">${COMPANY_GST}</div>
            <div style="text-align:center; font-size:${isA4 ? "10px" : "9px"};">Delivery Call No: ${kotOrder?._id?.slice(-2) || 'N/A'}</div>
            </div>
        </body>
        </html>
        `

        const win = window.open("", "_blank", "width=800,height=600")
        if (!win) return alert("Allow popups to print.")

        win.document.write(printHTML)
        win.document.close()
        win.onload = () => setTimeout(() => { win.focus(); win.print() }, 500)
    }, [kotOrder, kotPrintSize])

    // ------------------- INFINITE SCROLL -------------------
    useEffect(() => {
        const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && hasMore && !loadingMenu) {
            fetchMenuItems(true)
            }
        },
        { threshold: 0.1 }
        )
        if (loaderRef.current) observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [hasMore, loadingMenu, fetchMenuItems])

    // ------------------- RENDER -------------------
    return (
        <div className="h-screen bg-gray-50 flex flex-col">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
                <button onClick={() => router.back()} className="p-2 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200">
                <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-gray-900">Order Entry</span>

                <div className="relative">
                <input
                    type="text"
                    placeholder="Item Name or Code"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-1 border rounded w-48 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                {orderType === "room-service" ? (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Room #</span>
                    <input
                    type="text"
                    value={customerInfo.room}
                    onChange={e => setCustomerInfo({ ...customerInfo, room: e.target.value })}
                    className="w-16 h-8 text-center border rounded bg-orange-100 text-orange-800 font-medium"
                    />
                </div>
                ) : (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Table #</span>
                    <input
                    type="text"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                    className="w-16 h-8 text-center border rounded bg-orange-100 text-orange-800 font-medium"
                    />
                </div>
                )}
            </div>
            </div>

            <div className="flex justify-center mt-3 gap-2">
            {["all", "kitchen", "retail"].map(type => (
                <button
                key={type}
                onClick={() => setItemType(type)}
                className={`px-3 py-1 text-xs rounded border ${itemType === type ? "bg-orange-500 text-white border-orange-500" : "border-gray-300"}`}
                >
                {type === "all" ? "All Items" : type === "kitchen" ? "Kitchen" : "Retail"}
                </button>
            ))}
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
            {/* CATEGORIES */}
            <div className="w-32 bg-white border-r border-gray-200 overflow-y-auto">
            {loadingCategories ? (
                <div className="p-4 text-center"><Loader className="w-5 h-5 animate-spin mx-auto" /></div>
            ) : (
                <>
                <button onClick={() => setSelectedCategory("all")} className={`w-full text-center py-4 border-b ${selectedCategory === "all" ? "bg-orange-50 border-l-4 border-l-orange-500" : ""}`}>
                    <div className="text-2xl">All</div>
                    <span className="text-xs">All</span>
                </button>
                {categories.map(cat => (
                    <button key={cat._id} onClick={() => setSelectedCategory(cat.name)} className={`w-full text-center py-4 border-b ${selectedCategory === cat.name ? "bg-orange-50 border-l-4 border-l-orange-500" : ""}`}>
                    <div className="text-2xl">{cat.icon || "Dish"}</div>
                    <span className="text-xs">{cat.name}</span>
                    </button>
                ))}
                </>
            )}
            </div>

            {/* MENU ITEMS */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {menuItems.length > 0 ? (
                <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {menuItems.map(item => (
                    <div key={item._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md">
                        <div className="relative">
                        <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-32 object-cover" />
                        <button onClick={() => addToCart(item)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs">+</button>
                        </div>
                        <div className="p-3">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">₹{item.price.toFixed(2)}</span>
                            <span className="text-xs text-red-500">Tax Exc</span>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                <div ref={loaderRef} className="py-4 text-center">
                    {hasMore && <Loader className="w-4 h-4 animate-spin inline" />} {hasMore && "Loading..."}
                </div>
                </>
            ) : loadingMenu ? (
                <div className="flex flex-col items-center justify-center h-full">
                <Loader className="w-8 h-8 animate-spin text-orange-500" />
                <p className="mt-2 text-sm text-gray-500">Loading menu...</p>
                </div>
            ) : (
                <p className="text-center text-gray-500">No items found.</p>
            )}
            </div>

            {/* CART */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b">
                <div className="flex gap-2">
                {["dine-in", "room-service", "takeaway"].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-1 text-xs rounded border ${orderType === t ? "bg-orange-500 text-white" : "border-gray-300"}`}>
                    {t === "dine-in" ? "Dine-in" : t === "room-service" ? "Room Service" : "Takeaway"}
                    </button>
                ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {showCustomerForm ? (
                <div>
                    <div className="flex justify-between mb-3">
                    <h4 className="font-semibold">Customer Details</h4>
                    <button onClick={() => setShowCustomerForm(false)} className="text-xs text-gray-500">Back</button>
                    </div>
                    <input placeholder="Name" value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} className="w-full mb-2 p-2 border rounded text-sm" />
                    <input placeholder="Phone" value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} className="w-full mb-2 p-2 border rounded text-sm" />
                    {orderType === "room-service" && (
                    <input placeholder="Room" value={customerInfo.room} onChange={e => setCustomerInfo({ ...customerInfo, room: e.target.value })} className="w-full mb-2 p-2 border rounded text-sm" />
                    )}
                </div>
                ) : cart.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">Cart is empty</p>
                ) : (
                toArray(cart).map(item => (
                    <div key={item._id} className="flex justify-between items-center py-2 border-b">
                    <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-6 h-6 border rounded">-</button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-6 h-6 border rounded">+</button>
                        <button onClick={() => removeFromCart(item._id)} className="ml-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    </div>
                ))
                )}
            </div>

            <div className="p-4 border-t">
                <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Amount</span><span>₹{getSubtotal().toFixed(0)}</span></div>
                {getTaxLines().map(tax => (
                    <div key={tax.id} className="flex justify-between"><span>{tax.label}</span><span>₹{tax.amount.toFixed(0)}</span></div>
                ))}
                <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>₹{getTotalAmount().toFixed(0)}</span></div>
                </div>
                <div className="flex gap-2 mt-3">
                {showCustomerForm ? (
                    <>
                    <button onClick={() => setShowCustomerForm(false)} className="flex-1 py-2 border rounded text-gray-700">Back</button>
                    <button onClick={handleSubmitOrder} className="flex-1 py-2 bg-orange-600 text-white rounded">Confirm</button>
                    </>
                ) : (
                    <>
                    <button className="flex-1 py-2 border border-orange-300 text-orange-600 rounded">Cancel</button>
                    <button onClick={() => setShowCustomerForm(true)} disabled={cart.length === 0} className="flex-1 py-2 bg-orange-600 text-white rounded disabled:opacity-50">Order</button>
                    </>
                )}
                </div>
            </div>
            </div>
        </div>

        {/* KOT MODAL */}
        {showKOTModal && kotOrder && (
            <div className="fixed inset-0 bg-white z-50 overflow-auto p-4">
            <div className="max-w-sm mx-auto font-mono text-xs leading-tight">
                {/* Header */}
                <div className="text-center mb-2">
                  <p className="text-xs font-bold">GST INVOICE</p>
                  <p className="text-sm font-bold">{COMPANY_NAME}</p>
                  <p className="text-xs">RESTAURANT & BAR</p>
                  <p className="text-xs">ACROPOLIS5</p>
                  <p className="text-xs">THE FOOD COURT</p>
                  <p className="text-xs">KOLKATA - 700107, WEST BENGAL, INDIA</p>
                </div>

                {/* Date & Sale No */}
                <div className="mb-2 text-xs border-b border-gray-400 pb-1">
                  <div className="flex justify-between">
                    <span>Date {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}</span>
                    <span>KOT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sale No: {kotOrder?._id?.slice(-6) || 'N/A'}</span>
                    <span>{kotOrder.orderType === "room-service" ? `Room ${kotOrder.customerInfo?.room || "-"}` : `Table ${kotOrder.customerInfo?.table || "-"}`}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-2">
                  <div className="flex justify-between font-bold border-b border-gray-400 pb-1 text-xs">
                    <span className="flex-1">Item</span>
                    <span className="w-12 text-right">Qty</span>
                    <span className="w-16 text-right">Rate</span>
                    <span className="w-14 text-right">Tax</span>
                    <span className="w-16 text-right">Total</span>
                  </div>
                  
                  {toArray(kotOrder?.items).map((item, i) => {
                    const itemPrice = Number(item.price || 0);
                    const qty = Number(item.quantity || 1);
                    const taxRate = Number(item.tax || 0) / 100;
                    const itemTotal = itemPrice * qty;
                    const taxAmount = itemTotal * taxRate;
                    
                    return (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-300">
                        <span className="flex-1">{item.name}</span>
                        <span className="w-12 text-right">{qty}</span>
                        <span className="w-16 text-right">{itemPrice.toFixed(2)}</span>
                        <span className="w-14 text-right">{taxAmount.toFixed(2)}</span>
                        <span className="w-16 text-right">{(itemTotal + taxAmount).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="mb-2 border-b border-gray-400 pb-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span>{toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)}</span>
                  </div>
                </div>

                {/* Tax Summary */}
                <div className="mb-2 border-b border-gray-400 pb-1 text-xs">
                  <p className="font-bold">Tax Collection Summary</p>
                  <div className="flex justify-between">
                    <span>CGST @ 2.50%:</span>
                    <span>{((toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0)) * 0.025).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST @ 2.50%:</span>
                    <span>{((toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0)) * 0.025).toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs mt-4 space-y-1">
                  <p className="font-bold">*** KITCHEN ORDER TICKET ***</p>
                  <p>{COMPANY_GST}</p>
                  <p className="text-xs">Delivery Call No: {kotOrder?._id?.slice(-2) || 'N/A'}</p>
                </div>
            </div>

            <div className="flex justify-center mt-6 gap-4 items-center">
                <span className="font-medium">Print Size:</span>
                <label className="flex items-center gap-1">
                <input type="radio" name="size" checked={kotPrintSize === "original"} onChange={() => setKotPrintSize("original")} className="w-4 h-4" /> Original (80mm)
                </label>
                <label className="flex items-center gap-1">
                <input type="radio" name="size" checked={kotPrintSize === "a4"} onChange={() => setKotPrintSize("a4")} className="w-4 h-4" /> A4
                </label>
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <button onClick={() => { setShowKOTModal(false); setKotPrintSize("original"); }} className="px-6 py-2 border rounded text-gray-700">Close</button>
                <button onClick={handlePrint} className="px-6 py-2 bg-orange-600 text-white rounded">Print / Download</button>
            </div>
            </div>
        )}
        </div>
    )
    }   


"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Search, Plus, Minus, MoreVertical, Trash2, Loader2, Bed, Loader } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAlert } from "@/context/AlertContext"

// ---------- SAFE ARRAY HELPER ----------
function toArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ------------------- COMPANY INFO (EDIT HERE) -------------------
const COMPANY_NAME = "SPICE GARDEN RESTAURANT"
const COMPANY_GST = "GSTIN: 22AAAAA0000A1Z5"
const LOGO_URL = "/logo.png" // place in public/logo.png

export default function OrderEntry() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState([]);
  const [addedTax, setAddedTax] = useState(0);
  const [onlyTax, setOnlyTax] = useState(0);
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [tableNumber, setTableNumber] = useState("A1")
  const [covers, setCovers] = useState("5")
  const [itemType, setItemType] = useState("all");
  const [selectedCover, setSelectedCover] = useState("1")
  const [showLoader, setShowLoader] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    room: "",
    phone: "",
    table: "",
  })
  const [orderType, setOrderType] = useState("dine-in")
  const { showAlert } = useAlert()
  const router = useRouter()

  // loading states
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [taxes, setTaxes] = useState([])
  const [loadingTaxes, setLoadingTaxes] = useState(true)
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  const [cursor, setCursor] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 1500);

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [latestOrder, setLatestOrder] = useState(null);

  const [showKOTModal, setShowKOTModal] = useState(false);
  const [kotOrder, setKotOrder] = useState(null);
  const [kotPrintSize, setKotPrintSize] = useState("original");

  // ------------------- FETCH DATA -------------------
  useEffect(() => {
    fetchCategories()
    fetchTaxes()
  }, [])

  useEffect(() => {
    setMenuItems([]);
    setHasMore(true);
    setCursor('');
    fetchMenuItems(false, '');
  }, [debouncedSearchTerm, selectedCategory, itemType]);

  const fetchMenuItems = useCallback(async (append = false, cursorParam) => {
    try {
      setLoadingMenu(true);
      const queryParams = new URLSearchParams({
        searchTerm: debouncedSearchTerm,
        category: selectedCategory,
        itemType: itemType,
        cursor: cursorParam !== undefined ? cursorParam : cursor,
      });
      const response = await fetch(`/api/menu?${queryParams}&source=orders`);
      const data = await response.json();
      const filteredData = data.items ? data.items.filter(item => item.available) : [];
      const combined = append ? [...menuItems, ...filteredData] : filteredData;
      if (append) {
        setMenuItems(prev => {
          const unique = Array.from(new Map(combined.map(i => [i._id, i])).values())
          return unique;
        });
      } else {
        setMenuItems(filteredData);
      }
      setCursor(data.nextCursor || "");
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoadingMenu(false);
    }
  }, [debouncedSearchTerm, selectedCategory, itemType, cursor]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;
    const scrollContainer = document.querySelector(".custom-scrollbar");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMenu) {
          fetchMenuItems(true);
        }
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(loader);
    return () => loader && observer.unobserve(loader);
  }, [hasMore, loadingMenu, fetchMenuItems]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch("/api/categories")
      const data = await response.json()
      setCategories(data)
      setSelectedCategory("all")
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchTaxes = async () => {
    try {
      setLoadingTaxes(true)
      const response = await fetch("/api/taxes?active=true")
      const data = await response.json()
      setTaxes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching taxes:", error)
      setTaxes([])
    } finally {
      setLoadingTaxes(false)
    }
  }

  // ------------------- CART -------------------
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id)
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const updateQuantity = (id, quantity) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item._id !== id))
    } else {
      setCart(cart.map(item => (item._id === id ? { ...item, quantity } : item)))
    }
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id))
  }

  const getSubtotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0)

  const getTaxLines = () => {
    const subtotal = getSubtotal()
    return taxes.map(tax => {
      const isPercentage = tax.type === "percentage"
      const amount = isPercentage ? (subtotal * Number(tax.rate || 0)) / 100 : Number(tax.rate || 0)
      return {
        id: tax._id,
        name: tax.name || (isPercentage ? `Tax ${tax.rate}%` : `Tax ₹${tax.rate}`),
        label: isPercentage ? `${tax.name || "Tax"} ${tax.rate}%` : `${tax.name || "Tax"}`,
        amount,
      }
    })
  }

  const generateBill = async (orderId, status) => {
    try {
      const response = await fetch("/api/bills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      })
      if (response.ok) {
        const bill = await response.json()
        showAlert("success", "Bill Generated", `Bill #${bill.billNumber}`, [{ text: "OK" }])
      }
    } catch (error) {
      console.error("Error generating bill:", error)
    }
  }

  // ------------------- TAX CALCULATION -------------------
  useEffect(() => {
    const finalAmount = cart.reduce(
      (acc, item) => {
        const itemTax = (item.price * (item.tax || 0) / 100) * item.quantity;
        const itemTotal = (item.price * item.quantity) + itemTax;
        return {
          withTax: acc.withTax + itemTotal,
          withoutTax: acc.withoutTax + itemTax,
        };
      },
      { withTax: 0, withoutTax: 0 }
    );
    setAddedTax(finalAmount.withTax);
    setOnlyTax(finalAmount.withoutTax);
  }, [cart]);

  const getTotalTaxAmount = () => getTaxLines().reduce((sum, t) => sum + t.amount, 0)
  const getTotalAmount = () => getSubtotal() + getTotalTaxAmount()

  // ------------------- ORDER SUBMIT -------------------
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      showAlert("warning", "Cart is empty", "Please add items to the cart before placing an order.", [{ text: "Okay" }])
      return
    }
    if (!customerInfo.name || !customerInfo.phone) {
      showAlert("warning", "Incomplete Customer Information", "Please fill in all customer information fields.", [{ text: "Okay" }])
      return
    }
    setShowLoader(true)
    try {
      const subtotal = getSubtotal()
      const totalTaxAmount = getTotalTaxAmount()
      const orderData = {
        items: cart,
        customerInfo: { ...customerInfo, table: tableNumber },
        orderType,
        paymentMethod,
        subtotal: subtotal.toFixed(2),
        taxes: getTaxLines().map(t => ({ ...t, amount: t.amount.toFixed(2) })),
        itemTaxes: onlyTax,
        totalTaxAmount: totalTaxAmount.toFixed(2),
        totalAmount: (Number(getTotalAmount().toFixed(0)) + Number(onlyTax)),
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: new Date(),
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const createdOrder = await response.json()
        await generateBill(createdOrder._id.toString(), "unpaid")
        generateKOT(createdOrder);
        showAlert("success", "Order Placed", "Your order has been placed successfully!", [{ text: "Okay" }])
        setCart([])
        setCustomerInfo({ name: "", room: "", phone: "", table: "" })
        setShowCustomerForm(false)
      }
    } catch (error) {
      console.error("Error placing order:", error)
      showAlert("error", "Failed", "Could not place order.", [{ text: "OK" }])
    } finally {
      setShowLoader(false);
    }
  }

  // ------------------- KOT GENERATION & PRINT -------------------
  const generateKOT = (order) => {
    setKotOrder(order);
    setKotPrintSize("original");
    setShowKOTModal(true);
  };

  const handlePrint = useCallback(() => {
    if (!kotOrder) return;

    const isA4 = kotPrintSize === "a4";
    
    const formatPrice = (val) => Number(val || 0).toFixed(2);
    
    const itemsHTML = toArray(kotOrder?.items).map(i => {
      const itemPrice = Number(i.price || 0);
      const qty = Number(i.quantity || 1);
      const taxRate = Number(i.tax || 0) / 100;
      const itemTotal = itemPrice * qty;
      const taxAmount = itemTotal * taxRate;
      return `<tr style="border-bottom:1px solid #333;"><td>${i.name}</td><td style="text-align:right;">${qty}</td><td style="text-align:right;">${formatPrice(itemPrice)}</td><td style="text-align:right;">${formatPrice(taxAmount)}</td><td style="text-align:right;">${formatPrice(itemTotal + taxAmount)}</td></tr>`;
    }).join("");

    const totalItems = toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const subtotal = toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const cgstAmount = subtotal * 0.025;
    const sgstAmount = subtotal * 0.025;

    const printHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>KOT - ${kotOrder.customerInfo?.table || kotOrder.customerInfo?.room || "Takeaway"}</title>
        <style>
          body { margin:0; font-family:monospace; }
          .kot-container {
            ${isA4 ? "width:190mm; margin:20mm auto; padding:15mm; font-size:12px; line-height:1.4;" : "padding:8mm; font-size:11px; line-height:1.3;"}
          }
          .header { text-align:center; margin-bottom:8px; }
          .company-info { font-size:${isA4 ? "11px" : "10px"}; margin:0; }
          .company-name { font-weight:bold; font-size:${isA4 ? "14px" : "13px"}; margin:2px 0; }
          .date-info { display:flex; justify-content:space-between; font-size:${isA4 ? "11px" : "10px"}; margin:4px 0; border-bottom:1px solid #333; padding-bottom:2px; }
          .items-table { width:100%; border-collapse:collapse; margin:4px 0; font-size:${isA4 ? "11px" : "10px"}; }
          .items-header { font-weight:bold; border-bottom:1px solid #000; }
          .items-header td { padding:2px; text-align:right; }
          .items-header td:first-child { text-align:left; }
          .tax-summary { font-size:${isA4 ? "11px" : "10px"}; margin:4px 0; border-bottom:1px solid #333; padding:2px 0; }
          .tax-line { display:flex; justify-content:space-between; }
          .footer { text-align:center; margin-top:8px; font-weight:bold; font-size:${isA4 ? "11px" : "10px"}; }
          @media print {
            ${isA4 ? "@page { size:A4; margin:10mm; }" : "@page { size:80mm auto; margin:5mm; }"}
          }
        </style>
      </head>
      <body>
        <div class="kot-container">
          <div class="header">
            <div class="company-info">GST INVOICE</div>
            <div class="company-name">${COMPANY_NAME}</div>
            <div class="company-info">RESTAURANT & BAR</div>
            <div class="company-info">ACROPOLIS5</div>
            <div class="company-info">THE FOOD COURT</div>
            <div class="company-info">KOLKATA - 700107, WEST BENGAL, INDIA</div>
          </div>
          <div class="date-info">
            <span>Date ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}</span>
            <span>KOT</span>
          </div>
          <div class="date-info">
            <span>Sale No: ${kotOrder?._id?.slice(-6) || 'N/A'}</span>
            <span>${kotOrder.orderType === "room-service" ? `Room ${kotOrder.customerInfo?.room || "-"}` : `Table ${kotOrder.customerInfo?.table || "-"}`}</span>
          </div>
          <table class="items-table">
            <tr class="items-header">
              <td>Item</td>
              <td>Qty</td>
              <td>Rate</td>
              <td>Tax</td>
              <td>Total</td>
            </tr>
            ${itemsHTML}
          </table>
          <div class="date-info">
            <span>Total Items:</span>
            <span>${totalItems}</span>
          </div>
          <div class="tax-summary">
            <div style="font-weight:bold; margin-bottom:2px;">Tax Collection Summary</div>
            <div class="tax-line">
              <span>CGST @ 2.50%:</span>
              <span>${formatPrice(cgstAmount)}</span>
            </div>
            <div class="tax-line">
              <span>SGST @ 2.50%:</span>
              <span>${formatPrice(sgstAmount)}</span>
            </div>
          </div>
          <div class="footer">*** KITCHEN ORDER TICKET ***</div>
          <div style="text-align:center; font-size:${isA4 ? "10px" : "9px"}; margin-top:4px;">${COMPANY_GST}</div>
          <div style="text-align:center; font-size:${isA4 ? "10px" : "9px"};">Delivery Call No: ${kotOrder?._id?.slice(-2) || 'N/A'}</div>
        </div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) { alert("Please allow popups to print KOT"); return; }
    win.document.write(printHTML);
    win.document.close();
    win.onload = () => setTimeout(() => { win.focus(); win.print(); }, 500);
  }, [kotOrder, kotPrintSize]);

  // ------------------- RENDER -------------------
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-gray-900">Order Entry</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Item Name or Code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-1 pr-8 text-sm w-48"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-gary-50 flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-600">Item Type:</span>
            <div className="flex gap-1">
              {["all", "kitchen", "retail"].map((type) => (
                <button
                  key={type}
                  className={`px-3 py-1 text-xs border border-gray-300 rounded ${
                    itemType === type ? "bg-orange-500 text-white border-orange-500" : ""
                  }`}
                  onClick={() => setItemType(type)}
                >
                  {type === "all" ? "All Items" : type === "kitchen" ? "Kitchen Items" : "Retail Items"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {orderType === "room-service" ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Room #</span>
                <input
                  type="text"
                  value={customerInfo.room}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, room: e.target.value })}
                  className="w-16 h-8 text-center border border-gray-300 rounded bg-orange-100 text-orange-800 font-medium"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Table #</span>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-16 h-8 text-center border border-gray-300 rounded bg-orange-100 text-orange-800 font-medium"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-30 bg-white border-r border-gray-200 flex flex-col overflow-x-hidden scrollbar-hide">
          {loadingCategories ? (
            <div className="flex flex-col items-center justify-center min-w-48 py-6 space-y-2">
              <Loader className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="text-sm text-gray-500">Loading categories...</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex flex-col items-center py-4 px-4 border-b border-gray-100 hover:bg-gray-50 ${
                  selectedCategory === "all" ? "bg-orange-50 border-l-4 border-l-orange-500" : ""
                }`}
              >
                <div className="text-2xl mb-2">All</div>
                <span className="text-sm text-gray-700 text-center">All</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex flex-col items-center py-4 px-3 border-b border-gray-100 hover:bg-gray-50 ${
                    selectedCategory === category.name ? "bg-orange-50 border-l-4 border-l-orange-500" : ""
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon || "Dish"}</div>
                  <span className="text-xs text-gray-700 text-center">{category.name}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {menuItems.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={item.image || `/placeholder.svg?height=128&width=200&query=${encodeURIComponent(item.name + " food dish")}`}
                        alt={item.name}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => addToCart(item)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        +
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 mb-1">{item.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">₹ {item.price.toFixed(2)}</span>
                        <span className="text-xs text-red-500">Tax Exc</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div ref={loaderRef} className="text-xs mt-3">
                {hasMore && (
                  <div className="flex items-center justify-center">
                    <Loader className="w-4 h-4 text-orange-500 animate-spin" />
                    <span className="ml-2">Loading more items...</span>
                  </div>
                )}
              </div>
            </>
          ) : loadingMenu && hasMore ? (
            <div className="flex flex-col justify-center items-center space-y-2 h-full">
              <Loader className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="text-sm text-gray-500">Loading menu items...</span>
            </div>
          ) : (
            <div className="text-center text-gray-500">No items found.</div>
          )}
        </div>

        {/* Cart */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Order Type Selection */}
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="text-xs text-gray-600 mr-3">Order Type</span>
            <div className="flex gap-2">
              {["dine-in", "room-service", "takeaway"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    orderType === type
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {type === "dine-in" ? "Dine-in" : type === "room-service" ? "Room Service" : "Takeaway"}
                </button>
              ))}
            </div>
          </div>

          {/* Cart Content Area */}
          <div className="flex-1 overflow-y-auto py-3 px-4 custom-scrollbar mb-4">
            {showCustomerForm ? (
              <div className="h-full">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">Customer Details</h4>
                  <button
                    type="button"
                    onClick={() => setShowCustomerForm(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Back to Cart
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                  />
                  {orderType === "room-service" && (
                    <input
                      type="text"
                      placeholder="Room Number"
                      value={customerInfo.room}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, room: e.target.value })}
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                    />
                  )}
                  {orderType === "dine-in" && (
                    <input
                      type="text"
                      placeholder="Table Number"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                    />
                  )}
                </div>

                <div className="flex mt-3 justify-between items-center space-x-2">
                  <div className="flex gap-2">
                    {["cash", "card", "online", "room"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-3 py-1 rounded text-xs border ${
                          paymentMethod === method
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {method === "cash" ? "Cash" : method === "card" ? "Card" : method === "room" ? "Room" : "Online"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 mb-5">
                  {paymentMethod === "room" && orderType !== "room-service" && (
                    <input
                      type="text"
                      placeholder="Room Number"
                      value={customerInfo.room}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, room: e.target.value })}
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                    />
                  )}
                </div>
              </div>
            ) : (
              <>
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Cart is empty
                  </div>
                ) : (
                  toArray(cart).map((item) => (
                    <div key={item._id} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500">₹ {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="w-6 h-6 text-red-500 hover:bg-red-50 rounded flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {/* Cart Total and Actions */}
          <div className="pb-3 pt-1 px-4 border-t border-gray-200">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="">Amount</span>
                <span>₹{getSubtotal().toFixed(0)}</span>
              </div>

              <div className="flex justify-between">
                <span>Item Tax</span>
                <span>₹{onlyTax}</span>
              </div>

              {loadingTaxes ? (
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>Loading...</span>
                </div>
              ) : (
                getTaxLines().map((tax) => (
                  <div key={tax.id} className="flex justify-between">
                    <span>{tax.label}</span>
                    <span>₹{tax.amount.toFixed(0) || 0}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total Amount</span>
                <span>₹{Number(getTotalAmount().toFixed(0)) + Number(onlyTax)}</span>
              </div>
            </div>

            <div className="flex space-x-2 mt-2">
              {showCustomerForm ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCustomerForm(false)}
                    className="flex-1 py-2 px-0 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={showLoader}
                    className="flex-1 py-2 px-0 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {showLoader ? "Placing..." : "Confirm Order"}
                  </button>
                </>
              ) : (
                <>
                  <button className="flex-1 py-2 px-0 border border-orange-300 text-orange-600 rounded hover:bg-orange-50">
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowCustomerForm(true)}
                    disabled={cart.length === 0}
                    className="flex-1 py-2 px-0 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loader */}
      {showLoader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* KOT Modal */}
      {showKOTModal && kotOrder && (
        <div className="fixed inset-0 bg-white overflow-auto p-4 z-50">
          {/* Printable area */}
          <div id="kot-print-content" className="max-w-sm mx-auto font-mono text-xs leading-tight">
            {/* Header */}
            <div className="text-center mb-2">
              <p className="text-xs font-bold">GST INVOICE</p>
              <p className="text-sm font-bold">{COMPANY_NAME}</p>
              <p className="text-xs">RESTAURANT & BAR</p>
              <p className="text-xs">ACROPOLIS5</p>
              <p className="text-xs">THE FOOD COURT</p>
              <p className="text-xs">KOLKATA - 700107, WEST BENGAL, INDIA</p>
            </div>

            {/* Date & Sale No */}
            <div className="mb-2 text-xs border-b border-gray-400 pb-1">
              <div className="flex justify-between">
                <span>Date {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}</span>
                <span>KOT</span>
              </div>
              <div className="flex justify-between">
                <span>Sale No: {kotOrder?._id?.slice(-6) || 'N/A'}</span>
                <span>{kotOrder.orderType === "room-service" ? `Room ${kotOrder.customerInfo?.room || "-"}` : `Table ${kotOrder.customerInfo?.table || "-"}`}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-2">
              <div className="flex justify-between font-bold border-b border-gray-400 pb-1 text-xs">
                <span className="flex-1">Item</span>
                <span className="w-12 text-right">Qty</span>
                <span className="w-16 text-right">Rate</span>
                <span className="w-14 text-right">Tax</span>
                <span className="w-16 text-right">Total</span>
              </div>
              
              {toArray(kotOrder?.items).map((item, i) => {
                const itemPrice = Number(item.price || 0);
                const qty = Number(item.quantity || 1);
                const taxRate = Number(item.tax || 0) / 100;
                const itemTotal = itemPrice * qty;
                const taxAmount = itemTotal * taxRate;
                
                return (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-300">
                    <span className="flex-1">{item.name}</span>
                    <span className="w-12 text-right">{qty}</span>
                    <span className="w-16 text-right">{itemPrice.toFixed(2)}</span>
                    <span className="w-14 text-right">{taxAmount.toFixed(2)}</span>
                    <span className="w-16 text-right">{(itemTotal + taxAmount).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="mb-2 border-b border-gray-400 pb-1 text-xs">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span>{toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)}</span>
              </div>
            </div>

            {/* Tax Summary */}
            <div className="mb-2 border-b border-gray-400 pb-1 text-xs">
              <p className="font-bold">Tax Collection Summary</p>
              <div className="flex justify-between">
                <span>CGST @ 2.50%:</span>
                <span>{((toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0)) * 0.025).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST @ 2.50%:</span>
                <span>{((toArray(kotOrder?.items).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0)) * 0.025).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs mt-4 space-y-1">
              <p className="font-bold">*** KITCHEN ORDER TICKET ***</p>
              <p>{COMPANY_GST}</p>
              <p className="text-xs">Delivery Call No: {kotOrder?._id?.slice(-2) || 'N/A'}</p>
            </div>
          </div>

          {/* Size selector */}
          <div className="flex justify-center mt-4 gap-4 items-center">
            <span className="text-sm font-medium">Print size:</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="kotSize" value="original" checked={kotPrintSize === "original"} onChange={() => setKotPrintSize("original")} className="w-4 h-4 text-orange-600" />
              <span>Original (80 mm)</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="kotSize" value="a4" checked={kotPrintSize === "a4"} onChange={() => setKotPrintSize("a4")} className="w-4 h-4 text-orange-600" />
              <span>A4</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center mt-4 gap-3">
            <button
              onClick={() => { setShowKOTModal(false); setKotPrintSize("original"); }}
              className="px-4 py-1 border rounded text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Print / Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



