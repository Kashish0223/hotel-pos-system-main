import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money";
import { getNextAtomicSequence } from "@/lib/finance/sequence";
import { recordAuditEvent } from "@/lib/finance/audit";
import { withIdempotency } from "@/lib/finance/idempotency";

/**
 * POST /api/finance/payments
 * Record one or more payment tenders against an issued invoice.
 * Supports split tenders (e.g. Cash + UPI + Card) and partial payments.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["finance:manage_drawer", "process_payments"]);
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
          body: { error: "Invoice not found" }
        };
      }

      // Check current balance due
      const currentGrandTotalPaise = invoice.grandTotalPaise !== undefined
        ? Math.round(invoice.grandTotalPaise)
        : toPaise(invoice.totalAmount || invoice.grandTotal || 0);

      let currentBalanceDuePaise = invoice.balanceDuePaise !== undefined
        ? Math.round(invoice.balanceDuePaise)
        : (invoice.isSettled || invoice.status === "paid" ? 0 : currentGrandTotalPaise);

      if (currentBalanceDuePaise <= 0) {
        return {
          statusCode: 400,
          body: { error: "Invoice is already paid in full", balanceDuePaise: 0 }
        };
      }

      // Normalize tenders input
      // Supports array of tenders [{ method, amountPaise, referenceNumber }] or simple { paymentMethod, amount }
      let rawTenders = [];
      if (Array.isArray(body.tenders) && body.tenders.length > 0) {
        rawTenders = body.tenders;
      } else if (body.paymentMethod) {
        const amtPaise = body.amount !== undefined ? toPaise(body.amount) : currentBalanceDuePaise;
        rawTenders = [{
          method: String(body.paymentMethod).toLowerCase(),
          amountPaise: amtPaise,
          referenceNumber: body.referenceNumber || body.transactionId || null,
          details: body.tenderDetails || null
        }];
      } else {
        return {
          statusCode: 400,
          body: { error: "Payment method or tenders array must be provided" }
        };
      }

      // Validate tender amounts
      let totalTenderedPaise = 0;
      const validatedTenders = [];

      for (const t of rawTenders) {
        const tenderPaise = t.amountPaise !== undefined ? Math.round(t.amountPaise) : toPaise(t.amount || 0);
        if (tenderPaise <= 0) {
          return {
            statusCode: 400,
            body: { error: `Invalid tender amount: ${tenderPaise} paise` }
          };
        }
        totalTenderedPaise += tenderPaise;
        validatedTenders.push({
          method: String(t.method || "cash").toLowerCase(),
          amountPaise: tenderPaise,
          referenceNumber: t.referenceNumber || null,
          details: t.details || null
        });
      }

      // Prevent over-payment beyond remaining balance due
      if (totalTenderedPaise > currentBalanceDuePaise) {
        return {
          statusCode: 400,
          body: {
            error: `Payment amount (₹${formatINR(totalTenderedPaise)}) exceeds balance due (₹${formatINR(currentBalanceDuePaise)})`,
            balanceDuePaise: currentBalanceDuePaise,
            tenderedPaise: totalTenderedPaise
          }
        };
      }

      // Generate receipts and insert payment records
      const now = new Date();
      const createdPayments = [];

      for (const tender of validatedTenders) {
        const { formatted: receiptNumber } = await getNextAtomicSequence(
          db,
          "global_receipt_seq",
          "REC",
          7,
          true
        );

        const paymentDoc = {
          receiptNumber,
          invoiceId,
          invoiceNumber: invoice.billNumber,
          orderIds: invoice.orderIds || (invoice.orderId ? [invoice.orderId] : []),
          amountPaise: tender.amountPaise,
          amountRupees: formatINR(tender.amountPaise),
          tender: tender.method,
          referenceNumber: tender.referenceNumber,
          tenderDetails: tender.details,
          recordedBy: auth.user.name || auth.user.email || "staff",
          recordedById: auth.user.id,
          recordedAt: now,
          createdAt: now
        };

        const insertRes = await db.collection("payments").insertOne(paymentDoc);
        createdPayments.push({ ...paymentDoc, _id: insertRes.insertedId });
      }

      // Compute updated invoice balance
      const newBalanceDuePaise = currentBalanceDuePaise - totalTenderedPaise;
      const isPaidInFull = newBalanceDuePaise === 0;
      const newPaymentStatus = isPaidInFull ? "paid" : "partially_paid";

      // Build primary payment method label (e.g. "split: cash, upi" or "cash")
      const paymentMethodsUsed = Array.from(new Set(createdPayments.map(p => p.tender))).join(", ");
      const finalPaymentMethod = validatedTenders.length > 1
        ? `Split (${paymentMethodsUsed})`
        : validatedTenders[0].method;

      // Update invoice document
      const updateFields = {
        grandTotalPaise: currentGrandTotalPaise,
        balanceDuePaise: newBalanceDuePaise,
        totalAmount: (currentGrandTotalPaise / 100).toFixed(2),
        paymentStatus: newPaymentStatus,
        status: newPaymentStatus,
        isSettled: isPaidInFull,
        billPay: isPaidInFull,
        paymentMethod: finalPaymentMethod,
        updatedAt: now
      };

      if (isPaidInFull) {
        updateFields.settledAt = now;
      }

      await db.collection("bills").updateOne(
        { _id: invoiceId },
        {
          $set: updateFields,
          $push: {
            paymentsList: {
              $each: createdPayments.map(p => ({
                receiptNumber: p.receiptNumber,
                tender: p.tender,
                amountPaise: p.amountPaise,
                amount: formatINR(p.amountPaise),
                referenceNumber: p.referenceNumber,
                recordedAt: p.recordedAt
              }))
            }
          }
        }
      );

      // Update associated operational orders if invoice is settled
      const orderIds = invoice.orderIds || (invoice.orderId ? [invoice.orderId] : []);
      if (orderIds.length > 0) {
        await db.collection("orders").updateMany(
          { _id: { $in: orderIds.map(id => new ObjectId(id)) } },
          {
            $set: {
              paymentStatus: newPaymentStatus,
              paymentMethod: finalPaymentMethod,
              billPay: isPaidInFull,
              updatedAt: now
            }
          }
        );
      }

      // Audit log entry
      await recordAuditEvent({
        action: "payment_recorded",
        entityType: "invoice",
        entityId: invoice.billNumber || invoiceIdStr,
        actor: auth.user,
        amountPaise: totalTenderedPaise,
        metadata: {
          invoiceId: invoiceIdStr,
          totalTenderedPaise,
          newBalanceDuePaise,
          isPaidInFull,
          receiptNumbers: createdPayments.map(p => p.receiptNumber)
        }
      });

      return {
        statusCode: 200,
        body: {
          success: true,
          message: isPaidInFull ? "Invoice settled in full" : "Partial payment recorded",
          invoiceNumber: invoice.billNumber,
          totalPaidPaise: totalTenderedPaise,
          totalPaid: formatINR(totalTenderedPaise),
          balanceDuePaise: newBalanceDuePaise,
          balanceDue: formatINR(newBalanceDuePaise),
          paymentStatus: newPaymentStatus,
          isSettled: isPaidInFull,
          receipts: createdPayments
        }
      };
    });

  } catch (error) {
    console.error("POST /api/finance/payments error:", error);
    return Response.json({ error: error.message || "Payment processing failure" }, { status: 500 });
  }
}

/**
 * GET /api/finance/payments
 * Query recorded payment receipts by invoiceId or date range.
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["finance:view_invoices", "view_bill", "view_reports"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId") || searchParams.get("billId");

    const db = await getDatabase();
    const query = {};

    if (invoiceId && ObjectId.isValid(invoiceId)) {
      query.invoiceId = new ObjectId(invoiceId);
    }

    const payments = await db
      .collection("payments")
      .find(query)
      .sort({ recordedAt: -1 })
      .limit(100)
      .toArray();

    return Response.json(payments);

  } catch (error) {
    console.error("GET /api/finance/payments error:", error);
    return Response.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
