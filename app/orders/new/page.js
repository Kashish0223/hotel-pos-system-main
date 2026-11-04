"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  MoreVertical,
  Trash2,
  Loader2,
  Bed,
  Loader,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import { jsPDF } from "jspdf";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthToken } from "@/lib/useAuthToken";
// import { subscribeToPush } from '/lib/webhook.js';  
import {subscribeToPush} from '@/lib/webhook'
// ---------- SAFE ARRAY HELPER ----------
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

// ------------------- COMPANY INFO (EDIT HERE) -------------------
const COMPANY_NAME = "SPICE GARDEN RESTAURANT";
const COMPANY_GST = "GSTIN: 22AAAAA0000A1Z5";
const LOGO_URL = "/images/logo.png"; // Must be in public/ folder
// const ADDRESS ="Jalisana Rd, Nayakpur, Jalisana, Gujarat, India - 382130"
// const CONTACT ="📞 +91-9978662828 | ✉️ contact@hotel-pos.com"

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export default function OrderEntry() {
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [addedTax, setAddedTax] = useState(0);
  const [onlyTax, setOnlyTax] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pending");
  const [tableNumber, setTableNumber] = useState("A1");
  const [covers, setCovers] = useState("5");
  const [itemType, setItemType] = useState("all");
  const [selectedCover, setSelectedCover] = useState("1");
  const [showLoader, setShowLoader] = useState(false);
  const token = useAuthToken();
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    room: "",
    phone: "",
    table: "",
  });
  const [orderType, setOrderType] = useState("dine-in");
  const { showAlert } = useAlert();
  const router = useRouter();
  // loading states
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [taxes, setTaxes] = useState([]);
  const [loadingTaxes, setLoadingTaxes] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [cursor, setCursor] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 1500);
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [kotOrder, setKotOrder] = useState(null);
  const [kotPrintSize, setKotPrintSize] = useState("original"); // "original" | "a4"

  // Add this state at the top (near other useState)
  const [isPartialMode, setIsPartialMode] = useState(false);
  const [partialAlerts, setPartialAlerts] = useState(false);
  const [settings, setSettings] = useState(null);
  const [manualKOTOrder, setManualKOTOrder] = useState(null); // <-- NEW

  // Edit order through the orders/edit page 
  const [isEditMode, setIsEditMode] = useState(false);
const [editingOrderId, setEditingOrderId] = useState(null);

  // Hold order until final confirm
  const [draftOrder, setDraftOrder] = useState(null);

  // === NEW: Online Payment Dropdown State ===
  const [onlineSubMethod, setOnlineSubMethod] = useState(null);

  const [isMounted, setIsMounted] = useState(false);

  const validateName = (name) => {
    if (!name || name.trim().length === 0) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name.trim()))
      return "Name can only contain letters and spaces";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) return "";
    const cleaned = phone.replace(/\D/g, ""); // remove non-digits
    if (cleaned.length !== 10) return "Phone must be exactly 10 digits";
    // if (!/^[6-9]\d{9}$/.test(cleaned)) return "Invalid Indian mobile number";
  };
  useEffect(() => {
    setIsMounted(true);
  }, []);


