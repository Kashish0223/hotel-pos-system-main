import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { emitEvent, emitSoundEvent } from "@/lib/events"; // ✅ keep event emission if you have it
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import {headers} from "next/headers";

import { sendPushToAuthorizedUsers } from "@/lib/sendPushNotification";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;


  export async function GET(request) {
    try {
      // const headerList = await headers();
      // const authHeader = headerList.get("Authorization");
      // if (!authHeader || !authHeader.startsWith("Bearer ")) {
      //   return Response.json({ error: "No token provided" }, { status: 401 });
      // }
      // const token = authHeader.split("Bearer ")[1];
      // try {
      //   const verified = await jwtVerify(token, secret);
      //   const payload = verified.payload;
      //   if (!payload.role)
      //     return Response.json(
      //       { error: "Invalid token (missing role)" },
      //       { status: 401 }
      //     );
      // } catch (e) {
      //   // console.error("JWT verification failed:", e);
      //   return Response.json(
      //     { error: "Invalid or expired token" },
      //     { status: 401 }
      //   );
      // }
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
      const { searchParams } = new URL(request.url);


      const status = searchParams.get("status"); // single value
      const tableNumber = searchParams.get("tableNumber");
      const customerEmail = searchParams.get("customerEmail");
      const search = searchParams.get("search"); // free text
      const sort = searchParams.get("sort") || "desc"; // default desc
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const cursor = searchParams.get("cursor"); // createdAt timestamp
      const history = searchParams.get("history") || "false";
      const email = searchParams.get("email") || null;


    const query = {};


      if (history === "true") {
        try {
          // const db = await getDatabase();
          // const { searchParams } = new URL(request.url);
          // const status = searchParams.get("status");

          const query = {};
          if (email) query.customerEmail = email;
          if (status) {
            const statusArray = status.split(",").map(s => s.trim());
            query.status = { $in: statusArray };
          }

          if (tableNumber) {
            query.tableNumber = tableNumber;
          }


          const orders = await db
            .collection("orders")
            .find(query)
            .project({
              _id: 1,
              status: 1,
              paymentStatus: 1,
              createdAt: 1,
              settled: 1,
              totalAmount: 1,
              subtotal: 1,
              itemTaxes: 1,
              taxAmount: 1,
              taxes: 1,
              tableNumber:1,
              totalTaxAmount: 1,
              orderType: 1,
              paymentMethod: 1,
              customerInfo: 1,
              billPay: 1,
              "items._id": 1,
              "items.name": 1,
              "items.nameEn": 1,
              "items.price": 1,
              "items.quantity": 1,
              "items.tax": 1,
              "items.itemType": 1,
            })
            .sort({ createdAt: -1 })
            .toArray();


          // console.log('Orders:', JSON.stringify(orders,null,2));
          // console.log("PaymentMethod------",paymentMethod)
          return Response.json(orders);
        } catch (error) {
          return Response.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
          );
        }
      }


      // --- Status ---
      if (status && status !== "all") {
        const statusArray = status.split(",").map(s => s.trim());
        query.status = { $in: statusArray };
      }
  //    if (status && status !== "all") {
  //   const statusArray = status.split(",").map(s => s.trim());
  //   query.$or = [
  //     { status: { $in: statusArray } },
  //     { paymentStatus: { $in: statusArray } }
  //   ];
  // }

      if (tableNumber) {
          // query["customerInfo.tableNumber"] = tableNumber;
  // Most orders store tableNumber at root level
  // Some may have it inside customerInfo.table
  query.$or = [
    { tableNumber: tableNumber },
    { "customerInfo.table": tableNumber },
    { "customerInfo.tableNumber": tableNumber }
  ];
      }


      if (customerEmail) {
        query.$or = [
          { customerEmail },
          { email: customerEmail },
          { "customerInfo.email": customerEmail },
        ];
      }


      // Generic search
      // if (search) {
      //   const regex = new RegExp(search, "i"); // case-insensitive
      //   query.$or = [
      //     { customerEmail: regex },
      //     { "customerInfo.email": regex },
      //     { "customerInfo.name": regex },
      //     { "items.name": regex },
      //     { "items.nameEn": regex },
      //   ];
      // }


      // Generic search
      if (search) {
        const regex = new RegExp(search, "i"); // case-insensitive
        query.$or = [
          { "_id": search }, // match by order ID (exact match)
          { "tableNumber": regex }, // match table number (partial match)
          { "customerInfo.name": regex }, // customer name
          { customerEmail: regex },
          { "customerInfo.email": regex },
        ];
      }
      // Date range - Store in separate object to avoid conflicts with cursor pagination
      const dateRangeQuery = {};
      if (startDate) {
        dateRangeQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateRangeQuery.$lte = end;
      }
      if (Object.keys(dateRangeQuery).length > 0) {
        if (!query.createdAt) query.createdAt = {};
        Object.assign(query.createdAt, dateRangeQuery);
      }


      // // Cursor-based pagination
      // if (cursor) {
      //   const cursorDate = new Date(cursor);
      //   if (!query.createdAt) query.createdAt = {};
      //   if (sort === "asc") {
      //     query.createdAt = { ...(query.createdAt || {}), $gt: cursorDate };
      //   } else {
      //     query.createdAt = { ...(query.createdAt || {}), $lt: cursorDate };
      //   }
      // }


      // // --- Sorting ---
      // const sortOrder = sort === "asc" ? 1 : -1;
      // --- Cursor-based pagination (with proper tie-breaking) ---
      if (cursor) {
        try {
          const [cursorDate, cursorId] = cursor.split("::"); 
          if (!cursorDate || !cursorId) throw new Error("Invalid cursor format");
          
          const cursorDateObj = new Date(cursorDate);
          if (isNaN(cursorDateObj.getTime())) throw new Error("Invalid cursor date");

          // Build cursor condition based on sort order
          if (sort === "asc") {
            query.$or = [
              { createdAt: { $gt: cursorDateObj } },
              { createdAt: cursorDateObj, _id: { $gt: cursorId } }
            ];
          } else {
            query.$or = [
              { createdAt: { $lt: cursorDateObj } },
              { createdAt: cursorDateObj, _id: { $lt: cursorId } }
            ];
          }
        } catch (error) {
          console.error("Invalid cursor format, starting from beginning:", error);
          // Ignore invalid cursor and start from beginning
        }
      }

      const sortOrder = sort === "asc" ? 1 : -1;

      const orders = await db
        .collection("orders")
        .find(query)
        .sort({ createdAt: sortOrder, _id: sortOrder })
        .limit(limit + 1)
        .project({
          _id: 1,
          status: 1,
          paymentStatus: 1,
          createdAt: 1,
          settled: 1,
          totalAmount: 1,
          taxAmount: 1,  
          taxes: 1,
          itemTaxes: 1,
          subtotal: 1,
          totalTaxAmount: 1,
          orderType: 1,
          paymentMethod: 1,
          customerInfo: 1,
          billPay: 1,
          "items._id": 1,
          "items.name": 1,
          "items.nameEn": 1,
          "items.price": 1,
          "items.quantity": 1,
          "items.tax": 1,
          "items.itemType": 1,
        })
        .toArray();

      const hasMore = orders.length > limit;
      const items = hasMore ? orders.slice(0, limit) : orders;
      const nextCursor = hasMore && items.length > 0 
        ? `${items[items.length - 1].createdAt.toISOString()}::${items[items.length - 1]._id.toString()}` 
        : null;

      return Response.json({
        orders: items,
        nextCursor,
        hasMore,
      });
      // return Response.json({
      //   orders: orders || [],
      //   nextCursor:
      //     orders.length > 0 ? orders[orders.length - 1].createdAt : null,
      // });
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
  }

  export async function POST(request) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
  const payload = await request.json();

  let settings = { pos: { soundEnabled: true } };
  try {
    // const settingsRes = await db.collection("settings").findOne({});
    // if (settingsRes) settings = settingsRes;
     const settingsRes = await db.collection("settings").findOne({ type: "system" });
      if (settingsRes) settings = settingsRes.data || settings;
  } catch (e) {
    console.error("Failed to fetch settings:", e);
  }

  const {
    items,
    customerInfo = {},
    orderType = "dine-in",
    source = "qr-code",
    tableNumber,
    table,
    paymentMethod,
    isFinalConfirm,
    orderId: clientOrderId,
  } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Items are required" }, { status: 400 });
  }

  const partialAlerts = [];

  // === DRY RUN: Stock validation only (customer warning) ===
  if (source === "qr-code" && !isFinalConfirm) {
    for (const item of items) {
      if (item.itemType !== "retail") continue;

      const menu = await db.collection("menu").findOne({ _id: new ObjectId(item._id) });
      if (!menu?.linkedInventory) continue;

      const inventory = await db.collection("inventory").findOne({ _id: new ObjectId(menu.linkedInventory) });
      if (!inventory) continue;

      const available = inventory.currentStock || 0;
      if (item.quantity > available) {
        partialAlerts.push({
          name: menu.name || item.name,
          requested: item.quantity,
          available,
        });
      }
    }

    return Response.json({
      success: true,
      partialAlerts,
      message: "Validation complete. Awaiting final confirmation.",
    });
  }

  let order;
  let orderIdObj;

  // === CUSTOMER FINAL CONFIRM (QR flow): Update existing order ===
  if (source === "qr-code" && isFinalConfirm && clientOrderId) {
    try {
      const orderIdObj = new ObjectId(clientOrderId);
      
      const existingOrder = await db.collection("orders").findOne({ _id: orderIdObj });
      if (!existingOrder) {
        return Response.json({ error: "Order not found" }, { status: 404 });
      }

      const deductions = [];

      for (const item of items) {
        if (item.itemType !== "retail") continue;

        const menuId = item._id || item.id;
        if (!menuId) continue;

        const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
        if (!menu?.linkedInventory) continue;

        const invId = new ObjectId(menu.linkedInventory);
        const inventory = await db.collection("inventory").findOne({ _id: invId });
        if (!inventory) continue;

        const available = inventory.currentStock || 0;
        let deductQty = Number(item.quantity || 0);

        if (deductQty > available) deductQty = available;
        if (deductQty <= 0) continue;

        await db.collection("inventory").updateOne(
          { _id: invId },
          { $inc: { currentStock: -deductQty } }
        );

        deductions.push({ inventoryId: invId.toString(), qty: deductQty });
      }

      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const itemTaxes = items.reduce((sum, i) => {
        const lineTotal = i.price * i.quantity;
        return sum + (lineTotal * Number(i.tax || 0)) / 100;
      }, 0);

      await db.collection("orders").updateOne(
        { _id: orderIdObj },
        {
          $set: {
            items: items,
            subtotal: subtotal.toFixed(2),
            itemTaxes: Number(itemTaxes.toFixed(2)),
            totalAmount: Number(subtotal + itemTaxes).toFixed(2),
            partialOrder: true,
            paymentMethod,
            updatedAt: new Date(),
          }
        }
      );

      if (deductions.length > 0) {
        await db.collection("stock_movements").insertMany(
          deductions.map(d => ({
            inventoryId: new ObjectId(d.inventoryId),
            type: "out",
            quantity: d.qty,
            reason: `Order #${existingOrder.orderNumber} (Partial Update)`,
            orderId: orderIdObj,
            date: new Date(),
          }))
        );
      }

      const updatedOrder = await db.collection("orders").findOne({ _id: orderIdObj });

      // === NOTIFY STAFF (QR FLOW) ===
      try {
        emitEvent("orders1:update", {
          id: orderIdObj.toString(),
          soundEnabled: settings?.pos?.soundEnabled ?? true,
        });

        await sendPushToAuthorizedUsers({
          title: "New Table Order",
          body: `New items ordered for Table ${updatedOrder.tableNumber}`,
          data: {
            url: "/orders",
            orderId: orderIdObj.toString()
          }
        });
      } catch (e) {
        console.error("QR Flow Notify failed:", e);
      }

      return Response.json({
        success: true,
        order: updatedOrder,
        message: "Order updated successfully with available quantities"
      });

    } catch (e) {
      console.error("Order update failed:", e);
      return Response.json({ error: "Failed to update order" }, { status: 500 });
    }
  }
  else {
    // === STAFF FLOW: Create brand new order ===

    const deductions = [];
    try {
      for (const item of items) {
        if (item.itemType !== "retail") continue;

        const menuId = item._id || item.id;
        if (!menuId) continue;

        const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
        if (!menu?.linkedInventory) continue;

        const invId = new ObjectId(menu.linkedInventory);
        
        const result = await db.collection("inventory").findOneAndUpdate(
          { _id: invId, currentStock: { $gte: item.quantity } },
          { $inc: { currentStock: -item.quantity } },
          { returnDocument: "after" }
        );

        const updatedDoc = result.value !== undefined ? result.value : result;
        if (!updatedDoc) {
           throw new Error(`Not enough stock for ${menu.name || item.name}`);
        }
        
        deductions.push({
          inventoryId: invId.toString(),
          qty: item.quantity
        });
      }
    } catch (error) {
      // Rollback stock
      for (const d of deductions) {
        await db.collection("inventory").updateOne(
          { _id: new ObjectId(d.inventoryId) },
          { $inc: { currentStock: d.qty } }
        );
      }
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Generate order number
    const orderCounterKey = "global_order_seq";
    await db.collection("counters").findOneAndUpdate(
      { _id: orderCounterKey },
      { $setOnInsert: { seq: 0 } },
      { upsert: true }
    );

    const counterResult = await db.collection("counters").findOneAndUpdate(
      { _id: orderCounterKey },
      { $inc: { seq: 1 } },
      { returnDocument: "after" }
    );

    const counterDoc = counterResult.value !== undefined ? counterResult.value : counterResult;

    if (!counterDoc || typeof counterDoc.seq !== 'number') {
      throw new Error("Failed to generate order number");
    }

    const orderNumber = `ORD-${String(counterDoc.seq).padStart(7, "0")}`;

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemTaxes = items.reduce((sum, i) => {
      const lineTotal = i.price * i.quantity;
      return sum + (lineTotal * Number(i.tax || 0)) / 100;
    }, 0);

    const orderDoc = {
      orderNumber,
      items,
      customerInfo: { ...customerInfo, table: (customerInfo.table || customerInfo.tableNumber || "A1") },
      tableNumber: tableNumber || customerInfo.table || customerInfo.tableNumber || "A1",
      orderType,
      source,
      subtotal: subtotal.toFixed(2),
      itemTaxes: Number(itemTaxes.toFixed(2)),
      totalAmount: Number(subtotal + itemTaxes).toFixed(2),
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod:"pending",
      createdAt: new Date(),
      partialOrder: partialAlerts.length > 0,
      billPay: false,
    };

    const result = await db.collection("orders").insertOne(orderDoc);
    orderIdObj = result.insertedId;
    order = { ...orderDoc, _id: orderIdObj };

    // Log stock movements
    if (deductions.length > 0) {
      await db.collection("stock_movements").insertMany(
        deductions.map(d => ({
          inventoryId: new ObjectId(d.inventoryId),
          type: "out",
          quantity: d.qty,
          reason: `Order #${orderNumber}`,
          orderId: orderIdObj,
          date: new Date(),
        }))
      );
    }

    // === EMIT EVENT FOR NEW ORDER (STAFF FLOW) ===
    try {
      emitEvent("orders1:update", {
        id: orderIdObj.toString(),
        soundEnabled: settings?.pos?.soundEnabled ?? true,
      });

      // Send Push Notification
      await sendPushToAuthorizedUsers({
        title: "New Order Placed",
        body: `Order #${orderNumber} for Table ${orderDoc.tableNumber}`,
        data: {
          url: "/orders",
          orderId: orderIdObj.toString()
        }
      });
    } catch (e) {
      console.error("emitEvent/Push failed:", e);
    }
  }

  // Fetch final fresh order
  const finalOrder = await db.collection("orders").findOne({ _id: orderIdObj });

  return Response.json({
    success: true,
    order: finalOrder,
    message: "Order created successfully"
  });
}

  // ------------rBill also generated through this api-------------------
