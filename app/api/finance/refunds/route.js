import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money";
import { getNextAtomicSequence } from "@/lib/finance/sequence";
import { recordAuditEvent } from "@/lib/finance/audit";
import { withIdempotency } from "@/lib/finance/idempotency";

/**
 * POST /api/finance/refunds
 * Process an authorized financial refund against an approved credit note.
 * Tracks tender returned (Cash, UPI, Card) and protects against cumulative over-refunds.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["finance:issue_refund", "admin", "superadmin", "manager"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key");

    return withIdempotency(idempotencyKey, body, async () => {
      const db = await getDatabase();
      const creditNoteIdStr = body.creditNoteId;
      const creditNoteNumber = body.creditNoteNumber;

      if (!creditNoteIdStr && !creditNoteNumber) {
        return {
          statusCode: 400,
          body: { error: "creditNoteId or creditNoteNumber is required" }
        };
      }

      // Query credit note
      const cnQuery = creditNoteIdStr && ObjectId.isValid(creditNoteIdStr)
        ? { _id: new ObjectId(creditNoteIdStr) }
        : { creditNoteNumber };

      const creditNote = await db.collection("credit_notes").findOne(cnQuery);

      if (!creditNote) {
        return {
          statusCode: 404,
          body: { error: "Credit note not found" }
        };
      }

      if (creditNote.status === "voided") {
        return {
          statusCode: 400,
          body: { error: "Cannot issue refund against a voided credit note" }
        };
      }

      const customerCreditPaise = creditNote.customerCreditPaise || 0;
      if (customerCreditPaise <= 0) {
        return {
          statusCode: 400,
          body: {
            error: "Credit note has zero refundable customer credit (it was fully credited against outstanding unpaid invoice balance)",
            creditedAgainstBalancePaise: creditNote.creditedAgainstBalancePaise || 0
          }
        };
      }

      // Determine requested refund amount
      const requestedPaise = body.amountPaise !== undefined
        ? Math.round(body.amountPaise)
        : body.amount !== undefined
        ? toPaise(body.amount)
        : customerCreditPaise;

      if (requestedPaise <= 0) {
        return {
          statusCode: 400,
          body: { error: "Refund amount must be greater than zero" }
        };
      }

      // Query existing refunds on this credit note
      const existingRefunds = await db.collection("refunds").find({
        creditNoteId: creditNote._id
      }).toArray();

      const totalAlreadyRefundedPaise = existingRefunds.reduce((sum, r) => sum + (r.amountPaise || 0), 0);
      const remainingRefundablePaise = customerCreditPaise - totalAlreadyRefundedPaise;

      if (requestedPaise > remainingRefundablePaise) {
        return {
          statusCode: 400,
          body: {
            error: `Requested refund (₹${formatINR(requestedPaise)}) exceeds remaining credit note limit (₹${formatINR(remainingRefundablePaise)})`,
            customerCreditPaise,
            totalAlreadyRefundedPaise,
            remainingRefundablePaise
          }
        };
      }

      const tenderMethod = String(body.tender || "cash").toLowerCase();
      const validTenders = ["cash", "upi", "card", "bank_transfer", "cheque"];
      if (!validTenders.includes(tenderMethod)) {
        return {
          statusCode: 400,
          body: { error: `Invalid tender method "${tenderMethod}". Must be one of: ${validTenders.join(", ")}` }
        };
      }

      // Generate atomic refund receipt number
      const { formatted: refundNumber } = await getNextAtomicSequence(
        db,
        "global_refund_seq",
        "REF",
        7,
        true
      );

      const now = new Date();
      const refundDoc = {
        refundNumber,
        creditNoteId: creditNote._id,
        creditNoteNumber: creditNote.creditNoteNumber,
        invoiceId: creditNote.invoiceId,
        invoiceNumber: creditNote.invoiceNumber,
        amountPaise: requestedPaise,
        amountRupees: formatINR(requestedPaise),
        tender: tenderMethod,
        referenceNumber: body.referenceNumber || null,
        reason: body.reason || creditNote.reasonText,
        processedBy: auth.user.name || auth.user.email || "manager",
        processedById: auth.user.id,
        processedAt: now,
        createdAt: now
      };

      const insertRes = await db.collection("refunds").insertOne(refundDoc);
      const createdRefund = { ...refundDoc, _id: insertRes.insertedId };

      // Update credit note record
      const newTotalRefundedPaise = totalAlreadyRefundedPaise + requestedPaise;
      const isFullyRefunded = newTotalRefundedPaise >= customerCreditPaise;

      await db.collection("credit_notes").updateOne(
        { _id: creditNote._id },
        {
          $set: {
            refundedPaise: newTotalRefundedPaise,
            status: isFullyRefunded ? "refunded" : "partially_refunded",
            lastRefundAt: now,
            updatedAt: now
          },
          $push: {
            refundsList: {
              refundNumber,
              tender: tenderMethod,
              amountPaise: requestedPaise,
              amount: formatINR(requestedPaise),
              processedAt: now
            }
          }
        }
      );

      // Audit log entry
      await recordAuditEvent({
        action: "refund_processed",
        entityType: "refund",
        entityId: refundNumber,
        actor: auth.user,
        amountPaise: requestedPaise,
        metadata: {
          creditNoteNumber: creditNote.creditNoteNumber,
          invoiceNumber: creditNote.invoiceNumber,
          tender: tenderMethod,
          isFullyRefunded,
          newTotalRefundedPaise
        }
      });

      return {
        statusCode: 201,
        body: {
          success: true,
          message: `Refund ${refundNumber} processed successfully via ${tenderMethod.toUpperCase()}`,
          refund: createdRefund,
          creditNoteStatus: isFullyRefunded ? "refunded" : "partially_refunded",
          remainingRefundablePaise: customerCreditPaise - newTotalRefundedPaise,
          remainingRefundable: formatINR(customerCreditPaise - newTotalRefundedPaise)
        }
      };
    });

  } catch (error) {
    console.error("POST /api/finance/refunds error:", error);
    return Response.json({ error: error.message || "Failed to process refund" }, { status: 500 });
  }
}

/**
 * GET /api/finance/refunds
 * List refunds with optional filtering
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["finance:view_refunds", "admin", "superadmin", "manager", "view_bill"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const creditNoteId = searchParams.get("creditNoteId");
    const tender = searchParams.get("tender");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query = {};
    if (creditNoteId && ObjectId.isValid(creditNoteId)) {
      query.creditNoteId = new ObjectId(creditNoteId);
    }
    if (tender) {
      query.tender = tender.toLowerCase();
    }

    const db = await getDatabase();
    const refunds = await db.collection("refunds")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return Response.json({ success: true, count: refunds.length, refunds });

  } catch (error) {
    console.error("GET /api/finance/refunds error:", error);
    return Response.json({ error: error.message || "Failed to fetch refunds" }, { status: 500 });
  }
}