useEffect(() => {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;
  const editOrderParam = searchParams.get("editOrder");

  if (editOrderParam) {
    try {
      const editData = JSON.parse(decodeURIComponent(editOrderParam));

      // === Restore Items ===
      const restoredCart = (editData.items || []).map((item) => ({
        ...item,
        _id: item._id || item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        tax: Number(item.tax || 0),
        itemType: item.itemType || "kitchen",
      }));
      setCart(restoredCart);

      // === Restore Customer Info ===
      setCustomerInfo({
        name: editData.customerInfo?.name || "",
        phone: editData.customerInfo?.phone || "",
        table: editData.customerInfo?.table || "",
        room: editData.customerInfo?.room || "",
      });

      // === Restore Order Type ===
      setOrderType(editData.orderType || "dine-in");

      // === Restore Table Number (for dine-in) ===
      if (editData.orderType === "dine-in") {
        setTableNumber(editData.tableNumber || "A1");
      }

      // === Enable Edit Mode ===
      setIsEditMode(true);
      setEditingOrderId(editData.orderId);

      showAlert("info", "Edit Mode", "Existing order loaded. Add items and confirm to update.", [{ text: "OK" }]);

      // Clean URL
      router.replace("/orders/new", undefined, { shallow: true });
    } catch (err) {
      console.error("Failed to parse edit data:", err);
      showAlert("error", "Error", "Could not load order data.", [{ text: "OK" }]);
    }
  }
}, [router, showAlert]);
  // MOVE INSIDE COMPONENT
  const isOutOfStock = (item) => {
    return item.itemType === "retail" && (item.currentStock ?? 0) <= 0;
  };

  useEffect(() => {
    setLoadingCategories(true);
    setLoadingTaxes(true);
    if (!token) return;
    fetchCategories();
    // fetchTaxes();
  }, [token]);

  // useEffect(() => {
  //   setMenuItems([]);
  //   setHasMore(true);
  //   const newCursor = "";
  //   setCursor(newCursor);
  //   fetchMenuItems(false, "newCursor");
  // }, [debouncedSearchTerm, selectedCategory, itemType,token]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) {
        setLoadingSettings(true);
        return; // will retry on next render when token arrives
      }
      setLoadingSettings(true);
      try {
        const response = await fetch("/api/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("Fetched Settings:", data.general);
        setSettings(data); // only general settings.general
        // setSettings(data.general); // only general settings.general
      } catch (error) {
        console.error("Error fetching settings.general:", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [token]);

  // ---------- AUTO-DOWNLOAD KOT (PDF) ----------
  const downloadKOT = useCallback(
    (order) => {
      if (!order || !Array.isArray(order.items)) return;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: kotPrintSize === "a4" ? "a4" : [80, 150],
      });

      // SETTINGS
      const restName = settings?.general?.restaurantName || "";
      const address =
        settings?.general?.address ||
        "";
      const gst = settings?.general?.gst || "";
      const phone1 = settings?.general?.phone1 || "";
      // const restName = settings?.general?.restaurantName || "Hotel-POS";
      // const address =
      //   settings?.general?.address ||
      //   "Jalisana Rd, Nayakpur, Jalisana, Gujarat, India - 382130";
      // const gst = settings?.general?.gst || "GSTIN: 24AAAAA0000A1Z5";
      // const phone1 = settings?.general?.phone1 || "0987654321";

      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 6;
      const right = pageWidth - 6;
      const lineH = 4.5;
      let y = 8; // Tighter top margin

      // 1. LOGO (top-left)
      const logoSize = kotPrintSize === "a4" ? 18 : 18;
      doc.addImage(LOGO_URL, "PNG", left, y, logoSize, logoSize);

      // 2. RIGHT SIDE: Hotel Name, Address, GST, Phones
      const rightX = right;
      doc.setFontSize(kotPrintSize === "a4" ? 12 : 10);
      doc.setFont("helvetica", "bold");
      doc.text(restName, rightX, y + 5, { align: "right" });

      doc.setFontSize(kotPrintSize === "a4" ? 8 : 7);
      doc.setFont("helvetica", "normal");
      doc.text(address, rightX, y + 9, { align: "right", maxWidth: 50 });
      doc.text(gst, rightX, y + 15, { align: "right" });
      // doc.text(phone1, rightX, y + 12, { align: "right" });
      doc.setLineWidth(0.2);

      // doc.text(phone2, rightX, y + 18, { align: "right" });

      y += logoSize + 8;

      // 3. TITLE
      doc.setFontSize(kotPrintSize === "a4" ? 13 : 11);
      doc.setFont("helvetica", "bold");
      doc.text("KITCHEN ORDER TICKET", pageWidth / 2, y, { align: "center" });
      doc.setLineWidth(0.3);
      y += lineH + 1;

      // 4. ORDER INFO
      const tableOrRoom =
        order.orderType === "room-service"
          ? order.customerInfo?.room
          : order.customerInfo?.table || tableNumber;

      const timeStr = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      doc.setFontSize(kotPrintSize === "a4" ? 10 : 9);
      doc.setFont("helvetica", "normal");
      doc.text(`Order Type: ${order.orderType}`, left, y);
      y += lineH;
      doc.text(
        `${order.orderType === "room-service" ? "Room" : "Table"}: ${
          tableOrRoom || "-"
        }`,
        left,
        y
      );
      y += lineH;
      doc.text(`Time: ${timeStr}`, left, y);
      y += lineH + 2;

      // 5. TABLE HEADER + UNDERLINE ONLY BELOW "Item" & "Qty"
      const col1X = left;
      const col2X = right - (kotPrintSize === "a4" ? 18 : 12);

      doc.setFontSize(kotPrintSize === "a4" ? 10 : 9);
      doc.setFont("helvetica", "bold");
      doc.text("Item", col1X, y);
      doc.text("Qty", col2X, y, { align: "right" });

      // UNDERLINE ONLY BELOW HEADER
      const headerY = y + 1;
      doc.setLineWidth(0.3);
      doc.line(col1X, headerY, col2X - 2, headerY); // under "Item"
      doc.line(col2X - 2, headerY, col2X + 8, headerY); // under "Qty" (extends slightly)

      y += lineH + 1;

      // 6. TABLE ROWS (NO LINES BETWEEN ROWS)
      doc.setFont("helvetica", "normal");
      const items = toArray(order.items);
      items.forEach((i) => {
        const qty = i.quantity || 1;
        doc.text(i.name, col1X, y);
        doc.text(`${qty}`, col2X, y, { align: "right" });
        y += lineH;
      });

      // 7. FOOTER
      y += 3;
      doc.setFontSize(kotPrintSize === "a4" ? 10 : 9);
      doc.setFont("helvetica", "bold");
      doc.text("*** Send to Kitchen ***", pageWidth / 2, y, {
        align: "center",
      });

      // 8. SAVE
      const fileName = `KOT_${order.orderType}_${
        tableOrRoom || "X"
      }_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    },
    [settings, kotPrintSize, tableNumber]
  );

  const generateKOT = useCallback(
    (order) => {
      if (!order || !Array.isArray(order.items)) {
        console.warn("KOT ignored – invalid items:", order);
        return;
      }
      setKotOrder(order);
      setKotPrintSize("original");
      setShowKOTModal(true);
    },
    [settings, downloadKOT]
  );

  // ---------- OPTIONAL: SILENT PRINT (no modal) ----------
  //   const silentPrintKOT = useCallback(
  //     (order) => {
  //       if (!order) return;
  // const printHTML = `
  // <!DOCTYPE html>
  // <html>
  // <head>
  // <meta charset="UTF-8">
  // <title>KOT</title>
  // <style>
  //   body { margin:0; font-family:Arial,poppins,sans-serif; }
  //   .kot {
  //     width: ${kotPrintSize === "a4" ? "190mm" : "80mm"};
  //     padding: ${kotPrintSize === "a4" ? "15mm" : "8mm"};
  //     font-size: ${kotPrintSize === "a4" ? "14px" : "13px"};
  //   }
  //   .header { display:flex; justify-content:space-between; align-items:center; }
  //   .header-left img { height:${kotPrintSize === "a4" ? "60px" : "45px"}; object-fit:contain; }
  //   .header-right { text-align:right; line-height:1.4; }
  //   .header-right h1 { margin:0; font-size:${kotPrintSize === "a4" ? "18px" : "15px"}; font-weight:bold; }
  //   .header-right p { margin:0; font-size:${kotPrintSize === "a4" ? "12px" : "11px"}; }
  //   h2 { text-align:center; font-size:${kotPrintSize === "a4" ? "18px" : "16px"}; font-weight:bold; margin:12px 0 10px; }
  //   .details { margin-top:8px; line-height:1.6; }
  //   .details p { margin:0; }
  //   .details strong { display:inline-block; width:90px; }
  //   table { width:100%; border-collapse:collapse; margin-top:10px; }
  //   th, td { padding:5px 0; font-size:${kotPrintSize === "a4" ? "14px" : "13px"}; border-bottom:1px solid #000; }
  //   th { font-weight:bold; }
  //   th:last-child, td:last-child { text-align:center; }
  //   .footer { text-align:center; margin-top:12px; font-weight:bold; }

  //   @media print {
  //     @page { size:${kotPrintSize === "a4" ? "A4" : "80mm auto"}; margin:5mm; }
  //     body { -webkit-print-color-adjust:exact; }
  //   }
  // </style>
  // </head>
  // <body>
  // <div class="kot">
  //   <!-- Header -->
  //   <div class="header">
  //     <div class="header-left"><img src="${LOGO_URL}" alt="Logo"/></div>
  //     <div class="header-right">
  //       <h1>${settings?.general?.restaurantName || "Hotel-POS"}</h1>
  //       <p>${settings?.general?.address || "Jalisana Rd, Nayakpur, Jalisana, Gujarat, India - 382130"}</p>
  //       <p>${settings?.general?.phone || "9978662828"}</p>
  //     </div>
  //   </div>

  //   <!-- Title -->
  //   <h2>KITCHEN ORDER TICKET</h2>

  //   <!-- Details -->
  //   <div class="details">
  //     <p><strong>Order Type:</strong> ${kotOrder.orderType}</p>
  //     <p><strong>${kotOrder.orderType === "room-service" ? "Room" : "Table"}:</strong> ${
  //       kotOrder.orderType === "room-service"
  //         ? kotOrder.customerInfo?.room || "-"
  //         : kotOrder.customerInfo?.table || "-"
  //     }</p>
  //     <p><strong>Time:</strong> ${new Date().toLocaleString("en-GB", {
  //       day: "2-digit",
  //       month: "2-digit",
  //       year: "numeric",
  //       hour: "2-digit",
  //       minute: "2-digit",
  //       second: "2-digit"
  //     })}</p>
  //   </div>

  //   <!-- Table -->
  //   <table>
  //     <thead>
  //       <tr><th>Item</th><th>Qty</th></tr>
  //     </thead>
  //     <tbody>
  //       ${toArray(kotOrder?.items)
  //         .map(
  //           (i) => `
  //         <tr>
  //           <td>${i.name}</td>
  //           <td>${i.quantity || 1}</td>
  //         </tr>`
  //         )
  //         .join("")}
  //     </tbody>
  //   </table>

  //   <!-- Footer -->
  //   <div class="footer">*** Send to Kitchen ***</div>
  // </div>
  // </body>
  // </html>
  // `;
  //       const iframe = document.createElement("iframe");
  //       iframe.style.position = "fixed";
  //       iframe.style.right = "0";
  //       iframe.style.bottom = "0";
  //       iframe.style.width = "0";
  //       iframe.style.height = "0";
  //       iframe.style.border = "0";
  //       document.body.appendChild(iframe);

  //       iframe.onload = () => {
  //         const doc = iframe.contentDocument || iframe.contentWindow.document;
  //         doc.open();
  //         doc.write(printHTML);
  //         doc.close();

  //         // wait for rendering to complete before printing
  //         setTimeout(() => {
  //           iframe.contentWindow.focus();
  //           iframe.contentWindow.print();
  //           setTimeout(() => document.body.removeChild(iframe), 1000);
  //         }, 500);
  //       };

  //       // Force-load about:blank first
  //       iframe.src = "about:blank";
  //     },
  //     [settings, kotPrintSize]
  //   );

  const silentPrintKOT = useCallback(
    (order) => {
      if (!order || !order.items || order.items.length === 0) return;

      // console.log(settings.general.restaurantName)
      // // Dynamic company info from settings
      // const COMPANY_NAME = settings?.general?.restaurantName || "";
      // const COMPANY_GST = settings?.general?.gst || "";
      // const COMPANY_FSSAI = settings?.general?.fssai || "";
      // const COMPANY_ADDRESS_LINES = settings?.general?.addressLines || ""
      //          COMPANY INFO – use settings or fallback
    // ────────────────────────────────────────────────
    const companyNameMain   = settings?.general?.restaurantName   || "Hotel-POS";
    const companyAddress    = settings?.general?.address          || "S.NO. 414, VILLAGE-JALISANA, TALUKA-MANDAL, DIST-AHMEDABAD 382130 GUJARAT INDIA";
    const companyPhone      = settings?.general?.phone            || "951625-62828";
    const companyGST        = settings?.general?.gst              || "";
    const COMPANY_FSSAI      = settings?.general?.fssai            || "";

      const formatPrice = (val) => Number(val || 0).toFixed(2);

      const formatDateTime = () => {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
      };

      // Dynamic order fields
      const saleNo =
        order.saleNo || order.billNumber || order._id?.slice(-10) || "N/A";
      // const cardNo = order.cardNo || "1078031(0)";
      const deliveryCallNo =
        order.deliveryCallNo || order._id?.slice(-2) || "38";

      // 1️⃣ NEW SUBTOTAL — includes each item's own tax
      const subtotalWithItemTax = order.items.reduce((sum, i) => {
        const qty = Number(i.quantity || 1);
        const rate = Number(i.price || 0);
        const sub = qty * rate;

        const taxPercent = Number(i.tax || 0);
        const itemTaxAmount = (sub * taxPercent) / 100;

        return sum + sub + itemTaxAmount;
      }, 0);
      // Subtotal (before tax)
      const subtotal = order.items.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1),
        0
      );

      // Item tax total
      const totalItemTax = order.items.reduce((sum, i) => {
        const qty = Number(i.quantity || 1);
        const rate = Number(i.price || 0);
        const sub = qty * rate;
        const taxPercent = Number(i.tax || 0);
        return sum + (sub * taxPercent) / 100;
      }, 0);

      // Split item tax into CGST/SGST
      const itemCGST = totalItemTax / 2;
      const itemSGST = totalItemTax / 2;
      const itemTaxPercent = order.items.length > 0 ? Number(order.items[0].tax || 0) : 0;
      const cgstPercent = (itemTaxPercent / 2).toFixed(1);
      const sgstPercent = (itemTaxPercent / 2).toFixed(1);

      // 2️⃣ Global tax lines (unchanged logic)
      // const taxLines = taxes.map((tax) => {
      //   const taxRate = Number(tax.taxRate || 0);
      //   const amount =
      //     tax.type === "percentage" ? (subtotal * taxRate) / 100 : taxRate;

      //   return {
      //     name: tax.name || "Tax",
      //     rate: taxRate,
      //     amount,
      //     isPercentage: tax.type === "percentage",
      //   };
      // });

      // 3️⃣ Total global tax
      // const totalTax = taxLines.reduce((s, t) => s + t.amount, 0);

      // 4️⃣ FINAL GRAND TOTAL
      const grandTotal = subtotalWithItemTax ;

      //  const taxLines = taxes.map(tax => {
      //       const taxRate = Number(tax.taxRate || 0);
      //       const amount = tax.type === "percentage"
      //         ? (subtotal * taxRate) / 100
      //         : taxRate;

      //       return {
      //         name: tax.name || "Tax",
      //         rate: taxRate,
      //         amount,
      //         isPercentage: tax.type === "percentage"
      //       };
      //     });

      //     const totalTax = taxLines.reduce((s, t) => s + t.amount, 0);
      //     const grandTotal = subtotal + totalTax;

      // Items HTML
      const itemsHTML = order.items
        .map((i) => {
          const name = i.name || "Unknown";
          const qty = Number(i.quantity || 1);
          const rate = Number(i.price || 0);

          // Use the tax percentage defined on the item itself
          const itemTaxPercentage = Number(i.tax || 0); // e.g., "5" → 5%
          const subtotal = rate * qty;
          const taxAmount = (subtotal * itemTaxPercentage) / 100;
          const total = subtotal + taxAmount;

          return `
        <tr>
          <td style="padding:2px 0;">${name}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${formatPrice(rate)}</td>
          <td style="text-align:right;">${formatPrice(taxAmount)}</td>
          <td style="text-align:right;">${formatPrice(total)}</td>
        </tr>`;
        })
        .join("");

      // Tax Summary HTML (dynamic!)
      // const taxSummaryHTML = taxLines
      //   .map((tax) => {
      //     return `<div><span>${tax.name} @ ${tax.rate}${
      //       tax.isPercentage ? "%" : ""
      //     } :</span><span>${formatPrice(tax.amount)}</span></div>`;
      //   })
      //   .join("");
      const taxSummaryHTML = `
        <div class="tax-summary">
          <div class="bold">Tax Collection Summary</div>
          ${totalItemTax > 0 ? `
            <div class="total"><span>CGST ${cgstPercent > 0 ? `(${cgstPercent}%)` : ''}:</span><span>${formatPrice(itemCGST)}</span></div>
            <div class="total"><span>SGST ${sgstPercent > 0 ? `(${sgstPercent}%)` : ''}:</span><span>${formatPrice(itemSGST)}</span></div>
          ` : ''}
          <div class="border-t border-dashed mt-2 pt-1 font-bold">
            <div><span>Total Tax:</span><span>${formatPrice(totalItemTax)}</span></div>
          </div>
        </div>
      `;

      const headerHTML = `
      <div class="center" style="line-height:1.3;border-bottom:1px solid #000; margin-bottom:6px;">
        <div class="bold" style="font-size:13px;">${companyNameMain}</div>
        <div style="font-size:10px;">${companyAddress}</div>
        <div class="center small">☎ ${companyPhone ||settings?.general?.phone} |✉️ ${settings?.general?.email || 'contact@hotel-pos.com'}</div>
      </div>
    `;
      const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>GST Invoice - KOT</title>
  <style>
    body { font-family: monospace; font-size: 11px; width: 80mm; margin: 0 auto; padding: 5px 8px; line-height: 1.3; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .small { font-size: 9px; border-bottom:1px solid #000 }
    .header-line { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 5px; }
     th { border-bottom: 1px solid #000; }
    th, td { padding: 1px 0; }
    th:nth-child(2), td:nth-child(2) { text-align: center; width: 10%; }
    th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4), th:nth-child(5), td:nth-child(5) { text-align: right; width: 15%; }
    .totals, .tax-summary { margin-top: 4px; border-top: 1px solid #000; padding-top: 2px; }
    .totals, .gst-summary { margin-top: 4px; border-top: 1px solid #000; padding-top: 2px; }
    .totals div, .tax-summary div { display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px; }
    .totals div, .gst-summary div { border-bottom:2px solid #000,margin: 2px 0; font-size: 10px; }
    .footer { margin-top: 10px; font-size: 9px; text-align: center; line-height: 1.4; }
  </style>
</head>
<body>

   ${headerHTML}
  <div class="divider"></div>

  <div class="divider"></div>
  <div class="small">
    <div>Date : ${formatDateTime()}</div>
    <div>Sale No : ${saleNo}</div>
  </div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Tax</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="totals">
    <div>
      <span>Subtotal :</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
  </div>

  ${totalItemTax > 0 ? `
    <div class="tax-summary">
      <div class="bold">Tax Collection Summary</div>
      <div>
        <span>CGST (${cgstPercent}%)</span>
        <span>${formatPrice(itemCGST)}</span>
      </div>
      <div>
        <span>SGST (${sgstPercent}%)</span>
        <span>${formatPrice(itemSGST)}</span>
      </div>
      <div class="divider"></div>
      <div class="bold">
        <span>Total Tax :</span>
        <span>${formatPrice(totalItemTax)}</span>
      </div>
    </div>
  ` : ''}

  <div class="totals">
    <div>
      <span>Total :</span>
      <span>${formatPrice(Math.round(grandTotal))}</span>
    </div>
  </div>

  <div class="gst-summary small">
    <div><span>GST No :</span><span>${COMPANY_GST}</span></div>
  </div>

  <div class="footer">
    <div>FSSAI : ${COMPANY_FSSAI}</div>
    <div>Delivery Call No : ${deliveryCallNo}</div>
  </div>

</body>

</html>`;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      iframe.onload = () => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(printHTML);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 600);
      };
      iframe.src = "about:blank";
    },
    [settings, taxes] // ← Now depends on real taxes!
  );

  //--------------------------Last Successful Code--------------------------
  // const silentPrintKOT = useCallback(
  //   (order) => {
  //     if (!order) return;

  //     const isA4 = false;

  //     const formatPrice = (val) => Number(val || 0).toFixed(2);

  //     const itemsHTML = toArray(order?.items).map(i => {
  //       const itemPrice = Number(i.price || 0);
  //       const qty = Number(i.quantity || 1);
  //       const taxRate = Number(i.tax || 0) / 100;
  //       const itemTotal = itemPrice * qty;
  //       const taxAmount = itemTotal * taxRate;
  //       return `<tr style="border-bottom:1px solid #333;"><td>${i.name}</td><td style="text-align:right;">${qty}</td><td style="text-align:right;">${formatPrice(itemPrice)}</td><td style="text-align:right;">${formatPrice(taxAmount)}</td><td style="text-align:right;">${formatPrice(itemTotal + taxAmount)}</td></tr>`;
  //     }).join("");

  //     const totalItems = toArray(order?.items).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  //     const subtotal = toArray(order?.items).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  //     const cgstAmount = subtotal * 0.025;
  //     const sgstAmount = subtotal * 0.025;

  //     const printHTML = `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //     <meta charset="UTF-8">
  //     <title>KOT</title>
  //     <style>
  //     body { margin:0; font-family: monospace; }
  //     .kot {
  //         width:80mm; padding:8mm; font-size:11px; line-height:1.3;
  //     }
  //     .header { text-align:center; margin-bottom:8px; }
  //     .company-name { font-weight:bold; font-size:13px; margin:2px 0; }
  //     .company-info { font-size:10px; margin:0; }
  //     .section-title { text-align:center; font-weight:bold; margin:8px 0 4px; border-bottom:1px solid #000; padding-bottom:2px; }
  //     .date-info { display:flex; justify-content:space-between; font-size:10px; margin:4px 0; border-bottom:1px solid #333; padding-bottom:2px; }
  //     .items-table { width:100%; border-collapse:collapse; margin:4px 0; font-size:10px; }
  //     .items-header { font-weight:bold; border-bottom:1px solid #000; }
  //     .items-header td { padding:2px; text-align:right; }
  //     .items-header td:first-child { text-align:left; }
  //     .items-header td:nth-child(2) { width:12%; }
  //     .items-header td:nth-child(3) { width:18%; }
  //     .items-header td:nth-child(4) { width:14%; }
  //     .items-header td:nth-child(5) { width:16%; }
  //     .tax-summary { font-size:10px; margin:4px 0; border-bottom:1px solid #333; padding:2px 0; }
  //     .tax-line { display:flex; justify-content:space-between; }
  //     .footer { text-align:center; margin-top:8px; font-weight:bold; font-size:10px; }
  //     @media print {
  //         @page { size: 80mm auto; margin: 5mm; }
  //     }
  //     </style>
  // </head>
  // <body>
  //     <div class="kot">
  //     <div class="header">
  //         <div class="company-info">GST INVOICE</div>
  //         <div class="company-name">${COMPANY_NAME}</div>
  //         <div class="company-info">RESTAURANT & BAR</div>
  //         <div class="company-info">ACROPOLIS5</div>
  //         <div class="company-info">THE FOOD COURT</div>
  //         <div class="company-info">KOLKATA - 700107, WEST BENGAL, INDIA</div>
  //     </div>
  //     <div class="date-info">
  //         <span>Date ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}</span>
  //         <span>KOT</span>
  //     </div>
  //     <div class="date-info">
  //         <span>Sale No: ${order?._id?.slice(-6) || 'N/A'}</span>
  //         <span>${order.orderType === "room-service" ? `Room ${order.customerInfo?.room || "-"}` : `Table ${order.customerInfo?.table || "-"}`}</span>
  //     </div>
  //     <table class="items-table">
  //         <tr class="items-header">
  //             <td>Item</td>
  //             <td>Qty</td>
  //             <td>Rate</td>
  //             <td>Tax</td>
  //             <td>Total</td>
  //         </tr>
  //         ${itemsHTML}
  //     </table>
  //     <div class="date-info">
  //         <span>Total Items:</span>
  //         <span>${totalItems}</span>
  //     </div>
  //     <div class="tax-summary">
  //         <div style="font-weight:bold; margin-bottom:2px;">Tax Collection Summary</div>
  //         <div class="tax-line">
  //             <span>CGST @ 2.50%:</span>
  //             <span>${formatPrice(cgstAmount)}</span>
  //         </div>
  //         <div class="tax-line">
  //             <span>SGST @ 2.50%:</span>
  //             <span>${formatPrice(sgstAmount)}</span>
  //         </div>
  //     </div>
  //     <div class="footer">*** KITCHEN ORDER TICKET ***</div>
  //     <div style="text-align:center; font-size:9px; margin-top:4px;">${COMPANY_GST}</div>
  //     <div style="text-align:center; font-size:9px;">Delivery Call No: ${order?._id?.slice(-2) || 'N/A'}</div>
  //     </div>
  // </body>
  // </html>
  // `;

  //     const iframe = document.createElement("iframe");
  //     iframe.style.position = "fixed";
  //     iframe.style.right = "0";
  //     iframe.style.bottom = "0";
  //     iframe.style.width = "0";
  //     iframe.style.height = "0";
  //     iframe.style.border = "0";
  //     document.body.appendChild(iframe);

  //     iframe.onload = () => {
  //       const doc = iframe.contentDocument || iframe.contentWindow.document;
  //       doc.open();
  //       doc.write(printHTML);
  //       doc.close();

  //       setTimeout(() => {
  //         iframe.contentWindow.focus();
  //         iframe.contentWindow.print();
  //         setTimeout(() => document.body.removeChild(iframe), 1000);
  //       }, 500);
  //     };

  //     iframe.src = "about:blank";
  //   },
  //   []
  // );

  //---------------------3 days ago -----------------------------
  // const silentPrintKOT = useCallback(
  //   (order) => {
  //     if (!order || !order.items || order.items.length === 0) {
  //       console.warn("KOT ignored – no items");
  //       return;
  //     }

  //     // Force 80mm thermal printer size
  //     const tableOrRoom =
  //       order.orderType === "room-service"
  //         ? order.customerInfo?.room || "-"
  //         : order.customerInfo?.table || "-";

  //     const printHTML = `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //   <meta charset="UTF-8">
  //   <title>KOT</title>
  //   <style>
  //     body { margin:0; padding:8mm; font-family: Arial, sans-serif; width:80mm; }
  //     .kot { width:70mm; margin:0 auto; font-size:13px; line-height:1.4; }
  //     .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
  //     .header img { height:45px; object-fit:contain; }
  //     .header-right { text-align:right; }
  //     .header-right h1 { margin:0; font-size:15px; font-weight:bold; }
  //     .header-right p { margin:3px 0; font-size:11px; }
  //     h2 { text-align:center; font-size:16px; font-weight:bold; margin:12px 0; }
  //     .details p { margin:4px 0; font-size:12px; }
  //     .details strong { display:inline-block; width:80px; }
  //     table { width:100%; border-collapse:collapse; margin-top:10px; font-size:13px; }
  //     th, td { padding:4px 0; border-bottom:1px solid #000; }
  //     th { font-weight:bold; }
  //     td:last-child { text-align:center; }
  //     .footer { text-align:center; margin-top:12px; font-weight:bold; font-size:12px; }
  //     @media print {
  //       @page { size: 80mm 150mm; margin:0; }
  //       body { -webkit-print-color-adjust: exact; }
  //     }
  //   </style>
  // </head>
  // <body>
  // <div class="kot">
  //   <div class="header">
  //     <img src="${LOGO_URL}" alt="Logo"/>
  //     <div class="header-right">
  //       <h1>${settings?.general?.restaurantName || "Restaurant"}</h1>
  //       <p>${settings?.general?.address || ""}</p>
  //       <p>${settings?.general?.phone || ""}</p>
  //     </div>
  //   </div>
  //   <h2>KITCHEN ORDER TICKET</h2>
  //   <div class="details">
  //     <p><strong>Order Type:</strong> ${order.orderType}</p>
  //     <p><strong>${order.orderType === "room-service" ? "Room" : "Table"}:</strong> ${tableOrRoom}</p>
  //     <p><strong>Time:</strong> ${new Date().toLocaleString("en-GB", {
  //       day: "2-digit",
  //       month: "2-digit",
  //       year: "numeric",
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     })}</p>
  //   </div>
  //   <table>
  //     <thead><tr><th>Item</th><th>Qty</th></tr></thead>
  //     <tbody>
  //       ${toArray(order.items)
  //         .map(
  //           (i) => `<tr><td>${i.name}</td><td>${i.quantity || 1}</td></tr>`
  //         )
  //         .join("")}
  //     </tbody>
  //   </table>
  //   <div class="footer">*** Send to Kitchen ***</div>
  // </div>
  // </body>
  // </html>`;

  //     const iframe = document.createElement("iframe");
  //     iframe.style.position = "fixed";
  //     iframe.style.right = "0";
  //     iframe.style.bottom = "0";
  //     iframe.style.width = "0px";
  //     iframe.style.height = "0px";
  //     iframe.style.border = "none";
  //     document.body.appendChild(iframe);

  //     const loadHandler = () => {
  //       try {
  //         const doc = iframe.contentDocument || iframe.contentWindow.document;
  //         doc.open();
  //         doc.write(printHTML);
  //         doc.close();

  //         // Extra delay to ensure images/fonts load
  //         setTimeout(() => {
  //           iframe.contentWindow.focus();
  //           iframe.contentWindow.print();

  //           // Clean up after printing
  //           setTimeout(() => {
  //             if (document.body.contains(iframe)) {
  //               document.body.removeChild(iframe);
  //             }
  //           }, 1000);
  //         }, 800);
  //       } catch (err) {
  //         console.error("Print error:", err);
  //         if (document.body.contains(iframe)) {
  //           document.body.removeChild(iframe);
  //         }
  //       }
  //     };

  //     iframe.onload = loadHandler;
  //     iframe.src = "about:blank";
  //   },
  //   [settings] // ← ONLY settings (and it's stable)
  // );

  const handlePrint = useCallback(() => {
    if (!kotOrder) return;
    downloadKOT(kotOrder); // <-- reuse the same PDF generator
    setShowKOTModal(false);
  }, [kotOrder, downloadKOT]);
  // const handlePrint = useCallback(() => {
  //   const printHTML = `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //   <meta charset="UTF-8">
  //   <title>KOT</title>
  //   <style>
  //     body { margin:0; font-family: Poppins; }
  //     .kot {
  //       ${
  //         isA4
  //           ? "width:190mm; margin:20mm auto; padding:15mm; font-size:14px;"
  //           : "width:80mm; padding:8mm; font-size:13px;"
  //       }
  //     }

  //     /* --- Header Layout --- */
  //     .header {
  //       display: flex;
  //       align-items: center;
  //       justify-content: space-between;
  //       margin-bottom: 10px;
  //     }

  //     .logo {
  //       height:${isA4 ? "50px" : "35px"};
  //       width:auto;
  //       object-fit: contain;
  //     }

  //     .company-info {
  //       text-align: right;
  //       flex: 1;
  //       margin-left: 10px;
  //     }

  //     h1 {
  //       margin: 0;
  //       font-size:${isA4 ? "20px" : "16px"};
  //       font-weight:bold;
  //     }

  //     .gst, .address, .contact {
  //       margin: 2px 0;
  //       font-size:${isA4 ? "12px" : "10px"};
  //       color: #555;
  //     }

  //     h2 { text-align:center; margin:8px 0; font-size:${
  //       isA4 ? "18px" : "16px"
  //     }; }
  //     p { margin:4px 0; font-size:${isA4 ? "14px" : "13px"}; }
  //     table { width:100%; border-collapse:collapse; margin-top:10px; }
  //     th, td {
  //       border-bottom:1px solid #ccc;
  //       padding:${isA4 ? "8px 4px" : "4px 2px"};
  //       text-align:left;
  //       font-size:${isA4 ? "14px" : "13px"};
  //     }
  //     .footer {
  //       text-align:center;
  //       margin-top:12px;
  //       font-weight:bold;
  //       font-size:${isA4 ? "12px" : "11px"};
  //     }

  //     @media print {
  //       ${
  //         isA4
  //           ? "@page { size: A4; margin: 10mm; }"
  //           : "@page { size: 80mm auto; margin: 5mm; }"
  //       }
  //     }
  //   </style>
  // </head>
  // <body>
  //   <div class="kot">
  //     <div class="header">
  //       <img src="${LOGO_URL}" alt="Logo" class="logo" />
  //       <div class="company-info">
  //         <h1>${settings?.general?.restaurantName}</h1>
  //         <p class="gst">${settings?.general?.gst}</p>
  //         <p class="address">${settings?.general?.address}</p>
  //         <p class="contact">${settings?.general?.phone}</p>
  //       </div>
  //     </div>

  //     <h2>KITCHEN ORDER TICKET</h2>
  //     <p><strong>Order Type:</strong> ${kotOrder.orderType}</p>
  //     <p><strong>${
  //       kotOrder.orderType === "room-service" ? "Room" : "Table"
  //     }:</strong>
  //       ${kotOrder.customerInfo?.room || kotOrder.customerInfo?.table || "-"}
  //     </p>
  //     <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>

  //     <table>
  //       <thead><tr><th>Item</th><th>Qty</th></tr></thead>
  //       <tbody>
  //         ${toArray(kotOrder?.items)
  //           .map(
  //             (i) => `<tr><td>${i.name}</td><td>${i.quantity || 1}</td></tr>`
  //           )
  //           .join("")}
  //       </tbody>
  //     </table>

  //     <div class="footer">*** Send to Kitchen ***</div>
  //   </div>
  // </body>
  // </html>
  // `;
  //   const win = window.open("", "_blank", "width=800,height=600");
  //   if (!win) return alert("Allow popups to print.");
  //   win.document.write(printHTML);
  //   win.document.close();
  //   win.onload = () =>
  //     setTimeout(() => {
  //       win.focus();
  //       win.print();
  //     }, 500);
  // }, [kotOrder, kotPrintSize]);

  // const fetchMenuItems = useCallback(
  //   async (append = false, cursorParam = cursor) => {
  //     if (!token) {
  //       setLoadingMenu(true);
  //       return;
  //     }
  //     try {
  //       setLoadingMenu(!append);
  //       const queryParams = new URLSearchParams({
  //         searchTerm: debouncedSearchTerm,
  //         category: selectedCategory,
  //         itemType: itemType,
  //         // cursor: cursorParam !== undefined ? cursorParam : cursor,
  //         cursor: cursorParam ?? "", // Use empty string if undefined
  //       });
  //       const response = await fetch(`/api/menu?${queryParams}&source=orders`, {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //       const data = await response.json();
  //       const filteredData = data.items
  //         ? data.items.filter((item) => item.available)
  //         : [];
  //       const combined = append
  //         ? [...menuItems, ...filteredData]
  //         : filteredData;
  //       if (append) {
  //         setMenuItems((prev) => {
  //           const uniqueMenu = Array.from(
  //             new Map(combined.map((item) => [item._id, item])).values()
  //           );
  //           return uniqueMenu;
  //         });
  //       } else {
  //         setMenuItems(filteredData);
  //       }
  //       setCursor(data.nextCursor || "");
  //       setHasMore(!!data.nextCursor);
  //     } catch (error) {
  //       console.error("Error fetching menu items:", error);
  //     } finally {
  //       setLoadingMenu(false);
  //     }
  //   },
  //   [debouncedSearchTerm, selectedCategory, itemType, token, showAlert, cursor]
  // );
  // === FETCH MENU ITEMS WITH CURSOR-BASED INFINITE SCROLL ===
// const fetchMenuItems = useCallback(
//   async (append = false, nextCursor = cursor) => {
//     if (!token) {
//       setLoadingMenu(true);
//       return;
//     }

//     try {
//       setLoadingMenu(!append); // show loader only on first load

//       // Always use cursor-based pagination
//       const queryParams = new URLSearchParams({
//         searchTerm: debouncedSearchTerm,
//         category: selectedCategory,
//         itemType: itemType,
//       });

//       // Add cursor only if we are appending (not first load)
//       if (append && nextCursor) {
//         queryParams.append("cursor", nextCursor);
//       }

//       const url = `/api/menu?${queryParams.toString()}&source=orders`;

//       const response = await fetch(url, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to fetch");

//       const data = await response.json();

//       const filteredData = data.items
//         ? data.items.filter((item) => item.available)
//         : [];

//       if (append) {
//         setMenuItems((prev) => {
//           // De-duplicate by _id
//           const existingIds = new Set(prev.map((i) => i._id));
//           const newItems = filteredData.filter((i) => !existingIds.has(i._id));
//           return [...prev, ...newItems];
//         });
//       } else {
//         setMenuItems(filteredData);
//       }

//       // Update cursor & hasMore from cursor-based response
//       setCursor(data.nextCursor || "");
//       setHasMore(!!data.nextCursor);
//     } catch (error) {
//       console.error("Error fetching menu items:", error);
//       showAlert("error", "Error", "Failed to load menu items", [{ text: "OK" }]);
//     } finally {
//       setLoadingMenu(false);
//     }
//   },
//   [debouncedSearchTerm, selectedCategory, itemType, token, cursor, showAlert]
// );

const fetchMenuItems = useCallback(
  async (append = false, nextCursor = "") => {
    if (!token) return;

    try {
      setLoadingMenu(!append);

      const params = new URLSearchParams({
        searchTerm: debouncedSearchTerm,
        category: selectedCategory === "all" ? "" : selectedCategory,
        itemType: itemType === "all" ? "" : itemType,
        limit: "20",
      });

      if (append && nextCursor) {
        params.set("cursor", nextCursor);
      }

      const url = `/api/menu?${params.toString()}&source=orders`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed");

      const data = await response.json();

      const newItems = data.items || [];

      if (append) {
        setMenuItems((prev) => {
          const existingIds = new Set(prev.map((i) => i._id));
          const filteredNew = newItems.filter((i) => !existingIds.has(i._id));
          return [...prev, ...filteredNew];
        });
      } else {
        setMenuItems(newItems);
      }

      setCursor(data.nextCursor || "");
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingMenu(false);
    }
  },
  [debouncedSearchTerm, selectedCategory, itemType, token]
);

// === INITIAL LOAD (reset everything) ===
useEffect(() => {
  setMenuItems([]);
  setCursor("");
  setHasMore(true);
  fetchMenuItems(false, ""); // fresh load
}, [debouncedSearchTerm, selectedCategory, itemType, token, fetchMenuItems]);

// === INFINITE SCROLL OBSERVER ===
// useEffect(() => {
//   const loader = loaderRef.current;
//   if (!loader || !hasMore || loadingMenu) return;

//   const observer = new IntersectionObserver(
//     (entries) => {
//       if (entries[0].isIntersecting && hasMore && !loadingMenu) {
//         fetchMenuItems(true, cursor); // append using current cursor
//       }
//     },
//     { threshold: 0.1 }
//   );

//   observer.observe(loader);

//   return () => {
//     if (loader) observer.unobserve(loader);
//   };
// }, [hasMore, loadingMenu, cursor, fetchMenuItems]);

useEffect(() => {
  const loader = loaderRef.current;
  if (!loader || !hasMore || loadingMenu) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMenu) {
        fetchMenuItems(true, cursor); // ← PASS CURRENT CURSOR HERE
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(loader);

  return () => {
    if (loader) observer.unobserve(loader);
  };
}, [hasMore, loadingMenu, cursor, fetchMenuItems]); // ← ADD cursor to deps!
  useEffect(() => {
    setMenuItems([]);
    setCursor("");
    setHasMore(true);
    fetchMenuItems(false, ""); // fresh load
  }, [debouncedSearchTerm, selectedCategory, itemType, token, fetchMenuItems]);

  const fetchCategories = async () => {
    if (!token) {
      setLoadingCategories(false);
      return;
    }
    try {
      setLoadingCategories(true);
      const response = await fetch("/api/categories", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setCategories(data);
      setSelectedCategory("all");
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem._id === item._id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, quantity) => {
    if (quantity === 0) {
      setCart(cart.filter((item) => item._id !== id));
    } else {
      setCart(
        cart.map((item) => (item._id === id ? { ...item, quantity } : item))
      );
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const getSubtotal = () =>
    cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // const fetchTaxes = async () => {
  //   if (!token) {
  //     setLoadingTaxes(true);
  //     return;
  //   }
  //   try {
  //     setLoadingTaxes(true);
  //     const response = await fetch("/api/taxes?active=true", {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     const data = await response.json();
  //     setTaxes(Array.isArray(data) ? data : []);
  //   } catch (error) {
  //     console.error("Error fetching taxes:", error);
  //     setTaxes([]);
  //   } finally {
  //     setLoadingTaxes(false);
  //   }
  // };

  const getTaxLines = () => {
    const subtotal = getSubtotal();
    return taxes.map((tax) => {
      const isPercentage = tax.type === "percentage";
      const amount = isPercentage
        ? (subtotal * Number(tax.taxRate || 0)) / 100
        : Number(tax.taxRate || 0);
      return {
        id: tax._id,
        name:
          tax.name ||
          (isPercentage ? `Tax ${tax.taxRate}%` : `Tax ₹${tax.taxRate}`),
        label: isPercentage
          ? `${tax.name || "Tax"} ${tax.taxRate}%`
          : `${tax.name || "Tax"}`,
        amount,
      };
    });
  };

  // const generateBill = async (orderId, status) => {
  //   try {
  //     const response = await fetch("/api/bills/generate", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ orderId, status }),
  //     });
  //     if (response.ok) {
  //       const bill = await response.json();
  //       showAlert("success", "Bill Generated", `Bill #${bill.billNumber}`, [
  //         { text: "OK" },
  //       ]);
  //     }
  //   } catch (error) {
  //     console.error("Error generating bill:", error);
  //   }
  // };

  useEffect(() => {
    const finalAmount = cart.reduce(
      (acc, item) => {
        const itemTax = ((item.price * (item.tax || 0)) / 100) * item.quantity;
        const itemTotal = item.price * item.quantity + itemTax;
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

  const getTotalTaxAmount = () =>
    getTaxLines().reduce((sum, t) => sum + t.amount, 0);
  const getTotalAmount = () => getSubtotal() ;

  //     const handleSubmitOrder = async () => {
  //       if (cart.length === 0) {
  //         showAlert(
  //           "warning",
  //           "Cart is empty",
  //           "Please add items to the cart before placing an order.",
  //           [{ text: "Okay" }]
  //         );
  //         return;
  //       }
  //       if (!customerInfo.name || !customerInfo.phone) {
  //         showAlert(
  //           "warning",
  //           "Incomplete Customer Information",
  //           "Please fill in all customer information fields.",
  //           [{ text: "Okay" }]
  //         );
  //         return;
  //       }
  //       setShowLoader(true);
  //       try {
  //         const subtotal = getSubtotal();
  //         const taxResponse = await fetch("/api/taxes?active=true");
  //         const taxes = await taxResponse.json();
  //         let totalTaxAmount = 0;
  //         const appliedTaxes = taxes.map((tax) => {
  //           let taxAmount =
  //             tax.type === "percentage" ? (subtotal * tax.taxRate) / 100 : tax.taxRate;
  //           totalTaxAmount += taxAmount;
  //           return { ...tax, amount: taxAmount.toFixed(2) };
  //         });
  //         const orderData = {
  //           items: cart,
  //           customerInfo: { ...customerInfo, table: tableNumber },
  //           orderType,
  //           paymentMethod: paymentMethod,
  //           subtotal: subtotal.toFixed(2),
  //           taxes: appliedTaxes,
  //           itemTaxes: onlyTax,
  //           totalTaxAmount: totalTaxAmount.toFixed(2),
  //           totalAmount: Number(getTotalAmount().toFixed(0)) + Number(onlyTax),
  //           status: "pending",
  //           paymentStatus: "unpaid",
  //           createdAt: new Date(),
  //         };

  //         const response = await fetch("/api/orders", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify(orderData),
  //         });
  //         if (response.ok) {
  //           showAlert(
  //             "success",
  //             "Order Placed",
  //             "Your order has been placed successfully!",
  //             [{ text: "Okay" }]
  //           );
  //           const createdOrder = await response.json();
  //           // await generateBill(createdOrder._id.toString(), "unpaid")
  //           if (createdOrder && createdOrder._id) {
  //             await generateBill(createdOrder._id.toString(), "unpaid");
  //           } else {
  //             console.warn("Order created but _id missing:", createdOrder);
  //           }

  //           // Inside handleSubmitOrder, after response
  // const { partialAlerts } = await response.json();

  // if (partialAlerts?.length > 0) {
  //   const messages = partialAlerts.map(a =>
  //     `${a.name}: Only ${a.available} available (you requested ${a.requested})`
  //   ).join("\n");

  //   showAlert(
  //     "warning",
  //     "Partial Order",
  //     `Some items were reduced due to low stock:\n\n${messages}\n\nYour order has been adjusted.`,
  //     [{ text: "OK" }]
  //   );
  // }
  //           setOrderPlaced(true);
  //           setLatestOrder(orderData);
  //           generateKOT(orderData);
  //           setCart([]);
  //           setCustomerInfo({ name: "", room: "", phone: "", table: "" });
  //           setShowCustomerForm(false);
  //         }
  //       } catch (error) {
  //         console.error("Error placing order:", error);
  //         alert("Error placing order");
  //       } finally {
  //         setShowLoader(false);
  //       }
  //     };

  // const handleSubmitOrder = async () => {
  //   // === CASE 1: User is in Customer Form → Try to Place Order ===
  //   if (showCustomerForm) {
  //     if (cart.length === 0) {
  //       showAlert("warning", "Cart is empty", "Please add items to the cart.", [
  //         { text: "Okay" },
  //       ]);
  //       return;
  //     }

  //     if (!customerInfo.name) {
  //       showAlert(
  //         "warning",
  //         "Incomplete Info",
  //         "Please fill customer details.",
  //         [{ text: "Okay" }]
  //       );
  //       return;
  //     }

  //     setShowLoader(true);

  //     try {
  //       const subtotal = getSubtotal();
  //       const taxResponse = await fetch("/api/taxes?active=true");
  //       const taxes = await taxResponse.json();
  //       let totalTaxAmount = 0;
  //       const appliedTaxes = taxes.map((tax) => {
  //         const amount =
  //           tax.type === "percentage"
  //             ? (subtotal * tax.taxRate) / 100
  //             : tax.taxRate;
  //         totalTaxAmount += amount;
  //         return { ...tax, amount: amount.toFixed(2) };
  //       });

  //       const orderData = {
  //         items: cart,
  //         customerInfo: { ...customerInfo, table: tableNumber },
  //         orderType,
  //         paymentMethod,
  //         subtotal: subtotal.toFixed(2),
  //         taxes: appliedTaxes,
  //         itemTaxes: onlyTax,
  //         totalTaxAmount: totalTaxAmount.toFixed(2),
  //         totalAmount: Number(getTotalAmount().toFixed(0)) + Number(onlyTax),
  //         status: "pending",
  //         paymentStatus: "unpaid",
  //         createdAt: new Date(),
  //       };

  //       const response = await fetch("/api/orders", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(orderData),
  //       });

  //       const result = await response.json();

  //       if (!response.ok) {
  //         showAlert(
  //           "error",
  //           "Order Failed",
  //           result.error || "Please try again.",
  //           [{ text: "OK" }]
  //         );
  //         setShowLoader(false);
  //         return;
  //       }

  //       const { partialAlerts, order } = result;

  //       // === PARTIAL ORDER DETECTED ===
  //       if (partialAlerts?.length > 0) {
  //         // Update cart with available quantities
  //         const updatedCart = cart
  //           .map((item) => {
  //             const alert = partialAlerts.find((a) => a.name === item.name);
  //             if (alert) return { ...item, quantity: alert.available };
  //             return item;
  //           })
  //           .filter((item) => item.quantity > 0);

  //         setCart(updatedCart);

  //         // Show alert
  //         const messages = partialAlerts
  //           .map(
  //             (a) =>
  //               `${a.name}: Only ${a.available} available (requested ${a.requested})`
  //           )
  //           .join("\n");

  //         showAlert(
  //           "warning",
  //           "Partial Order",
  //           `${messages}\n\nYour cart has been updated. Please review and confirm again.`,
  //           [{ text: "OK" }]
  //         );

  //         // Go back to cart
  //         setShowCustomerForm(false);
  //         setIsPartialMode(true); // Require re-confirmation
  //         setShowLoader(false);
  //         return; // STOP — wait for user to confirm
  //       }

  //       // === FULL ORDER SUCCESS ===
  //       showAlert("success", "Order Placed", "Order placed successfully!", [
  //         { text: "Okay" },
  //       ]);

  //       if (order?._id) {
  //         await generateBill(order._id.toString(), "unpaid");
  //       }

  //       // === AUTO-GENERATE KOT IF ENABLED ===
  //       if (settings?.pos?.autoGenerateKOT) {
  //         generateKOT(order); // <-- now downloads PDF automatically
  //       } else {
  //         setManualKOTOrder(order);
  //         setShowKOTModal(false);
  //       }

  //       setCart([]);
  //       setCustomerInfo({ name: "", room: "", phone: "", table: "" });
  //       setShowCustomerForm(false);
  //       setIsPartialMode(false);
  //       setPartialAlerts(null);
  //     } catch (error) {
  //       console.error("Order error:", error);
  //       showAlert("error", "Error", "Failed to place order.", [{ text: "OK" }]);
  //     } finally {
  //       setShowLoader(false);
  //     }

  //     return;
  //   }

  //   // === CASE 2: User is in Cart → Go to Customer Form ===
  //   if (!showCustomerForm) {
  //     if (isPartialMode) {
  //       // Allow going to form only if partial was handled
  //       setShowCustomerForm(true);
  //     } else {
  //       setShowCustomerForm(true);
  //     }
  //     return;
  //   }
  // };

  const handleSubmitOrder = async () => {
    // === CASE: In Customer Form → Try to Place Order ===
    if (showCustomerForm) {
      if (cart.length === 0) {
        showAlert("warning", "Cart is empty", "Please add items.", [
          { text: "Okay" },
        ]);
        return;
      }
      // if (!customerInfo.name) {
      //   showAlert("warning", "Incomplete Info", "Please fill customer details.", [{ text: "Okay" }]);
      //   return;
      // }
      // === VALIDATE NAME & PHONE BEFORE PLACING ORDER ===
      const nameError = validateName(customerInfo.name);
      const phoneError = validatePhone(customerInfo.phone);

      if (nameError) {
        showAlert("warning", "Invalid Input", nameError, [{ text: "OK" }]);
        return;
      }

      if (phoneError) {
        showAlert("warning", "Invalid Phone", phoneError, [{ text: "OK" }]);
        return;
      }

      setShowLoader(true);

      try {
        // === STEP 1: DRY-RUN (Check stock, NO save) ===
        const dryRunRes = await fetch("/api/orders/dry-run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: cart, isFinalConfirm: false }),
        });

        const { partialAlerts } = await dryRunRes.json();

        // === PARTIAL: Update cart + show alert + go back to cart ===
        if (partialAlerts?.length > 0) {
          const updatedCart = cart
            .map((item) => {
              const alert = partialAlerts.find((a) => a.name === item.name);
              return alert ? { ...item, quantity: alert.available } : item;
            })
            .filter((item) => item.quantity > 0);

          setCart(updatedCart);

          // === BUILD DRAFT ORDER (for final confirm) ===
          const subtotal = updatedCart.reduce(
            (s, i) => s + i.price * i.quantity,
            0
          );
          // const taxResponse = await fetch("/api/taxes?active=true", {
          //   headers: { Authorization: `Bearer ${token}` },
          // });
          // const taxes = await taxResponse.json();
          // let totalTaxAmount = 0;
          // const appliedTaxes = taxes.map((tax) => {
          //   const amount =
          //     tax.type === "percentage"
          //       ? (subtotal * tax.taxRate) / 100
          //       : tax.taxRate;
          //   totalTaxAmount += amount;
          //   return { ...tax, amount: amount.toFixed(2) };
          // });

          const draft = {
            items: updatedCart,
            customerInfo: { ...customerInfo, table: tableNumber },
            orderType,
            paymentMethod,
            subtotal: subtotal.toFixed(2),
            taxes: appliedTaxes,
            itemTaxes: onlyTax,
            totalTaxAmount: totalTaxAmount.toFixed(2),
            totalAmount: Number((subtotal + onlyTax).toFixed(2)),
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: new Date(),
          };

          setDraftOrder(draft);
          setPartialAlerts(partialAlerts);
          setIsPartialMode(true);

          const messages = partialAlerts
            .map(
              (a) =>
                `${a.name}: Only ${a.available} available (requested ${a.requested})`
            )
            .join("\n");

          showAlert(
            "warning",
            "Partial Order",
            `${messages}\n\nCart updated. Please review and confirm.`,
            [{ text: "OK" }]
          );

          setShowCustomerForm(false); // ← Back to cart
          setShowLoader(false);
          return;
        }

        // === NO PARTIAL → Save immediately ===
        const subtotal = getSubtotal();
        // const taxResponse = await fetch("/api/taxes?active=true", {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        // const taxes = await taxResponse.json();
        // let totalTaxAmount = 0;
        // const appliedTaxes = taxes.map((tax) => {
        //   const amount =
        //     tax.type === "percentage"
        //       ? (subtotal * tax.taxRate) / 100
        //       : tax.taxRate;
        //   totalTaxAmount += amount;
        //   return { ...tax, amount: amount.toFixed(2) };
        // });

        // const orderData = {
        //   items: cart,
        //   customerInfo: { ...customerInfo, table: tableNumber },
        //   orderType,
        //   paymentMethod,
        //   subtotal: subtotal.toFixed(2),
        //   taxes: appliedTaxes,
        //   itemTaxes: onlyTax,
        //   totalTaxAmount: totalTaxAmount.toFixed(2),
        //   totalAmount: Number(getTotalAmount().toFixed(0)) + Number(onlyTax),
        //   status: "pending",
        //   paymentStatus: "unpaid",
        //   createdAt: new Date(),
        //   isFinalConfirm: true,
        //   partialOrder: isPartialMode,
        // };

        const orderData = {
          items: cart,
          customerInfo: { ...customerInfo, table: tableNumber },
          tableNumber: tableNumber,
          orderType,
          paymentMethod,

          // CRITICAL: Add these fields
          subtotal: Number(subtotal.toFixed(2)) || 0,
          // taxAmount: Number(totalTaxAmount.toFixed(2)) || 0, // Total tax amount
          itemTaxes: Number(onlyTax.toFixed(2)) || 0, // If you have item-wise tax
          totalAmount: Number((subtotal + onlyTax).toFixed(2)) || 0,

          // This is the array that will show CGST/SGST separately
          // taxes: appliedTaxes, // ← THIS IS WHAT YOU WANT!

          status: "pending",
          paymentStatus: "unpaid",
          isFinalConfirm: true,
          partialOrder: isPartialMode,
        };
        // console.log("Order Data:", orderData);



       let response;
      if (isEditMode && editingOrderId) {
        // === UPDATE EXISTING ORDER ===
        response = await fetch(`/api/orders/${editingOrderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });
      } else {
          response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        showAlert("error", "Order Failed", result.error || "Try again.", [
          { text: "OK" },
        ]);
        setShowLoader(false);
        return;
      }

      // Success handling (same for both create & update)
      showAlert("success", "Success", isEditMode ? "Order updated successfully!" : "Order placed successfully!", [{ text: "OK" }]);

        const { order } = result;
        // ── Better logging ──
console.log("Order created/updated:", {
  isNew: !isEditMode,
  orderId: order?._id,
  total: order?.totalAmount,
  type: order?.orderType
});

        // ────────────────────────────────────────────────
//     ADD PUSH NOTIFICATION HERE — only for NEW orders
// ────────────────────────────────────────────────
if (!isEditMode) {   // ← important: only when creating new order
console.log("Sending push notification for NEW order", order?._id);
  try {
    const pushRes =  await fetch('/api/sendPushNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,           // optional but good
      },
     body: JSON.stringify({
    message: `New order placed! #${order?._id?.slice(-6) || 'new'} • ₹${order?.totalAmount || '?'} • ${order?.orderType || 'standard'}`,
    data: { orderId: order?._id, total: order?.totalAmount, type: order?.orderType }  // Add data
  })
    });
console.log("Push response status:", pushRes.status, pushRes.ok ? "OK" : "Failed");

    if (!pushRes.ok) {
      const errText = await pushRes.text();
      console.error("Push failed:", errText);
    }    // You can .then / .catch if you want to log success/failure, but it's fire-and-forget in most POS systems
  } catch (pushErr) {
    console.log("Orders push");
    console.warn("Push notification failed (non-critical):", pushErr);
    // Do **not** show alert to user — it's secondary feature
  }
}
// ────────────────────────────────────────────────
        // showAlert("success", "Order Placed", "Success!", [{ text: "Okay" }]);
        // if (order?._id) await generateBill(order._id.toString(), "unpaid");

        if (settings?.pos?.autoGenerateKOT) {
          silentPrintKOT(order);
        } else {
          setManualKOTOrder(order);
        }

        // Reset
        setCart([]);
        setCustomerInfo({ name: "", room: "", phone: "", table: "" });
        setShowCustomerForm(false);
        setIsPartialMode(false);
        setDraftOrder(null);
        setIsEditMode(false);
        setEditingOrderId(null);
      } catch (error) {
        console.error("Order error:", error);
        showAlert("error", "Error", "Failed to place order.", [{ text: "OK" }]);
      } finally {
        setShowLoader(false);
      }
      return;
    }

    // === CASE: In Cart → Go to Customer Form ===
    if (!showCustomerForm) {
      setShowCustomerForm(true);
      return;
    }
  };

  const filteredItems = menuItems;

  return (
    //{"manage_orders"}>
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
          <div className="bg-gary-50 flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-600">
              Item Type:
            </span>
            <div className="flex gap-1">
              <button
                className={`px-3 py-1 text-xs border border-gray-300 rounded px-4 py-2 text-xs ${
                  itemType === "all"
                    ? "bg-orange-500 text-white border-orange-500"
                    : ""
                } `}
                onClick={() => setItemType("all")}
              >
                All Items
              </button>
              <button
                className={`px-3 py-1 text-xs border border-gray-300 rounded px-4 py-2 text-xs ${
                  itemType === "kitchen"
                    ? "bg-orange-500 text-white border-orange-500"
                    : ""
                } `}
                onClick={() => setItemType("kitchen")}
              >
                Kitchen Items
              </button>
              <button
                className={`px-3 py-1 text-xs border border-gray-300 rounded px-4 py-2 text-xs ${
                  itemType === "retail"
                    ? "bg-orange-500 text-white border-orange-500"
                    : ""
                } `}
                onClick={() => setItemType("retail")}
              >
                Retail Items
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {orderType === "room-service" ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Room #</span>
                <input
                  type="text"
                  value={customerInfo.room}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, room: e.target.value })
                  }
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
              <span className="text-sm text-gray-500">
                Loading categories...
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex flex-col items-center py-4 px-4 border-b border-gray-100 hover:bg-gray-50 ${
                  selectedCategory === "all"
                    ? "bg-orange-50 border-l-4 border-l-orange-500"
                    : ""
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
                    selectedCategory === category.name
                      ? "bg-orange-50 border-l-4 border-l-orange-500"
                      : ""
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon || "Dish"}</div>
                  <span className="text-xs text-gray-700 text-center">
                    {category.name}
                  </span>
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
                {/* {menuItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative">
                        <img
                          src={
                            item.image ||
                            `/placeholder.svg?height=128&width=200&query=${encodeURIComponent(
                              item.name + " food dish"
                            )}`
                          }
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
                        <h3 className="font-medium text-sm text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            ₹ {item.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-red-500">Tax Exc</span>
                        </div>
                      </div>
                    </div>
                  ))} */}
                {menuItems.map((item) => {
                  const outOfStock = isOutOfStock(item);
                  return (
                    <div
                      key={item._id}
                      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all
          ${
            outOfStock
              ? "opacity-50 grayscale cursor-not-allowed"
              : "hover:shadow-md"
          }`}
                    >
                      {/* Image */}
                      <div className="relative">
                        <img
                          src={
                            item.image ||
                            `/placeholder.svg?height=128&width=200&query=${encodeURIComponent(
                              item.name + " food dish"
                            )}`
                          }
                          alt={item.name}
                          className="w-full h-32 object-cover"
                        />
                        {/* + button – disabled when out of stock */}
                        <button
                          onClick={() => !outOfStock && addToCart(item)}
                          disabled={outOfStock}
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs
              ${
                outOfStock
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
                          title={outOfStock ? "Out of stock" : "Add to cart"}
                        >
                          {outOfStock ? "X" : "+"}
                        </button>
                      </div>

                      {/* Name & price */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            ₹ {item.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-red-500">Tax Exc</span>
                        </div>

                        {/* Stock indicator (optional – nice UX) */}
                        {outOfStock && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            Out of stock
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              <span className="text-sm text-gray-500">
                Loading menu items...
              </span>
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
                  {type === "dine-in"
                    ? "Dine-in"
                    : type === "room-service"
                    ? "Room Service"
                    : "Takeaway"}
                </button>
              ))}
            </div>
          </div>
          {/* Cart Content Area */}
          <div className="flex-1 overflow-y-auto py-3 px-4 custom-scrollbar mb-4">
            {showCustomerForm ? (
              /* Customer Details Form */
              <div className="h-full">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Customer Details
                  </h4>
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
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                  />
                  {orderType === "room-service" && (
                    <input
                      type="text"
                      placeholder="Room Number"
                      value={customerInfo.room}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          room: e.target.value,
                        })
                      }
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
                    {["pending", "cash", "online", "room"].map((method) => (
                      <div key={method} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (method === "online") {
                              setPaymentMethod("online"); // highlight online immediately
                              setOnlineSubMethod("upi"); // default sub-method
                            } else {
                              setPaymentMethod(method);
                              setOnlineSubMethod(null);
                            }
                          }}
                          className={`px-3 py-1 rounded text-xs border ${
                            paymentMethod === method ||
                            (method === "online" &&
                              paymentMethod?.startsWith("online"))
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {method === "pending"
                            ? "Pending"
                            : method === "cash"
                            ? "Cash"
                            : method === "room"
                            ? "Room"
                            : method === "room"
                            ? "Room"
                            : "Online"}
                        </button>

                        {paymentMethod?.startsWith("online") &&
                          method === "online" && (
                            <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-lg z-10">
                              {["upi", "netbanking", "card"].map((sub) => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOnlineSubMethod(sub);
                                    setPaymentMethod(`online-${sub}`);
                                  }}
                                  className={`block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 ${
                                    onlineSubMethod === sub
                                      ? "bg-orange-100 font-medium"
                                      : ""
                                  }`}
                                >
                                  {/* {sub === "upi" ? "UPI" ? "Card" : "Net Banking"} */}
                                  {sub === "upi"
                                    ? "UPI"
                                    : sub === "card"
                                    ? "Card"
                                    : "Net Banking"}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* <div className="flex mt-3 justify-between items-center space-x-2">
                  <div className="flex gap-2">
  {["cash", "card", "online", "room"].map((method) => (
    <div key={method} className="relative">
      <button
        type="button"
        onClick={() => {
          if (method === "online") {
            setPaymentMethod("online");
            setOnlineSubMethod("upi");
          } else {
            setPaymentMethod(method);
            setOnlineSubMethod(null);
          }
        }}
        className={`px-3 py-1 rounded text-xs border ${
          // paymentMethod === method || paymentMethod.startsWith("online")
          (paymentMethod === method) || (method === "online" && paymentMethod.startsWith("online-"))
            ? "bg-orange-500 text-white border-orange-500"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      >
        {method === "cash"
          ? "Cash"
          : method === "card"
          ? "Card"
          : method === "room"
          ? "Room"
          : "Online"}
      </button>

      {paymentMethod === "online" && method === "online" && (
        <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-lg z-10">
          {["upi", "netbanking"].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOnlineSubMethod(sub);
                setPaymentMethod(`online-${sub}`);
              }}
              className={`block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 ${
                onlineSubMethod === sub ? "bg-orange-100 font-medium" : ""
              }`}
            >
              {sub === "upi" ? "UPI" : "Net Banking"}
            </button>
          ))}
        </div>
      )}
    </div>
  ))}

                  </div>
                </div> */}

                {/* {["cash", "card", "online", "room"].map((method) => (
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
                        {method === "cash"
                          ? "Cash"
                          : method === "card"
                          ? "Card"
                          : method === "room"
                          ? "Room"
                          : "Online"}
                      </button>
                    ))} */}
                <div className="mt-2 mb-5">
                  {paymentMethod === "room" && orderType !== "room-service" && (
                    <input
                      type="text"
                      placeholder="Room Number"
                      value={customerInfo.room}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          room: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-sm text-sm"
                    />
                  )}
                </div>
              </div>
            ) : (
              /* Cart Items */
              <>
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Cart is empty
                  </div>
                ) : (
                  cart
                    .slice()
                    .reverse()
                    .map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between py-3 border-b border-gray-100"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            ₹ {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item._id, item.quantity - 1)
                            }
                            className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item._id, item.quantity + 1)
                            }
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
          {/* Item Tax Split into CGST/SGST */}
{onlyTax > 0 && (
  <>
    {/* Assume all items have same tax rate, take first one */}
    {cart.length > 0 && (
      <>
      {(() => {
        const itemTaxPercent = Number(cart[0].tax || 0);
                      const cgstPercent = (itemTaxPercent / 2).toFixed(1);
                      const sgstPercent = (itemTaxPercent / 2).toFixed(1);

                      return (
                        <>
              <div className="flex justify-between">
                <span>CGST (Item)</span>
                <span>₹{(onlyTax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (Item)</span>
                <span>₹{(onlyTax / 2).toFixed(2)}</span>
              </div>
              </>
                      );
                    })()}
      </>
      )}
              {/* <div className="flex justify-between">
                <span>Total Tax</span>
                <span>₹{onlyTax.toFixed(2)}</span>
              </div> */}
            </>
)}
              {/* {loadingTaxes ? (
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>Loading...</span>
                </div>
              ) : (
                getTaxLines().map((tax) => (
                  <div key={tax.id} className="flex justify-between">
                    <span>{tax.label}</span>
                    <span>₹{tax.amount.toFixed(2) || 0}</span>
                  </div>
                ))
              )} */}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total Amount</span>
                <span>
                  ₹{Number(getTotalAmount() + Number(onlyTax)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 mt-2">
              {showCustomerForm ? (
                /* Customer Form Actions */
                <>
                  <button
                    type="button"
                    onClick={() => setShowCustomerForm(false)}
                    className="flex-1 py-2 px-0 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  {/* <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={showLoader || loadingSettings}
                    className="flex-1 py-2 px-0 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  > */}
                  {/* {showLoader && orderPlaced ? "Placing..." : "Confirm Order"} */}
                  {/* {showLoader
                      ? "Placing..."
                      : isPartialMode
                      ? "Confirm Order"
                      : "Place Order"} */}
                  {/* </button> */}

                  <button
                    onClick={handleSubmitOrder}
                    disabled={showLoader || loadingSettings}
                    className="flex-1 py-2 px-0 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {showLoader
                      ? "Processing..."
                      : showCustomerForm
                      ? isPartialMode
                        ? "Confirm Final Order"
                        : "Place Order"
                      : isPartialMode
                      ? "Review & Confirm"
                      : "Order"}
                  </button>
                </>
              ) : (
                /* Cart Actions */
                <>
                  {/* <button className="flex-1 py-2 px-0 border border-orange-300 text-orange-600 rounded hover:bg-orange-50">
                    Cancel
                  </button> */}
                  <button
                    onClick={() => {
                      // FULL CANCEL: Clear everything
                      setCart([]);
                      setCustomerInfo({
                        name: "",
                        room: "",
                        phone: "",
                        table: "",
                      });
                      setShowCustomerForm(false);
                      setIsPartialMode(false);
                      setDraftOrder(null);
                      setPartialAlerts(null);
                      setManualKOTOrder(null);
                      setTableNumber("A1");
                      setOrderType("dine-in");
                      setPaymentMethod("cash");
                    }}
                    className="flex-1 py-2 px-0 border border-orange-300 text-orange-600 rounded hover:bg-orange-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowCustomerForm(true)}
                    disabled={cart.length === 0}
                    className="flex-1 py-2 px-0 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* Order */}
                    {isPartialMode ? "Review & Confirm" : "Order"}
                  </button>
                  {/* ---------- MANUAL KOT BUTTON (only when auto-KOT is OFF) ---------- */}
                  {!showCustomerForm &&
                    cart.length === 0 &&
                    manualKOTOrder &&
                    !settings?.pos?.autoGenerateKOT && (
                      <button
                        type="button"
                        onClick={() => {
    silentPrintKOT(manualKOTOrder);
    setShowKOTModal(false);
  }}
                        // onClick={() => generateKOT(manualKOTOrder)}
                        className="flex-1 py-2 px-0 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Print KOT
                      </button>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLoader && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Enhanced KOT Modal from 2nd Code */}
      {showKOTModal && kotOrder && isMounted && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto p-4">
          <div className="max-w-sm mx-auto font-mono text-xs leading-tight">
            {/* Optional: See what item.tax values are */}
            {/* {console.log(
              "KOT Items with their own tax %:",
              kotOrder.items.map((i) => ({ name: i.name, tax: i.tax }))
            )} */}

            {/* === HEADER === */}
            <div className="text-center mb-3">

              <p className="text-sm font-bold">
                {settings?.general?.restaurantName || COMPANY_NAME}
              </p>
              {(
                settings?.general?.addressLines || [
                  "(a unit of DEVYANI INTERNATIONAL LTD)",
                  "ACROPOLIS",
                  "THE FOOD COURT",
                  "1858 RAJDANGA MAIN ROAD",
                  "KOLKATA - 700107, WEST BENGAL, INDIA",
                ]
              ).map((line, i) => (
                <p key={i} className="text-xs">
                  {line}
                </p>
              ))}
            </div>

            {/* === ITEMS TABLE === */}
            <table className="w-full text-xs mb-3">
              <thead>
                <tr className="border-b-2 border-gray-800 font-bold">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center w-10">Qty</th>
                  <th className="text-right w-16">Rate</th>
                  <th className="text-right w-14">ItemTax</th>
                  <th className="text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                {toArray(kotOrder.items).map((item, i) => {
                  const qty = Number(item.quantity || 1);
                  const rate = Number(item.price || 0);
                  const subtotal = rate * qty;

                  // Use the tax percentage defined on the item itself
                  const itemTaxPercentage = Number(item.tax || 0); // e.g., "5" → 5%
                  const taxAmount = (subtotal * itemTaxPercentage) / 100;
                  const total = subtotal + taxAmount;

                  // Console log so you can verify
                  // console.log(
                  //   `Item: ${
                  //     item.name
                  //   } | Price: ₹${rate} | Qty: ${qty} | Tax: ${itemTaxPercentage}% | Tax ₹${taxAmount.toFixed(
                  //     2
                  //   )} | Total: ₹${total.toFixed(2)}`
                  // );

                  return (
                    <tr key={i} className=" border-gray-300">
                      <td className="py-1">{item.name}</td>
                      <td className="text-center">{qty}</td>
                      <td className="text-right">{rate.toFixed(2)}</td>
                      <td className="text-right">{taxAmount.toFixed(2)}</td>
                      <td className="text-right">{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* === TOTALS & TAX SUMMARY – Now uses item-level tax like 2nd KOT === */}
{(() => {
  // 1️⃣ Calculate subtotal (before tax)
  const subtotal = toArray(kotOrder.items).reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1),
    0
  );

  // 2️⃣ Calculate total item tax (from each item's own tax %)
  const totalItemTax = toArray(kotOrder.items).reduce((sum, i) => {
    const qty = Number(i.quantity || 1);
    const rate = Number(i.price || 0);
    const sub = qty * rate;
    const taxPercent = Number(i.tax || 0);
    return sum + (sub * taxPercent) / 100;
  }, 0);

  // 3️⃣ Split into CGST / SGST
  const itemCGST = totalItemTax / 2;
  const itemSGST = totalItemTax / 2;

  // 4️⃣ Get effective tax % from first item (for display)
  const itemTaxPercent = kotOrder.items.length > 0 ? Number(kotOrder.items[0].tax || 0) : 0;
  const cgstPercent = (itemTaxPercent / 2).toFixed(1);
  const sgstPercent = (itemTaxPercent / 2).toFixed(1);

  // 5️⃣ Grand total = subtotal + item taxes
  const grandTotal = subtotal + totalItemTax;

  return (
    <div className="text-xs">
      {/* Subtotal (includes item tax already in line items, but show base) */}
      <div className="border-t border-gray-400 pt-2">
        <div className="flex justify-between">
          <span>Subtotal :</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Tax Summary – Same as 2nd KOT */}
      {totalItemTax > 0 && (
        <div className="border-t border-gray-400 pt-2">
          <p className="font-bold mb-1">Tax Collection Summary</p>
          <div className="flex justify-between">
            <span>CGST {cgstPercent > 0 ? `(${cgstPercent}%)` : ''} :</span>
            <span>₹{itemCGST.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST {sgstPercent > 0 ? `(${sgstPercent}%)` : ''} :</span>
            <span>₹{itemSGST.toFixed(2)}</span>
          </div>
          <div className="border-t border-dashed mt-2 pt-1 font-bold">
            <div className="flex justify-between">
              <span>Total Tax :</span>
              <span>₹{totalItemTax.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Final Total */}
      <div className="border-t-2 border-gray-800 pt-2 mt-3">
        <div className="flex justify-between font-bold text-base">
          <span>Total :</span>
          <span>₹{Math.round(grandTotal)}</span>
        </div>
      </div>

      {/* GST No */}
      <div className="mt-3 text-xs">
        <div className="flex justify-between">
          <span>GST No.:</span>
          <span>{settings?.general?.gst || COMPANY_GST}</span>
        </div>
      </div>
    </div>
  );
})()}

            {/* === FOOTER & CONTROLS (unchanged) === */}
            <div className="text-center font-bold text-xs mt-5">
              *** KITCHEN ORDER TICKET ***
            </div>

            <div className="flex justify-center mt-6 gap-6 items-center flex-wrap text-sm">
              <span className="font-medium">Print Size:</span>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="size"
                  checked={kotPrintSize === "original"}
                  onChange={() => setKotPrintSize("original")}
                />{" "}
                Original (80mm)
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="size"
                  checked={kotPrintSize === "a4"}
                  onChange={() => setKotPrintSize("a4")}
                />{" "}
                A4
              </label>
            </div>

            <div className="flex justify-center gap-6 mt-6">
              <button
                onClick={() => {
                  setShowKOTModal(false);
                  setKotPrintSize("original");
                }}
                className="px-8 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-8 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    //
  );
}