// export async function POST(request) {
//   const client = await clientPromise;
//   const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
//   const payload = await request.json();

//   let settings = { pos: { soundEnabled: true } };
//   try {
//     const settingsRes = await db.collection("settings").findOne({});
//     if (settingsRes) settings = settingsRes;
//   } catch (e) {
//     console.error("Failed to fetch settings:", e);
//   }

//   const {
//     items,
//     customerInfo = {},
//     orderType = "dine-in",
//     source = "qr-code",
//     tableNumber,
//     table,
//     isFinalConfirm,
//     orderId: clientOrderId, // ← Sent from frontend after verify-otp
//   } = payload;

//   if (!Array.isArray(items) || items.length === 0) {
//     return Response.json({ error: "Items are required" }, { status: 400 });
//   }

//   const partialAlerts = [];

//   // === DRY RUN: Stock validation only (customer warning) ===
//   if (source === "qr-code" && !isFinalConfirm) {
//     for (const item of items) {
//       if (item.itemType !== "retail") continue;

//       const menu = await db.collection("menu").findOne({ _id: new ObjectId(item._id) });
//       if (!menu?.linkedInventory) continue;

//       const inventory = await db.collection("inventory").findOne({ _id: new ObjectId(menu.linkedInventory) });
//       if (!inventory) continue;

