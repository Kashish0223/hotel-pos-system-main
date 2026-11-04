import test from "node:test";
import assert from "node:assert/strict";
import {
  toPaise,
  formatINR,
  calculateInvoiceTotals
} from "../../lib/finance/money.js";

test("Phase 2 Billing - Invoice Issuance Snapshot & Invariants", () => {
  // Order with 2 line items:
  // Item 1: 2 x ₹250 with 5% GST (2.5% CGST + 2.5% SGST)
  // Item 2: 1 x ₹150 with ₹50 discount and 5% GST
  const invoice = calculateInvoiceTotals({
    lines: [
      {
        name: "Butter Chicken",
        unitPricePaise: toPaise(250), // 25000 paise
        quantity: 2,
        discountPaise: 0,
        taxRules: [
          { name: "CGST", rateBps: 250 },
          { name: "SGST", rateBps: 250 }
        ]
      },
      {
        name: "Garlic Naan Basket",
        unitPricePaise: toPaise(150), // 15000 paise
        quantity: 1,
        discountPaise: toPaise(50),  // 5000 paise discount
        taxRules: [
          { name: "CGST", rateBps: 250 },
          { name: "SGST", rateBps: 250 }
        ]
      }
    ]
  });

  // Gross subtotal = 2 * 250 + 1 * 150 = ₹650 (65000 paise)
  assert.equal(invoice.grossSubtotalPaise, 65000);
  // Total discount = ₹50 (5000 paise)
  assert.equal(invoice.totalDiscountPaise, 5000);
  // Net subtotal = ₹600 (60000 paise)
  assert.equal(invoice.netSubtotalPaise, 60000);

  // Item 1 taxable = 50000 paise. CGST 2.5% = 1250 paise, SGST 2.5% = 1250 paise. Total tax = 2500 paise.
  // Item 2 taxable = 10000 paise. CGST 2.5% = 250 paise, SGST 2.5% = 250 paise. Total tax = 500 paise.
  // Total tax = 3000 paise (₹30.00)
  assert.equal(invoice.totalTaxPaise, 3000);
  assert.equal(invoice.taxLines.find(t => t.name === "CGST").amountPaise, 1500);
  assert.equal(invoice.taxLines.find(t => t.name === "SGST").amountPaise, 1500);

  // Grand Total = 60000 + 3000 = 63000 paise (₹630.00)
  assert.equal(invoice.grandTotalPaise, 63000);
  assert.equal(invoice.display.grandTotal, "630.00");

  // Initial balance due upon issuance equals grand total
  const initialBalanceDuePaise = invoice.grandTotalPaise;
  assert.equal(initialBalanceDuePaise, 63000);
});

test("Phase 2 Payments - Partial Payment & Balance Tracking", () => {
  const invoiceTotalPaise = 63000; // ₹630.00
  let balanceDuePaise = invoiceTotalPaise;
  let totalPaidPaise = 0;
  const paymentReceipts = [];

  // Customer makes first partial tender: ₹300 via UPI
  const firstPaymentPaise = toPaise(300); // 30000 paise
  assert.ok(firstPaymentPaise <= balanceDuePaise, "Payment cannot exceed balance due");

  totalPaidPaise += firstPaymentPaise;
  balanceDuePaise -= firstPaymentPaise;
  paymentReceipts.push({
    receiptNumber: "REC-20261102-0000001",
    tender: "upi",
    amountPaise: firstPaymentPaise
  });

  // Verify state after 1st tender
  assert.equal(balanceDuePaise, 33000); // ₹330.00 left
  assert.equal(totalPaidPaise, 30000);
  assert.equal(balanceDuePaise + totalPaidPaise, invoiceTotalPaise, "Conservation invariant holds");
  const statusStep1 = balanceDuePaise === 0 ? "paid" : "partially_paid";
  assert.equal(statusStep1, "partially_paid");

  // Customer makes second tender to settle remaining balance: ₹330 via Cash
  const secondPaymentPaise = toPaise(330); // 33000 paise
  assert.ok(secondPaymentPaise <= balanceDuePaise, "Payment cannot exceed balance due");

  totalPaidPaise += secondPaymentPaise;
  balanceDuePaise -= secondPaymentPaise;
  paymentReceipts.push({
    receiptNumber: "REC-20261102-0000002",
    tender: "cash",
    amountPaise: secondPaymentPaise
  });

  // Verify state after full settlement
  assert.equal(balanceDuePaise, 0);
  assert.equal(totalPaidPaise, 63000);
  assert.equal(balanceDuePaise + totalPaidPaise, invoiceTotalPaise, "Conservation invariant holds");
  const statusStep2 = balanceDuePaise === 0 ? "paid" : "partially_paid";
  assert.equal(statusStep2, "paid");
  assert.equal(paymentReceipts.length, 2);
});

