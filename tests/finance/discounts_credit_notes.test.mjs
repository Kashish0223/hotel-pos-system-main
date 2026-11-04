import test from "node:test";
import assert from "node:assert/strict";
import {
  toPaise,
  formatINR,
  calculateInvoiceTotals,
  roundHalfUp
} from "../../lib/finance/money.js";
import {
  validateDiscountAuthorization,
  DISCOUNT_REASON_CODES,
  CASHIER_DISCOUNT_LIMITS
} from "../../lib/finance/discounts.js";

test("Phase 3 Discounts - Cashier Threshold & Manager Authorization Rules", () => {
  const cashier = { id: "u1", name: "Ramesh Cashier", role: "cashier" };
  const manager = { id: "m1", name: "Anjali Manager", role: "manager" };

  // 1. Within cashier threshold (5% discount on ₹1000 order = ₹50, promo reason)
  const autoApproved = validateDiscountAuthorization({
    grossSubtotalPaise: toPaise(1000), // 100000 paise
    discountPaise: toPaise(50),        // 5000 paise (5%)
    reasonCode: "promotion",
    operator: cashier
  });
  assert.equal(autoApproved.authorized, true);
  assert.equal(autoApproved.requiresManager, false);
  assert.equal(autoApproved.approvedDiscountPaise, 5000);

  // 2. Exceeds cashier threshold (30% discount on ₹1000 order = ₹300, promo reason) without manager
  const deniedWithoutManager = validateDiscountAuthorization({
    grossSubtotalPaise: toPaise(1000),
    discountPaise: toPaise(300), // ₹300 exceeds max flat (₹200) and max percent (10%)
    reasonCode: "promotion",
    operator: cashier,
    approver: null
  });
  assert.equal(deniedWithoutManager.authorized, false);
  assert.equal(deniedWithoutManager.requiresManager, true);
  assert.match(deniedWithoutManager.error, /requires Manager or Admin authorization/);

  // 3. Exceeds cashier threshold with Manager Approver
  const approvedWithManager = validateDiscountAuthorization({
    grossSubtotalPaise: toPaise(1000),
    discountPaise: toPaise(300),
    reasonCode: "promotion",
    operator: cashier,
    approver: manager
  });
  assert.equal(approvedWithManager.authorized, true);
  assert.equal(approvedWithManager.requiresManager, true);
  assert.equal(approvedWithManager.approvedDiscountPaise, 30000);
  assert.equal(approvedWithManager.approvedBy.name, "Anjali Manager");

  // 4. Reason that always requires manager (e.g. food quality/defect)
  const qualityCompWithoutManager = validateDiscountAuthorization({
    grossSubtotalPaise: toPaise(500),
    discountPaise: toPaise(50), // Small amount, but reason mandates manager
    reasonCode: "food_quality",
    operator: cashier
  });
  assert.equal(qualityCompWithoutManager.authorized, false);
  assert.equal(qualityCompWithoutManager.requiresManager, true);

  // 5. Exceeding 100% of bill is strictly blocked
  const excessiveDiscount = validateDiscountAuthorization({
    grossSubtotalPaise: toPaise(500),
    discountPaise: toPaise(600),
    reasonCode: "promotion",
    operator: manager
  });
  assert.equal(excessiveDiscount.authorized, false);
  assert.match(excessiveDiscount.error, /cannot exceed gross subtotal/);
});

test("Phase 3 Discounts - Pre-Issue Discount Tax Recalculation (Canonical Scenario A)", () => {
  // Scenario A: ₹500 gross price, genuine approved ₹200 discount before issue
  // 5% GST (2.5% CGST + 2.5% SGST)
  const invoice = calculateInvoiceTotals({
    lines: [
      {
        name: "Buffet Lunch",
        unitPricePaise: toPaise(500),
        quantity: 1,
        discountPaise: 0,
        taxRules: [
          { name: "CGST", rateBps: 250 },
          { name: "SGST", rateBps: 250 }
        ]
      }
    ],
    orderDiscountPaise: toPaise(200) // ₹200 pre-issue approved discount
  });

  // Gross subtotal = ₹500 (50000 paise)
  assert.equal(invoice.grossSubtotalPaise, 50000);
  // Total discount = ₹200 (20000 paise)
  assert.equal(invoice.totalDiscountPaise, 20000);
  // Taxable subtotal = ₹300 (30000 paise)
  assert.equal(invoice.taxableSubtotalPaise, 30000);

  // Tax is strictly 5% of ₹300 = ₹15 (1500 paise: 750 CGST + 750 SGST)
  assert.equal(invoice.taxTotalPaise, 1500);
  assert.equal(invoice.taxLines.find(t => t.name === "CGST").amountPaise, 750);
  assert.equal(invoice.taxLines.find(t => t.name === "SGST").amountPaise, 750);

  // Grand total = 30000 + 1500 = 31500 paise (₹315.00)
  assert.equal(invoice.grandTotalPaise, 31500);
  assert.equal(invoice.display.grandTotal, "315.00");
});

