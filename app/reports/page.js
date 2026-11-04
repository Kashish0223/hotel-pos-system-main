"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { CookingPot, ShoppingCart } from 'lucide-react';
// import * as XLSX from "xlsx";
import * as XLSX from "xlsx-js-style";

import { saveAs } from "file-saver";
import {useAuthToken} from "@/lib/useAuthToken";
import {useAuth } from "@/lib/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



// Card Components
const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded border shadow-sm ${className}`}>
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`px-6 pt-3 pb-0 ${className}`}>
      {children}
    </div>
  )
}

const CardTitle = ({ children, className = "" }) => {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  )
}

const CardDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-xs text-gray-600 mt-1.5 ${className}`}>
      {children}
    </p>
  )
}

const CardContent = ({ children, className = "" }) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}

// Chart Container Components
const ChartContainer = ({ children, config, className = "" }) => {
  return (
    <div className={`w-full h-full ${className}`} data-chart-config={JSON.stringify(config)}>
      {children}
    </div>
  )
}

const ChartTooltip = ({ children, content, formatter, ...props }) => {
  return children
}

const ChartTooltipContent = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        {label && <p className="font-medium mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {formatter ? formatter(entry.value, entry.dataKey)[0] : `${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}



export default function Reports() {
   const today = new Date()
   const {user, hasPermission} = useAuth();
     const [settings, setSettings] = useState(null);

  const [reportData, setReportData] = useState({
    dailySales: [],
    topItems: [],
    ordersByType: {},
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderAmount: 0,
  })
  const [dateRange, setDateRange] = useState({

    startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const [selectedRange, setSelectedRange] = useState("custom") // Track selected button
  const [itemTypeFilter, setItemTypeFilter] = useState("all") // New state for itemType filter
  const [mainTab, setMainTab] = useState("finance") // "finance" | "analytics"
  const [filterBasis, setFilterBasis] = useState("invoiceDate") // "invoiceDate" | "paymentDate" | "refundDate" | "businessDate"
  const [financeData, setFinanceData] = useState(null)
  const [financeLoading, setFinanceLoading] = useState(false)
  const token = useAuthToken();

//------------------------Download Daily Sales Report in Excel Functions------------------------
// const downloadDailySalesExcel = () => {
//   if (!reportData.dailySales || reportData.dailySales.length === 0) {
//     alert("No per-day data available.");
//     return;
//   }

//   const rows = reportData.dailySales.map((day) => ({
//     Date: day.date,
//     "Total Orders": day.totalOrders,
//     "Total Revenue (₹)": day.totalRevenue,
//     "Kitchen Revenue (₹)": day.kitchenRevenue,
//     "Retail Revenue (₹)": day.retailRevenue,
//   }));

//   const ws = XLSX.utils.json_to_sheet(rows);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Daily Sales");
//   const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

//   saveAs(
//     new Blob([excelBuffer], { type: "application/octet-stream" }),
//     `DailySalesReport.xlsx`
//   );
// };

  useEffect(() => {
    // Fetch settings from API
    if (!token) return;
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings',{
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings();
    }, [token]);

//------------------------Download Daily Top Selling Items Report in Excel Functions------------------------
const downloadTopItemsExcel = () => {
  if (!reportData.topItems || reportData.topItems.length === 0) {
    alert("No top selling items found.");
    return;
  }

  const wb = XLSX.utils.book_new();
  const wsData = [];

  // -------- HEADER --------
  wsData.push(["Top Selling Items Report"]);
  wsData.push([`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`]);

  const monthName = new Date(dateRange.startDate).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  wsData.push([`Month: ${monthName}`]);
  wsData.push([]);

  // -------- TABLE HEADER --------
  wsData.push(["Rank", "Item Name", "Quantity", "Revenue", "Item Type"]);

  // -------- DATA --------
  reportData.topItems.forEach((item, index) => {
    wsData.push([
      index + 1,
      item?.name?.en ??
        item?.nameEn ??
        item?.name?.ja ??
        item?.name ??
        "Unnamed Item",
      item.quantity,
      item.revenue,
      item.itemType,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // -------- MERGES --------
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  ];

  // -------- COLUMN WIDTH --------
  ws["!cols"] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 12 },
    { wch: 14 },
    { wch: 15 },
  ];

  // -------- STYLES --------
  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "FFC000" } }, // Yellow
  };

  const bold = { font: { bold: true } };

  ws["A1"].s = headerStyle;
  ws["A2"].s = headerStyle;
  ws["A3"].s = headerStyle;

  // Table header styling
  ["A5", "B5", "C5", "D5", "E5"].forEach((cell) => {
    if (ws[cell]) ws[cell].s = bold;
  });

  XLSX.utils.book_append_sheet(wb, ws, "Top Items");

  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });

  saveAs(
    new Blob([excelBuffer], { type: "application/octet-stream" }),
    `Top_Selling_Items_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`
  );
};

