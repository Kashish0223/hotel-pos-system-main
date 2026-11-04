import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import {
  toPaise,
  formatINR,
  calculateInvoiceTotals
} from "@/lib/finance/money";
import { getNextAtomicSequence } from "@/lib/finance/sequence";
import { recordAuditEvent } from "@/lib/finance/audit";
import { withIdempotency } from "@/lib/finance/idempotency";

export async function POST(request) {
  try {
    // ── Authentication & RBAC Guard ─────────────────────────
    const auth = await requireFinanceAuth(["finance:issue_invoice", "view_bill", "process_payments"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key");

    return withIdempotency(idempotencyKey, body, async () => {
      const db = await getDatabase();
      const {
        orderIds,
        paymentMethod = "",
        tenderDetails = null,
        referenceNumber = null,
        amountPaidPaise: customPaidPaise = null
      } = body;

      // Handle single or multiple order IDs
      const rawOrderIds = Array.isArray(orderIds)
        ? orderIds
        : body.orderId
        ? [body.orderId]
        : [];

      if (rawOrderIds.length === 0) {
        return {
          statusCode: 400,
          body: { error: "orderIds must be a non-empty array of IDs" }
        };
      }

      // Validate ObjectId formats
      for (const id of rawOrderIds) {
        if (!ObjectId.isValid(id)) {
          return {
            statusCode: 400,
            body: { error: `Invalid order ID format: ${id}` }
          };
        }
      }

      const orderObjectIds = rawOrderIds.map(id => new ObjectId(id));

      // Fetch all orders
      const orders = await db.collection("orders").find({
        _id: { $in: orderObjectIds }
      }).toArray();

      if (orders.length !== rawOrderIds.length) {
        return {
          statusCode: 404,
          body: { error: "One or more requested orders could not be found" }
        };
      }

      // Prevent duplicate billing on already-billed orders
      const alreadyBilled = orders.filter(o => o.billed);
      if (alreadyBilled.length > 0) {
        return {
          statusCode: 409,
          body: {
            error: `Order #${alreadyBilled[0].orderNumber || alreadyBilled[0]._id} has already been billed`,
            orderId: alreadyBilled[0]._id
          }
        };
      }

      // Check if existing bill already points to any of these orders
      const existingBill = await db.collection("bills").findOne({
        $or: [
          { orderIds: { $in: orderObjectIds } },
          { orderId: { $in: orderObjectIds } }
        ]
      });

      if (existingBill) {
        return {
          statusCode: 409,
          body: {
            error: `A bill (#${existingBill.billNumber}) already exists for one or more selected orders`,
            billNumber: existingBill.billNumber
          }
        };
      }

      // ── Generate unique invoice number atomically ────────────
      const { formatted: billNumber } = await getNextAtomicSequence(
        db,
        "global_invoice_seq",
        "INV",
        7,
        true
      );

      // ── Calculate server-priced lines and totals ─────────────
      const allLines = [];
      const groupedItems = orders.map(order => {
        const orderLines = (order.items || []).map(item => {
          const unitPricePaise = toPaise(item.price || 0);
          const taxPct = Number(item.tax || 0);
          const taxRateBps = Math.round(taxPct * 100);

          return {
            name: item.name?.en || item.name || "Item",
            unitPricePaise,
            quantity: Number(item.quantity || 1),
            discountPaise: 0,
            taxRules: taxRateBps > 0 ? [{ name: `GST ${taxPct}%`, rateBps: taxRateBps }] : []
          };
        });

        allLines.push(...orderLines);

        return {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber || `Order-${order._id.toString().slice(-6)}`,
          createdAt: order.createdAt,
          items: (order.items || []).map(item => ({
            name: item.name?.en || item.name || "Item",
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            tax: Number(item.tax || 0)
          })),
          subtotal: Number(order.subtotal || 0),
          itemTaxes: Number(order.itemTaxes || 0),
          discount: Number(order.discount || 0),
          total: Number(order.totalAmount || 0)
        };
      });

      // Sum pre-existing order discounts
      const totalOrderDiscountPaise = orders.reduce((sum, o) => sum + toPaise(o.discount || 0), 0);

      const calculatedInvoice = calculateInvoiceTotals({
        lines: allLines,
        orderDiscountPaise: totalOrderDiscountPaise
      });

      // Determine initial payment status and balance due
      const isComplimentary = paymentMethod === "n/c";
      const grandTotalPaise = isComplimentary ? 0 : calculatedInvoice.grandTotalPaise;

      let initialPaidPaise = 0;
      let paymentStatus = "unpaid";
      let isSettled = false;
      const paymentsList = [];
      const now = new Date();

      if (isComplimentary) {
        initialPaidPaise = 0;
        paymentStatus = "paid";
        isSettled = true;
      } else if (paymentMethod && paymentMethod !== "pending" && paymentMethod !== "") {
        // Immediate payment tendered at generation time
        initialPaidPaise = customPaidPaise !== null
          ? Math.min(grandTotalPaise, Math.round(customPaidPaise))
          : grandTotalPaise;

        if (initialPaidPaise > 0) {
          const { formatted: receiptNumber } = await getNextAtomicSequence(
            db,
            "global_receipt_seq",
            "REC",
            7,
            true
          );

          const receiptDoc = {
            receiptNumber,
            invoiceNumber: billNumber,
            amountPaise: initialPaidPaise,
            amountRupees: formatINR(initialPaidPaise),
            tender: paymentMethod.toLowerCase(),
            referenceNumber,
            tenderDetails,
            recordedBy: auth.user.name || "staff",
            recordedById: auth.user.id,
            recordedAt: now,
            createdAt: now
          };

          paymentsList.push(receiptDoc);
        }

        const remainingBalancePaise = grandTotalPaise - initialPaidPaise;
        isSettled = remainingBalancePaise === 0;
        paymentStatus = isSettled ? "paid" : initialPaidPaise > 0 ? "partially_paid" : "unpaid";
      }

      const balanceDuePaise = Math.max(0, grandTotalPaise - initialPaidPaise);

      // ── Build immutable bill snapshot document ───────────────
      const billData = {
        billNumber,
        orderIds: orderObjectIds,
        customerInfo: orders[0]?.customerInfo || {},
        customerName: orders[0]?.customerInfo?.name || "Walk-in Customer",
        customerPhone: orders[0]?.customerInfo?.phone || "",
        customerRoom: orders[0]?.customerInfo?.room || "",
        customerTable: orders[0]?.customerInfo?.table || orders[0]?.tableNumber || "",
        orderType: orders[0]?.orderType || "Dine-In",
        groupedItems,
        // Exact integer paise accounting figures
        grossSubtotalPaise: calculatedInvoice.grossSubtotalPaise,
        discountTotalPaise: calculatedInvoice.totalDiscountPaise,
        taxableSubtotalPaise: calculatedInvoice.taxableSubtotalPaise,
        taxTotalPaise: calculatedInvoice.taxTotalPaise,
        grandTotalPaise,
        balanceDuePaise,
        // Backward-compatible string fields for existing UI components
        subtotal: (calculatedInvoice.grossSubtotalPaise / 100).toFixed(2),
        itemTaxes: (calculatedInvoice.taxTotalPaise / 100).toFixed(2),
        discount: (calculatedInvoice.totalDiscountPaise / 100).toFixed(2),
        totalAmount: (grandTotalPaise / 100).toFixed(2),
        grandTotal: (grandTotalPaise / 100).toFixed(2),
        paymentMethod: paymentMethod || "pending",
        status: "issued",
        paymentStatus,
        isSettled,
        settledAt: isSettled ? now : null,
        billPay: isSettled,
        paymentsList: paymentsList.map(p => ({
          receiptNumber: p.receiptNumber,
          tender: p.tender,
          amountPaise: p.amountPaise,
          amount: p.amountRupees,
          referenceNumber: p.referenceNumber,
          recordedAt: p.recordedAt
        })),
        sourceOrdersCount: orders.length,
        issuedBy: auth.user.name || "staff",
        issuedById: auth.user.id,
        createdAt: now,
        updatedAt: now
      };

      // Insert new bill
      const result = await db.collection("bills").insertOne(billData);
      const insertedBillId = result.insertedId;

      // If initial payment was created, persist to `payments` collection
      if (paymentsList.length > 0) {
        await db.collection("payments").insertMany(
          paymentsList.map(p => ({
            ...p,
            invoiceId: insertedBillId,
            orderIds: orderObjectIds
          }))
        );
      }

      // Update associated original orders
      await db.collection("orders").updateMany(
        { _id: { $in: orderObjectIds } },
        {
          $set: {
            billed: true,
            billId: insertedBillId,
            paymentStatus,
            combinedBill: orders.length > 1,
            paymentMethod: billData.paymentMethod,
            billPay: isSettled,
            updatedAt: now
          }
        }
      );

      // Audit log entry
      await recordAuditEvent({
        action: "invoice_issued",
        entityType: "invoice",
        entityId: billNumber,
        actor: auth.user,
        amountPaise: grandTotalPaise,
        metadata: {
          billId: insertedBillId.toString(),
          orderIds: rawOrderIds,
          grandTotalPaise,
          balanceDuePaise,
          isSettled
        }
      });

      return {
        statusCode: 200,
        body: {
          ...billData,
          _id: insertedBillId
        }
      };
    });

  } catch (error) {
    console.error("Bill generation error:", error);
    return Response.json({ error: error.message || "Failed to generate bill" }, { status: 500 });
  }
}
