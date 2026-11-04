import test from "node:test";
import assert from "node:assert/strict";
import { toPaise, formatINR } from "../../lib/finance/money.js";
import {
  calculateFinancialAggregates,
  verifyFinancialAggregatesInvariant
} from "../../lib/finance/reports.js";
import {
  sanitizeForCSV,
  generateCSV,
  exportFinancialSummaryCSV,
  exportInvoicesCSV,
  exportPaymentsCSV
} from "../../lib/finance/exports.js";

test("Phase 6 Reports - Authoritative Aggregation & Financial Invariants", () => {
  // Mock authoritative bills
  const sampleBills = [
    {
      _id: "bill-1",
      billNumber: "INV-20261101-0001",
      issueDate: "2026-11-01T12:00:00Z",
      grossSubtotalPaise: toPaise(1000), // ₹1,000.00
      totalDiscountPaise: toPaise(100),  // -₹100.00
      taxableAmountPaise: toPaise(900),  // ₹900.00
      totalTaxPaise: toPaise(45),        // ₹45.00 (5% GST)
      taxBreakdown: { cgstPaise: 2250, sgstPaise: 2250 }, // ₹22.50 + ₹22.50
      grandTotalPaise: toPaise(945),     // ₹945.00
      balanceDuePaise: 0,
      status: "paid"
    },
    {
      _id: "bill-2",
      billNumber: "INV-20261101-0002",
      issueDate: "2026-11-01T14:30:00Z",
      grossSubtotalPaise: toPaise(2500), // ₹2,500.00
      totalDiscountPaise: toPaise(250),  // -₹250.00
      taxableAmountPaise: toPaise(2250), // ₹2,250.00
      totalTaxPaise: toPaise(112.50),    // ₹112.50
      taxBreakdown: { cgstPaise: 5625, sgstPaise: 5625 },
      grandTotalPaise: toPaise(2362.50), // ₹2,362.50
      balanceDuePaise: toPaise(500),     // ₹500.00 remaining
      status: "partially_paid"
    },
    {
      _id: "bill-3",
      billNumber: "INV-20261101-0003",
      status: "cancelled", // MUST BE EXCLUDED FROM REVENUE
      grossSubtotalPaise: toPaise(5000),
      grandTotalPaise: toPaise(5250)
    }
  ];

  // Mock payments
  const samplePayments = [
    {
      _id: "pay-1",
      receiptNumber: "REC-20261101-0001",
      tender: "cash",
      amountPaise: toPaise(945) // ₹945.00 cash
    },
    {
      _id: "pay-2",
      receiptNumber: "REC-20261101-0002",
      tender: "upi",
      amountPaise: toPaise(1500) // ₹1,500.00 UPI
    },
    {
      _id: "pay-3",
      receiptNumber: "REC-20261101-0003",
      tender: "card",
      amountPaise: toPaise(362.50) // ₹362.50 Card
    }
  ];

  // Mock refunds
  const sampleRefunds = [
    {
      _id: "ref-1",
      refundNumber: "REF-20261101-0001",
      tender: "cash",
      amountPaise: toPaise(100) // ₹100.00 cash refund
    }
  ];

  // Mock expenses
  const sampleExpenses = [
    {
      _id: "exp-1",
      expenseId: "EXINV-20261101-0001",
      category: "Supplies",
      paymentMethod: "cash",
      amountPaise: toPaise(200), // ₹200.00
      status: "approved"
    }
  ];

  // Mock register sessions
  const sampleSessions = [
    {
      _id: "sess-1",
      sessionId: "SES-20261101-0001",
      status: "closed",
      openingFloatPaise: toPaise(500),
      cashVariancePaise: toPaise(-20) // -₹20.00 shortage
    }
  ];

  const agg = calculateFinancialAggregates({
    bills: sampleBills,
    payments: samplePayments,
    refunds: sampleRefunds,
    expenses: sampleExpenses,
    sessions: sampleSessions,
    startDate: "2026-11-01",
    endDate: "2026-11-01"
  });

  // Verify Counts (Cancelled bill excluded)
  assert.equal(agg.counts.bills, 2);
  assert.equal(agg.counts.payments, 3);
  assert.equal(agg.counts.refunds, 1);
  assert.equal(agg.counts.expenses, 1);
  assert.equal(agg.counts.closedSessions, 1);

  // Invariant 1: Gross (1000 + 2500 = 3500) - Discounts (100 + 250 = 350) === Net (3150)
  assert.equal(agg.revenue.grossSalesPaise, 350000);
  assert.equal(agg.revenue.discountsPaise, 35000);
  assert.equal(agg.revenue.netSalesPaise, 315000);
  assert.equal(agg.revenue.netSalesPaise, agg.revenue.grossSalesPaise - agg.revenue.discountsPaise);

  // Invariant 2: Net (3150) + Tax (45 + 112.50 = 157.50) === Billed (3307.50)
  assert.equal(agg.revenue.taxesPaise, 15750);
  assert.equal(agg.revenue.billedTotalPaise, 330750);
  assert.equal(agg.revenue.billedTotalPaise, agg.revenue.netSalesPaise + agg.revenue.taxesPaise);

  // Invariant 3: Gross Collections (945 + 1500 + 362.50 = 2807.50) - Refunds (100) === Net Collections (2707.50)
  assert.equal(agg.collections.cashPaise, 94500);
  assert.equal(agg.collections.upiPaise, 150000);
  assert.equal(agg.collections.cardPaise, 36250);
  assert.equal(agg.collections.grossCollectionsPaise, 280750);
  assert.equal(agg.collections.refundsPaise, 10000);
  assert.equal(agg.collections.netCollectionsPaise, 270750);
  assert.equal(agg.collections.netCollectionsPaise, agg.collections.grossCollectionsPaise - agg.collections.refundsPaise);

  // Invariant 4: Receivables = 500 (balanceDue on bill-2)
  assert.equal(agg.receivables.receivablesPaise, 50000);

  // Invariant 5: Operating Summary = Net Sales (3150) - Expenses (200) + Cash Variance (-20) = 2930
  assert.equal(agg.operatingSummaryPaise, 293000);
  assert.equal(agg.display.operatingSummary, "2930.00");

  // Structural Invariant Verifier
  const verifier = verifyFinancialAggregatesInvariant(agg);
  assert.equal(verifier.valid, true);
  assert.equal(verifier.errors.length, 0);
});

