import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money.js";
import { recordAuditEvent } from "@/lib/finance/audit.js";
import { withIdempotency } from "@/lib/finance/idempotency.js";
import {
  calculateSessionReconciliation,
  calculateDenominationsPaise
} from "@/lib/finance/sessions.js";

/**
 * POST /api/finance/sessions/close
 * Close and reconcile an active register shift.
 * Computes expected drawer balance, checks variance against physical counted cash,
 * and records an immutable closing audit snapshot.
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
      const sessionIdStr = body.sessionId;

      if (!sessionIdStr || !ObjectId.isValid(sessionIdStr)) {
        return {
          statusCode: 400,
          body: { error: "A valid sessionId is required to close a shift" }
        };
      }

      const sessionId = new ObjectId(sessionIdStr);
      const session = await db.collection("register_sessions").findOne({ _id: sessionId });

      if (!session) {
        return {
          statusCode: 404,
          body: { error: "Register session not found" }
        };
      }

      if (session.status === "closed") {
        return {
          statusCode: 400,
          body: {
            error: `Session ${session.sessionNumber} is already closed`,
            closedAt: session.closedAt,
            reconciliation: session.closingReconciliation
          }
        };
      }

      // Determine physical counted cash
      let countedCashPaise = 0;
      if (body.denominations && Object.keys(body.denominations).length > 0) {
        countedCashPaise = calculateDenominationsPaise(body.denominations);
      } else if (body.countedCashPaise !== undefined) {
        countedCashPaise = Math.round(body.countedCashPaise);
      } else if (body.countedCash !== undefined) {
        countedCashPaise = toPaise(body.countedCash);
      } else {
        return {
          statusCode: 400,
          body: { error: "Physical counted cash (or denomination breakdown) is required to close shift" }
        };
      }

      if (countedCashPaise < 0) {
        return {
          statusCode: 400,
          body: { error: "Counted cash cannot be negative" }
        };
      }

      // Query all payments, refunds, and cash movements for this session
      const sessionStart = session.openedAt;
      const now = new Date();

      // 1. Payments during shift
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

      // 2. Cash refunds during shift
      const refunds = await db.collection("refunds").find({
        createdAt: { $gte: sessionStart },
        tender: "cash"
      }).toArray();

      const cashRefundsPaise = refunds.reduce((sum, r) => sum + (r.amountPaise || 0), 0);

      // 3. Manual movements during shift
      const movements = await db.collection("cash_movements").find({
        sessionId: session._id
      }).toArray();

      let cashInPaise = 0;
      let cashOutPaise = 0;

      movements.forEach(m => {
        const amt = m.amountPaise || 0;
        if (m.type === "cash_in") cashInPaise += amt;
        else cashOutPaise += amt;
      });

      // Calculate authoritative reconciliation metrics
      const reconciliation = calculateSessionReconciliation({
        openingFloatPaise: session.openingFloatPaise || 0,
        cashSalesPaise,
        cashRefundsPaise,
        cashInPaise,
        cashOutPaise,
        countedCashPaise,
        upiSalesPaise,
        cardSalesPaise
      });

      const notes = (body.notes || "").trim();

      // Require notes if variance exists
      if (reconciliation.cashVariancePaise !== 0 && !notes) {
        return {
          statusCode: 400,
          body: {
            error: `Drawer has a variance of ₹${formatINR(Math.abs(reconciliation.cashVariancePaise))} (${reconciliation.varianceType}). An explanatory note is required.`,
            reconciliation
          }
        };
      }

      // Update session document to closed
      const updateDoc = {
        status: "closed",
        closedAt: now,
        closedBy: auth.user.name || auth.user.email || "staff",
        closedById: auth.user.id,
        countedCashPaise,
        countedCashRupees: formatINR(countedCashPaise),
        denominations: body.denominations || null,
        closingNotes: notes,
        closingReconciliation: reconciliation,
        updatedAt: now
      };

      await db.collection("register_sessions").updateOne(
        { _id: session._id },
        { $set: updateDoc }
      );

      // Audit log
      await recordAuditEvent({
        action: "session_closed",
        entityType: "register_session",
        entityId: session.sessionNumber,
        actor: auth.user,
        amountPaise: countedCashPaise,
        reasonCode: reconciliation.varianceType !== "balanced" ? "cash_variance" : "normal_close",
        reasonText: notes || `Session closed with ${reconciliation.varianceType}`,
        metadata: {
          sessionId: session._id.toString(),
          registerId: session.registerId,
          expectedCashPaise: reconciliation.expectedCashPaise,
          countedCashPaise,
          cashVariancePaise: reconciliation.cashVariancePaise,
          varianceType: reconciliation.varianceType,
          totalSalesCollectionsPaise: reconciliation.totalSalesCollectionsPaise
        }
      });

      return {
        statusCode: 200,
        body: {
          success: true,
          message: `Shift session ${session.sessionNumber} closed successfully (${reconciliation.varianceType})`,
          sessionNumber: session.sessionNumber,
          reconciliation,
          closedAt: now
        }
      };
    });

  } catch (error) {
    console.error("POST /api/finance/sessions/close error:", error);
    return Response.json({ error: error.message || "Failed to close register session" }, { status: 500 });
  }
}
