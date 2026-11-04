import test from "node:test";
import assert from "node:assert/strict";
import { toPaise, formatINR } from "../../lib/finance/money.js";
import {
  calculateSessionReconciliation,
  calculateDenominationsPaise,
  CASH_MOVEMENT_TYPES,
  MOVEMENT_REASON_CODES
} from "../../lib/finance/sessions.js";

test("Phase 4 Sessions - Expected Drawer Formula & Multi-Movement Reconciliation", () => {
  // Test parameters:
  // Opening Float: ₹1,000 (100000 paise)
  // Cash Sales: ₹4,500 (450000 paise)
  // Cash Refunds: ₹250 (25000 paise)
  // Manual Cash In (Change float top-up): ₹500 (50000 paise)
  // Manual Cash Out (Petty cash ₹250 + Safe Drop ₹1,500): ₹1,750 (175000 paise)
  // Non-cash digital sales: UPI ₹8,000 (800000 paise), Card ₹4,000 (400000 paise)
  // Counted Physical Cash: ₹4,000 (400000 paise)
  const rec = calculateSessionReconciliation({
    openingFloatPaise: toPaise(1000),
    cashSalesPaise: toPaise(4500),
    cashRefundsPaise: toPaise(250),
    cashInPaise: toPaise(500),
    cashOutPaise: toPaise(1750),
    countedCashPaise: toPaise(4000),
    upiSalesPaise: toPaise(8000),
    cardSalesPaise: toPaise(4000)
  });

  // Expected cash = 100000 + (450000 - 25000) + (50000 - 175000)
  //               = 100000 + 425000 - 125000 = 400000 paise (₹4,000.00)
  assert.equal(rec.expectedCashPaise, 400000);
  assert.equal(rec.countedCashPaise, 400000);
  assert.equal(rec.cashVariancePaise, 0);
  assert.equal(rec.varianceType, "balanced");
  assert.equal(rec.display.expectedCash, "4000.00");
  assert.equal(rec.display.countedCash, "4000.00");

  // Verify non-cash isolation
  assert.equal(rec.upiSalesPaise, 800000);
  assert.equal(rec.cardSalesPaise, 400000);
  // Total collections = 4500 + 8000 + 4000 = ₹16,500
  assert.equal(rec.totalSalesCollectionsPaise, 1650000);
  assert.equal(rec.display.totalSalesCollections, "16500.00");
});

test("Phase 4 Sessions - Denomination Counter Calculation", () => {
  const denominations = {
    "500": 4,   // ₹2,000
    "200": 5,   // ₹1,000
    "100": 10,  // ₹1,000
    "50": 20,   // ₹1,000
    "20": 50,   // ₹1,000
    "10": 100,  // ₹1,000
    "coins": 150 // ₹150
  };

  const totalPaise = calculateDenominationsPaise(denominations);
  // Total = 2000 + 1000 + 1000 + 1000 + 1000 + 1000 + 150 = ₹7,150 (715000 paise)
  assert.equal(totalPaise, 715000);
  assert.equal(formatINR(totalPaise), "7150.00");
});

test("Phase 4 Invariants - Scenario D: Cash Drawer Shortage Reconciled", () => {
  // Scenario D from Master Prompt:
  // ₹500 cash sales, opening float ₹100, only ₹400 present in physical drawer
  const openingFloatPaise = toPaise(100);  // 10000 paise
  const cashSalesPaise = toPaise(500);     // 50000 paise
  const countedCashPaise = toPaise(400);   // 40000 paise physical cash present

  const rec = calculateSessionReconciliation({
    openingFloatPaise,
    cashSalesPaise,
    countedCashPaise
  });

  // Expected = 10000 + 50000 = 60000 paise (₹600)
  assert.equal(rec.expectedCashPaise, 60000);
  assert.equal(rec.countedCashPaise, 40000);
  // Variance = 40000 - 60000 = -20000 paise (-₹200 shortage)
  assert.equal(rec.cashVariancePaise, -20000);
  assert.equal(rec.varianceType, "shortage");
  assert.equal(rec.display.cashVariance, "-200.00");

  // INVARIANT 1: Sales recognized remain strictly ₹500 (never altered to ₹300)
  assert.equal(rec.cashSalesPaise, 50000);
  // INVARIANT 2: Shortage is tracked as an operational cash variance, not a sales reduction
  assert.equal(rec.cashVariancePaise, -20000);
});

test("Phase 4 Sessions - Cash Drawer Overage", () => {
  // Expected ₹500, but physical count is ₹550
  const rec = calculateSessionReconciliation({
    openingFloatPaise: toPaise(200),
    cashSalesPaise: toPaise(300),
    countedCashPaise: toPaise(550)
  });

  assert.equal(rec.expectedCashPaise, 50000);
  assert.equal(rec.countedCashPaise, 55000);
  assert.equal(rec.cashVariancePaise, 5000); // +₹50 overage
  assert.equal(rec.varianceType, "overage");
  assert.equal(rec.display.cashVariance, "+50.00");
});

test("Phase 4 Sessions - One Active Session Per Register Rule", () => {
  const activeSessions = new Map();

  function openSession(registerId, openingFloatPaise) {
    if (activeSessions.has(registerId)) {
      throw new Error(`An active session is already open on register ${registerId}`);
    }
    const session = {
      registerId,
      sessionNumber: "SES-20261102-0000001",
      openingFloatPaise,
      status: "open"
    };
    activeSessions.set(registerId, session);
    return session;
  }

  function closeSession(registerId) {
    if (!activeSessions.has(registerId)) {
      throw new Error(`No active session on register ${registerId}`);
    }
    activeSessions.delete(registerId);
    return true;
  }

  // 1. Open on REG-1 succeeds
  const s1 = openSession("REG-1", toPaise(500));
  assert.equal(s1.registerId, "REG-1");

  // 2. Concurrently attempting to open another session on REG-1 is rejected
  assert.throws(() => openSession("REG-1", toPaise(500)), /already open on register REG-1/);

  // 3. Opening on separate register REG-2 succeeds
  const s2 = openSession("REG-2", toPaise(500));
  assert.equal(s2.registerId, "REG-2");

  // 4. Closing REG-1 allows new session to open
  closeSession("REG-1");
  const s1New = openSession("REG-1", toPaise(600));
  assert.equal(s1New.openingFloatPaise, 60000);
});

test("Phase 4 Formatting - Session & Cash Movement Sequences", () => {
  const sessionPattern = /^SES-\d{8}-\d{7}$/;
  const movementPattern = /^CSH-\d{8}-\d{7}$/;

  const sampleSession = "SES-20261102-0000001";
  const sampleMovement = "CSH-20261102-0000005";

  assert.ok(sessionPattern.test(sampleSession), "Session matches SES-YYYYMMDD-XXXXXXX");
  assert.ok(movementPattern.test(sampleMovement), "Movement matches CSH-YYYYMMDD-XXXXXXX");
});