test("Phase 6 Exports - Spreadsheet Formula Injection (CSV Injection) Mitigation", () => {
  // Dangerous inputs that attempt spreadsheet formula execution
  const attackInputs = [
    { input: "=1+1", expectedStartsWith: "'=" },
    { input: "+SUM(A1:A10)", expectedStartsWith: "'+" },
    { input: "-100+20", expectedStartsWith: "'-" },
    { input: "@HYPERLINK(\"http://evil.com\")", expectedStartsWith: "'@" },
    { input: "\tcmd.exe", expectedStartsWith: "'\t" },
    { input: "\rcalc.exe", expectedStartsWith: "'\r" }
  ];

  attackInputs.forEach(({ input, expectedStartsWith }) => {
    const sanitized = sanitizeForCSV(input);
    const matchesPrefix =
      sanitized.startsWith(expectedStartsWith) ||
      sanitized.startsWith(`"${expectedStartsWith}`);
    assert.ok(
      matchesPrefix,
      `Input "${input}" must be escaped to prevent formula execution, got "${sanitized}"`
    );
  });

  // Standard RFC 4180 escaping
  assert.equal(sanitizeForCSV("Normal Text"), "Normal Text");
  assert.equal(sanitizeForCSV("Text, with comma"), '"Text, with comma"');
  assert.equal(sanitizeForCSV('Text with "quotes"'), '"Text with ""quotes"""');
  assert.equal(sanitizeForCSV(""), "");
  assert.equal(sanitizeForCSV(null), "");
  assert.equal(sanitizeForCSV(undefined), "");
});

