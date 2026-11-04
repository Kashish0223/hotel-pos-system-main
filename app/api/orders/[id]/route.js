import { getDatabase } from "@/lib/db-config";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { emitEvent } from "@/lib/events";
import { jwtVerify } from "jose";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function GET(request, { params }) {
  try {
    const db = await getDatabase();
    // 🔐 Decode JWT
    const headerList = await headers();
    const authHeader = headerList.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      const verified = await jwtVerify(token, secret);
      const payload = verified.payload;
      if (!payload.role)
        return Response.json(
          { error: "Invalid token (missing role)" },
          { status: 401 }
        );
    } catch (e) {
      // console.error("JWT verification failed:", e);
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(id),
    });
    // console.log("Orders ID",order)

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return Response.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const data = await request.json();
    const { id } = await params;

    // === AUTHENTICATION (unchanged) ===
    const headerList = await headers();
    const authHeader = headerList.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (e) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Permission checks (kept as-is)
    const tokenRole = payload.role;
    const tokenPermissions = Array.isArray(payload.permissions) ? payload.permissions : [];
    const isSuperAdmin = payload.isSuperAdmin || false;
    if (!(tokenRole === "superadmin" || isSuperAdmin)) {
      const requestedPermissions = Array.isArray(data.permissions) ? data.permissions : [];
      const forbidden = requestedPermissions.filter(p => !tokenPermissions.includes(p));
      if (forbidden.length > 0) {
        return Response.json(
          { error: `Permission mismatch: You don't have permission: ${forbidden.join(", ")}` },
          { status: 403 }
        );
      }
    }

    const orderIdObj = new ObjectId(id);

    // Fetch current order
    const currentOrder = await db.collection("orders").findOne({ _id: orderIdObj });
    if (!currentOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Declare outside so accessible later
    const partialAlerts = [];
    const deductions = [];

    // === INVENTORY HANDLING WITH PARTIAL ALERTS (from 2nd code) ===
    if (Array.isArray(data.items)) {
      // STEP 1: Check stock and adjust quantities if needed
      for (const newItem of data.items) {
        if (newItem.itemType !== "retail") continue;

        const menuId = newItem._id || newItem.id;
        if (!menuId) continue;

        const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
        if (!menu?.linkedInventory) continue;

        const invId = new ObjectId(menu.linkedInventory);

        // Fetch REAL available BEFORE restore
        const inventory = await db.collection("inventory").findOne({ _id: invId });
        const realAvailable = inventory?.currentStock || 0;

        const oldItem = currentOrder.items?.find(i => String(i._id || i.id) === String(menuId));
        const originalQty = oldItem?.quantity || 0;

        const maxAllowed = originalQty + realAvailable;
        let finalQty = newItem.quantity;

        if (newItem.quantity > maxAllowed) {
          if (realAvailable === 0) {
            finalQty = originalQty;
            partialAlerts.push({
              name: menu.name || newItem.name,
              requested: newItem.quantity,
              available: 0,
              adjustedTo: originalQty,
              message: "0 available, cannot increase"
            });
          } else {
            finalQty = maxAllowed;
            partialAlerts.push({
              name: menu.name || newItem.name,
              requested: newItem.quantity,
              available: realAvailable,
              adjustedTo: finalQty,
            });
          }
          newItem.quantity = finalQty; // Adjust the quantity in the incoming data
        }
      }

      // STEP 2: Restore old quantities (return previously deducted stock)
      for (const oldItem of currentOrder.items || []) {
        if (oldItem.itemType !== "retail") continue;

        const menuId = oldItem._id || oldItem.id;
        if (!menuId) continue;

        const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
        if (!menu?.linkedInventory) continue;

        await db.collection("inventory").updateOne(
          { _id: new ObjectId(menu.linkedInventory) },
          { $inc: { currentStock: oldItem.quantity } }
        );
      }

      // STEP 3: Deduct the final (possibly adjusted) quantities
      for (const newItem of data.items) {
        if (newItem.itemType !== "retail") continue;

        const menuId = newItem._id || newItem.id;
        if (!menuId) continue;

        const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
        if (!menu?.linkedInventory) continue;

        const invId = new ObjectId(menu.linkedInventory);

        const result = await db.collection("inventory").findOneAndUpdate(
          { _id: invId },
          { $inc: { currentStock: -newItem.quantity } },
          { returnDocument: "after" }
        );

        deductions.push({
          inventoryId: invId.toString(),
          qty: newItem.quantity,
          newStock: result?.value?.currentStock || 0,
        });
      }
    }

    // === RECALCULATE TOTALS (your original logic) ===
    let subtotal = Number(currentOrder.subtotal || 0);
    let itemTaxes = Number(currentOrder.itemTaxes || 0);
    let totalAmount = Number(currentOrder.totalAmount || 0);
    if (Array.isArray(data.items)) {
      subtotal = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      itemTaxes = data.items.reduce((sum, i) => {
        const lineTotal = i.price * i.quantity;
        return sum + (lineTotal * Number(i.tax || 0)) / 100;
      }, 0);
      totalAmount = subtotal + itemTaxes;
    }

    // === UPDATE ORDER IN DB ===
    const { createdAt, _id, ...restData } = data; // Exclude createdAt and _id from updates

    const updateFields = {
      ...restData,
      subtotal: Number(subtotal.toFixed(2)),
      itemTaxes: Number(itemTaxes.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      updatedAt: new Date(),
    };

    await db.collection("orders").updateOne(
      { _id: orderIdObj },
      { $set: updateFields }
    );

    // === SYNC BILL (your original full logic - unchanged) ===
    // let bill = await db.collection("bills").findOne({ orderId: orderIdObj });
    // const normalizedOrderType =
    //   typeof data.orderType === "object"
    //     ? data.orderType?.value || data.orderType?.en || "dine-in"
    //     : data.orderType || currentOrder.orderType || "dine-in";

    // const billData = {
    //   orderId: orderIdObj,
    //   orderNumber: currentOrder.orderNumber,
    //   customerName: data.customerInfo?.name || currentOrder.customerInfo?.name || "Walk-in Customer",
    //   customerPhone: data.customerInfo?.phone || currentOrder.customerInfo?.phone || "",
    //   customerTable: data.customerInfo?.table || currentOrder.tableNumber || "",
    //   orderType: normalizedOrderType,
    //   items: data.items || currentOrder.items,
    //   subtotal: Number(subtotal).toFixed(2),
    //   itemTaxes: Number(itemTaxes).toFixed(2),
    //   totalAmount: Number(totalAmount).toFixed(2),
    //   status: data.paymentStatus || currentOrder.paymentStatus || "unpaid",
    //   orderStatus: data.status || currentOrder.status,
    //   updatedAt: new Date(),
    //   isSettled: data.status === "paid" || currentOrder.status === "paid",
    // };

    // if (bill) {
    //   await db.collection("bills").updateOne(
    //     { _id: bill._id },
    //     { $set: billData }
    //   );
    // } else {
    //   const counterKey = "global_invoice_seq";
    //   await db.collection("bill_counters").findOneAndUpdate(
    //     { _id: counterKey },
    //     { $setOnInsert: { seq: 0 } },
    //     { upsert: true }
    //   );
    //   await db.collection("bill_counters").findOneAndUpdate(
    //     { _id: counterKey },
    //     { $inc: { seq: 1 } }
    //   );
    //   const counterDoc = await db.collection("bill_counters").findOne({ _id: counterKey });
    //   if (!counterDoc?.seq) throw new Error("Failed to generate invoice number");
    //   const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    //   const invoiceNumber = `INV-${today}-${String(counterDoc.seq).padStart(7, "0")}`;

    //   await db.collection("bills").insertOne({
    //     billNumber: invoiceNumber,
    //     ...billData,
    //     createdAt: new Date(),
    //   });

    //   await db.collection("orders").updateOne(
    //     { _id: orderIdObj },
    //     { $set: { billed: true } }
    //   );
    // }

    // === REAL-TIME EVENTS (unchanged) ===
    try {
      const tableNum = data.customerInfo?.table || currentOrder.tableNumber || null;
      emitEvent("orders:update", {
        id,
        status: data.status || currentOrder.status,
        tableNumber: tableNum,
      });
      emitEvent("orders1:update", {
        id,
        status: data.status || currentOrder.status,
        tableNumber: tableNum,
      });
    } catch (e) {
      console.error("emitEvent failed", e);
    }

    // === FINAL RETURN (already had partialAlerts) ===
    return Response.json({
      success: true,
      partialAlerts,
      message: partialAlerts.length > 0
        ? "Order updated with adjustments due to low/out of stock"
        : "Order updated successfully"
    });
  }
  catch (error) {
    console.error("Error updating order:", error);
    return Response.json({ error: error.message || "Failed to update order and bill" }, { status: 500 });
  }
}
// export async function PUT(request, { params }) {
//   try {
//     const client = await clientPromise;
//     const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

