import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money.js";
import { getNextAtomicSequence } from "@/lib/finance/sequence.js";
import { recordAuditEvent } from "@/lib/finance/audit.js";

/**
 * GET /api/expenses
 * List operational expenses
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["manage_expenses", "view_expenses", "admin", "superadmin", "view_bill"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const expenses = await db.collection("expenses").find({}).sort({ date: -1, createdAt: -1 }).toArray();
    return Response.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return Response.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

/**
 * POST /api/expenses
 * Record an expense with integer paise amounts.
 * If paid in cash, links directly to active register drawer session to avoid double-counting.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["manage_expenses", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const data = await request.json();
    if (!data.amount || !data.category) {
      return Response.json({ error: "amount and category are required" }, { status: 400 });
    }

    const amountPaise = data.amountPaise !== undefined
      ? Math.round(data.amountPaise)
      : toPaise(data.amount || 0);

    if (amountPaise <= 0) {
      return Response.json({ error: "Expense amount must be greater than zero" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    // Atomic expense sequence: EXINV-YYYYMMDD-XXXXXX
    const { formatted: expenseInvoiceNo } = await getNextAtomicSequence(
      db,
      "global_expense_seq",
      "EXINV",
      6,
      true
    );

    const now = new Date();
    const paymentMethod = String(data.paymentMethod || "cash").toLowerCase();
    const registerId = (data.registerId || "DEFAULT_REGISTER").trim().toUpperCase();

    // If paid via cash, check if an active register session is open to log the drawer deduction
    let linkedSessionId = null;
    let linkedCashMovementNo = null;

    if (paymentMethod === "cash") {
      const activeSession = await db.collection("register_sessions").findOne({
        registerId,
        status: "open"
      });

      if (activeSession) {
        linkedSessionId = activeSession._id;
        const { formatted: movementNumber } = await getNextAtomicSequence(
          db,
          "global_cash_movement_seq",
          "CSH",
          7,
          true
        );
        linkedCashMovementNo = movementNumber;

        await db.collection("cash_movements").insertOne({
          movementNumber,
          sessionId: activeSession._id,
          sessionNumber: activeSession.sessionNumber,
          registerId,
          type: "petty_cash",
          amountPaise,
          amountRupees: formatINR(amountPaise),
          reasonCode: "petty_expense",
          reasonText: `Expense #${expenseInvoiceNo} (${data.category} - ${data.description || ""})`,
          expenseRef: expenseInvoiceNo,
          recordedBy: auth.user.name || auth.user.email || "staff",
          recordedById: auth.user.id,
          createdAt: now
        });
      }
    }

    const expenseDoc = {
      ...data,
      expenseInvoiceNo,
      amountPaise,
      amountRupees: formatINR(amountPaise),
      amount: parseFloat(formatINR(amountPaise)),
      paymentMethod,
      orderType: data.orderType || "expense",
      status: data.status || "approved",
      linkedSessionId,
      linkedCashMovementNo,
      createdBy: auth.user.name || auth.user.email || "staff",
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection("expenses").insertOne(expenseDoc);

    // Audit log
    await recordAuditEvent({
      action: "expense_recorded",
      entityType: "expense",
      entityId: expenseInvoiceNo,
      actor: auth.user,
      amountPaise,
      reasonCode: data.category,
      reasonText: data.description || "",
      metadata: {
        paymentMethod,
        linkedCashMovementNo
      }
    });

    return Response.json({
      success: true,
      id: result.insertedId,
      expenseInvoiceNo,
      linkedCashMovementNo
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return Response.json({ error: error.message || "Failed to record expense" }, { status: 500 });
  }
}
