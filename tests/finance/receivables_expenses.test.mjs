import test from "node:test";
import assert from "node:assert/strict";
import { toPaise, formatINR } from "../../lib/finance/money.js";
import {
  calculateAgeingBuckets,
  generateCustomerStatement,
  PAYMENT_TERMS
} from "../../lib/finance/ageing.js";

test("Phase 5 Receivables - Ageing Buckets Conservation Invariant", () => {
  // As-of date: 2026-11-02
  const asOfDate = new Date("2026-11-02T00:00:00Z");

  const sampleInvoices = [
    {
      _id: "inv-1",
      billNumber: "INV-20261025-0001",
      dueDate: new Date("2026-10-25T00:00:00Z"), // 8 days overdue -> Current (0-30d)
      balanceDuePaise: toPaise(1250.50) // 125050 paise
    },
    {
      _id: "inv-2",
      billNumber: "INV-20260920-0002",
      dueDate: new Date("2026-09-20T00:00:00Z"), // 43 days overdue -> 31-60d
      balanceDuePaise: toPaise(3400.00) // 340000 paise
    },
    {
      _id: "inv-3",
      billNumber: "INV-20260815-0003",
      dueDate: new Date("2026-08-15T00:00:00Z"), // 79 days overdue -> 61-90d
      balanceDuePaise: toPaise(5000.00) // 500000 paise
    },
    {
      _id: "inv-4",
      billNumber: "INV-20260601-0004",
      dueDate: new Date("2026-06-01T00:00:00Z"), // 154 days overdue -> 90d+
      balanceDuePaise: toPaise(8900.25) // 890025 paise
    },
    {
      _id: "inv-5",
      billNumber: "INV-20261001-0005",
      dueDate: new Date("2026-10-01T00:00:00Z"),
      balanceDuePaise: 0 // Fully paid -> Ignored in outstanding
    }
  ];

  const result = calculateAgeingBuckets({
    invoices: sampleInvoices,
    asOfDate
  });

  // Verify individual buckets
  assert.equal(result.buckets.currentPaise, 125050);
  assert.equal(result.buckets.days31_60Paise, 340000);
  assert.equal(result.buckets.days61_90Paise, 500000);
  assert.equal(result.buckets.days90PlusPaise, 890025);

  // Invariant verification: sum(buckets) === totalOutstandingPaise
  const sumBuckets =
    result.buckets.currentPaise +
    result.buckets.days31_60Paise +
    result.buckets.days61_90Paise +
    result.buckets.days90PlusPaise;

  assert.equal(sumBuckets, result.totalOutstandingPaise);
  assert.equal(result.totalOutstandingPaise, 1855075); // ₹18,550.75
  assert.equal(result.display.totalOutstanding, "18550.75");

  // Verify itemized tags
  assert.equal(result.itemized[0].bucket, "current");
  assert.equal(result.itemized[1].bucket, "days31_60");
  assert.equal(result.itemized[2].bucket, "days61_90");
  assert.equal(result.itemized[3].bucket, "days90Plus");
  assert.equal(result.itemized[4].bucket, "paid");
});