//     const data = await request.json();
//     const { id } = await params;

//     // === AUTHENTICATION (unchanged) ===
//     const headerList = await headers();
//     const authHeader = headerList.get("Authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return Response.json({ error: "No token provided" }, { status: 401 });
//     }

//     const token = authHeader.split("Bearer ")[1];
//     let payload;
//     try {
//       const verified = await jwtVerify(token, secret);
//       payload = verified.payload;
//     } catch (e) {
//       return Response.json({ error: "Invalid or expired token" }, { status: 401 });
//     }

//     // Permission checks (kept as-is)
//     const tokenRole = payload.role;
//     const tokenPermissions = Array.isArray(payload.permissions) ? payload.permissions : [];
//     const isSuperAdmin = payload.isSuperAdmin || false;

//     if (!(tokenRole === "superadmin" || isSuperAdmin)) {
//       const requestedPermissions = Array.isArray(data.permissions) ? data.permissions : [];
//       const forbidden = requestedPermissions.filter(p => !tokenPermissions.includes(p));
//       if (forbidden.length > 0) {
//         return Response.json(
//           { error: `Permission mismatch: You don't have permission: ${forbidden.join(", ")}` },
//           { status: 403 }
//         );
//       }
//     }

//     const orderIdObj = new ObjectId(id);

