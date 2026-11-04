import { toPaise, formatINR, roundHalfUp } from "./money.js";

/**
 * Valid types for cash movements within a register session
 */
export const CASH_MOVEMENT_TYPES = {
  CASH_IN: "cash_in",         // Additional float / change added
  PETTY_CASH: "petty_cash",   // Incidental authorized expense
  CASH_OUT: "cash_out",       // Manager drawer withdrawal
  BANK_DROP: "bank_drop"      // Mid-shift safe/bank transfer
};

/**
 * Standard reasons for cash movements
 */
export const MOVEMENT_REASON_CODES = [
  { code: "float_topup", label: "Float Top-up / Extra Change", type: "cash_in" },
  { code: "petty_expense", label: "Petty Cash Expense (Supplies/Repairs)", type: "petty_cash" },
  { code: "vendor_payout", label: "Spot Vendor Payment", type: "cash_out" },
  { code: "safe_drop", label: "Mid-Shift Bank/Safe Drop", type: "bank_drop" },
  { code: "manager_withdrawal", label: "Manager Authorized Withdrawal", type: "cash_out" }
];

/**
 * Calculate expected cash drawer balance and shift reconciliation metrics.
 * 
 * Formula:
 * Expected Drawer = Opening Float
 *                 + Cash Receipts (net of change given)
 *                 + Manual Cash In
 *                 - Cash Refunds (authorized via Phase 3 credit notes)
 *                 - Authorized Cash Out / Bank Drops / Petty Cash
 * 
 * Variance = Counted Cash - Expected Drawer
 * 
 * Invariants:
 * 1. Non-cash tenders (UPI, Card) are tracked separately and NEVER inflate the physical cash drawer.
 * 2. A cash shortage is an operational cash loss, NEVER a deduction from recognized sales.
 * 
 * @param {Object} params
 * @param {number} params.openingFloatPaise - Initial cash in drawer
 * @param {number} [params.cashSalesPaise=0] - Cash receipts collected from bills
 * @param {number} [params.cashRefundsPaise=0] - Cash refunds disbursed to guests
 * @param {number} [params.cashInPaise=0] - Additional cash added during shift
 * @param {number} [params.cashOutPaise=0] - Cash removed for petty cash, vendor, or safe drops
 * @param {number} [params.countedCashPaise=0] - Physical cash counted at close
 * @param {number} [params.upiSalesPaise=0] - Non-cash UPI collections
 * @param {number} [params.cardSalesPaise=0] - Non-cash Card collections
 * @returns {Object} Reconciliation summary
 */
export function calculateSessionReconciliation({
  openingFloatPaise = 0,
  cashSalesPaise = 0,
  cashRefundsPaise = 0,
  cashInPaise = 0,
  cashOutPaise = 0,
  countedCashPaise = 0,
  upiSalesPaise = 0,
  cardSalesPaise = 0
}) {
  const openingFloat = Math.max(0, Math.round(openingFloatPaise || 0));
  const cashSales = Math.max(0, Math.round(cashSalesPaise || 0));
  const cashRefunds = Math.max(0, Math.round(cashRefundsPaise || 0));
  const cashIn = Math.max(0, Math.round(cashInPaise || 0));
  const cashOut = Math.max(0, Math.round(cashOutPaise || 0));
  const counted = Math.max(0, Math.round(countedCashPaise || 0));
  const upiSales = Math.max(0, Math.round(upiSalesPaise || 0));
  const cardSales = Math.max(0, Math.round(cardSalesPaise || 0));

  // Expected cash in physical drawer
  const netCashFromOperations = cashSales - cashRefunds;
  const netManualMovements = cashIn - cashOut;
  const expectedCashPaise = openingFloat + netCashFromOperations + netManualMovements;

  // Variance: positive = overage, negative = shortage
  const cashVariancePaise = counted - expectedCashPaise;
  const varianceType = cashVariancePaise === 0 ? "balanced" : cashVariancePaise > 0 ? "overage" : "shortage";

  // Total collections across all tenders
  const totalSalesCollectionsPaise = cashSales + upiSales + cardSales;

  return {
    openingFloatPaise: openingFloat,
    cashSalesPaise: cashSales,
    cashRefundsPaise: cashRefunds,
    netCashFromOperationsPaise: netCashFromOperations,
    cashInPaise: cashIn,
    cashOutPaise: cashOut,
    netManualMovementsPaise: netManualMovements,
    expectedCashPaise,
    countedCashPaise: counted,
    cashVariancePaise,
    varianceType,
    // Non-cash tenders
    upiSalesPaise,
    cardSalesPaise,
    totalSalesCollectionsPaise,
    // Display helpers
    display: {
      openingFloat: formatINR(openingFloat),
      cashSales: formatINR(cashSales),
      cashRefunds: formatINR(cashRefunds),
      cashIn: formatINR(cashIn),
      cashOut: formatINR(cashOut),
      expectedCash: formatINR(expectedCashPaise),
      countedCash: formatINR(counted),
      cashVariance: (cashVariancePaise < 0 ? "-" : "+") + formatINR(Math.abs(cashVariancePaise)),
      upiSales: formatINR(upiSales),
      cardSales: formatINR(cardSales),
      totalSalesCollections: formatINR(totalSalesCollectionsPaise)
    }
  };
}

/**
 * Calculate total counted cash from currency denomination counts.
 * 
 * @param {Object} denominations - Map of denomination to count, e.g. { "500": 4, "200": 5, "100": 10 }
 * @returns {number} Total counted cash in paise
 */
export function calculateDenominationsPaise(denominations = {}) {
  let totalPaise = 0;
  for (const [denomStr, count] of Object.entries(denominations)) {
    if (denomStr.toLowerCase() === "coins") {
      const coinRupees = parseFloat(count);
      if (!isNaN(coinRupees) && coinRupees > 0) {
        totalPaise += Math.round(coinRupees * 100);
      }
      continue;
    }
    const denomRupees = parseFloat(denomStr);
    const qty = parseInt(count, 10);
    if (!isNaN(denomRupees) && !isNaN(qty) && qty > 0) {
      totalPaise += Math.round(denomRupees * 100) * qty;
    }
  }
  return totalPaise;
}
