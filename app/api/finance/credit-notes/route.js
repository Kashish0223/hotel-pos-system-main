import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR, roundHalfUp } from "@/lib/finance/money";
import { getNextAtomicSequence } from "@/lib/finance/sequence";
import { recordAuditEvent } from "@/lib/finance/audit";
import { withIdempotency } from "@/lib/finance/idempotency";

export const CREDIT_NOTE_REASONS = [
  { code: "guest_satisfaction", label: "Guest Satisfaction / Service Recovery" },
  { code: "food_quality", label: "Food Quality / Kitchen Defect" },
  { code: "billing_error", label: "Billing / Pricing Error" },
  { code: "item_cancelled", label: "Item Cancelled Post-Bill" },
  { code: "damaged_spillage", label: "Damaged / Spilled Item" },
  { code: "manager_comp", label: "Manager Discretionary Comp" }
];

/**
 * POST /api/finance/credit-notes
 * Issue an immutable, linked Credit Note against an existing invoice.
 * Never mutates original invoice totals; adjusts balance due or provides refundable customer credit.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["finance:issue_credit_note", "admin", "superadmin", "manager"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key");

    return withIdempotency(idempotencyKey, body, async () => {
      const db = await getDatabase();
      const invoiceIdStr = body.invoiceId || body.billId;

      if (!invoiceIdStr || !ObjectId.isValid(invoiceIdStr)) {
        return {
          statusCode: 400,
          body: { error: "A valid invoiceId (or billId) is required" }
        };
      }

      const invoiceId = new ObjectId(invoiceIdStr);
      const invoice = await db.collection("bills").findOne({ _id: invoiceId });

      if (!invoice) {
        return {
          statusCode: 404,
          body: { error: "Original invoice not found" }
        };
      }

      // Validate reason
      const reasonCode = body.reasonCode;
      const matchedReason = CREDIT_NOTE_REASONS.find(r => r.code === reasonCode);
      if (!matchedReason) {
        return {
          statusCode: 400,
          body: {
            error: `Invalid credit note reason code: "${reasonCode}". Must be one of: ${CREDIT_NOTE_REASONS.map(r => r.code).join(", ")}`
          }
        };
      }

      const reasonText = (body.reasonText || matchedReason.label).trim();
      if (!reasonText) {
        return {
          statusCode: 400,
          body: { error: "A descriptive reasonText is required for auditing credit notes" }
        };
      }

      // Determine requested credit amount in paise
      const requestedPaise = body.amountPaise !== undefined
        ? Math.round(body.amountPaise)
        : body.amount !== undefined
        ? toPaise(body.amount)
        : null;

      if (!requestedPaise || requestedPaise <= 0) {
        return {
          statusCode: 400,
          body: { error: "Credit note amount must be greater than zero" }
        };
      }

      // Check invoice grand total and cumulative existing credit notes
      const invoiceGrandTotalPaise = invoice.grandTotalPaise !== undefined
        ? Math.round(invoice.grandTotalPaise)
        : toPaise(invoice.totalAmount || invoice.grandTotal || 0);

      const existingCreditNotes = await db.collection("credit_notes").find({
        invoiceId: invoice._id,
        status: { $ne: "voided" }
      }).toArray();

      const existingCreditPaise = existingCreditNotes.reduce((sum, cn) => sum + (cn.amountPaise || 0), 0);
      const remainingCreditLimitPaise = Math.max(0, invoiceGrandTotalPaise - existingCreditPaise);

      if (requestedPaise > remainingCreditLimitPaise) {
        return {
          statusCode: 400,
          body: {
            error: `Requested credit (₹${formatINR(requestedPaise)}) exceeds remaining credit limit (₹${formatINR(remainingCreditLimitPaise)}) for invoice #${invoice.billNumber}`,
            grandTotalPaise: invoiceGrandTotalPaise,
            existingCreditPaise,
            remainingCreditLimitPaise
          }
        };
      }

      // Compute proportional tax reversal
      const totalTaxPaise = invoice.taxTotalPaise || invoice.totalTaxPaise || 0;
      let taxReversalPaise = 0;
      if (invoiceGrandTotalPaise > 0 && totalTaxPaise > 0) {
        taxReversalPaise = roundHalfUp(requestedPaise * (totalTaxPaise / invoiceGrandTotalPaise));
      }

      // Compute impact on invoice balance due vs refundable customer credit
      const currentBalanceDuePaise = invoice.balanceDuePaise !== undefined
        ? Math.round(invoice.balanceDuePaise)
        : (invoice.isSettled || invoice.status === "paid" ? 0 : invoiceGrandTotalPaise);

      const creditedAgainstBalancePaise = Math.min(currentBalanceDuePaise, requestedPaise);
      const newBalanceDuePaise = currentBalanceDuePaise - creditedAgainstBalancePaise;
      const customerCreditPaise = requestedPaise - creditedAgainstBalancePaise;

      // Inventory disposition: prepared food is NOT automatically restocked
      const inventoryDisposition = body.inventoryDisposition || "none";
      if (!["wastage", "restocked", "none"].includes(inventoryDisposition)) {
        return {
          statusCode: 400,
          body: { error: "inventoryDisposition must be one of: 'wastage', 'restocked', 'none'" }
        };
      }

      // Atomic Sequence for Credit Note
      const { formatted: creditNoteNumber } = await getNextAtomicSequence(
        db,
        "global_credit_note_seq",
        "CN",
        7,
        true
      );

      const now = new Date();
      const creditNoteDoc = {
        creditNoteNumber,
        invoiceId: invoice._id,
        invoiceNumber: invoice.billNumber,
        orderIds: invoice.orderIds || (invoice.orderId ? [invoice.orderId] : []),
        amountPaise: requestedPaise,
        amountRupees: formatINR(requestedPaise),
        taxReversalPaise,
        taxReversalRupees: formatINR(taxReversalPaise),
        creditedAgainstBalancePaise,
        customerCreditPaise, // refundable if invoice was already paid
        refundedPaise: 0,
        reasonCode,
        reasonLabel: matchedReason.label,
        reasonText,
        inventoryDisposition,
        status: "issued",
        issuedBy: auth.user.name || auth.user.email || "manager",
        issuedById: auth.user.id,
        issuedAt: now,
        createdAt: now
      };

      const cnInsertRes = await db.collection("credit_notes").insertOne(creditNoteDoc);
      const createdCreditNote = { ...creditNoteDoc, _id: cnInsertRes.insertedId };

      // Optional immediate refund processing if customer credit exists and refundTender is provided
      let refundDoc = null;
      if (customerCreditPaise > 0 && body.refundTender) {
        const refundMethod = String(body.refundTender.method || "cash").toLowerCase();
        const { formatted: refundNumber } = await getNextAtomicSequence(
          db,
          "global_refund_seq",
          "REF",
          7,
          true
        );

        refundDoc = {
          refundNumber,
          creditNoteId: createdCreditNote._id,
          creditNoteNumber,
          invoiceId: invoice._id,
          invoiceNumber: invoice.billNumber,
          amountPaise: customerCreditPaise,
          amountRupees: formatINR(customerCreditPaise),
          tender: refundMethod,
          referenceNumber: body.refundTender.referenceNumber || null,
          reasonCode,
          reasonText,
          processedBy: auth.user.name || auth.user.email || "manager",
          processedById: auth.user.id,
          processedAt: now,
          createdAt: now
        };

        const refundInsert = await db.collection("refunds").insertOne(refundDoc);
        refundDoc._id = refundInsert.insertedId;

        // Mark credit note as refunded
        await db.collection("credit_notes").updateOne(
          { _id: createdCreditNote._id },
          {
            $set: {
              refundedPaise: customerCreditPaise,
              status: "refunded",
              refundReference: refundNumber,
              refundedAt: now
            }
          }
        );
        createdCreditNote.refundedPaise = customerCreditPaise;
        createdCreditNote.status = "refunded";
      }

      // If food wastage, record in inventory wastage tracking
      if (inventoryDisposition === "wastage") {
        await db.collection("inventory_wastage").insertOne({
          creditNoteNumber,
          invoiceNumber: invoice.billNumber,
          amountPaise: requestedPaise,
          reasonText,
          recordedBy: auth.user.name || "manager",
          recordedAt: now
        });
      }

      // Update invoice document without mutating grand total or original line items
      const invoiceUpdates = {
        balanceDuePaise: newBalanceDuePaise,
        totalCreditNotesPaise: existingCreditPaise + requestedPaise,
        updatedAt: now
      };

      if (newBalanceDuePaise === 0) {
        invoiceUpdates.isSettled = true;
        invoiceUpdates.paymentStatus = invoice.paymentStatus === "paid" ? "paid" : "settled_by_credit";
        invoiceUpdates.status = invoiceUpdates.paymentStatus;
      }

      await db.collection("bills").updateOne(
        { _id: invoiceId },
        {
          $set: invoiceUpdates,
          $push: {
            creditNotesList: {
              creditNoteNumber,
              amountPaise: requestedPaise,
              amount: formatINR(requestedPaise),
              reasonCode,
              reasonText,
              customerCreditPaise,
              issuedAt: now
            }
          }
        }
      );

      // Append-only audit log
      await recordAuditEvent({
        action: "credit_note_issued",
        entityType: "credit_note",
        entityId: creditNoteNumber,
        actor: auth.user,
        amountPaise: requestedPaise,
        reasonCode,
        reasonText,
        metadata: {
          invoiceId: invoiceIdStr,
          invoiceNumber: invoice.billNumber,
          taxReversalPaise,
          creditedAgainstBalancePaise,
          customerCreditPaise,
          refundNumber: refundDoc?.refundNumber || null,
          inventoryDisposition
        }
      });

      return {
        statusCode: 201,
        body: {
          success: true,
          message: `Credit Note ${creditNoteNumber} issued successfully`,
          creditNote: createdCreditNote,
          refund: refundDoc,
          invoiceSummary: {
            invoiceNumber: invoice.billNumber,
            grandTotalPaise: invoiceGrandTotalPaise,
            originalGrandTotal: formatINR(invoiceGrandTotalPaise),
            previousBalanceDuePaise: currentBalanceDuePaise,
            newBalanceDuePaise,
            newBalanceDue: formatINR(newBalanceDuePaise),
            creditedAgainstBalance: formatINR(creditedAgainstBalancePaise),
            customerCredit: formatINR(customerCreditPaise)
          }
        }
      };
    });

  } catch (error) {
    console.error("POST /api/finance/credit-notes error:", error);
    return Response.json({ error: error.message || "Failed to issue credit note" }, { status: 500 });
  }
}

/**
 * GET /api/finance/credit-notes
 * List credit notes with optional filters
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["finance:view_credit_notes", "admin", "superadmin", "manager", "view_bill"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const reasonCode = searchParams.get("reasonCode");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query = {};
    if (invoiceId && ObjectId.isValid(invoiceId)) {
      query.invoiceId = new ObjectId(invoiceId);
    }
    if (reasonCode) {
      query.reasonCode = reasonCode;
    }

    const db = await getDatabase();
    const creditNotes = await db.collection("credit_notes")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return Response.json({ success: true, count: creditNotes.length, creditNotes });

  } catch (error) {
    console.error("GET /api/finance/credit-notes error:", error);
    return Response.json({ error: error.message || "Failed to fetch credit notes" }, { status: 500 });
  }
}