//     // Fetch current order
//     const currentOrder = await db.collection("orders").findOne({ _id: orderIdObj });
//     if (!currentOrder) {
//       return Response.json({ error: "Order not found" }, { status: 404 });
//     }

//     const deductions = [];


// if (Array.isArray(data.items)) {
//   const partialAlerts = [];
//   const deductions = [];

//   // STEP 1: Calculate max allowed using CURRENT real stock (BEFORE restore)
//   for (const newItem of data.items) {
//     if (newItem.itemType !== "retail") continue;

//     const menuId = newItem._id || newItem.id;
//     if (!menuId) continue;

//     const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
//     if (!menu?.linkedInventory) continue;

//     const invId = new ObjectId(menu.linkedInventory);

//     // Fetch REAL available BEFORE restore
//     const inventory = await db.collection("inventory").findOne({ _id: invId });
//     const realAvailable = inventory?.currentStock || 0;

//     const oldItem = currentOrder.items?.find(i => String(i._id || i.id) === String(menuId));
//     const originalQty = oldItem?.quantity || 0;

//     const maxAllowed = originalQty + realAvailable;
//     let finalQty = newItem.quantity;

//     // If try to increase beyond available
//     if (newItem.quantity > maxAllowed) {
//       // Special: if 0 available, rollback to original, special warn
//       if (realAvailable === 0) {
//         finalQty = originalQty;
//         partialAlerts.push({
//           name: menu.name || newItem.name,
//           requested: newItem.quantity,
//           available: 0,
//           adjustedTo: originalQty,
//           message: "0 available, cannot increase"
//         });
//       } else {
//         // Normal partial: cap to max, warn "only X more"
//         finalQty = maxAllowed;
//         partialAlerts.push({
//           name: menu.name || newItem.name,
//           requested: newItem.quantity,
//           available: realAvailable,
//           adjustedTo: finalQty,
//         });
//       }
//       newItem.quantity = finalQty; // Adjust in data
//     }
//   }

//   // STEP 2: Restore old stock
//   for (const oldItem of currentOrder.items || []) {
//     if (oldItem.itemType !== "retail") continue;

//     const menuId = oldItem._id || oldItem.id;
//     if (!menuId) continue;

//     const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
//     if (!menu?.linkedInventory) continue;

//     await db.collection("inventory").updateOne(
//       { _id: new ObjectId(menu.linkedInventory) },
//       { $inc: { currentStock: oldItem.quantity } }
//     );
//   }

//   // STEP 3: Deduct final (adjusted) quantities — no $gte, since we capped
//   for (const newItem of data.items) {
//     if (newItem.itemType !== "retail") continue;