//       const available = inventory.currentStock || 0;
//       if (item.quantity > available) {
//         partialAlerts.push({
//           name: menu.name || item.name,
//           requested: item.quantity,
//           available,
//         });
//       }
//     }

//     return Response.json({
//       success: true,
//       partialAlerts,
//       message: "Validation complete. Awaiting final confirmation.",
//     });
//   }

//   let order;
//   let orderIdObj;

//   // === CUSTOMER FINAL CONFIRM: Use existing order from verify-otp ===
//   // if (source === "qr-code" && isFinalConfirm && clientOrderId) {
//   //   try {
//   //     orderIdObj = new ObjectId(clientOrderId);
//   //     order = await db.collection("orders").findOne({ _id: orderIdObj });

//   //     if (!order) {
//   //       return Response.json({ error: "Order not found" }, { status: 404 });
//   //     }
//   //   } catch (e) {
//   //     return Response.json({ error: "Invalid orderId" }, { status: 400 });
//   //   }
//   // }
//   // === CUSTOMER FINAL CONFIRM: Safe partial + normal order handling ===
// // === CUSTOMER FINAL CONFIRM: Trust frontend-adjusted quantities (allow partial) ===
// if (source === "qr-code" && isFinalConfirm && clientOrderId) {
//   try {
//     const orderIdObj = new ObjectId(clientOrderId);
    