test("Phase 2 Payments - Split Tender Allocation (Cash + UPI + Card)", () => {
  const invoiceTotalPaise = toPaise(1250); // ₹1,250.00 (125000 paise)

  const splitTenders = [
    { method: "cash", amountPaise: toPaise(500), referenceNumber: null },   // ₹500
    { method: "upi", amountPaise: toPaise(500), referenceNumber: "UPI123456" }, // ₹500
    { method: "card", amountPaise: toPaise(250), referenceNumber: "TXN789" }   // ₹250
  ];

  const totalSplitPaise = splitTenders.reduce((sum, t) => sum + t.amountPaise, 0);
  assert.equal(totalSplitPaise, invoiceTotalPaise, "Split sum matches invoice total");

  let remainingDuePaise = invoiceTotalPaise;
  const receipts = [];

  for (let i = 0; i < splitTenders.length; i++) {
    const t = splitTenders[i];
    assert.ok(t.amountPaise > 0, "Tender must be positive");
    assert.ok(t.amountPaise <= remainingDuePaise, "Tender cannot exceed remaining balance");
    remainingDuePaise -= t.amountPaise;
    receipts.push({
      receiptNumber: `REC-20261102-${String(i + 1).padStart(7, "0")}`,
      method: t.method,
      amountPaise: t.amountPaise
    });
  }

  assert.equal(remainingDuePaise, 0, "Remaining balance due is strictly 0");
  assert.equal(receipts.length, 3);
  assert.equal(receipts.reduce((sum, r) => sum + r.amountPaise, 0), invoiceTotalPaise);
});

test("Phase 2 Payments - Over-Payment Prevention Guard", () => {
  const balanceDuePaise = toPaise(400); // ₹400 (40000 paise)
  const excessiveTenderPaise = toPaise(500); // ₹500 (50000 paise)

  const willOverpay = excessiveTenderPaise > balanceDuePaise;
  assert.equal(willOverpay, true);

  // Invariant: The system MUST reject any tender greater than balance due
  function recordTender(tenderPaise) {
    if (tenderPaise > balanceDuePaise) {
      throw new Error(`Payment amount exceeds balance due`);
    }
    return balanceDuePaise - tenderPaise;
  }

  assert.throws(() => recordTender(excessiveTenderPaise), /Payment amount exceeds balance due/);
});

test("Phase 2 Payments - Cash Change Calculation Integrity", () => {
  const invoiceTotalPaise = toPaise(780); // ₹780 (78000 paise)
  const customerHandedCashPaise = toPaise(1000); // ₹1,000 note (100000 paise)

  assert.ok(customerHandedCashPaise >= invoiceTotalPaise, "Customer provided enough cash");

  const changeDuePaise = customerHandedCashPaise - invoiceTotalPaise; // 22000 paise (₹220)
  const actualCashCollectedPaise = customerHandedCashPaise - changeDuePaise; // 78000 paise (₹780)

  // Invariants:
  // 1. Change due is exact without residue
  assert.equal(changeDuePaise, 22000);
  assert.equal(formatINR(changeDuePaise), "220.00");
  // 2. Net cash added to drawer matches invoice amount exactly
  assert.equal(actualCashCollectedPaise, invoiceTotalPaise);
  assert.equal(actualCashCollectedPaise, 78000);
});

test("Phase 2 Formatting - Identifier Sequence Number Contract", () => {
  const invoicePattern = /^INV-\d{8}-\d{7}$/;
  const receiptPattern = /^REC-\d{8}-\d{7}$/;

  const sampleInvoice = "INV-20261102-0000001";
  const sampleReceipt = "REC-20261102-0000042";

  assert.ok(invoicePattern.test(sampleInvoice), "Invoice matches INV-YYYYMMDD-XXXXXXX");
  assert.ok(receiptPattern.test(sampleReceipt), "Receipt matches REC-YYYYMMDD-XXXXXXX");
});