//     const menuId = newItem._id || newItem.id;
//     if (!menuId) continue;

//     const menu = await db.collection("menu").findOne({ _id: new ObjectId(menuId) });
//     if (!menu?.linkedInventory) continue;

//     const invId = new ObjectId(menu.linkedInventory);

//     const result = await db.collection("inventory").findOneAndUpdate(
//       { _id: invId },
//       { $inc: { currentStock: -newItem.quantity } },
//       { returnDocument: "after" }
//     );

//     deductions.push({
//       inventoryId: invId.toString(),
//       qty: newItem.quantity,
//       newStock: result?.currentStock || 0,
//     });
//      // === UPDATE ORDER IN DB ===
//   const updateFields = {
//     ...data,
//     subtotal: Number(subtotal.toFixed(2)),
//     itemTaxes: Number(itemTaxes.toFixed(2)),
//     totalAmount: Number(totalAmount.toFixed(2)),
//     updatedAt: new Date(),
//   };

//   await db.collection("orders").updateOne(
//     { _id: orderIdObj },
//     { $set: updateFields }
//   );

//   // === SYNC BILL (Update if exists, create if not) ===
//   let bill = await db.collection("bills").findOne({ orderId: orderIdObj });

//   const normalizedOrderType =
//     typeof data.orderType === "object"
//       ? data.orderType?.value || data.orderType?.en || "dine-in"
//       : data.orderType || currentOrder.orderType || "dine-in";

//   const billData = {
//     orderId: orderIdObj,
//     orderNumber: currentOrder.orderNumber,
//     customerName: data.customerInfo?.name || currentOrder.customerInfo?.name || "Walk-in Customer",
//     customerPhone: data.customerInfo?.phone || currentOrder.customerInfo?.phone || "",
//     customerTable: data.customerInfo?.table || currentOrder.tableNumber || "",
//     orderType: normalizedOrderType,
//     items: data.items || currentOrder.items,
//     subtotal: Number(subtotal).toFixed(2),
//     itemTaxes: Number(itemTaxes).toFixed(2),
//     totalAmount: Number(totalAmount).toFixed(2),
//     status: data.paymentStatus || currentOrder.paymentStatus || "unpaid",
//     orderStatus: data.status || currentOrder.status,
//     updatedAt: new Date(),
//     isSettled: data.status === "completed" || currentOrder.status === "completed",
//   };

//   if (bill) {
//     // Update existing bill
//     await db.collection("bills").updateOne(
//       { _id: bill._id },
//       { $set: billData }
//     );
//   } else {
//     // Rare case: bill missing → create new one (same as POST)
//     const counterKey = "global_invoice_seq";
//     await db.collection("bill_counters").findOneAndUpdate(
//       { _id: counterKey },
//       { $setOnInsert: { seq: 0 } },
//       { upsert: true }
//     );
//     await db.collection("bill_counters").findOneAndUpdate(
//       { _id: counterKey },
//       { $inc: { seq: 1 } }
//     );

//     const counterDoc = await db.collection("bill_counters").findOne({ _id: counterKey });
//     if (!counterDoc?.seq) throw new Error("Failed to generate invoice number");

//     const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
//     const invoiceNumber = `INV-${today}-${String(counterDoc.seq).padStart(7, "0")}`;

//     await db.collection("bills").insertOne({
//       billNumber: invoiceNumber,
//       ...billData,
//       createdAt: new Date(),
//     });

//     // Mark order as billed
//     await db.collection("orders").updateOne(
//       { _id: orderIdObj },
//       { $set: { billed: true } }
//     );
//   }
//     try {
//     const tableNum = data.customerInfo?.table || currentOrder.tableNumber || null;
//     emitEvent("orders:update", { id, status: data.status || currentOrder.status, tableNumber: tableNum });
//     emitEvent("orders1:update", { id, status: data.status || currentOrder.status, tableNumber: tableNum });
//   } catch (e) {
//     console.error("emitEvent failed", e);
//   }
//     return Response.json({
//       success: true,
//       partialAlerts,
//       message: partialAlerts.length > 0
//         ? "Order updated with adjustments due to low/out of stock"
//         : "Order updated successfully"
//     });
//   }
// }

//   }
//   catch (error) {
//     console.error("Error updating order:", error);
//     return Response.json({ error: error.message || "Failed to update order and bill" }, { status: 500 });
//   }
//  }