//     // Find existing order
//     const existingOrder = await db.collection("orders").findOne({ _id: orderIdObj });
//     if (!existingOrder) {
//       return Response.json({ error: "Order not found" }, { status: 404 });
//     }

//     const deductions = [];

//     // Deduct stock with adjusted quantities
//     for (const item of items) {
//       if (item.itemType !== "retail") continue;

//       const menuId = item._id || item.id;
//       if (!menuId) continue;

//       const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
//       if (!menu?.linkedInventory) continue;

//       const invId = new ObjectId(menu.linkedInventory);
//       const inventory = await db.collection("inventory").findOne({ _id: invId });
//       if (!inventory) continue;

//       const available = inventory.currentStock || 0;
//       let deductQty = Number(item.quantity || 0);

//       if (deductQty > available) deductQty = available;
//       if (deductQty <= 0) continue;

//       const result = await db.collection("inventory").updateOne(
//         { _id: invId },
//         { $inc: { currentStock: -deductQty } }
//       );

//       if (result.modifiedCount === 0) {
//         console.warn(`Stock race: ${menu.name}, tried ${deductQty}`);
//       }

//       deductions.push({ inventoryId: invId.toString(), qty: deductQty });
//     }

//     // Calculate correct totals
//     const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
//     const itemTaxes = items.reduce((sum, i) => {
//       const lineTotal = i.price * i.quantity;
//       return sum + (lineTotal * Number(i.tax || 0)) / 100;
//     }, 0);

