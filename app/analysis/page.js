"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminHeader from "@/components/AdminHeader";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuthToken } from "@/lib/useAuthToken";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function AnalysisPage() {
  const [analyticsData, setAnalyticsData] = useState({
    salesTrend: [],
    categoryPerformance: [],
    customerInsights: {
      newCustomers: 0,
      returningCustomers: 0,
      totalCustomers: 0,
      activeCustomers: 0,
    },
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(true);

  const [selectedRange, setSelectedRange] = useState("");
  const token = useAuthToken();
  const [settings, setSettings] = useState(null);

  // Function to calculate date ranges
  const getDateRange = (type) => {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    let startDate;

    switch (type) {
      case "all":
        // For "All", you might want to set a very early date or fetch the first order date from your API
        // For now, setting it to 2 years ago as an example
        startDate = new Date(today.getFullYear() - 2, 0, 1)
          .toISOString()
          .split("T")[0];
        break;
      case "2w":
        startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        break;
      case "1w":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        break;
      case "1y":
        startDate = new Date(
          today.getFullYear() - 1,
          today.getMonth(),
          today.getDate()
        )
          .toISOString()
          .split("T")[0];
        break;
      default:
        return { startDate: dateRange.startDate, endDate: dateRange.endDate };
    }

    return { startDate, endDate };
  };

  // Handle date range button clicks
  const handleDateRangeClick = (rangeType) => {
    // console.log(`Selected range: ${rangeType}`);
    setSelectedRange(rangeType);
    const newRange = getDateRange(rangeType);
    setDateRange(newRange);
  };


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


  useEffect(() => {
   if(!token) return;
   setLoading(true)
    fetchAnalyticsData();
  }, [dateRange,token]);


  if (!token) return;
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/comprehensive?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      ,{
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
// If backend returns error → set empty safe data, not break UI
    if (!response.ok || data.error) {
      setAnalyticsData({
        salesTrend: [],
        categoryPerformance: [],
        paymentMethods: [],
        customerInsights: {
          totalCustomers: 0,
          newCustomers: 0,
          returningCustomers: 0,
          activeCustomers: 0,
        },
        hasData: false,
      });
      setLoading(false);
      return;
    }

      // console.log(`Data for analysis is: ${JSON.stringify(data,null,2)}`)

      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00ff00",
    "#ff00ff",
  ];


// const downloadReportPDF = () => {
//   if (!settings) {
//     alert("Settings not loaded");
//     return;
//   }

//   const doc = new jsPDF();
//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();
//   let yPos = 10;

//   const logo = new Image();
//   logo.src = "/images/logo.png";

//   logo.onload = () => {
// doc.addImage(logo, "PNG", 10, 10, 25, 25);

// doc.setFont("helvetica", "bold");
// doc.setFontSize(16);
// doc.text(settings.general.restaurantName, 40, 15);

// doc.setFont("helvetica", "normal");
// doc.setFontSize(10);
// doc.text(settings.general.address, 40, 22, { maxWidth: 160 });

// // PHONE
// const phoneIcon = new Image();
// phoneIcon.src = "/images/phone.png";
// doc.addImage(phoneIcon, "PNG", 40, 28, 4, 4);
// doc.text(settings.general.phone, 47, 31);

// // EMAIL
// const emailIcon = new Image();
// emailIcon.src = "/images/communication.png";
// doc.addImage(emailIcon, "PNG", 40, 34, 4, 4);
// doc.text(settings.general.email, 47, 37);
// doc.setDrawColor(0, 0, 0);  // black
// doc.setLineWidth(0.3);
// doc.line(10, 40, pageWidth - 10, 40);

// yPos = 46; // << new correct line height

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(14);
//     doc.text("Business Analysis Report", pageWidth / 2, yPos, { align: "center" });

//     yPos += 5;
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     doc.text(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`, pageWidth / 2, yPos, { align: "center" });

//     yPos += 12;

//     // KEY METRICS
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(12);
//     doc.text("Key Metrics", 10, yPos);
//     yPos += 8;

//     const metrics = [
//       [`Total Revenue: ${analyticsData.totalRevenue?.toLocaleString() || 0}`, `Total Orders: ${analyticsData.totalOrders || 0}`],
//       [`Avg Order Value: ${analyticsData.avgOrderAmount?.toFixed(2) || 0}`, ""]
//     ];

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     metrics.forEach(row => {
//       doc.text(row[0], 10, yPos);
//       if (row[1]) doc.text(row[1], pageWidth / 2, yPos);
//       yPos += 7;
//     });

//     yPos += 5;

//     // PAYMENT TABLE
//     if (analyticsData.paymentMethods?.length > 0) {
//       autoTable(doc, {
//         head: [["Payment Method", "Order Count", "Amount"]],
//         body: analyticsData.paymentMethods.map(pm => [
//           pm.name || "Unknown",
//           pm.count || 0,
//           `${(pm.amount || 0).toFixed(2)}`
//         ]),
//         startY: yPos,
//       });
//       yPos = doc.lastAutoTable.finalY + 10;
//     }

//     if (yPos > pageHeight - 30) {
//       doc.addPage();
//       yPos = 10;
//     }

//     // CATEGORY TABLE
//     autoTable(doc, {
//       head: [["Category", "Amount"]],
//       body: analyticsData.categoryPerformance.map(cat => [
//         cat.name,
//         `${(cat.value || 0).toFixed(2)}`
//       ]),
//       startY: yPos,
//     });

//     yPos = doc.lastAutoTable.finalY + 10;

//     // CUSTOMER INSIGHTS
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(12);
//     doc.text("Customer Insights", 10, yPos);
//     yPos += 8;

//     const customerData = analyticsData.customerInsights;
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);

//     doc.text(`Total Customers: ${customerData.totalCustomers}`, 10, yPos); yPos += 6;
//     doc.text(`New Customers: ${customerData.newCustomers}`, 10, yPos); yPos += 6;
//     doc.text(`Returning Customers: ${customerData.returningCustomers}`, 10, yPos); yPos += 6;
//     doc.text(`Active Customers: ${customerData.activeCustomers}`, 10, yPos);

//     doc.save(`Analysis_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
//   };
// };
const addPDFHeader = (doc, settings) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo
  const logo = new Image();
  logo.src = "/images/logo.png";

  return new Promise((resolve) => {
    logo.onload = () => {
      doc.addImage(logo, "PNG", 12, 10, 22, 22);

      // Restaurant Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(settings.general.restaurantName, 38, 16);

      // Address
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(settings.general.address, 38, 20, {
        maxWidth: pageWidth - 50,
      });

      doc.text(`Phone: ${settings.general.phone}`, 38, 28);
      doc.text(`Email: ${settings.general.email}`, 38, 32);

      // Divider
      doc.setDrawColor(200);
      doc.line(10, 36, pageWidth - 10, 36);

      resolve();
    };
  });
};

const downloadReportPDF = async () => {
  if (!analyticsData) {
    alert("No analytics data available");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");

  // ✅ ADD HEADER
  await addPDFHeader(doc, settings);

  /* ---------------- TITLE ---------------- */
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Sales Analysis Report", 14, 48);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Date Range: ${dateRange.startDate} to ${dateRange.endDate}`,
    14,
    55
  );

  /* ---------------- KEY METRICS ---------------- */
  const totalRevenue = analyticsData?.totalRevenue || 0;
  const totalOrders = analyticsData?.totalOrders || 0;
  const avgOrderValue =
    totalOrders > 0 ? totalRevenue / totalOrders : 0;

  doc.setFontSize(13);
  doc.text("Key Metrics", 14, 64);

  autoTable(doc, {
    startY: 68,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", `${totalRevenue.toFixed(2)} (INR)`],
      ["Total Orders", totalOrders],
      ["Average Order Value", `${avgOrderValue.toFixed(2)}`],
    ],
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [255, 193, 7],
      textColor: [0, 0, 0],
    },
  });

  /* ---------------- DAILY SALES ---------------- */
  const dailySalesRows =
    analyticsData?.salesTrend?.map((day) => [
      new Date(day.date).toLocaleDateString("en-IN"),
      day.orders || 0,
      day.quantity || 0,
      `${(day.revenue || 0).toFixed(2)}`,
    ]) || [];

  doc.setFontSize(13);
  doc.text(
    "Daily Sales Summary",
    14,
    doc.lastAutoTable.finalY + 8
  );

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    head: [["Date", "Orders", "Quantity", "Revenue"]],
    body: dailySalesRows,
    styles: { fontSize: 10, halign: "center" },
    headStyles: {
      fillColor: [255, 193, 7],
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: () => {
      addPDFHeader(doc, settings); // ✅ Header on every page
    },
  });

  /* ---------------- DATE-WISE PAYMENT METHODS ---------------- */
