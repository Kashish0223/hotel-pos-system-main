import { toPaise, formatINR } from "./money.js";

/**
 * Authoritative Financial Aggregation Engine
 * 
 * Computes exact financial metrics from authoritative transaction collections:
 * bills, payments, credit_notes, refunds, expenses, and register_sessions.
 * 
 * Rules & Invariants:
 * 1. Revenue is NEVER aggregated from unbilled orders. Only authoritative bills count.
 * 2. Gross Sales - Discounts === Net Sales (Taxable Turnover).
 * 3. Net Sales + Output Tax === Billed Total.
 * 4. Gross Collections - Refunds === Net Collections Realized.
 * 5. Screen figures and export figures are identical down to the exact paise.
 */

/**
 * Aggregate financial metrics from raw entity records.
 * 
 * @param {Object} params
 * @param {Array} params.bills - Authoritative invoice records
 * @param {Array} params.payments - Dedicated payment allocation records
 * @param {Array} params.creditNotes - Linked credit note records
 * @param {Array} params.refunds - Disbursed refund records
 * @param {Array} params.expenses - Operational expense records
 * @param {Array} params.sessions - Closed and active register sessions
 * @param {string} [params.filterBasis="invoiceDate"]
 * @param {string|Date} [params.startDate]
 * @param {string|Date} [params.endDate]
 * @returns {Object} Comprehensive aggregated metrics
 */
export function calculateFinancialAggregates({
  bills = [],
  payments = [],
  creditNotes = [],
  refunds = [],
  expenses = [],
  sessions = [],
  filterBasis = "invoiceDate",
  startDate = null,
  endDate = null
}) {
  // 1. BILLING AGGREGATES (Active issued bills)
  let grossSalesPaise = 0;
  let discountsPaise = 0;
  let taxesPaise = 0;
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;
  let billedTotalPaise = 0;
  let receivablesPaise = 0;
  let billCount = 0;

  bills.forEach(bill => {
    // Exclude cancelled/voided bills from revenue
    if (bill.status === "cancelled" || bill.status === "void") return;

    billCount++;

    const gross = bill.grossSubtotalPaise !== undefined
      ? bill.grossSubtotalPaise
      : toPaise(bill.grossAmount || bill.subtotal || bill.totalAmount || 0);

    const disc = bill.totalDiscountPaise !== undefined
      ? bill.totalDiscountPaise
      : toPaise(bill.discount || 0);

    const tax = bill.totalTaxPaise !== undefined
      ? bill.totalTaxPaise
      : toPaise(bill.tax || 0);

    const grand = bill.grandTotalPaise !== undefined
      ? bill.grandTotalPaise
      : toPaise(bill.totalAmount || 0);

    const bal = bill.balanceDuePaise !== undefined
      ? bill.balanceDuePaise
      : (grand - toPaise(bill.paidAmount || 0));

    grossSalesPaise += gross;
    discountsPaise += disc;
    taxesPaise += tax;
    billedTotalPaise += grand;
    receivablesPaise += Math.max(0, bal);

    // Tax breakdown
    if (bill.taxBreakdown) {
      cgstPaise += bill.taxBreakdown.cgstPaise || 0;
      sgstPaise += bill.taxBreakdown.sgstPaise || 0;
      igstPaise += bill.taxBreakdown.igstPaise || 0;
    } else {
      // Default to 50/50 dual GST (CGST/SGST)
      cgstPaise += Math.round(tax / 2);
      sgstPaise += tax - Math.round(tax / 2);
    }
  });

  const netSalesPaise = grossSalesPaise - discountsPaise;

  // 2. PAYMENT / COLLECTION AGGREGATES
  let cashCollectionsPaise = 0;
  let upiCollectionsPaise = 0;
  let cardCollectionsPaise = 0;
  let otherCollectionsPaise = 0;
  let paymentCount = 0;

  payments.forEach(payment => {
    paymentCount++;
    const amt = payment.amountPaise !== undefined
      ? payment.amountPaise
      : toPaise(payment.amount || 0);

    const tender = (payment.tender || payment.paymentMethod || "other").toLowerCase();
    if (tender === "cash") {
      cashCollectionsPaise += amt;
    } else if (tender === "upi") {
      upiCollectionsPaise += amt;
    } else if (tender === "card") {
      cardCollectionsPaise += amt;
    } else {
      otherCollectionsPaise += amt;
    }
  });

  const grossCollectionsPaise = cashCollectionsPaise + upiCollectionsPaise + cardCollectionsPaise + otherCollectionsPaise;

  // 3. REFUND & CREDIT NOTE AGGREGATES
  let totalRefundsPaise = 0;
  let cashRefundsPaise = 0;
  let digitalRefundsPaise = 0;
  let refundCount = 0;

  refunds.forEach(ref => {
    refundCount++;
    const amt = ref.amountPaise !== undefined
      ? ref.amountPaise
      : toPaise(ref.amount || 0);

    totalRefundsPaise += amt;
    if ((ref.tender || "").toLowerCase() === "cash") {
      cashRefundsPaise += amt;
    } else {
      digitalRefundsPaise += amt;
    }
  });

  const netCollectionsPaise = grossCollectionsPaise - totalRefundsPaise;

  let totalCreditNotesPaise = 0;
  creditNotes.forEach(cn => {
    const amt = cn.amountPaise !== undefined ? cn.amountPaise : toPaise(cn.amount || 0);
    totalCreditNotesPaise += amt;
  });

  // Open / unapplied customer credits (credit notes issued minus refunds processed)
  const customerCreditsPaise = Math.max(0, totalCreditNotesPaise - totalRefundsPaise);

  // 4. EXPENSES AGGREGATES
  let totalExpensesPaise = 0;
  let cashExpensesPaise = 0;
  let nonCashExpensesPaise = 0;
  let expenseCount = 0;
  const expensesByCategory = {};

  expenses.forEach(exp => {
    if (exp.status === "rejected") return;

    expenseCount++;
    const amt = exp.amountPaise !== undefined ? exp.amountPaise : toPaise(exp.amount || 0);
    totalExpensesPaise += amt;

    const cat = exp.category || "General";
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;

    if ((exp.paymentMethod || "").toLowerCase() === "cash") {
      cashExpensesPaise += amt;
    } else {
      nonCashExpensesPaise += amt;
    }
  });

  // 5. REGISTER SESSIONS & CASH VARIANCE
  let totalCashVariancePaise = 0;
  let closedSessionsCount = 0;
  let totalOpeningFloatPaise = 0;

  sessions.forEach(sess => {
    if (sess.status === "closed") {
      closedSessionsCount++;
      totalCashVariancePaise += (sess.cashVariancePaise || 0);
    }
    totalOpeningFloatPaise += (sess.openingFloatPaise || 0);
  });

  // 6. OPERATING SUMMARY (Operational Gross Margin / EBITDA estimate)
  // Net Sales (Taxable Turnover) - Operating Expenses + Cash Variance
  const operatingSummaryPaise = netSalesPaise - totalExpensesPaise + totalCashVariancePaise;

  return {
    period: {
      startDate: startDate ? new Date(startDate).toISOString().split("T")[0] : null,
      endDate: endDate ? new Date(endDate).toISOString().split("T")[0] : null,
      filterBasis
    },
    counts: {
      bills: billCount,
      payments: paymentCount,
      refunds: refundCount,
      expenses: expenseCount,
      closedSessions: closedSessionsCount
    },
    revenue: {
      grossSalesPaise,
      discountsPaise,
      netSalesPaise,
      taxesPaise,
      cgstPaise,
      sgstPaise,
      igstPaise,
      billedTotalPaise
    },
    collections: {
      cashPaise: cashCollectionsPaise,
      upiPaise: upiCollectionsPaise,
      cardPaise: cardCollectionsPaise,
      otherPaise: otherCollectionsPaise,
      grossCollectionsPaise,
      refundsPaise: totalRefundsPaise,
      cashRefundsPaise,
      digitalRefundsPaise,
      netCollectionsPaise
    },
    receivables: {
      receivablesPaise,
      customerCreditsPaise
    },
    expenses: {
      totalExpensesPaise,
      cashExpensesPaise,
      nonCashExpensesPaise,
      byCategory: expensesByCategory
    },
    cashDrawer: {
      totalOpeningFloatPaise,
      totalCashVariancePaise
    },
    operatingSummaryPaise,
    display: {
      grossSales: formatINR(grossSalesPaise),
      discounts: formatINR(discountsPaise),
      netSales: formatINR(netSalesPaise),
      taxes: formatINR(taxesPaise),
      cgst: formatINR(cgstPaise),
      sgst: formatINR(sgstPaise),
      igst: formatINR(igstPaise),
      billedTotal: formatINR(billedTotalPaise),
      cashCollections: formatINR(cashCollectionsPaise),
      upiCollections: formatINR(upiCollectionsPaise),
      cardCollections: formatINR(cardCollectionsPaise),
      otherCollections: formatINR(otherCollectionsPaise),
      grossCollections: formatINR(grossCollectionsPaise),
      refunds: formatINR(totalRefundsPaise),
      netCollections: formatINR(netCollectionsPaise),
      receivables: formatINR(receivablesPaise),
      customerCredits: formatINR(customerCreditsPaise),
      expenses: formatINR(totalExpensesPaise),
      cashVariance: formatINR(totalCashVariancePaise),
      operatingSummary: formatINR(operatingSummaryPaise)
    }
  };
}