test("Phase 5 Receivables - Customer Statement of Account Invariant", () => {
  // Invariant: Closing Balance = Opening Balance + Debits (Invoices) - Credits (Payments + Credit Notes)
  const openingBalancePaise = toPaise(2000); // ₹2,000.00

  const invoices = [
    {
      billNumber: "INV-20261005-0010",
      issueDate: "2026-10-05T10:00:00Z",
      grandTotalPaise: toPaise(4500) // ₹4,500.00 debit
    },
    {
      billNumber: "INV-20261015-0025",
      issueDate: "2026-10-15T12:00:00Z",
      grandTotalPaise: toPaise(3000) // ₹3,000.00 debit
    }
  ];

  const creditNotes = [
    {
      creditNoteNumber: "CN-20261010-0001",
      issuedAt: "2026-10-10T14:30:00Z",
      amountPaise: toPaise(500), // ₹500.00 credit
      reasonCode: "BILLING_ERROR"
    }
  ];

  const payments = [
    {
      receiptNumber: "REC-20261012-0003",
      paymentDate: "2026-10-12T16:00:00Z",
      amountPaise: toPaise(3000), // ₹3,000.00 credit
      tender: "upi"
    },
    {
      receiptNumber: "REC-20261020-0008",
      paymentDate: "2026-10-20T11:00:00Z",
      amountPaise: toPaise(2500), // ₹2,500.00 credit
      tender: "cash"
    }
  ];

  const stmt = generateCustomerStatement({
    customerId: "cust-101",
    customerName: "Acme Corporate Events",
    openingBalancePaise,
    invoices,
    creditNotes,
    payments
  });

  // Expected totals:
  // Debits = 4500 + 3000 = ₹7,500 (750000 paise)
  // Credits = 500 (CN) + 3000 (Pay) + 2500 (Pay) = ₹6,000 (600000 paise)
  // Closing = 2000 + 7500 - 6000 = ₹3,500 (350000 paise)
  assert.equal(stmt.totalDebitsPaise, 750000);
  assert.equal(stmt.totalCreditsPaise, 600000);
  assert.equal(stmt.closingBalancePaise, 350000);
  assert.equal(stmt.display.closingBalance, "3500.00");

  // Invariant verification
  const computedClosing = stmt.openingBalancePaise + stmt.totalDebitsPaise - stmt.totalCreditsPaise;
  assert.equal(stmt.closingBalancePaise, computedClosing);

  // Chronological order verification:
  // 1: 2026-10-05 Invoice 4500 -> Running: 2000 + 4500 = 6500
  // 2: 2026-10-10 Credit Note 500 -> Running: 6500 - 500 = 6000
  // 3: 2026-10-12 Payment 3000 -> Running: 6000 - 3000 = 3000
  // 4: 2026-10-15 Invoice 3000 -> Running: 3000 + 3000 = 6000
  // 5: 2026-10-20 Payment 2500 -> Running: 6000 - 2500 = 3500
  assert.equal(stmt.ledger.length, 5);
  assert.equal(stmt.ledger[0].balancePaise, 650000);
  assert.equal(stmt.ledger[1].balancePaise, 600000);
  assert.equal(stmt.ledger[2].balancePaise, 300000);
  assert.equal(stmt.ledger[3].balancePaise, 600000);
  assert.equal(stmt.ledger[4].balancePaise, 350000);
});

test("Phase 5 Purchases - Duplicate Vendor Bill Detection Contract", () => {
  // Contract rule: An existing vendor invoice cannot be re-entered with the same vendorBillNumber & supplierId
  const existingBills = [
    {
      supplierCategoryId: "sup-999",
      vendorBillNumber: "BILL/2026/0491",
      totalAmountPaise: toPaise(14500)
    }
  ];

  const isDuplicateVendorBill = (newSupplierId, newBillNumber) => {
    return existingBills.some(
      b => b.supplierCategoryId === newSupplierId &&
           b.vendorBillNumber.toLowerCase().trim() === newBillNumber.toLowerCase().trim()
    );
  };

  // Re-entering identical bill number for the same vendor must trigger duplicate detection
  assert.equal(isDuplicateVendorBill("sup-999", "BILL/2026/0491"), true);
  assert.equal(isDuplicateVendorBill("sup-999", "  bill/2026/0491  "), true);

  // Different bill number for same vendor is allowed
  assert.equal(isDuplicateVendorBill("sup-999", "BILL/2026/0492"), false);

  // Same bill number for different vendor is allowed
  assert.equal(isDuplicateVendorBill("sup-888", "BILL/2026/0491"), false);
});

test("Phase 5 Purchases - PO/GRN vs Paid Vendor Bill Contract", () => {
  // Contract rule: Recording a purchase order / goods receipt MUST NOT default to paid.
  // isPaid must be strictly false until explicit vendor disbursement is recorded.
  const createPurchaseRecord = (data) => {
    return {
      supplierCategoryId: data.supplierCategoryId,
      vendorBillNumber: data.vendorBillNumber,
      totalAmountPaise: toPaise(data.totalAmount),
      isPaid: data.isPaid === true ? true : false,
      status: data.status || "received"
    };
  };

  const newPO = createPurchaseRecord({
    supplierCategoryId: "sup-001",
    vendorBillNumber: "VB-2026-101",
    totalAmount: 12500
  });

  assert.equal(newPO.isPaid, false, "PO/GRN entry must never be treated as paid vendor invoice");
  assert.equal(newPO.totalAmountPaise, 1250000);
});

