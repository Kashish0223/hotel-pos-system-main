import { toPaise, formatINR, roundHalfUp } from "./money.js";

/**
 * Standard Payment Terms
 */
export const PAYMENT_TERMS = {
  DUE_ON_RECEIPT: { code: "DUE_ON_RECEIPT", days: 0, label: "Due on Receipt" },
  NET15: { code: "NET15", days: 15, label: "Net 15 Days" },
  NET30: { code: "NET30", days: 30, label: "Net 30 Days" },
  NET60: { code: "NET60", days: 60, label: "Net 60 Days" },
  NET90: { code: "NET90", days: 90, label: "Net 90 Days" }
};

/**
 * Calculate ageing buckets for a list of open invoices or debtor records.
 * 
 * Buckets:
 * 1. Current / Not Overdue (or 0-30 days overdue)
 * 2. 31 to 60 days overdue
 * 3. 61 to 90 days overdue
 * 4. 91+ days overdue
 * 
 * Invariant:
 * currentPaise + days31_60Paise + days61_90Paise + days90PlusPaise === totalOutstandingPaise
 * 
 * @param {Object} params
 * @param {Array} params.invoices - Array of { dueDate, issueDate, balanceDuePaise, totalAmountPaise, ... }
 * @param {Date|string} [params.asOfDate] - Cutoff date for ageing calculation
 * @returns {Object} Ageing summary and itemized invoices with bucket tags
 */
export function calculateAgeingBuckets({
  invoices = [],
  asOfDate = new Date()
}) {
  const asOf = new Date(asOfDate);
  const asOfTime = asOf.getTime();

  let currentPaise = 0;
  let days31_60Paise = 0;
  let days61_90Paise = 0;
  let days90PlusPaise = 0;
  let totalOutstandingPaise = 0;

  const itemized = invoices.map(inv => {
    const dueTime = inv.dueDate ? new Date(inv.dueDate).getTime() : (inv.issueDate ? new Date(inv.issueDate).getTime() : asOfTime);
    const balancePaise = inv.balanceDuePaise !== undefined
      ? Math.round(inv.balanceDuePaise)
      : inv.outstandingAmount !== undefined
      ? toPaise(inv.outstandingAmount)
      : inv.amount !== undefined
      ? toPaise(inv.amount)
      : 0;

    if (balancePaise <= 0) {
      return { ...inv, balanceDuePaise: 0, daysOverdue: 0, bucket: "paid" };
    }

    totalOutstandingPaise += balancePaise;

    // Days past due
    const diffMs = asOfTime - dueTime;
    const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let bucket = "current";
    if (daysOverdue > 90) {
      bucket = "days90Plus";
      days90PlusPaise += balancePaise;
    } else if (daysOverdue > 60) {
      bucket = "days61_90";
      days61_90Paise += balancePaise;
    } else if (daysOverdue > 30) {
      bucket = "days31_60";
      days31_60Paise += balancePaise;
    } else {
      bucket = "current";
      currentPaise += balancePaise;
    }

    return {
      ...inv,
      balanceDuePaise: balancePaise,
      balanceDueRupees: formatINR(balancePaise),
      daysOverdue,
      bucket
    };
  });

  return {
    asOfDate: asOf.toISOString(),
    totalOutstandingPaise,
    totalOutstandingRupees: formatINR(totalOutstandingPaise),
    buckets: {
      currentPaise,
      days31_60Paise,
      days61_90Paise,
      days90PlusPaise
    },
    display: {
      current: formatINR(currentPaise),
      days31_60: formatINR(days31_60Paise),
      days61_90: formatINR(days61_90Paise),
      days90Plus: formatINR(days90PlusPaise),
      totalOutstanding: formatINR(totalOutstandingPaise)
    },
    itemized
  };
}