/**
 * Verify financial integrity invariants on aggregated data.
 * 
 * @param {Object} agg - Result of calculateFinancialAggregates
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function verifyFinancialAggregatesInvariant(agg) {
  const errors = [];

  // Invariant 1: Net Sales = Gross Sales - Discounts
  if (agg.revenue.netSalesPaise !== agg.revenue.grossSalesPaise - agg.revenue.discountsPaise) {
    errors.push("Net Sales invariant violated: grossSalesPaise - discountsPaise !== netSalesPaise");
  }

  // Invariant 2: Billed Total = Net Sales + Taxes
  if (agg.revenue.billedTotalPaise !== agg.revenue.netSalesPaise + agg.revenue.taxesPaise) {
    errors.push("Billed Total invariant violated: netSalesPaise + taxesPaise !== billedTotalPaise");
  }

  // Invariant 3: Net Collections = Gross Collections - Refunds
  if (agg.collections.netCollectionsPaise !== agg.collections.grossCollectionsPaise - agg.collections.refundsPaise) {
    errors.push("Net Collections invariant violated: grossCollectionsPaise - refundsPaise !== netCollectionsPaise");
  }

  // Invariant 4: Gross Collections = Cash + UPI + Card + Other
  const sumTenders = agg.collections.cashPaise + agg.collections.upiPaise + agg.collections.cardPaise + agg.collections.otherPaise;
  if (agg.collections.grossCollectionsPaise !== sumTenders) {
    errors.push("Tender breakdown sum invariant violated: sum(tenders) !== grossCollectionsPaise");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