//     // UPDATE the order with correct items and totals
//     await db.collection("orders").updateOne(
//       { _id: orderIdObj },
//       {
//         $set: {
//           items: items,
//           subtotal: subtotal.toFixed(2),
//           itemTaxes: Number(itemTaxes.toFixed(2)),
//           totalAmount: Number(subtotal + itemTaxes).toFixed(2),
//           partialOrder: true,
//           updatedAt: new Date(),
//         }
//       }
//     );

//     // Log stock movements
//     if (deductions.length > 0) {
//       await db.collection("stock_movements").insertMany(
//         deductions.map(d => ({
//           inventoryId: new ObjectId(d.inventoryId),
//           type: "out",
//           quantity: d.qty,
//           reason: `Order #${existingOrder.orderNumber} (Partial Update)`,
//           orderId: orderIdObj,
//           date: new Date(),
//         }))
//       );
//     }

//     // === FETCH THE UPDATED ORDER FRESH FROM DB ===
//     const updatedOrder = await db.collection("orders").findOne({ _id: orderIdObj });

//     // // === GENERATE BILL USING UPDATED ORDER ===
//     // let billData = null;
//     // if (!updatedOrder.billed) {
//     //   try {
//     //     const counterKey = "global_invoice_seq";
//     //     await db.collection("bill_counters").findOneAndUpdate(
//     //       { _id: counterKey },
//     //       { $setOnInsert: { seq: 0 } },
//     //       { upsert: true }
//     //     );
//     //     await db.collection("bill_counters").findOneAndUpdate(
//     //       { _id: counterKey },
//     //       { $inc: { seq: 1 } }
//     //     );

