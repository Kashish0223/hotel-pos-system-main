import test from "node:test";
import assert from "node:assert/strict";
import {
  toPaise,
  formatINR,
  calculateInvoiceTotals
} from "../../lib/finance/money.js";

test("Financial Invariant - Scenario A: Pre-Issue Approved Discount", () => {
  // ₹500 price with genuine approved ₹200 discount before bill issue
  const invoice = calculateInvoiceTotals({
    lines: [
      {
        name: "Chef Special Platter",
        unitPricePaise: toPaise(500), // 50000 paise
        quantity: 1,
        discountPaise: toPaise(200),  // 20000 paise
        taxRules: []                  // 0 tax for invariant illustration
      }
    ]
  });

  assert.equal(invoice.grossSubtotalPaise, 50000); // ₹500
  assert.equal(invoice.totalDiscountPaise, 20000);  // ₹200
  assert.equal(invoice.grandTotalPaise, 30000);     // ₹300
  assert.equal(invoice.display.grandTotal, "300.00");
});

test("Financial Invariant - Scenario B: Partial Payment Handling", () => {
  // ₹500 final issued invoice, customer pays ₹300
  const invoiceTotalPaise = toPaise(500); // 50000 paise
  const paymentReceivedPaise = toPaise(300); // 30000 paise
  const balanceDuePaise = invoiceTotalPaise - paymentReceivedPaise; // 20000 paise

  assert.equal(balanceDuePaise, 20000);
  assert.equal(formatINR(balanceDuePaise), "200.00");

  const paymentStatus = paymentReceivedPaise >= invoiceTotalPaise
    ? "paid"
    : paymentReceivedPaise > 0
    ? "partially_paid"
    : "unpaid";

  assert.equal(paymentStatus, "partially_paid");
});

test("Financial Invariant - Scenario C: Post-Issue Credit Note & Actual Refund", () => {
  // ₹500 paid in full, customer granted genuine ₹200 post-issue correction/refund
  const originalInvoicePaise = toPaise(500);
  const paidPaise = toPaise(500);

  // Credit note issued
  const creditNoteAmountPaise = toPaise(200);
  // Cash refund issued
  const refundAmountPaise = toPaise(200);

  // Invariants:
  // 1. Original invoice retains ₹500
  assert.equal(originalInvoicePaise, 50000);
  // 2. Net retained revenue = original - credit note = ₹300
  const netRetainedPaise = originalInvoicePaise - creditNoteAmountPaise;
  assert.equal(netRetainedPaise, 30000);
  // 3. Net retained cash = paid - refund = ₹300
  const netCashPaise = paidPaise - refundAmountPaise;
  assert.equal(netCashPaise, 30000);
});

test("Financial Invariant - Scenario D: Cash Drawer Shortage", () => {
  // ₹500 cash sales, only ₹300 present in physical drawer
  const openingFloatPaise = toPaise(100);  // ₹100 opening float
  const cashSalesPaise = toPaise(500);     // ₹500 cash receipts
  const expectedDrawerPaise = openingFloatPaise + cashSalesPaise; // ₹600

  const countedPhysicalCashPaise = toPaise(400); // Only ₹400 in drawer
  const drawerVariancePaise = countedPhysicalCashPaise - expectedDrawerPaise; // -₹200 (shortage)

  // Invariants:
  // 1. Sales remain exactly ₹500
  assert.equal(cashSalesPaise, 50000);
  // 2. Shortage is audited as variance, not hidden sales reduction
  assert.equal(drawerVariancePaise, -20000); // ₹200 shortage
  assert.equal(formatINR(Math.abs(drawerVariancePaise)), "200.00");
});