const downloadDailyItemWiseExcel = () => {
  if (!reportData.dailyItemSales?.length) {
    alert("No daily item-wise sales data available");
    return;
  }

  const wb = XLSX.utils.book_new();
  const wsData = [];

  // -------- HEADER --------
  wsData.push(["Daily Item Wise Sales Report"]);
  wsData.push([`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`]);

  const monthName = new Date(dateRange.startDate).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  wsData.push([`Month: ${monthName}`]);
  wsData.push([]);

  // -------- GROUP DATA --------
  const groupedByDate = reportData.dailyItemSales.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  Object.entries(groupedByDate).forEach(([date, items]) => {
    wsData.push([`Date: ${date}`]);
    wsData.push(["Item Name", "Item Type", "Quantity", "Revenue"]);

    let dailyTotal = 0;

    items.forEach((item) => {
      dailyTotal += Number(item.revenue);
      wsData.push([
        item.itemName,
        item.itemType,
        item.quantity,
        item.revenue,
      ]);
    });

    // Daily Total (right aligned like screenshot)
    wsData.push(["", "", "", dailyTotal]);
    wsData.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // -------- MERGES --------
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
  ];

  // -------- COLUMN WIDTH --------
  ws["!cols"] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
  ];

  // -------- STYLES --------
  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "FFC000" } }, // Yellow
  };

  const bold = { font: { bold: true } };
  const rightBold = {
    font: { bold: true },
    alignment: { horizontal: "right" },
  };

  ws["A1"].s = headerStyle;
  ws["A2"].s = headerStyle;
  ws["A3"].s = headerStyle;

  Object.keys(ws).forEach((cell) => {
    const value = ws[cell].v;

    if (typeof value === "string" && value.startsWith("Date:")) {
      ws[cell].s = bold;
    }

    if (value === "Item Name") ws[cell].s = bold;
    if (value === "Item Type") ws[cell].s = bold;
    if (value === "Quantity") ws[cell].s = bold;
    if (value === "Revenue") ws[cell].s = bold;
  });

  // Style daily totals (last column numbers without label)
  Object.keys(ws).forEach((cell) => {
    if (
      cell.startsWith("D") &&
      typeof ws[cell].v === "number" &&
      ws[`A${cell.substring(1)}`]?.v === ""
    ) {
      ws[cell].s = rightBold;
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, "Daily Item Sales");

  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });

  saveAs(
    new Blob([excelBuffer], { type: "application/octet-stream" }),
    `Daily_Item_Wise_Sales_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`
  );
};