//     //     const counterDoc = await db.collection("bill_counters").findOne({ _id: counterKey });
//     //     if (!counterDoc?.seq) throw new Error("Failed to generate invoice number");

//     //     const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
//     //     const invoiceNumber = `INV-${today}-${String(counterDoc.seq).padStart(7, "0")}`;

//     //     const subtotal = Number(updatedOrder.subtotal);
//     //     const itemTaxes = Number(updatedOrder.itemTaxes || 0);
//     //     const totalAmount = subtotal + itemTaxes;

//     //     billData = {
//     //       billNumber: invoiceNumber,
//     //       orderId: orderIdObj,
//     //       orderNumber: updatedOrder.orderNumber,
//     //       customerName: updatedOrder.customerInfo?.name || "Walk-in Customer",
//     //       customerPhone: updatedOrder.customerInfo?.phone || "",
//     //       customerTable: updatedOrder.tableNumber || "",
//     //       orderType: updatedOrder.orderType || "dine-in",
//     //       items: updatedOrder.items, // ← NOW CORRECT QUANTITIES
//     //       subtotal: subtotal.toFixed(2),
//     //       itemTaxes: itemTaxes.toFixed(2),
//     //       totalAmount: totalAmount.toFixed(2),
//     //       status: "unpaid",
//     //       orderStatus: "pending",
//     //       createdAt: new Date(),
//     //       isSettled: false,
//     //     };

