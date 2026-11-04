import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money.js";
import { getNextAtomicSequence } from "@/lib/finance/sequence.js";
import { recordAuditEvent } from "@/lib/finance/audit.js";
import { withIdempotency } from "@/lib/finance/idempotency.js";
import {
  CASH_MOVEMENT_TYPES,
  MOVEMENT_REASON_CODES
} from "@/lib/finance/sessions.js";

/**
 * POST /api/finance/sessions/movements
 * Record manual cash-in, petty cash, or bank/safe drop during an active shift.
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
          body: { error: "A valid active sessionId is required" }
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

      if (session.status !== "open") {
        return {
          statusCode: 400,
          body: { error: `Cannot record movements on a ${session.status} session` }
        };
      }

      const movementType = String(body.type || "").toLowerCase();
      if (!Object.values(CASH_MOVEMENT_TYPES).includes(movementType)) {
        return {
          statusCode: 400,
          body: { error: `Invalid movement type "${movementType}". Must be one of: ${Object.values(CASH_MOVEMENT_TYPES).join(", ")}` }
        };
      }

      const amountPaise = body.amountPaise !== undefined
        ? Math.round(body.amountPaise)
        : body.amount !== undefined
        ? toPaise(body.amount)
        : 0;

      if (amountPaise <= 0) {
        return {
          statusCode: 400,
          body: { error: "Movement amount must be greater than zero" }
        };
      }

      const reasonCode = body.reasonCode || (movementType === "cash_in" ? "float_topup" : "petty_expense");
      const matchedReason = MOVEMENT_REASON_CODES.find(r => r.code === reasonCode);
      const reasonText = (body.reasonText || matchedReason?.label || movementType).trim();

      // Allocate atomic movement sequence
      const { formatted: movementNumber } = await getNextAtomicSequence(
        db,
        "global_cash_movement_seq",
        "CSH",
        7,
        true
      );

      const now = new Date();
      const movementDoc = {
        movementNumber,
        sessionId: session._id,
        sessionNumber: session.sessionNumber,
        registerId: session.registerId,
        type: movementType,
        amountPaise,
        amountRupees: formatINR(amountPaise),
        reasonCode,
        reasonText,
        recordedBy: auth.user.name || auth.user.email || "staff",
        recordedById: auth.user.id,
        createdAt: now
      };

      const insertRes = await db.collection("cash_movements").insertOne(movementDoc);
      const createdMovement = { ...movementDoc, _id: insertRes.insertedId };

      // Audit log
      await recordAuditEvent({
        action: "cash_movement_recorded",
        entityType: "cash_movement",
        entityId: movementNumber,
        actor: auth.user,
        amountPaise,
        reasonCode,
        reasonText,
        metadata: {
          sessionId: session._id.toString(),
          sessionNumber: session.sessionNumber,
          registerId: session.registerId,
          type: movementType
        }
      });

      return {
        statusCode: 201,
        body: {
          success: true,
          message: `${movementType.replace("_", " ").toUpperCase()} of ₹${formatINR(amountPaise)} recorded successfully (${movementNumber})`,
          movement: createdMovement
        }
      };
    });

  } catch (error) {
    console.error("POST /api/finance/sessions/movements error:", error);
    return Response.json({ error: error.message || "Failed to record cash movement" }, { status: 500 });
  }
}

/**
 * GET /api/finance/sessions/movements
 * List cash movements for a given session.
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["finance:manage_drawer", "cashier", "manager", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const sessionIdStr = searchParams.get("sessionId");

    if (!sessionIdStr || !ObjectId.isValid(sessionIdStr)) {
      return Response.json({ error: "A valid sessionId query param is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const movements = await db.collection("cash_movements")
      .find({ sessionId: new ObjectId(sessionIdStr) })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ success: true, count: movements.length, movements });

  } catch (error) {
    console.error("GET /api/finance/sessions/movements error:", error);
    return Response.json({ error: error.message || "Failed to fetch cash movements" }, { status: 500 });
  }
}
