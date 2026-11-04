import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { jwtVerify } from "jose"
import { headers } from "next/headers"

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// Corrected function – gives continuous sequence across days
// async function getNextInvoiceNumber(db) {
//   const counterDoc = await db.collection("bill_counters").findOneAndUpdate(
//     { _id: "invoiceNumber" },           // unique ID for settlement numbers
//     { $inc: { seq: 1 } },               // increment by 1 every time
//     { returnDocument: "after", upsert: true }
//   );

//   const seq = counterDoc.value.seq;     // this will be 1, 2, 3, 4... forever

//   // Format: SBILL-20251205-000001, SBILL-20251205-000002, SBILL-20251206-000003...
//   const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
//   return `SBILL-${dateStr}-${seq.toString().padStart(6, "0")}`;
// }

// DEDICATED COUNTER FOR SETTLEMENTS — NEVER RESET
// THIS IS THE WINNING PATTERN — SAME AS YOUR BILLS/GENERATE
async function getNextInvoiceNumber(db) {
  const counterKey = "settlement_sequence";  // One counter forever

  // Step 1: Make sure the counter document exists
  await db.collection("bill_counters").findOneAndUpdate(
    { _id: counterKey },
    { $setOnInsert: { seq: 0 } },
    { upsert: true }
  );

  // Step 2: Increment it
  await db.collection("bill_counters").findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } }
  );

  // Step 3: Read the actual value — NEVER fails
  const counterDoc = await db.collection("bill_counters").findOne({ _id: counterKey });

  if (!counterDoc || typeof counterDoc.seq !== "number") {
    throw new Error("Failed to generate settlement number");
  }

  const seq = counterDoc.seq;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return `SBILL-${dateStr}-${seq.toString().padStart(6, "0")}`;
}
async function getExpensesInvoiceNumber(db) {
  const counterKey = "settleExpenses_sequence";  // One counter forever

  // Step 1: Make sure the counter document exists
  await db.collection("bill_counters").findOneAndUpdate(
    { _id: counterKey },
    { $setOnInsert: { seq: 0 } },
    { upsert: true }
  );

  // Step 2: Increment it
  await db.collection("bill_counters").findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } }
  );

  // Step 3: Read the actual value — NEVER fails
  const counterDoc = await db.collection("bill_counters").findOne({ _id: counterKey });

  if (!counterDoc || typeof counterDoc.seq !== "number") {
    throw new Error("Failed to generate settlement number");
  }

  const seq = counterDoc.seq;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return `EXP-${dateStr}-${seq.toString().padStart(6, "0")}`;
}
async function removeImages(order) {
  if (!order) return order;

  // Remove customer image
  if (order.customerInfo) {
    delete order.customerInfo.image;
  }

  // Remove item images
  if (Array.isArray(order.items)) {
    order.items = order.items.map((item) => {
      delete item.image;
      delete item.extraImages;
      delete item.shortDescription?.image;
      return item;
    });
  }

  return order;
}