const downloadDailyItemWisePDF = () => {
  if (!settings || !reportData.dailyItemSales?.length) {
    alert("Required data not available");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const formatCurrency = (val) =>
    `${Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  // ---------- HEADER ----------
  const logo = new Image();
  logo.src = "/images/logo.png";

  logo.onload = () => {
    doc.addImage(logo, "PNG", 12, 10, 22, 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(settings.general.restaurantName, 38, 16);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(settings.general.address, 38, 22, { maxWidth: 150 });
    doc.text(`Phone: ${settings.general.phone}`, 38, 29);
    doc.text(`Email: ${settings.general.email}`, 38, 33);

    doc.setDrawColor(200);
    doc.line(10, 36, pageWidth - 10, 36);

    // ---------- REPORT TITLE ----------
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Item Wise Sales Report", pageWidth / 2, 45, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Date Range: ${dateRange.startDate} to ${dateRange.endDate}`,
      pageWidth / 2,
      51,
      { align: "center" }
    );

    let y = 60;

    // ---------- GROUP BY DATE ----------
    const groupedByDate = reportData.dailyItemSales.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});

    Object.entries(groupedByDate).forEach(([date, items]) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Date: ${date}`, 14, y);
      y += 4;

      let dateTotal = 0;

      autoTable(doc, {
        startY: y,
        head: [["Item Name", "Type", "Qty", "Revenue"]],
        body: items.map((i) => {
          dateTotal += Number(i.revenue);
          return [
            i.itemName,
            i.itemType,
            i.quantity,
            formatCurrency(i.revenue),
          ];
        }),
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [245, 158, 11], // orange
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          2: { halign: "center" },
          3: { halign: "right" },
        },
      });

      y = doc.lastAutoTable.finalY + 2;

      // ---------- DATE SUBTOTAL ----------
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total: ${formatCurrency(dateTotal)}`,
        pageWidth - 14,
        y + 4,
        { align: "right" }
      );

      y += 12;
    });

    // ---------- FOOTER ----------
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    doc.save(
      `Daily_Item_Wise_Sales_${dateRange.startDate}_to_${dateRange.endDate}.pdf`
    );
  };
};



  useEffect(() => {
    if (!token) return;
    fetchReportData()
    fetchFinanceData()
  }, [dateRange, token, filterBasis])

  const fetchFinanceData = async () => {
    if (!token) return
    setFinanceLoading(true)
    try {
      const response = await fetch(
        `/api/finance/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&filterBy=${filterBasis}`,
        {
          headers: {
            Authorization: `Bearer ${token?.trim()}`
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setFinanceData(data)
      }
    } catch (error) {
      console.error("Error fetching finance reports:", error)
    } finally {
      setFinanceLoading(false)
    }
  }

  const downloadFinanceCSV = async (reportType = "summary") => {
    if (!token) return
    try {
      const response = await fetch(
        `/api/finance/reports?format=csv&reportType=${reportType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&filterBy=${filterBasis}`,
        {
          headers: {
            Authorization: `Bearer ${token?.trim()}`
          }
        }
      )
      if (response.ok) {
        const blob = await response.blob()
        const filename = `finance-${reportType}-${dateRange.startDate}-to-${dateRange.endDate}.csv`
        saveAs(blob, filename)
      } else {
        alert("Failed to export finance CSV")
      }
    } catch (error) {
      console.error("Error exporting finance CSV:", error)
      alert("Error exporting finance CSV")
    }
  }

  const fetchReportData = async () => {
   
    try {
      const response = await fetch(`/api/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,{
        headers:{
          Authorization:`Bearer ${token?.trim()}`
        }
      })
      const data = await response.json()
      // console.log('Received report data checking:', JSON.stringify(data,null,2));
      setReportData(data)
    } catch (error) {
      console.error("Error fetching report data:", error)
    }
  }

  // Function to calculate date ranges
  const getDateRange = (type) => {
    const today = new Date()
    const endDate = today.toISOString().split("T")[0]
    let startDate

    switch (type) {
      case "all":
        // For "All", you might want to set a very early date or fetch the first order date from your API
        // For now, setting it to 2 years ago as an example
        startDate = new Date(today.getFullYear() - 2, 0, 1).toISOString().split("T")[0]
        break
      case "2w":
        startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        break
      case "1m":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split("T")[0]
        break
      case "1y":
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split("T")[0]
        break
      default:
        return { startDate: dateRange.startDate, endDate: dateRange.endDate }
    }

    return { startDate, endDate }
  }

  // Handle date range button clicks
  const handleDateRangeClick = (rangeType) => {
    // console.log(`Selected range: ${rangeType}`);
    setSelectedRange(rangeType)
    const newRange = getDateRange(rangeType)
    setDateRange(newRange)
  }

  // Handle manual date input changes
  const handleDateInputChange = (field, value) => {
    setSelectedRange("custom") // Switch to custom when manually changing dates
    setDateRange({ ...dateRange, [field]: value })
  }

  // Filter top items based on itemType
  const getFilteredTopItems = () => {
    if (itemTypeFilter === "all") {
      return reportData.topItems
    }
    return reportData.topItems.filter(item => item.itemType === itemTypeFilter)
  }

  const filteredTopItems = getFilteredTopItems()

  const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

  const PIE_COLORS = [
    "#F97316", // orange-500 (base)
    "#8B5CF6", // purple-500
    "#10B981", // green-500
    "#3B82F6", // blue-500
    "#7C2D12"  // orange-900 (darkest orange)
  ];

  const orderTypeData = Object.entries(reportData.ordersByType).map(([type, count], index) => ({
    name: type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: count,
    color: PIE_COLORS[index],
  }))

  // console.log(hasPermission(user,"view_reports"));


  
  return (
    // //{"view_reports"}>
    hasPermission(user, "view_reports") && (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link
                  href="/"
                  className="text-orange-500 hover:text-orange-600 mr-4"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Link>
                <h1 className="text-sm font-bold text-gray-900">
                  Reports & Analytics
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Main Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4 bg-white px-4 pt-3 rounded shadow-sm">
            <button
              onClick={() => setMainTab("finance")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                mainTab === "finance"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-sm font-semibold">₹</span>
              Authoritative Finance & Tax
            </button>
            <button
              onClick={() => setMainTab("analytics")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                mainTab === "analytics"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Operations & Analytics
            </button>
          </div>

          {mainTab === "finance" ? (
            /* =========================================================================
               AUTHORITATIVE ENTERPRISE FINANCE & TAX REPORTS
               ========================================================================= */
            <div>
              {/* Filter Controls & Accountant Export Actions */}
              <div className="bg-white rounded shadow p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                        Filter Basis
                      </label>
                      <select
                        value={filterBasis}
                        onChange={(e) => setFilterBasis(e.target.value)}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded font-medium bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="invoiceDate">Invoice Date (Billed Revenue)</option>
                        <option value="paymentDate">Payment Date (Cash Collections)</option>
                        <option value="refundDate">Refund Date (Disbursements)</option>
                        <option value="businessDate">Business Shift Date</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => handleDateInputChange("startDate", e.target.value)}
                        className="text-xs px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => handleDateInputChange("endDate", e.target.value)}
                        className="text-xs px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex items-end self-end gap-1">
                      {["2w", "1m", "1y", "all"].map((range) => (
                        <button
                          key={range}
                          onClick={() => handleDateRangeClick(range)}
                          className={`h-7 px-2.5 text-xs rounded border transition-colors ${
                            selectedRange === range
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {range.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sanitized Accountant CSV Export Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => downloadFinanceCSV("summary")}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Financial Summary (CSV)
                    </button>
                    <button
                      onClick={() => downloadFinanceCSV("invoices")}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Invoices Register (CSV)
                    </button>
                    <button
                      onClick={() => downloadFinanceCSV("payments")}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Collections Register (CSV)
                    </button>
                    <button
                      onClick={() => downloadFinanceCSV("sessions")}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-black transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cashier Shifts (CSV)
                    </button>
                  </div>
                </div>
              </div>

              {/* Authoritative Financial KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* 1. Gross Sales */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Gross Sales (Line Value)</p>
                      <h4 className="text-xl font-bold text-gray-900 mt-1">
                        ₹{financeData?.display?.grossSales || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {financeData?.counts?.bills || 0} authoritative bills
                      </p>
                    </div>
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-md font-bold text-xs">Gross</span>
                  </div>
                </div>

                {/* 2. Discounts */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Pre-Issue Discounts</p>
                      <h4 className="text-xl font-bold text-amber-600 mt-1">
                        -₹{financeData?.display?.discounts || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Approved cashier/manager discounts</p>
                    </div>
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-md font-bold text-xs">Disc</span>
                  </div>
                </div>

                {/* 3. Net Taxable Sales */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Net Sales (Taxable Base)</p>
                      <h4 className="text-xl font-bold text-emerald-600 mt-1">
                        ₹{financeData?.display?.netSales || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Gross Sales - Discounts</p>
                    </div>
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-md font-bold text-xs">Net</span>
                  </div>
                </div>

                {/* 4. Output GST Collected */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Output GST Liability</p>
                      <h4 className="text-xl font-bold text-purple-600 mt-1">
                        ₹{financeData?.display?.taxes || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        CGST: ₹{financeData?.display?.cgst || "0.00"} | SGST: ₹{financeData?.display?.sgst || "0.00"}
                      </p>
                    </div>
                    <span className="p-2 bg-purple-50 text-purple-600 rounded-md font-bold text-xs">GST</span>
                  </div>
                </div>

                {/* 5. Invoiced Revenue */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Total Invoiced (Billed)</p>
                      <h4 className="text-xl font-bold text-indigo-700 mt-1">
                        ₹{financeData?.display?.billedTotal || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Net Turnover + Output GST</p>
                    </div>
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-md font-bold text-xs">Billed</span>
                  </div>
                </div>

                {/* 6. Gross Collections */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Gross Collections</p>
                      <h4 className="text-xl font-bold text-green-700 mt-1">
                        ₹{financeData?.display?.grossCollections || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Cash: ₹{financeData?.display?.cashCollections || "0.00"} | UPI: ₹{financeData?.display?.upiCollections || "0.00"}
                      </p>
                    </div>
                    <span className="p-2 bg-green-50 text-green-600 rounded-md font-bold text-xs">Receipts</span>
                  </div>
                </div>

                {/* 7. Disbursed Refunds */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Refunds Disbursed</p>
                      <h4 className="text-xl font-bold text-rose-600 mt-1">
                        -₹{financeData?.display?.refunds || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {financeData?.counts?.refunds || 0} audited refunds
                      </p>
                    </div>
                    <span className="p-2 bg-rose-50 text-rose-600 rounded-md font-bold text-xs">Refund</span>
                  </div>
                </div>

                {/* 8. Net Collections Realized */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Net Realized Collections</p>
                      <h4 className="text-xl font-bold text-emerald-700 mt-1">
                        ₹{financeData?.display?.netCollections || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Gross Collections - Refunds</p>
                    </div>
                    <span className="p-2 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs">Realized</span>
                  </div>
                </div>

                {/* 9. Accounts Receivable */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Receivables (Unpaid Bills)</p>
                      <h4 className="text-xl font-bold text-orange-600 mt-1">
                        ₹{financeData?.display?.receivables || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Balance due on issued bills</p>
                    </div>
                    <span className="p-2 bg-orange-50 text-orange-600 rounded-md font-bold text-xs">A/R</span>
                  </div>
                </div>

                {/* 10. Operational Expenses */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Operational Expenses</p>
                      <h4 className="text-xl font-bold text-red-600 mt-1">
                        -₹{financeData?.display?.expenses || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Approved operational expenses</p>
                    </div>
                    <span className="p-2 bg-red-50 text-red-600 rounded-md font-bold text-xs">Expense</span>
                  </div>
                </div>

                {/* 11. Cash Drawer Variance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Cash Drawer Variance</p>
                      <h4 className={`text-xl font-bold mt-1 ${
                        (financeData?.cashDrawer?.totalCashVariancePaise || 0) < 0
                          ? "text-red-600"
                          : (financeData?.cashDrawer?.totalCashVariancePaise || 0) > 0
                          ? "text-emerald-600"
                          : "text-gray-900"
                      }`}>
                        ₹{financeData?.display?.cashVariance || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {financeData?.counts?.closedSessions || 0} reconciled shifts
                      </p>
                    </div>
                    <span className="p-2 bg-gray-100 text-gray-700 rounded-md font-bold text-xs">Drawer</span>
                  </div>
                </div>

                {/* 12. Net Operating Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Operating Summary</p>
                      <h4 className="text-xl font-bold text-gray-900 mt-1">
                        ₹{financeData?.display?.operatingSummary || "0.00"}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Net Sales - Expenses ± Variance</p>
                    </div>
                    <span className="p-2 bg-gray-800 text-white rounded-md font-bold text-xs">EBITDA</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Tables (Tenders, Taxes, and Invoices) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Tender Breakdown */}
                <div className="bg-white rounded shadow p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                    <span>Collections by Tender / Payment Method</span>
                    <span className="text-xs font-normal text-gray-500">
                      Total: ₹{financeData?.display?.grossCollections || "0.00"}
                    </span>
                  </h3>
                  <table className="min-w-full text-xs text-left">
                    <thead className="border-b bg-gray-50 font-semibold text-gray-600">
                      <tr>
                        <th className="py-2 px-3">Tender</th>
                        <th className="py-2 px-3 text-right">Collections (₹)</th>
                        <th className="py-2 px-3 text-right">% of Gross</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2 px-3 font-medium">Cash</td>
                        <td className="py-2 px-3 text-right">₹{financeData?.display?.cashCollections || "0.00"}</td>
                        <td className="py-2 px-3 text-right text-gray-500">
                          {financeData?.collections?.grossCollectionsPaise
                            ? ((financeData.collections.cashPaise / financeData.collections.grossCollectionsPaise) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">UPI / QR</td>
                        <td className="py-2 px-3 text-right">₹{financeData?.display?.upiCollections || "0.00"}</td>
                        <td className="py-2 px-3 text-right text-gray-500">
                          {financeData?.collections?.grossCollectionsPaise
                            ? ((financeData.collections.upiPaise / financeData.collections.grossCollectionsPaise) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">Card</td>
                        <td className="py-2 px-3 text-right">₹{financeData?.display?.cardCollections || "0.00"}</td>
                        <td className="py-2 px-3 text-right text-gray-500">
                          {financeData?.collections?.grossCollectionsPaise
                            ? ((financeData.collections.cardPaise / financeData.collections.grossCollectionsPaise) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">Other / Digital</td>
                        <td className="py-2 px-3 text-right">₹{financeData?.display?.otherCollections || "0.00"}</td>
                        <td className="py-2 px-3 text-right text-gray-500">
                          {financeData?.collections?.grossCollectionsPaise
                            ? ((financeData.collections.otherPaise / financeData.collections.grossCollectionsPaise) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tax Breakdown */}
                <div className="bg-white rounded shadow p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                    <span>GST Output Tax Breakdown</span>
                    <span className="text-xs font-normal text-gray-500">
                      Total Tax: ₹{financeData?.display?.taxes || "0.00"}
                    </span>
                  </h3>
                  <table className="min-w-full text-xs text-left">
                    <thead className="border-b bg-gray-50 font-semibold text-gray-600">
                      <tr>
                        <th className="py-2 px-3">Tax Component</th>
                        <th className="py-2 px-3">Taxable Turnover (₹)</th>
                        <th className="py-2 px-3 text-right">Tax Collected (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2 px-3 font-medium">CGST (Central GST)</td>
                        <td className="py-2 px-3">₹{financeData?.display?.netSales || "0.00"}</td>
                        <td className="py-2 px-3 text-right">₹{financeData?.display?.cgst || "0.00"}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">SGST (State GST)</td>
                        <td className="py-2 px-3">₹{financeData?.display?.netSales || "0.00"}</td>
                        <td className="py-2 px-3 text-right">₹{financeData?.display?.sgst || "0.00"}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">IGST (Inter-state GST)</td>
                        <td className="py-2 px-3">₹0.00</td>
                        <td className="py-2 px-3 text-right">₹{financeData?.display?.igst || "0.00"}</td>
                      </tr>
                      <tr className="bg-gray-50 font-bold">
                        <td className="py-2 px-3">Total Output GST</td>
                        <td className="py-2 px-3">₹{financeData?.display?.netSales || "0.00"}</td>
                        <td className="py-2 px-3 text-right text-purple-700">₹{financeData?.display?.taxes || "0.00"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Authoritative Invoices Snapshot */}
              <div className="bg-white rounded shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    Authoritative Invoices Snapshot ({financeData?.sampleInvoices?.length || 0})
                  </h3>
                  <button
                    onClick={() => downloadFinanceCSV("invoices")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Download Full Invoices Register (CSV) &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="border-b bg-gray-50 font-semibold text-gray-600">
                      <tr>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Issue Date</th>
                        <th className="py-2 px-3">Customer</th>
                        <th className="py-2 px-3 text-right">Grand Total (₹)</th>
                        <th className="py-2 px-3 text-right">Balance Due (₹)</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {financeData?.sampleInvoices?.length > 0 ? (
                        financeData.sampleInvoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono font-medium text-gray-900">{inv.billNumber}</td>
                            <td className="py-2 px-3 text-gray-600">
                              {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("en-IN") : "-"}
                            </td>
                            <td className="py-2 px-3">{inv.customerName}</td>
                            <td className="py-2 px-3 text-right font-medium">₹{inv.grandTotalRupees}</td>
                            <td className="py-2 px-3 text-right font-medium text-orange-600">₹{inv.balanceDueRupees}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                inv.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : inv.status === "partially_paid"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-gray-500">
                            No bills found in selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
               OPERATIONS & ANALYTICS VIEW (PRESERVED)
               ========================================================================= */
            <div>
          {/* Date Range Filter */}
          <div className="flex justify-between items-center mb-3">
            <div className="bg-white rounded shadow px-4 h-auto flex">
              {/* <h3 className="text-sm font-semibold mb-2">Date Range</h3> */}
              <div className="py-3">
                <div className="flex justify-between items-center space-x-3">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      handleDateInputChange("startDate", e.target.value)
                    }
                    className="text-xs px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-between mt-2 items-center">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      handleDateInputChange("endDate", e.target.value)
                    }
                    className="text-xs px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-1 gap-y-1 ml-3 py-3 px-1 items-center justify-items-center">
                {/* All */}
                <div className="relative group w-full">
                  <button
                    onClick={() => handleDateRangeClick("all")}
                    className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                      selectedRange === "all"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    All
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    All time
                  </span>
                </div>

                {/* 2w */}
                <div className="relative group w-full">
                  <button
                    onClick={() => handleDateRangeClick("2w")}
                    className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                      selectedRange === "2w"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    2w
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    2 weeks
                  </span>
                </div>

                {/* 1m */}
                <div className="relative group w-full">
                  <button
                    onClick={() => handleDateRangeClick("1m")}
                    className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                      selectedRange === "1m"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    1m
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    1 month
                  </span>
                </div>

                {/* 1y */}
                <div className="relative group w-full">
                  <button
                    onClick={() => handleDateRangeClick("1y")}
                    className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                      selectedRange === "1y"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    1y
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    1 year
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-col py-2 px-2">
                {/* <button
                  onClick={downloadDailySalesExcel}
                  className="px-4 py-2 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                >
                  Download Daily Report (Excel)
                </button> */}

                <button
                  onClick={downloadTopItemsExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Download Top Selling Items (Excel)
                </button>

                <button
                  onClick={downloadDailyItemWiseExcel}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Download Daily Item Sales (Excel)
                </button>

                <button
                  onClick={downloadDailyItemWisePDF}
                  className="px-4 py-2 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                >
                  Download Daily Item Sales (PDF)
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 py-3 rounded bg-white shadow">
              <div className="bg-white rounded flex items-center shadow justify-center px-5 py-4 m-0">
                <div className="flex items-center m-0">
                  <div className="p-2 bg-green-100 rounded-xl">
                    {/* <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className="w-5 h-5 text-green-600"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 6h7M10 6c1.657 0 3 1.343 3 3m-3-3v12m0 0h4m-4 0c-1.657 0-3-1.343-3-3"
    />
  </svg> */}
                    <span className="text-green-600 text-sm font-semibold">
                      ₹
                    </span>

                    {/* <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg> */}
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      ₹
                      {(itemTypeFilter === "all"
                        ? reportData.totalRevenue.toFixed(2)
                        : itemTypeFilter === "kitchen"
                        ? reportData.itemTypeStats.find(
                            (type) => type.itemType === "kitchen"
                          )?.totalRevenue || 0
                        : reportData.itemTypeStats.find(
                            (type) => type.itemType === "retail"
                          )?.totalRevenue || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded shadow p-0 flex items-center justify-center">
                <div className="flex items-center m-0">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-600">
                      Total Orders
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {/* {reportData.totalOrders} */}
                      {itemTypeFilter === "all"
                        ? reportData.totalOrders
                        : itemTypeFilter === "kitchen"
                        ? reportData.itemTypeStats.find(
                            (type) => type.itemType === "kitchen"
                          )?.totalOrders || 0
                        : reportData.itemTypeStats.find(
                            (type) => type.itemType === "retail"
                          )?.totalOrders || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded shadow p-0 flex items-center justify-center px-3">
                <div className="flex items-center m-0">
                  <div className="p-2 bg-yellow-100 rounded-xl">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-600">
                      Average Order
                    </p>
                    <p className="text-sm font-semibold text-yellow-600">
                      ₹
                      {/* {reportData.totalOrders > 0
                      ? (reportData.totalRevenue / reportData.totalOrders).toFixed(2)
                      : "0.00"} */}
                      {itemTypeFilter === "all"
                        ? reportData.totalOrders > 0
                          ? (
                              reportData.totalRevenue / reportData.totalOrders
                            ).toFixed(2)
                          : "0.00"
                        : itemTypeFilter === "kitchen"
                        ? reportData.itemTypeStats.find(
                            (type) => type.itemType === "kitchen"
                          )?.averageOrderValue || 0
                        : reportData.itemTypeStats.find(
                            (type) => type.itemType === "retail"
                          )?.averageOrderValue || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded shadow p-0 flex items-center justify-center">
                <div className="flex items-center m-0">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-600">
                      Top Items Sold
                    </p>
                    <p className="text-sm font-semibold text-purple-600">
                      {filteredTopItems.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            {/* Top Selling Items - Bar Chart and Breakdown Side by Side */}
            <div className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                            />
                          </svg>
                        </div>
                        Top Selling Items
                        {itemTypeFilter !== "all" && (
                          <span
                            className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                              itemTypeFilter === "kitchen"
                                ? "bg-orange-100 text-orange-500"
                                : "bg-blue-100 text-blue-500"
                            }`}
                          >
                            {itemTypeFilter === "kitchen"
                              ? "Kitchen Items"
                              : "Retail Items"}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Revenue and quantity breakdown of best-performing
                        products
                      </CardDescription>
                    </div>

                    {/* Item Type Filter Buttons */}
                    <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setItemTypeFilter("all")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                          itemTypeFilter === "all"
                            ? "bg-white text-gray-900 shadow-sm font-medium"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        All Items
                      </button>
                      <button
                        onClick={() => setItemTypeFilter("kitchen")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1 ${
                          itemTypeFilter === "kitchen"
                            ? "bg-white text-gray-900 shadow-sm font-medium"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {/* item.itemType === "kitchen" ? "bg-orange-500" : "bg-blue-500" */}
                        <CookingPot className="w-3 h-3 text-orange-500" />
                        Kitchen
                      </button>
                      <button
                        onClick={() => setItemTypeFilter("retail")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1 ${
                          itemTypeFilter === "retail"
                            ? "bg-white text-gray-900 shadow-sm font-medium"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3 text-blue-500" />
                        Retail
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredTopItems.length > 0 ? (
                    <>
                      <div className="flex gap-6 h-80">
                        {/* Bar Chart - Left Side */}
                        <div className="flex-1">
                          <ChartContainer
                            config={{
                              revenue: {
                                label: "Revenue (₹)",
                                color: "hsl(var(--chart-1))",
                              },
                            }}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={filteredTopItems.slice(0, 6)}
                                margin={{
                                  top: 20,
                                  right: 20,
                                  left: 20,
                                  bottom: 80,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  className="stroke-muted"
                                />
                                <XAxis
                                  // dataKey={"name.en"}
                                  dataKey={(d) =>
                                    d?.name?.en ??
                                    d?.nameEn ??
                                    d?.name?.ja ??
                                    d?.name ??
                                    "Unnamed Item"
                                  }
                                  tick={{ fontSize: 11 }}
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  interval={0}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <ChartTooltip
                                  content={<ChartTooltipContent />}
                                  formatter={(value, name) => [
                                    `₹${value}`,
                                    name === "revenue" ? "Revenue" : name,
                                  ]}
                                />
                                <Bar
                                  dataKey="revenue"
                                  fill="#F97316"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>

                        {/* Detailed Breakdown - Right Side */}
                        <div className="flex overflow-y-auto bg-white px-1 rounded-lg overflow-y-auto scrollbar-hide w-[40%] border border-gray-200">
                          <div className="space-y-1 flex-1">
                            <h4 className="font-medium text-sm text-gray-700 border-b pb-2 sticky top-0 bg-white pt-2">
                              Detailed Breakdown
                              {itemTypeFilter !== "all" && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({filteredTopItems.length} {itemTypeFilter}{" "}
                                  items)
                                </span>
                              )}
                            </h4>
                            {/* {filteredTopItems.slice(0, 10).map((item, index) => ( */}
                            {filteredTopItems.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0">
                                    {/* Item Type Indicator */}
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        item.itemType === "kitchen"
                                          ? "bg-orange-500"
                                          : "bg-blue-500"
                                      }`}
                                      title={
                                        item.itemType === "kitchen"
                                          ? "Kitchen Item"
                                          : "Retail Item"
                                      }
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-xs text-gray-900 truncate">
                                      {(() => {
                                        const displayName =
                                          item?.name?.en ??
                                          item?.nameEn ??
                                          item?.name?.ja ??
                                          item?.name ??
                                          "Unnamed Item";

                                        return displayName.length > 25
                                          ? displayName.slice(0, 25) + "..."
                                          : displayName;
                                      })()}
                                    </p>

                                    <p className="text-xs text-gray-600">
                                      Qty: {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-semibold text-green-600 text-xs">
                                    ₹{item.revenue}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    #{index + 1}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-80 text-gray-500">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 mx-auto mb-4 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                          />
                        </svg>
                        <p className="text-sm">
                          {itemTypeFilter === "all"
                            ? "No sales data available"
                            : `No ${itemTypeFilter} items found`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Orders by Type - Pie Chart and Breakdown Side by Side */}
            <div className="xl:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                        />
                      </svg>
                    </div>
                    Orders by Type
                  </CardTitle>
                  <CardDescription>Distribution of order types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-1 flex space-x-4 items-center">
                      {/* <h4 className="font-medium text-sm text-gray-700 border-b pb-2 sticky top-0 bg-white">Breakdown</h4> */}
                      {orderTypeData
                        .slice() // create a copy so original data isn't mutated
                        .sort((a, b) => b.value - a.value) // sort by value descending
                        .map((item, index) => (
                          <div
                            key={index}
                            className={`flex flex-col items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors bg-gray-100`}
                            // style={{ backgroundColor: PIE_COLORS[index] }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs font-medium text-gray-700">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-right flex justify-between space-x-2">
                              <span className="text-xs font-semibold text-gray-900">
                                #{item.value}
                              </span>
                              <p className="text-xs text-gray-500">
                                (
                                {reportData.totalOrders > 0
                                  ? Math.round(
                                      (item.value / reportData.totalOrders) *
                                        100
                                    )
                                  : 0}
                                %)
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {orderTypeData.length > 0 ? (
                    <div className="h-80 flex">
                      {/* Pie Chart - Top */}
                      <div className="flex-1">
                        <ChartContainer
                          config={{
                            orders: {
                              label: "Orders",
                            },
                          }}
                        >
                          <ResponsiveContainer width="100%" height="70%">
                            <PieChart>
                              <Pie
                                data={orderTypeData}
                                cx="50%"
                                // cy="50%"
                                innerRadius={30}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                {orderTypeData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                                        <p className="font-medium">
                                          {data.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {data.value} orders
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-80 text-gray-500">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 mx-auto mb-4 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                          />
                        </svg>
                        <p className="text-sm">No order data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
            </div>
          )}
        </div>
      </div>
    )
  );
}