/**
 * Generate a reconciled Customer Statement of Account.
 * 
 * Invariant:
 * Closing Balance === Opening Balance + Invoices - Credit Notes - Payments
 * 
 * @param {Object} params
 * @param {string} params.customerId
 * @param {string} params.customerName
 * @param {Date|string} [params.startDate]
 * @param {Date|string} [params.endDate]
 * @param {number} [params.openingBalancePaise=0]
 * @param {Array} [params.invoices=[]]
 * @param {Array} [params.creditNotes=[]]
 * @param {Array} [params.payments=[]]
 * @returns {Object} Reconciled customer account statement
 */
export function generateCustomerStatement({
  customerId,
  customerName = "Customer",
  startDate = null,
  endDate = new Date(),
  openingBalancePaise = 0,
  invoices = [],
  creditNotes = [],
  payments = []
}) {
  const openingPaise = Math.round(openingBalancePaise || 0);

  // Combine all transactions into chronological ledger entries
  const ledgerEntries = [];

  invoices.forEach(inv => {
    const amt = inv.grandTotalPaise !== undefined ? inv.grandTotalPaise : toPaise(inv.totalAmount || inv.amount || 0);
    ledgerEntries.push({
      date: new Date(inv.issueDate || inv.createdAt || inv.date),
      type: "invoice",
      reference: inv.billNumber || inv.invoiceNumber || inv._id?.toString() || "INV",
      description: `Invoice #${inv.billNumber || ""}`,
      debitPaise: amt,   // Increases customer owing
      creditPaise: 0
    });
  });

  creditNotes.forEach(cn => {
    const amt = cn.amountPaise !== undefined ? cn.amountPaise : toPaise(cn.amount || 0);
    ledgerEntries.push({
      date: new Date(cn.issuedAt || cn.createdAt || cn.date),
      type: "credit_note",
      reference: cn.creditNoteNumber || "CN",
      description: `Credit Note #${cn.creditNoteNumber || ""} (${cn.reasonText || cn.reasonCode || ""})`,
      debitPaise: 0,
      creditPaise: amt   // Decreases customer owing
    });
  });

  payments.forEach(p => {
    const amt = p.amountPaise !== undefined ? p.amountPaise : toPaise(p.amount || 0);
    ledgerEntries.push({
      date: new Date(p.recordedAt || p.paymentDate || p.createdAt || p.date),
      type: "payment",
      reference: p.receiptNumber || p.referenceNumber || "REC",
      description: `Payment Receipt (${p.tender?.toUpperCase() || "TENDER"})`,
      debitPaise: 0,
      creditPaise: amt   // Decreases customer owing
    });
  });

  // Sort by date ascending
  ledgerEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Compute running balance
  let runningBalancePaise = openingPaise;
  let totalDebitsPaise = 0;
  let totalCreditsPaise = 0;

  const itemizedLedger = ledgerEntries.map(entry => {
    totalDebitsPaise += entry.debitPaise;
    totalCreditsPaise += entry.creditPaise;
    runningBalancePaise = runningBalancePaise + entry.debitPaise - entry.creditPaise;

    return {
      ...entry,
      dateString: entry.date.toISOString().split("T")[0],
      debitRupees: entry.debitPaise > 0 ? formatINR(entry.debitPaise) : "-",
      creditRupees: entry.creditPaise > 0 ? formatINR(entry.creditPaise) : "-",
      balancePaise: runningBalancePaise,
      balanceRupees: formatINR(runningBalancePaise)
    };
  });

  const closingBalancePaise = runningBalancePaise;

  return {
    customerId,
    customerName,
    startDate: startDate ? new Date(startDate).toISOString().split("T")[0] : null,
    endDate: new Date(endDate).toISOString().split("T")[0],
    openingBalancePaise: openingPaise,
    totalDebitsPaise,
    totalCreditsPaise,
    closingBalancePaise,
    display: {
      openingBalance: formatINR(openingPaise),
      totalDebits: formatINR(totalDebitsPaise),
      totalCredits: formatINR(totalCreditsPaise),
      closingBalance: formatINR(closingBalancePaise)
    },
    ledger: itemizedLedger
  };
}