export async function POST(request) {
  try {
    const headerList = await headers()
    const authHeader = headerList.get("Authorization")

    // Check if Authorization header is provided
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    let payload
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload
    } catch (e) {
      console.error("JWT verification failed:", e)
      return Response.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Parse the request body
    // const { billId, paymentMethod, billType } = await request.json()
    const { billId, expenseId, paymentMethod, billType } = await request.json();

const idToUse = billType === "expenses" ? expenseId : billId;

if (!idToUse || !paymentMethod) {
  return Response.json({ error: "billId/expenseId and paymentMethod are required" }, { status: 400 });
}

const objectId = new ObjectId(idToUse);

    // console.log("Received billId:", billId)
    // console.log("Received paymentMethod:", paymentMethod)
    // console.log("Received billType:", billType)

    // Validate required fields
    // if (!billId || !paymentMethod) {
    //   return Response.json({ error: "billId and paymentMethod are required" }, { status: 400 })
    // }

if ((billType === "expenses" && !expenseId) || (billType !== "expenses" && !billId) || !paymentMethod) {
  return Response.json({ error: "billId/expenseId and paymentMethod are required" }, { status: 400 })
}


    // const objectId = new ObjectId(billId)
    // console.log("Converted billId:", objectId)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos")
    const settlement_sequence = await getNextInvoiceNumber(db)
    const settlementExp_sequence = await getExpensesInvoiceNumber(db)
    // console.log("Next Invoice Number:", settlement_sequence)
    // console.log("Next Invoice Number:", settlementExp_sequence)

    // Handle CUSTOMER BILLS
    if (billType === "customer" || !billType) {
      let bill = await db.collection("bills").findOne({
        _id: objectId,
        $or: [
          { status: "unpaid" },
          { paymentStatus: { $in: ["unpaid", "partially_paid"] } },
          { isSettled: false }
        ]
      });

      if (!bill) {
        return Response.json({ error: "Bill not found or already paid" }, { status: 404 });
      }

      const orderIds = bill.orderIds || (bill.orderId ? [new ObjectId(bill.orderId)] : []);
      const totalAmount = parseFloat(bill.totalAmount || bill.grandTotal || 0);

      // Insert settlement details into settlements collection
      const settlementResult = await db.collection("settlements").insertOne({
        billId: objectId,
        orderIds: orderIds,
        orderNumber: bill.billNumber || bill.orderNumber,
        orderType: bill.orderType,
        settlementNo: settlement_sequence,
        paymentMethod,
        totalAmount,
        customerInfo: [bill.customerName, bill.customerPhone, bill.customerRoom, bill.customerTable],
        tableNumber: bill.customerTable,
        settledAt: new Date(),
        settledBy: payload.email || payload.sub || "staff",
        createdAt: new Date(),
      });

      // Insert into payments collection for canonical ledger tracking
      await db.collection("payments").insertOne({
        receiptNumber: settlement_sequence,
        invoiceId: objectId,
        invoiceNumber: bill.billNumber,
        orderIds,
        amountPaise: Math.round(totalAmount * 100),
        amountRupees: totalAmount.toFixed(2),
        tender: String(paymentMethod).toLowerCase(),
        recordedBy: payload.email || payload.sub || "staff",
        recordedAt: new Date(),
        createdAt: new Date()
      });

      // Update the orders with settlement details
      const orderUpdateResult = await db.collection("orders").updateMany(
        { _id: { $in: orderIds } },
        {
          $set: {
            paymentMethod,
            paymentStatus: "paid",
            settled: true,
            billPay: true,
            settledAt: new Date(),
            settlementNo: settlement_sequence,
          },
        }
      );

      // Update the bills collection to mark the bill as settled
      const billUpdateResult = await db.collection("bills").updateOne(
        { _id: objectId },
        {
          $set: {
            status: "paid",
            paymentStatus: "paid",
            balanceDuePaise: 0,
            billSettled: true,
            settledAt: new Date(),
            paymentMethod,
            isSettled: true,
            billPay: true,
            settlementNo: settlement_sequence,
          },
        }
      );
      // console.log("Bill updated:", billUpdateResult)

      if (orderUpdateResult.modifiedCount === 0) {
        console.warn("⚠️ Warning: Order was not updated (no matching document or no changes)")
      }
      if (billUpdateResult.modifiedCount === 0) {
        console.warn("⚠️ Warning: Bill was not updated (no matching document or no changes)")
      }

      return Response.json({
        success: true,
        settlementNo: settlement_sequence,
        billId,
        message: "Bill settled successfully",
        // orderType: orderType,
        orderUpdateCount: orderUpdateResult.modifiedCount,
        billUpdateCount: billUpdateResult.modifiedCount,
      })
    }
    
    // Handle EXPENSE BILLS
    else if (billType === "expenses") {
      let expense = await db.collection("expenses").findOne({
        _id: new ObjectId(objectId),
        status: "pending"
      });

      if (!expense) {
        return Response.json({ error: "Expense not found or already settled" }, { status: 404 })
      }

      // Insert settlement details into the database
      const settlementResult = await db.collection("settlements").insertOne({
        expenseId: expenseId,
        expenseInvoiceNo: expense.expenseInvoiceNo,
        settlementNo: settlementExp_sequence,
        paymentMethod,
        orderType: expense.orderType,
        totalAmount: parseFloat(expense.amount),
        vendor: expense.vendor,
        description: expense.description,
        category: expense.category,
        settledAt: new Date(),
        settledBy: payload.email || payload.sub || "staff",
        createdAt: new Date(),
      })
      
      // Update the expense to mark it as settled
      const expenseUpdateResult = await db.collection("expenses").updateOne(
        { _id: new ObjectId(objectId)},
        {
          $set: {
            status: "Paid",
            paymentMethod,
            settlementNo: settlementExp_sequence,
            settledAt: new Date(),
          },
        }
      )
      // console.log("Expense updated:", expenseUpdateResult)

       // Update the bills collection to mark the bill as settled
      // const billUpdateResult = await db.collection("bills").updateOne(
      //   { _id: objectId },
      //   {
      //     $set: {
      //       status: "Paid",
      //       billSettled: true,
      //       settledAt: new Date(),
      //       paymentMethod,
      //       isSettled: true,
      //       settlementNo: settlement_sequence,
      //     },
      //   }
      // )
      // console.log("Bill updated:", billUpdateResult)

      if (expenseUpdateResult.modifiedCount === 0) {
        console.warn("⚠️ Warning: Expense was not updated (no matching document or no changes)")
      }

      return Response.json({
        success: true,
        settlementNo: settlementExp_sequence,
        billId,
        message: "Expense settled successfully",
        expenseUpdateCount: expenseUpdateResult.modifiedCount,
      })
    }

    return Response.json({ error: "Invalid billType provided" }, { status: 400 })

  } catch (error) {
    console.error("Settlement failed:", error)
    return Response.json({ error: "Failed to settle bill", details: error.message }, { status: 500 })
  }
}