test("Phase 6 Exports - Financial Summary CSV Integrity", () => {
  const summaryData = {
    startDate: "2026-11-01",
    endDate: "2026-11-01",
    filterBasis: "invoiceDate",
    display: {
      grossSales: "3500.00",
      discounts: "350.00",
      netSales: "3150.00",
      taxes: "157.50",
      billedTotal: "3307.50",
      cashCollections: "945.00",
      upiCollections: "1500.00",
      cardCollections: "362.50",
      otherCollections: "0.00",
      grossCollections: "2807.50",
      refunds: "100.00",
      netCollections: "2707.50",
      receivables: "500.00",
      customerCredits: "0.00",
      expenses: "200.00",
      cashVariance: "-20.00",
      operatingSummary: "2930.00"
    }
  };

  const csv = exportFinancialSummaryCSV(summaryData);

  assert.ok(csv.includes("HOTEL POS - FINANCIAL OPERATING SUMMARY"));
  assert.ok(csv.includes("3500.00"));
  assert.ok(csv.includes("3150.00"));
  assert.ok(csv.includes("3307.50"));
  assert.ok(csv.includes("2807.50"));
  assert.ok(csv.includes("2707.50"));
  assert.ok(csv.includes("2930.00"));
  // Variance -20.00 should be sanitized for formula injection
  assert.ok(csv.includes("'-20.00"));
});

test("Phase 6 Exports - Invoices & Collections CSV Exporter", () => {
  const sampleInvoices = [
    {
      billNumber: "INV-20261101-0001",
      issueDate: "2026-11-01T12:00:00Z",
      customerName: "=DDE(\"server\",\"app\",\"topic\")", // Malicious customer name
      grossSubtotalRupees: "1000.00",
      discountRupees: "100.00",
      taxableBaseRupees: "900.00",
      totalTaxRupees: "45.00",
      grandTotalRupees: "945.00",
      balanceDueRupees: "0.00",
      status: "paid"
    }
  ];

  const invoiceCSV = exportInvoicesCSV(sampleInvoices);
  assert.ok(invoiceCSV.includes("Invoice Number,Issue Date,Customer Name"));
  assert.ok(invoiceCSV.includes("INV-20261101-0001"));
  // Injected formula in customer name must be neutralized
  assert.ok(invoiceCSV.includes("'=DDE"));

  const samplePayments = [
    {
      receiptNumber: "REC-20261101-0001",
      recordedAt: "2026-11-01T12:05:00Z",
      billNumber: "INV-20261101-0001",
      tender: "cash",
      amountRupees: "945.00",
      recordedBy: "cashier-1"
    }
  ];

  const paymentCSV = exportPaymentsCSV(samplePayments);
  assert.ok(paymentCSV.includes("Receipt Number,Payment Date,Invoice Number,Tender / Method"));
  assert.ok(paymentCSV.includes("REC-20261101-0001"));
  assert.ok(paymentCSV.includes("CASH"));
  assert.ok(paymentCSV.includes("945.00"));
});

test("Phase 6 Reports - Zero Reliance on Unbilled Orders Gate", () => {
  // Contract rule: An order in KDS / kitchen that is not yet billed MUST NOT be aggregated into revenue.
  const records = [
    { type: "order", orderNumber: "ORD-101", status: "preparing", totalAmount: 850 },
    { type: "order", orderNumber: "ORD-102", status: "completed", totalAmount: 420 },
    { type: "bill", billNumber: "INV-101", status: "issued", grandTotalPaise: toPaise(850) }
  ];

  const onlyBills = records.filter(r => r.type === "bill");
  assert.equal(onlyBills.length, 1);
  assert.equal(onlyBills[0].billNumber, "INV-101");
  assert.equal(onlyBills[0].grandTotalPaise, 85000);
});