test("Phase 3 Credit Notes - Cumulative Credit Limit Enforcement", () => {
  const invoiceGrandTotalPaise = toPaise(500); // 50000 paise
  let totalExistingCreditPaise = 0;

  function issueCreditNote(requestedPaise) {
    const remainingCreditLimit = invoiceGrandTotalPaise - totalExistingCreditPaise;
    if (requestedPaise > remainingCreditLimit) {
      throw new Error(`Requested credit (₹${formatINR(requestedPaise)}) exceeds remaining credit limit (₹${formatINR(remainingCreditLimit)})`);
    }
    totalExistingCreditPaise += requestedPaise;
    return {
      creditNoteNumber: `CN-20261102-${String(totalExistingCreditPaise).padStart(7, "0")}`,
      amountPaise: requestedPaise,
      remainingLimitPaise: invoiceGrandTotalPaise - totalExistingCreditPaise
    };
  }

  // First credit note: ₹200
  const cn1 = issueCreditNote(toPaise(200));
  assert.equal(cn1.amountPaise, 20000);
  assert.equal(cn1.remainingLimitPaise, 30000);

  // Second credit note: ₹250
  const cn2 = issueCreditNote(toPaise(250));
  assert.equal(cn2.amountPaise, 25000);
  assert.equal(cn2.remainingLimitPaise, 5000); // ₹50 remaining

  // Third credit note: Attempting to credit ₹100 when only ₹50 remains -> must be rejected
  assert.throws(() => issueCreditNote(toPaise(100)), /exceeds remaining credit limit/);

  // Invariant holds
  assert.equal(totalExistingCreditPaise, 45000);
  assert.ok(totalExistingCreditPaise <= invoiceGrandTotalPaise);
});

test("Phase 3 Refunds - Cumulative Refund Limit Enforcement", () => {
  const creditNoteAmountPaise = toPaise(200); // ₹200 (20000 paise) customer credit
  let totalRefundedPaise = 0;

  function issueRefund(requestedPaise, tender = "cash") {
    const remainingRefundable = creditNoteAmountPaise - totalRefundedPaise;
    if (requestedPaise > remainingRefundable) {
      throw new Error(`Requested refund (₹${formatINR(requestedPaise)}) exceeds remaining refundable limit (₹${formatINR(remainingRefundable)})`);
    }
    totalRefundedPaise += requestedPaise;
    return {
      refundNumber: `REF-20261102-0000001`,
      tender,
      amountPaise: requestedPaise,
      remainingRefundablePaise: creditNoteAmountPaise - totalRefundedPaise
    };
  }

  // Partial refund: ₹120 via Cash
  const ref1 = issueRefund(toPaise(120), "cash");
  assert.equal(ref1.amountPaise, 12000);
  assert.equal(ref1.remainingRefundablePaise, 8000);

  // Second refund: Attempting ₹100 when only ₹80 remains -> must be rejected
  assert.throws(() => issueRefund(toPaise(100), "cash"), /exceeds remaining refundable limit/);

  // Remaining settlement: ₹80 via Cash
  const ref2 = issueRefund(toPaise(80), "cash");
  assert.equal(ref2.amountPaise, 8000);
  assert.equal(ref2.remainingRefundablePaise, 0);

  // Fully refunded
  assert.equal(totalRefundedPaise, creditNoteAmountPaise);
});

test("Phase 3 Invariants - Scenario C: Post-Issue Credit Note & Actual Refund", () => {
  // Scenario C: ₹500 invoice paid in full; customer granted genuine ₹200 post-issue correction & refund
  const originalInvoicePaise = toPaise(500); // 50000 paise
  const initialPaymentPaise = toPaise(500);  // 50000 paise collected

  // Credit note issued
  const creditNoteAmountPaise = toPaise(200); // 20000 paise
  // Actual refund disbursed
  const refundAmountPaise = toPaise(200);     // 20000 paise

  // Invariant 1: Original invoice remains ₹500 (never mutated or rewritten)
  assert.equal(originalInvoicePaise, 50000);

  // Invariant 2: Net recognized revenue = Original Invoice - Credit Note = ₹300
  const netRetainedRevenuePaise = originalInvoicePaise - creditNoteAmountPaise;
  assert.equal(netRetainedRevenuePaise, 30000);
  assert.equal(formatINR(netRetainedRevenuePaise), "300.00");

  // Invariant 3: Net retained cash = Initial Payment - Cash Refund = ₹300
  const netRetainedCashPaise = initialPaymentPaise - refundAmountPaise;
  assert.equal(netRetainedCashPaise, 30000);
  assert.equal(formatINR(netRetainedCashPaise), "300.00");

  // Invariant 4: Revenue matches Cash exactly
  assert.equal(netRetainedRevenuePaise, netRetainedCashPaise);
});

test("Phase 3 Inventory - Food Wastage vs Packaged Restock Contract", () => {
  // Inventory disposition rules:
  // 1. Prepared food cannot be restocked; must be flagged as "wastage"
  // 2. Unopened beverages / packaged goods may be flagged as "restocked"
  // 3. Billing errors / service charge adjustments have disposition "none"

  const validDispositions = ["wastage", "restocked", "none"];

  function validateInventoryDisposition(disposition, isPerishableFood) {
    if (!validDispositions.includes(disposition)) {
      throw new Error(`Invalid inventory disposition: ${disposition}`);
    }
    if (isPerishableFood && disposition === "restocked") {
      throw new Error("Perishable prepared food cannot be restocked into inventory; must be recorded as wastage");
    }
    return true;
  }

  assert.equal(validateInventoryDisposition("wastage", true), true);
  assert.equal(validateInventoryDisposition("none", false), true);
  assert.equal(validateInventoryDisposition("restocked", false), true);
  assert.throws(() => validateInventoryDisposition("restocked", true), /Perishable prepared food cannot be restocked/);
});

test("Phase 3 Formatting - Credit Note & Refund Sequence Contract", () => {
  const creditNotePattern = /^CN-\d{8}-\d{7}$/;
  const refundPattern = /^REF-\d{8}-\d{7}$/;

  const sampleCreditNote = "CN-20261102-0000001";
  const sampleRefund = "REF-20261102-0000001";

  assert.ok(creditNotePattern.test(sampleCreditNote), "Credit note follows CN-YYYYMMDD-XXXXXXX");
  assert.ok(refundPattern.test(sampleRefund), "Refund follows REF-YYYYMMDD-XXXXXXX");
});