if (analyticsData?.dateWisePayments?.length > 0) {
  doc.setFontSize(13);
  doc.text(
    "Date-wise Payment Method Breakdown",
    14,
    doc.lastAutoTable.finalY + 12
  );

  // Prepare rows for table: Date + one column per unique payment method
  const allMethods = new Set();
  analyticsData.dateWisePayments.forEach(day => {
    Object.keys(day.payments || {}).forEach(m => allMethods.add(m));
  });
  const methodList = Array.from(allMethods).sort();

  const paymentRows = analyticsData.dateWisePayments.map(day => {
    const row = [day.date];
    methodList.forEach(method => {
      row.push((day.payments[method] || 0).toFixed(2));
    });
    return row;
  });

  // Headers: Date + each method
  const paymentHeaders = ["Date", ...methodList.map(m => m.toUpperCase())];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    head: [paymentHeaders],
    body: paymentRows,
    styles: { fontSize: 9, cellPadding: 2, halign: "right" },
    headStyles: {
      fillColor: [255, 193, 7],
      textColor: [0, 0, 0],
      halign: "center"
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 30 } // Date column left-aligned
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didDrawPage: () => {
      addPDFHeader(doc, settings); // Keep header on new pages
    }
  });
}
  /* ---------------- PAYMENT METHODS ---------------- */
  if (analyticsData?.paymentMethods?.length) {
    doc.text(
      "Payment Method Breakdown",
      14,
      doc.lastAutoTable.finalY + 8
    );

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [["Method", "Orders", "Amount"]],
      body: analyticsData.paymentMethods.map((p) => [
        p.name,
        p.count,
        `${p.amount.toFixed(2)}`,
      ]),
      headStyles: {
        fillColor: [255, 193, 7],
        textColor: [0, 0, 0],
      },
    });
  }

  /* ---------------- SAVE ---------------- */
  doc.save(
    `Sales_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`
  );
};


  return (
    //"view_analytics">
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title="Business Analysis"
        subtitle="Comprehensive analytics and competitive insights"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Analytics" },
        ]}
        actionButton={
          <button
            onClick={downloadReportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download size={18} />
            <span className="text-sm font-medium">Download Report</span>
          </button>
        }
      />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center mb-3">
          <div className="bg-white rounded shadow px-4 h-auto flex">
            {/* <h3 className="text-sm font-semibold mb-2">Date Range</h3> */}
            <div className="py-3">
              <div className="flex justify-between items-center space-x-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Start:
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  // onChange={(e) => handleDateInputChange("startDate", e.target.value)}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value > dateRange.endDate) {
                      alert("Start date cannot be after end date");
                      return;
                    }
                    setDateRange({ ...dateRange, startDate: value });
                  }}
                  className="text-xs px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between mt-2 items-center">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  End:
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  // onChange={(e) => handleDateInputChange("endDate", e.target.value)}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value < dateRange.startDate) {
                      alert("End date cannot be before start date");
                      return;
                    }

                    setDateRange({ ...dateRange, endDate: value });
                  }}
                  // setDateRange({ ...dateRange, endDate: e.target.value })

                  className="text-xs px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-1 gap-y-1 ml-3 py-3 px-1 items-center justify-items-center">
              {/* <div className="grid grid-cols-2 gap-x-1 gap-y-1 ml-3 py-3 px-1 items-center justify-items-center"> */}

              {/* All */}
              <div className="relative group w-full">
                <button
                  onClick={() => handleDateRangeClick("all")}
                  className={`h-8 w-full px-2 text-xs rounded border transition-colors ${
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
                  onClick={() => handleDateRangeClick("1w")}
                  className={`h-8 w-full px-4 text-xs rounded border transition-colors ${
                    selectedRange === "1w"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-gray-50 text-black border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  1w
                </button>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                  1 week
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
          </div>

          {/* KPI Cards */}
          <div className="md:w-full lg:w-auto flex items-center justify-between bg-white py-2 px-2 border-gray-200 rounded shadow space-x-2">
            <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded">
                  <span className="text-sm font-semibold text-green-600">
                    {" "}
                    ₹
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    ₹
                    {(analyticsData?.salesTrend ?? [])
                      .reduce((sum, item) => sum + (item?.revenue ?? 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">
                    Total Orders
                  </p>
                  <p className="text-sm font-semibold text-blue-600">
                    {(analyticsData.salesTrend ?? [])
                      .reduce((sum, item) => sum + item.orders, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded lg:p-2">
                  <svg
                    className="w-5 h-5 text-yellow-600"
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
                    AvgOrder Value
                  </p>
                  <p className="text-sm font-semibold text-yellow-600">
                    ₹
                    {(analyticsData.salesTrend.length > 0 ?? 0)
                      ? (
                          analyticsData.salesTrend.reduce(
                            (sum, item) => sum + item.revenue,
                            0,
                          ) /
                          analyticsData.salesTrend.reduce(
                            (sum, item) => sum + item.orders,
                            0,
                          )
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">
                    Active Customers
                  </p>
                  <p className="text-sm font-semibold text-purple-600">
                    {analyticsData.customerInsights.activeCustomers ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
          {/* Sales Trend */}
          <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
            <h3 className="text-xs font-medium text-gray-900 mb-2">
              Sales Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* <XAxis dataKey="date" />
                  <YAxis /> */}
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: "11px", fill: "#374151" }} // 12px ~ Tailwind text-xs
                />
                <YAxis
                  tick={{ fontSize: "11px", fill: "#374151" }} // same styling for Y axis
                />

                {/* <Tooltip /> */}
                <Tooltip
                  contentStyle={{ fontSize: "10px" }} // whole box text
                  itemStyle={{ fontSize: "10px" }} // each entry text
                  labelStyle={{ fontSize: "10px" }} // label (e.g. date)
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
            <h3 className="text-xs font-medium text-gray-900 mb-2">
              Category Performance{" "}
              <span className="font-normal text-gray-500">
                (showing top 5 performing categories)
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, x, y }) => (
                    <text
                      x={x}
                      y={y}
                      fill="#666"
                      textAnchor={x > 150 ? "start" : "end"} // better alignment
                      dominantBaseline="central"
                      fontSize={11}
                    >
                      {name} {(percent * 100).toFixed(0)}%
                    </text>
                  )}
                  innerRadius={30}
                  outerRadius={80}
                  // outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={0}
                >
                  {analyticsData.categoryPerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="text-xs"
                    />
                  ))}
                </Pie>
                {/* <Tooltip /> */}
                <Tooltip
                  contentStyle={{ fontSize: "10px" }} // whole box text
                  itemStyle={{ fontSize: "10px" }} // each entry text
                  labelStyle={{ fontSize: "10px" }} // label (e.g. date)
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
            <h3 className="text-xs font-medium text-gray-900 mb-2">
              Payment Methods Breakdown
            </h3>
            {analyticsData.paymentMethods &&
            analyticsData.paymentMethods.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      innerRadius={30}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      paddingAngle={0}
                    >
                      {analyticsData.paymentMethods.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="text-xs"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: "10px" }}
                      itemStyle={{ fontSize: "10px" }}
                      labelStyle={{ fontSize: "10px" }}
                      formatter={(value) => `₹${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                  {analyticsData.paymentMethods.map((pm, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="font-medium">
                        {pm.name || "Unknown"}
                      </span>
                      <span>
                        ₹{(pm.amount || 0).toFixed(2)} ({pm.count || 0} orders)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-300 text-gray-500">
                <p className="text-xs">No payment data available</p>
              </div>
            )}
          </div>

          {/* Top Menu Items */}
          {/* <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-2">Top Menu Items</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topItems} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div> */}

          {/* Revenue by Outlet */}
          {/* <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-2">Revenue by Outlet</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.revenueByOutlet}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="outlet" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div> */}
        </div>

        {/* Competitive Analysis */}
        {/* <div className="bg-white rounded shadow px-5 py-4 border border-gray-100 mb-8">
            <h3 className="text-xs font-medium text-gray-900 mb-2">Competitive Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Competitor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Share
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.competitorAnalysis.map((competitor, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {competitor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{competitor.avgPrice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{competitor.rating}/5.0</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{competitor.marketShare}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            competitor.trend === "up"
                              ? "bg-green-100 text-green-800"
                              : competitor.trend === "down"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {competitor.trend === "up" ? "↗" : competitor.trend === "down" ? "↘" : "→"} {competitor.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div> */}

        {/* Customer Analytics */}
        <div className="bg-white rounded shadow px-5 py-4 border border-gray-100">
          <h3 className="text-xs font-medium text-gray-900 mb-2">
            Customer Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 mb-2">
                {analyticsData.customerInsights.newCustomers}
              </div>
              <div className="text-xs font-medium text-gray-600">
                New Customers
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 mb-2">
                {analyticsData.customerInsights.returningCustomers}
              </div>
              <div className="text-xs font-medium text-gray-600">
                Returning Customers
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600 mb-2">
                {analyticsData?.customerInsights?.vipCustomers ?? 0}
              </div>
              <div className="text-xs font-medium text-gray-600">
                VIP Customers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    //
  );
}
