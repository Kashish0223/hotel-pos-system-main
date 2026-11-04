import { getDatabase } from "@/lib/db-config";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { calculateFinancialAggregates, verifyFinancialAggregatesInvariant } from "@/lib/finance/reports";
import {
  exportFinancialSummaryCSV,
  exportInvoicesCSV,
  exportPaymentsCSV,
  exportSessionsCSV
} from "@/lib/finance/exports";

export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["finance:reports", "superadmin", "admin", "cashier"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const filterBasis = searchParams.get("filterBy") || "invoiceDate"; // "invoiceDate" | "paymentDate" | "refundDate" | "businessDate"
    const outletId = searchParams.get("outletId");
    const cashierId = searchParams.get("cashierId");
    const format = (searchParams.get("format") || "json").toLowerCase();
    const reportType = (searchParams.get("reportType") || "summary").toLowerCase();

    // Parse dates with start of day / end of day boundaries
    let startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    let endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const db = await getDatabase();

    // Construct base query filters
    const dateRangeFilter = { $gte: startDate, $lte: endDate };

    // 1. BILLS QUERY
    const billsQuery = {};
    if (filterBasis === "invoiceDate") {
      billsQuery.$or = [
        { issueDate: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ];
    } else {
      // General window
      billsQuery.$or = [
        { issueDate: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ];
    }
    if (outletId) billsQuery.outletId = outletId;
    if (cashierId) billsQuery.cashierId = cashierId;

    const bills = await db.collection("bills").find(billsQuery).sort({ createdAt: -1 }).toArray();

    // 2. PAYMENTS QUERY
    const paymentsQuery = {};
    if (filterBasis === "paymentDate") {
      paymentsQuery.$or = [
        { recordedAt: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ];
    } else {
      paymentsQuery.$or = [
        { recordedAt: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ];
    }
    if (outletId) paymentsQuery.outletId = outletId;
    if (cashierId) paymentsQuery.recordedBy = cashierId;

    const payments = await db.collection("payments").find(paymentsQuery).sort({ recordedAt: -1 }).toArray();

    // 3. CREDIT NOTES QUERY
    const creditNotesQuery = {
      $or: [
        { issuedAt: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ]
    };
    if (outletId) creditNotesQuery.outletId = outletId;
    const creditNotes = await db.collection("credit_notes").find(creditNotesQuery).sort({ issuedAt: -1 }).toArray();

    // 4. REFUNDS QUERY
    const refundsQuery = {};
    if (filterBasis === "refundDate") {
      refundsQuery.$or = [
        { issuedAt: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ];
    } else {
      refundsQuery.$or = [
        { issuedAt: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ];
    }
    if (outletId) refundsQuery.outletId = outletId;
    if (cashierId) refundsQuery.authorizedBy = cashierId;

    const refunds = await db.collection("refunds").find(refundsQuery).sort({ issuedAt: -1 }).toArray();

    // 5. EXPENSES QUERY
    const expensesQuery = {
      $or: [
        { date: dateRangeFilter },
        { createdAt: dateRangeFilter }
      ]
    };
    if (outletId) expensesQuery.outletId = outletId;
    const expenses = await db.collection("expenses").find(expensesQuery).sort({ createdAt: -1 }).toArray();

    // 6. SESSIONS QUERY
    const sessionsQuery = {};
    if (filterBasis === "businessDate") {
      sessionsQuery.openedAt = dateRangeFilter;
    } else {
      sessionsQuery.$or = [
        { openedAt: dateRangeFilter },
        { closedAt: dateRangeFilter }
      ];
    }
    if (outletId) sessionsQuery.outletId = outletId;
    if (cashierId) sessionsQuery.openedBy = cashierId;

    const sessions = await db.collection("register_sessions").find(sessionsQuery).sort({ openedAt: -1 }).toArray();

    // COMPUTE FINANCIAL AGGREGATES
    const aggregates = calculateFinancialAggregates({
      bills,
      payments,
      creditNotes,
      refunds,
      expenses,
      sessions,
      filterBasis,
      startDate,
      endDate
    });

    // VERIFY FINANCIAL INVARIANTS
    const invariantCheck = verifyFinancialAggregatesInvariant(aggregates);

    // HANDLE CSV EXPORT FORMAT
    if (format === "csv") {
      let csvContent = "";
      let filename = `finance-summary-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.csv`;

      if (reportType === "invoices") {
        csvContent = exportInvoicesCSV(bills);
        filename = `invoices-register-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.csv`;
      } else if (reportType === "payments") {
        csvContent = exportPaymentsCSV(payments);
        filename = `collections-register-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.csv`;
      } else if (reportType === "sessions") {
        csvContent = exportSessionsCSV(sessions);
        filename = `cashier-shifts-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.csv`;
      } else {
        csvContent = exportFinancialSummaryCSV({
          ...aggregates,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0]
        });
      }

      return new Response(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      });
    }

    // RETURN JSON RESPONSE
    return Response.json({
      success: true,
      invariantsValid: invariantCheck.valid,
      invariantErrors: invariantCheck.errors,
      ...aggregates,
      sampleInvoices: bills.slice(0, 50).map(b => ({
        billNumber: b.billNumber,
        issueDate: b.issueDate || b.createdAt,
        customerName: b.customerName || "Walk-in",
        grandTotalRupees: ((b.grandTotalPaise || 0) / 100).toFixed(2),
        balanceDueRupees: ((b.balanceDuePaise || 0) / 100).toFixed(2),
        status: b.status
      })),
      samplePayments: payments.slice(0, 50).map(p => ({
        receiptNumber: p.receiptNumber,
        recordedAt: p.recordedAt || p.createdAt,
        tender: p.tender,
        amountRupees: ((p.amountPaise || 0) / 100).toFixed(2),
        billNumber: p.billNumber
      }))
    });
  } catch (err) {
    console.error("Finance Reports GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