//     //     const billResult = await db.collection("bills").insertOne(billData);

//     //     await db.collection("orders").updateOne(
//     //       { _id: orderIdObj },
//     //       { $set: { billed: true, billId: billResult.insertedId } }
//     //     );

//     //     billData._id = billResult.insertedId;

//     //     emitEvent("orders1:update", {
//     //       id: orderIdObj.toString(),
//     //       soundEnabled: settings?.pos?.soundEnabled ?? true,
//     //     });
//     //   } catch (billError) {
//     //     console.error("Bill generation failed:", billError);
//     //   }
//     // }

//     return Response.json({
//       success: true,
//       order: updatedOrder,
//       bill: billData,
//       message: "Order updated successfully with available quantities"
//     });

//   } catch (e) {
//     console.error("Order update failed:", e);
//     return Response.json({ error: "Failed to update order" }, { status: 500 });
//   }
// }
//    else {
//     // === STAFF FLOW: Create brand new order ===

//     // === STOCK DEDUCTION LOGIC START ===
//     const deductions = [];
//     try {
//       for (const item of items) {
//         if (item.itemType !== "retail") continue;

//         const menuId = item._id || item.id;
//         if (!menuId) continue;

//         const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
//         if (!menu?.linkedInventory) continue;

//         const invId = new ObjectId(menu.linkedInventory);
        
//         const result = await db.collection("inventory").findOneAndUpdate(
//           { _id: invId, currentStock: { $gte: item.quantity } },
//           { $inc: { currentStock: -item.quantity } },
//           { returnDocument: "after" }
//         );
//         console.log('Result',JSON.stringify(result,null,2));
//         const updatedDoc = result.value !== undefined ? result.value : result;
//         console.log('Updated Doc',JSON.stringify(updatedDoc,null,2));
//         if (!updatedDoc) {
//            throw new Error(`Not enough stock for ${menu.name || item.name}`);
//         }
        
//         deductions.push({
//           inventoryId: invId.toString(),
//           qty: item.quantity
//         });
//       }
//     } catch (error) {
//         // Rollback
//          for (const d of deductions) {
//            await db.collection("inventory").updateOne(
//              { _id: new ObjectId(d.inventoryId) },
//              { $inc: { currentStock: d.qty } }
//            );
//          }
//          return Response.json({ error: error.message }, { status: 400 });
//     }
//     // === STOCK DEDUCTION LOGIC END ===

//     // Generate unique sequential order number
//     const orderCounterKey = "global_order_seq";
//     await db.collection("counters").findOneAndUpdate(
//       { _id: orderCounterKey },
//       { $setOnInsert: { seq: 0 } },
//       { upsert: true }
//     );

//     const counterResult = await db.collection("counters").findOneAndUpdate(
//       { _id: orderCounterKey },
//       { $inc: { seq: 1 } },
//       { returnDocument: "after" }
//     );

//     const counterDoc = counterResult.value !== undefined ? counterResult.value : counterResult;

//     if (!counterDoc || typeof counterDoc.seq !== 'number') {
//       throw new Error("Failed to generate order number");
//     }

//     const orderNumber = `ORD-${String(counterDoc.seq).padStart(7, "0")}`;

//     const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
//     const itemTaxes = items.reduce((sum, i) => {
//       const lineTotal = i.price * i.quantity;
//       return sum + (lineTotal * Number(i.tax || 0)) / 100;
//     }, 0);

