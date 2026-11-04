/**
 * Financial Export Engine
 * Generates sanitized, accountant-ready CSV and tabular data with
 * formula-injection (CSV injection) protection.
 */

/**
 * Sanitize a field value to prevent CSV / Spreadsheet formula injection.
 * If a value starts with '=', '+', '-', '@', tab, or carriage return,
 * prepends a single quote "'" to force spreadsheet engines to treat it strictly as text.
 * Also handles standard RFC 4180 escaping (quotes, commas, newlines).
 * 
 * @param {any} val - Raw cell value
 * @returns {string} Sanitized cell string safe for CSV
 */
export function sanitizeForCSV(val) {
  if (val === null || val === undefined) {
    return "";
  }

  let str = String(val);

  // Dangerous leading characters that trigger formula execution in Excel/Sheets/LibreOffice
  const formulaTriggers = ["=", "+", "-", "@", "\t", "\r"];
  if (formulaTriggers.some(trigger => str.startsWith(trigger))) {
    // Escape by prepending a single quote
    str = `'${str}`;
  }

  // If string contains comma, double-quote, or newline, escape internal quotes and wrap in quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate a complete RFC 4180 compliant CSV string from headers and rows.
 * 
 * @param {Array<{ label: string, key?: string, format?: Function }>} columns
 * @param {Array<Object>} rows
 * @returns {string} Formatted CSV text
 */
export function generateCSV(columns, rows = []) {
  const headerLine = columns.map(col => sanitizeForCSV(col.label)).join(",");

  const dataLines = rows.map(row => {
    return columns.map(col => {
      let cellVal = "";
      if (typeof col.format === "function") {
        cellVal = col.format(row[col.key], row);
      } else if (col.key && row[col.key] !== undefined) {
        cellVal = row[col.key];
      }
      return sanitizeForCSV(cellVal);
    }).join(",");
  });

  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Generate Accountant-Ready Financial Operating Summary CSV
 * 
 * @param {Object} summary - Reconciled financial metrics
 * @returns {string} CSV text
 */
export function exportFinancialSummaryCSV(summary) {
  const sections = [
    ["HOTEL POS - FINANCIAL OPERATING SUMMARY", ""],
    ["Report Period", `${summary.startDate || "Beginning"} to ${summary.endDate || "Current"}`],
    ["Filter Basis", summary.filterBasis || "Invoice Date"],
    ["Generated At", new Date().toISOString()],
    ["Status", "Authoritative Audit Aggregate"],
    [],
    ["METRIC / ACCOUNT CATEGORY", "AMOUNT (INR)"],
    ["Gross Sales (Total Line Value)", summary.display?.grossSales || "0.00"],
    ["Pre-Issue Discounts Granted", `(${summary.display?.discounts || "0.00"})`],
    ["Net Sales (Taxable Turnover)", summary.display?.netSales || "0.00"],
    ["Output GST Collected (CGST + SGST + IGST)", summary.display?.taxes || "0.00"],
    ["Total Invoiced Revenue (Billed)", summary.display?.billedTotal || "0.00"],
    [],
    ["COLLECTIONS & TENDERS", "AMOUNT (INR)"],
    ["Cash Collections", summary.display?.cashCollections || "0.00"],
    ["UPI Collections", summary.display?.upiCollections || "0.00"],
    ["Card Collections", summary.display?.cardCollections || "0.00"],
    ["Other Digital Collections", summary.display?.otherCollections || "0.00"],
    ["Gross Collections", summary.display?.grossCollections || "0.00"],
    ["Refunds Disbursed", `(${summary.display?.refunds || "0.00"})`],
    ["Net Collections Realized", summary.display?.netCollections || "0.00"],
    [],
    ["RECEIVABLES & LIABILITIES", "AMOUNT (INR)"],
    ["Accounts Receivable (Unpaid Invoices)", summary.display?.receivables || "0.00"],
    ["Open Customer Credits", summary.display?.customerCredits || "0.00"],
    [],
    ["OPERATIONAL DISBURSEMENTS & VARIANCE", "AMOUNT (INR)"],
    ["Approved Operational Expenses", `(${summary.display?.expenses || "0.00"})`],
    ["Cash Drawer Variance (Net Shortage/Overage)", summary.display?.cashVariance || "0.00"],
    [],
    ["NET OPERATING SUMMARY (EBITDA ESTIMATE)", summary.display?.operatingSummary || "0.00"]
  ];

  return sections.map(row => row.map(sanitizeForCSV).join(",")).join("\r\n");
}

/**
 * Generate Invoices Register CSV
 * 
 * @param {Array<Object>} invoices
 * @returns {string} CSV text
 */
export function exportInvoicesCSV(invoices = []) {
  const columns = [
    { label: "Invoice Number", key: "billNumber" },
    { label: "Issue Date", key: "issueDate", format: (v) => v ? new Date(v).toISOString().split("T")[0] : "" },
    { label: "Customer Name", key: "customerName", format: (v) => v || "Walk-in" },
    { label: "Table / Room", key: "tableName", format: (v) => v || "-" },
    { label: "Gross Subtotal (₹)", key: "grossSubtotalRupees", format: (v, r) => v || ((r.grossSubtotalPaise || 0) / 100).toFixed(2) },
    { label: "Discount (₹)", key: "discountRupees", format: (v, r) => v || ((r.totalDiscountPaise || 0) / 100).toFixed(2) },
    { label: "Taxable Base (₹)", key: "taxableBaseRupees", format: (v, r) => v || (((r.grossSubtotalPaise || 0) - (r.totalDiscountPaise || 0)) / 100).toFixed(2) },
    { label: "CGST (₹)", key: "cgstRupees", format: (v, r) => v || ((r.taxBreakdown?.cgstPaise || 0) / 100).toFixed(2) },
    { label: "SGST (₹)", key: "sgstRupees", format: (v, r) => v || ((r.taxBreakdown?.sgstPaise || 0) / 100).toFixed(2) },
    { label: "Total Tax (₹)", key: "totalTaxRupees", format: (v, r) => v || ((r.totalTaxPaise || 0) / 100).toFixed(2) },
    { label: "Grand Total (₹)", key: "grandTotalRupees", format: (v, r) => v || ((r.grandTotalPaise || 0) / 100).toFixed(2) },
    { label: "Balance Due (₹)", key: "balanceDueRupees", format: (v, r) => v || ((r.balanceDuePaise || 0) / 100).toFixed(2) },
    { label: "Status", key: "status" }
  ];

  return generateCSV(columns, invoices);
}

/**
 * Generate Collections & Receipts CSV
 * 
 * @param {Array<Object>} payments
 * @returns {string} CSV text
 */
export function exportPaymentsCSV(payments = []) {
  const columns = [
    { label: "Receipt Number", key: "receiptNumber" },
    { label: "Payment Date", key: "recordedAt", format: (v) => v ? new Date(v).toISOString().split("T")[0] : "" },
    { label: "Invoice Number", key: "billNumber" },
    { label: "Tender / Method", key: "tender", format: (v) => (v || "").toUpperCase() },
    { label: "Amount Paid (₹)", key: "amountRupees", format: (v, r) => v || ((r.amountPaise || 0) / 100).toFixed(2) },
    { label: "Cash Tendered (₹)", key: "tenderedCashRupees", format: (v, r) => v || (r.tenderedCashPaise ? ((r.tenderedCashPaise) / 100).toFixed(2) : "-") },
    { label: "Change Given (₹)", key: "changeReturnedRupees", format: (v, r) => v || (r.changeReturnedPaise ? ((r.changeReturnedPaise) / 100).toFixed(2) : "-") },
    { label: "Transaction / UTR Ref", key: "transactionReference", format: (v) => v || "-" },
    { label: "Cashier ID", key: "recordedBy" }
  ];

  return generateCSV(columns, payments);
}

/**
 * Generate Register Shifts & Z-Report CSV
 * 
 * @param {Array<Object>} sessions
 * @returns {string} CSV text
 */
export function exportSessionsCSV(sessions = []) {
  const columns = [
    { label: "Session ID", key: "sessionId" },
    { label: "Register ID", key: "registerId" },
    { label: "Cashier Name", key: "openedByName" },
    { label: "Opened At", key: "openedAt", format: (v) => v ? new Date(v).toLocaleString("en-IN") : "" },
    { label: "Closed At", key: "closedAt", format: (v) => v ? new Date(v).toLocaleString("en-IN") : "Active" },
    { label: "Opening Float (₹)", key: "openingFloatRupees", format: (v, r) => v || ((r.openingFloatPaise || 0) / 100).toFixed(2) },
    { label: "Cash Sales (₹)", key: "cashSalesRupees", format: (v, r) => v || ((r.cashSalesPaise || 0) / 100).toFixed(2) },
    { label: "Cash Refunds (₹)", key: "cashRefundsRupees", format: (v, r) => v || ((r.cashRefundsPaise || 0) / 100).toFixed(2) },
    { label: "Cash In (₹)", key: "cashInRupees", format: (v, r) => v || ((r.cashInPaise || 0) / 100).toFixed(2) },
    { label: "Cash Out (₹)", key: "cashOutRupees", format: (v, r) => v || ((r.cashOutPaise || 0) / 100).toFixed(2) },
    { label: "Expected Cash (₹)", key: "expectedCashRupees", format: (v, r) => v || ((r.expectedCashPaise || 0) / 100).toFixed(2) },
    { label: "Counted Cash (₹)", key: "countedCashRupees", format: (v, r) => v || (r.countedCashPaise !== undefined ? ((r.countedCashPaise || 0) / 100).toFixed(2) : "-") },
    { label: "Variance (₹)", key: "cashVarianceRupees", format: (v, r) => v || (r.cashVariancePaise !== undefined ? ((r.cashVariancePaise || 0) / 100).toFixed(2) : "-") },
    { label: "Status", key: "status" },
    { label: "Variance Notes", key: "varianceNote", format: (v) => v || "-" }
  ];

  return generateCSV(columns, sessions);
}
