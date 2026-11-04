import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money.js";
import { getNextAtomicSequence } from "@/lib/finance/sequence.js";
import { recordAuditEvent } from "@/lib/finance/audit.js";
import { withIdempotency } from "@/lib/finance/idempotency.js";
import { calculateSessionReconciliation } from "@/lib/finance/sessions.js";

/**
 * POST /api/finance/sessions
 * Open a new register shift session.
 * Enforces one active (unclosed) session per register to prevent double-counting.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["finance:manage_drawer", "cashier", "manager", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key");

    return withIdempotency(idempotencyKey, body, async () => {
      const db = await getDatabase();
      const registerId = (body.registerId || "DEFAULT_REGISTER").trim().toUpperCase();

      // Check for already-open session on this register
      const existingOpenSession = await db.collection("register_sessions").findOne({
        registerId,
        status: "open"
      });

      if (existingOpenSession) {
        return {
          statusCode: 409,
          body: {
            error: `An active session (${existingOpenSession.sessionNumber}) is already open on register ${registerId}. Close it before opening a new session.`,
            activeSession: existingOpenSession
          }
        };
      }

      // Opening float in paise
      const openingFloatPaise = body.openingFloatPaise !== undefined
        ? Math.round(body.openingFloatPaise)
        : body.openingFloat !== undefined
        ? toPaise(body.openingFloat)
        : 0;

      if (openingFloatPaise < 0) {
        return {
          statusCode: 400,
          body: { error: "Opening float cannot be negative" }
        };
      }

      // Allocate atomic session sequence
      const { formatted: sessionNumber } = await getNextAtomicSequence(
        db,
        "global_session_seq",
        "SES",
        7,
        true
      );

      const now = new Date();
      const sessionDoc = {
        sessionNumber,
        registerId,
        outletId: body.outletId || "default",
        status: "open",
        openingFloatPaise,
        openingFloatRupees: formatINR(openingFloatPaise),
        notes: (body.notes || "").trim(),
        openedBy: auth.user.name || auth.user.email || "staff",
        openedById: auth.user.id,
        openedAt: now,
        createdAt: now
      };

      const insertRes = await db.collection("register_sessions").insertOne(sessionDoc);
      const createdSession = { ...sessionDoc, _id: insertRes.insertedId };

      // Audit log
      await recordAuditEvent({
        action: "session_opened",
        entityType: "register_session",
        entityId: sessionNumber,
        actor: auth.user,
        amountPaise: openingFloatPaise,
        metadata: {
          registerId,
          openingFloatPaise,
          sessionId: createdSession._id.toString()
        }
      });

      return {
        statusCode: 201,
        body: {
          success: true,
          message: `Shift session ${sessionNumber} opened on register ${registerId}`,
          session: createdSession
        }
      };
    });

  } catch (error) {
    console.error("POST /api/finance/sessions error:", error);
    return Response.json({ error: error.message || "Failed to open register session" }, { status: 500 });
  }
}

/**
 * GET /api/finance/sessions
 * Fetch active session with live reconciliation or query past closed sessions.
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["finance:manage_drawer", "cashier", "manager", "admin", "superadmin", "view_bill"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const registerId = searchParams.get("registerId")?.trim().toUpperCase();
    const activeOnly = searchParams.get("active") === "true";
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const db = await getDatabase();

    if (activeOnly || (registerId && !searchParams.get("all"))) {
      // Find currently active session
      const query = { status: "open" };
      if (registerId) query.registerId = registerId;

      const activeSession = await db.collection("register_sessions").findOne(query);
      if (!activeSession) {
        return Response.json({ success: true, activeSession: null });
      }

      // Compute live aggregate collections during this active session
      const sessionStart = activeSession.openedAt;

      // 1. All payments recorded since session open
      const payments = await db.collection("payments").find({
        createdAt: { $gte: sessionStart }
      }).toArray();

      let cashSalesPaise = 0;
      let upiSalesPaise = 0;
      let cardSalesPaise = 0;

      payments.forEach(p => {
        const tender = String(p.tender || "").toLowerCase();
        const amt = p.amountPaise || 0;
        if (tender === "cash") cashSalesPaise += amt;
        else if (tender === "upi") upiSalesPaise += amt;
        else if (tender === "card") cardSalesPaise += amt;
      });

      // 2. All cash refunds disbursed since session open
      const refunds = await db.collection("refunds").find({
        createdAt: { $gte: sessionStart },
        tender: "cash"
      }).toArray();

      const cashRefundsPaise = refunds.reduce((sum, r) => sum + (r.amountPaise || 0), 0);

      // 3. Manual cash movements
      const movements = await db.collection("cash_movements").find({
        sessionId: activeSession._id
      }).toArray();

      let cashInPaise = 0;
      let cashOutPaise = 0;

      movements.forEach(m => {
        const amt = m.amountPaise || 0;
        if (m.type === "cash_in") cashInPaise += amt;
        else cashOutPaise += amt; // petty_cash, cash_out, bank_drop
      });

      // Live reconciliation calculation
      const liveReconciliation = calculateSessionReconciliation({
        openingFloatPaise: activeSession.openingFloatPaise || 0,
        cashSalesPaise,
        cashRefundsPaise,
        cashInPaise,
        cashOutPaise,
        countedCashPaise: 0, // Uncounted while active
        upiSalesPaise,
        cardSalesPaise
      });

      return Response.json({
        success: true,
        activeSession: {
          ...activeSession,
          liveReconciliation,
          transactionsCount: payments.length,
          refundsCount: refunds.length,
          movementsCount: movements.length
        }
      });
    }

    // Historical sessions query
    const listQuery = {};
    if (registerId) listQuery.registerId = registerId;

    const sessions = await db.collection("register_sessions")
      .find(listQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return Response.json({ success: true, count: sessions.length, sessions });

  } catch (error) {
    console.error("GET /api/finance/sessions error:", error);
    return Response.json({ error: error.message || "Failed to fetch register sessions" }, { status: 500 });
  }
}