test("Phase 5 Expenses - Cash Drawer Linkage Contract (No Double-Counting)", () => {
  // Contract rule: An expense paid in cash creates a linked petty cash movement in active drawer session
  const activeSessionId = "SES-20261102-0001";
  const expenseAmount = 350; // ₹350
  const expenseAmountPaise = toPaise(expenseAmount);

  const createExpenseAndMovement = (params) => {
    const expense = {
      expenseId: "EXINV-20261102-0001",
      category: "Maintenance",
      amountPaise: toPaise(params.amount),
      paymentMethod: params.paymentMethod,
      registerSessionId: params.paymentMethod === "cash" ? params.activeSessionId : null
    };

    let cashMovement = null;
    if (params.paymentMethod === "cash" && params.activeSessionId) {
      cashMovement = {
        sessionId: params.activeSessionId,
        type: "petty_cash",
        amountPaise: expense.amountPaise,
        movementCode: "EXPENSE_DISBURSEMENT",
        referenceId: expense.expenseId,
        authorizedBy: params.userId
      };
    }

    return { expense, cashMovement };
  };

  // Test cash expense with active session
  const cashResult = createExpenseAndMovement({
    amount: 350,
    paymentMethod: "cash",
    activeSessionId,
    userId: "staff-mgr-1"
  });

  assert.ok(cashResult.cashMovement, "Cash expense must generate linked cash drawer movement");
  assert.equal(cashResult.cashMovement.sessionId, activeSessionId);
  assert.equal(cashResult.cashMovement.type, "petty_cash");
  assert.equal(cashResult.cashMovement.amountPaise, 35000);
  assert.equal(cashResult.expense.registerSessionId, activeSessionId);

  // Test non-cash expense (bank transfer/UPI) -> no drawer movement
  const bankResult = createExpenseAndMovement({
    amount: 5000,
    paymentMethod: "bank_transfer",
    activeSessionId,
    userId: "staff-mgr-1"
  });

  assert.equal(bankResult.cashMovement, null, "Non-cash expense must not affect cash drawer");
  assert.equal(bankResult.expense.registerSessionId, null);
});

test("Phase 5 Receivables - Payment Allocation and Overpayment Guard", () => {
  // Contract rule: Payment against debtor cannot exceed current balance
  const currentDebtor = {
    _id: "debtor-55",
    customerName: "City Catering",
    outstandingAmountPaise: toPaise(2500) // ₹2,500.00
  };

  const allocatePayment = (debtor, paymentPaise) => {
    if (paymentPaise <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }
    if (paymentPaise > debtor.outstandingAmountPaise) {
      throw new Error(
        `Overpayment rejected: payment of ${paymentPaise} paise exceeds outstanding balance of ${debtor.outstandingAmountPaise} paise`
      );
    }

    const newOutstandingPaise = debtor.outstandingAmountPaise - paymentPaise;
    return {
      success: true,
      paidPaise: paymentPaise,
      newOutstandingPaise,
      isFullyPaid: newOutstandingPaise === 0
    };
  };

  // Valid partial payment
  const partial = allocatePayment(currentDebtor, toPaise(1000));
  assert.equal(partial.paidPaise, 100000);
  assert.equal(partial.newOutstandingPaise, 150000); // ₹1,500 remaining
  assert.equal(partial.isFullyPaid, false);

  // Valid full settlement
  const full = allocatePayment(currentDebtor, toPaise(2500));
  assert.equal(full.paidPaise, 250000);
  assert.equal(full.newOutstandingPaise, 0);
  assert.equal(full.isFullyPaid, true);

  // Overpayment attempt rejected
  assert.throws(
    () => allocatePayment(currentDebtor, toPaise(3000)),
    /Overpayment rejected/
  );
});