//     const orderDoc = {
//       orderNumber,
//       items,
//       customerInfo: { ...customerInfo, table: (customerInfo.table || customerInfo.tableNumber || "A1") },
//       tableNumber: tableNumber || customerInfo.table || customerInfo.tableNumber || "A1",
//       orderType,
//       source,
//       subtotal: subtotal.toFixed(2),
//       itemTaxes: Number(itemTaxes.toFixed(2)),
//       totalAmount: Number(subtotal + itemTaxes).toFixed(2),
//       // totalAmount: subtotal.toFixed(2),
//       status: "pending",
//       paymentStatus: "unpaid",
//       createdAt: new Date(),
//       partialOrder: partialAlerts.length > 0,
//       billed: false,
//     };

//     const result = await db.collection("orders").insertOne(orderDoc);
//     orderIdObj = result.insertedId;
//     order = { ...orderDoc, _id: orderIdObj };

//     // === LOG STOCK MOVEMENTS ===
//     if (deductions.length > 0) {
//       await db.collection("stock_movements").insertMany(
//         deductions.map(d => ({
//           inventoryId: new ObjectId(d.inventoryId),
//           type: "out",
//           quantity: d.qty,
//           reason: `Order #${orderNumber}`,
//           orderId: orderIdObj,
//           date: new Date(),
//         }))
//       );
//     }
//   }

//   // === GENERATE BILL (only if not already billed) ===
//   let billData = null;
//   if (!order.billed) {
//     try {
//       const counterKey = "global_invoice_seq";
//       await db.collection("bill_counters").findOneAndUpdate(
//         { _id: counterKey },
//         { $setOnInsert: { seq: 0 } },
//         { upsert: true }
//       );
//       await db.collection("bill_counters").findOneAndUpdate(
//         { _id: counterKey },
//         { $inc: { seq: 1 } }
//       );

//       const counterDoc = await db.collection("bill_counters").findOne({ _id: counterKey });
//       if (!counterDoc?.seq) throw new Error("Failed to generate invoice number");

//       const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
//       const invoiceNumber = `INV-${today}-${String(counterDoc.seq).padStart(7, "0")}`;

//       const subtotal = Number(order.subtotal);
//       const itemTaxes = Number(order.itemTaxes || 0);
//       const totalAmount = subtotal + itemTaxes;
//  const normalizedOrderType =
//   typeof orderType === "object"
//     ? orderType?.value || orderType?.en || "dine-in"
//     : orderType || "dine-in";

//       billData = {
//         billNumber: invoiceNumber,
//         orderId: orderIdObj,
//         orderNumber: order.orderNumber,
//         customerName: order.customerInfo?.name || "Walk-in Customer",
//         customerPhone: order.customerInfo?.phone || "",
//         customerTable: order.tableNumber || "",
//         orderType: normalizedOrderType,
//         // orderType: order.orderType ,
//         items: order.items,
//         subtotal: subtotal.toFixed(2),
//         itemTaxes: itemTaxes.toFixed(2),
//         totalAmount: totalAmount.toFixed(2),
//         status: "unpaid",
//         orderStatus: "pending",
//         createdAt: new Date(),
//         isSettled: false,
//       };

//       const billResult = await db.collection("bills").insertOne(billData);

//       await db.collection("orders").updateOne(
//         { _id: orderIdObj },
//         { $set: { billed: true, billId: billResult.insertedId } }
//       );

//       billData._id = billResult.insertedId;

//       // Emit event
//       emitEvent("orders1:update", {
//         id: orderIdObj.toString(),
//         soundEnabled: settings?.pos?.soundEnabled ?? true,
//       });
//     } catch (billError) {
//       console.error("Bill generation failed:", billError);
//       // Continue — order exists, bill failed
//     }
//   }

//   // Return final result
//   const finalOrder = await db.collection("orders").findOne({ _id: orderIdObj });

//   return Response.json({
//     success: true,
//     order: finalOrder,
//     bill: billData,
//   });
// }
