import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money.js";
import { getNextAtomicSequence } from "@/lib/finance/sequence.js";
import { recordAuditEvent } from "@/lib/finance/audit.js";

/**
 * POST /api/debtors/[id]/payment
 * Record a payment against an outstanding debtor account.
 */
export async function POST(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_debtors", "process_payments", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid debtor ID format" }, { status: 400 });
    }

    const debtor = await db.collection("debtors").findOne({ _id: new ObjectId(id) });
    if (!debtor) {
      return Response.json({ error: "Debtor not found" }, { status: 404 });
    }

    const body = await request.json();
    const paymentAmountPaise = body.amountPaise !== undefined
      ? Math.round(body.amountPaise)
      : toPaise(body.amount || 0);

    if (paymentAmountPaise <= 0) {
      return Response.json({ error: "Payment amount must be greater than zero" }, { status: 400 });
    }

    const totalAmountPaise = debtor.totalAmountPaise !== undefined
      ? debtor.totalAmountPaise
      : toPaise(debtor.totalAmount || debtor.amount || 0);

    const currentPaidPaise = debtor.paidAmountPaise !== undefined
      ? debtor.paidAmountPaise
      : toPaise(debtor.paidAmount || 0);

    const currentOutstandingPaise = debtor.outstandingAmountPaise !== undefined
      ? debtor.outstandingAmountPaise
      : Math.max(0, totalAmountPaise - currentPaidPaise);

    if (currentOutstandingPaise <= 0) {
      return Response.json({ error: "Debtor account is already fully paid" }, { status: 400 });
    }

    // Overpayment prevention
    if (paymentAmountPaise > currentOutstandingPaise) {
      return Response.json({
        error: `Payment amount (₹${formatINR(paymentAmountPaise)}) exceeds outstanding balance (₹${formatINR(currentOutstandingPaise)})`,
        outstandingAmountPaise: currentOutstandingPaise
      }, { status: 400 });
    }

    // Allocate atomic receipt number
    const { formatted: receiptNumber } = await getNextAtomicSequence(
      db,
      "global_receipt_seq",
      "REC",
      7,
      true
    );

    const newPaidPaise = currentPaidPaise + paymentAmountPaise;
    const newOutstandingPaise = currentOutstandingPaise - paymentAmountPaise;
    const isPaidInFull = newOutstandingPaise === 0;
    const paymentMethod = String(body.paymentMethod || "cash").toLowerCase();
    const now = new Date();

    // Update debtor document
    await db.collection("debtors").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          paidAmountPaise: newPaidPaise,
          paidAmount: parseFloat(formatINR(newPaidPaise)),
          outstandingAmountPaise: newOutstandingPaise,
          outstandingAmount: parseFloat(formatINR(newOutstandingPaise)),
          status: isPaidInFull ? "paid" : "partial",
          updatedAt: now,
          ...(isPaidInFull && { paidDate: now })
        }
      }
    );

    // Record in debtor_payments
    const paymentDoc = {
      receiptNumber,
      debtorId: new ObjectId(id),
      debtorName: debtor.customerName || debtor.name,
      amountPaise: paymentAmountPaise,
      amountRupees: formatINR(paymentAmountPaise),
      amount: parseFloat(formatINR(paymentAmountPaise)),
      paymentMethod,
      notes: body.notes || "",
      recordedBy: auth.user.name || auth.user.email || "staff",
      recordedById: auth.user.id,
      paymentDate: now,
      createdAt: now
    };

    await db.collection("debtor_payments").insertOne(paymentDoc);

    // Also record in central payments collection
    await db.collection("payments").insertOne({
      receiptNumber,
      source: "debtor",
      debtorId: new ObjectId(id),
      amountPaise: paymentAmountPaise,
      amountRupees: formatINR(paymentAmountPaise),
      tender: paymentMethod,
      recordedBy: auth.user.name || auth.user.email || "staff",
      recordedById: auth.user.id,
      createdAt: now
    });

    // Audit log
    await recordAuditEvent({
      action: "debtor_payment_recorded",
      entityType: "debtor",
      entityId: debtor.customerName || id,
      actor: auth.user,
      amountPaise: paymentAmountPaise,
      metadata: {
        receiptNumber,
        newOutstandingPaise,
        isPaidInFull
      }
    });

    return Response.json({
      success: true,
      message: `Payment of ₹${formatINR(paymentAmountPaise)} recorded successfully (${receiptNumber})`,
      receiptNumber,
      paidAmountPaise: newPaidPaise,
      outstandingAmountPaise: newOutstandingPaise,
      isPaidInFull
    });

  } catch (error) {
    console.error("POST /api/debtors/[id]/payment error:", error);
    return Response.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}
