// app/api/orders/verify-otp/route.js
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getDatabase } from "@/lib/db-config";
import { NextResponse } from "next/server";
import { emitEvent } from "@/lib/events";
import { SignJWT } from 'jose';
import { ObjectId } from "mongodb";
import { sendPushToAuthorizedUsers } from "@/lib/sendPushNotification";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error("Invalid JSON:", e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, otp } = body;

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  try {
    const db = await getDatabase();

    const searchEmail = email.toLowerCase().trim();
    const searchOtp = otp.toString().trim();

    const otpRecord = await db.collection("otps").findOne({
      email: searchEmail,
      otp: searchOtp,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Mark OTP as verified
    await db.collection("otps").updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true, verifiedAt: new Date() } }
    );

    const settings = await db.collection("settings").findOne({ hotelName: { $exists: true } });
    const currency = settings?.currency || "₹";

    // === CUSTOMER & USER LOGIC (unchanged) ===
    let customer = await db.collection("customers").findOne({ email: searchEmail });
    if (!customer) {
      const customerData = {
        name: otpRecord.customerInfo?.name || "Guest",
        email: searchEmail,
        phone: otpRecord.customerInfo?.phone || "",
        lastVisit: new Date(),
        visitCount: 1,
        status: "active",
        membershipTier: "bronze",
        totalSpent: otpRecord.totalAmount || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const res = await db.collection("customers").insertOne(customerData);
      customer = { _id: res.insertedId, ...customerData };
    } else {
      await db.collection("customers").updateOne(
        { _id: customer._id },
        {
          $set: { lastVisit: new Date(), updatedAt: new Date() },
          $inc: { visitCount: 1, totalSpent: otpRecord.totalAmount || 0 },
        }
      );
    }

    let user = await db.collection("users").findOne({ email: searchEmail });
    if (!user) {
      const res = await db.collection("users").insertOne({
        email: searchEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
        orders: [],
      });
      user = { _id: res.insertedId, email: searchEmail };
    }

    // === STOCK DEDUCTION: Safe partial handling ===
    // const deductions = [];
    const orderItems = otpRecord.orderItems || [];

    // for (const item of orderItems) {
    //   if (item.itemType !== "retail") continue;

    //   const menu = await db.collection("menu").findOne({ _id: new ObjectId(item._id) });
    //   if (!menu?.linkedInventory) continue;

    //   const invId = new ObjectId(menu.linkedInventory);
    //   const inventory = await db.collection("inventory").findOne({ _id: invId });

    //   if (!inventory) continue;

    //   const available = inventory.currentStock || 0;
    //   const requested = item.quantity;

    //   // If not enough stock → skip deduction, but allow order with reduced qty (already adjusted in frontend)
    //   if (requested > available) {
    //     // Do NOT deduct anything for this item
    //     // Frontend already reduced quantity to available (or user confirmed partial)
    //     // So we just proceed with the reduced quantity in the order
    //     continue;
    //   }

    //   // Deduct only if enough stock
    //   const result = await db.collection("inventory").findOneAndUpdate(
    //     { _id: invId, currentStock: { $gte: requested } },
    //     { $inc: { currentStock: -requested } },
    //     { returnDocument: "after" }
    //   );

    //   if (!result) {
    //     // Rollback all previous deductions
    //     for (const d of deductions) {
    //       await db.collection("inventory").updateOne(
    //         { _id: new ObjectId(d.inventoryId) },
    //         { $inc: { currentStock: d.qty } }
    //       );
    //     }
    //     throw new Error(`Failed to deduct stock for ${menu.name}`);
    //   }

    //   deductions.push({
    //     inventoryId: invId.toString(),
    //     name: menu.name,
    //     qty: requested,
    //     newStock: result.currentStock,
    //   });
    // }

    // === STOCK DEDUCTION: Only on final confirm (after OTP) ===
        // === SAFE STOCK DEDUCTION: Allow partial orders ===
    const deductions = [];

    for (const item of orderItems) {
      if (item.itemType !== "retail") continue;

      const itemId = item._id || item.id;
      if (!itemId || !ObjectId.isValid(itemId)) continue;

      const menu = await db.collection("menu").findOne({ _id: new ObjectId(itemId) });
      if (!menu?.linkedInventory) continue;

      const invId = new ObjectId(menu.linkedInventory);
      const inventory = await db.collection("inventory").findOne({ _id: invId });
      if (!inventory) continue;

      const available = inventory.currentStock || 0;
      let deductQty = Number(item.quantity || 0);

      // Partial: if not enough, deduct only what's available
      if (deductQty > available) {
        deductQty = available;
      }

      if (deductQty <= 0) continue;

      const result = await db.collection("inventory").findOneAndUpdate(
        { _id: invId, currentStock: { $gte: deductQty } },
        { $inc: { currentStock: -deductQty } },
        { returnDocument: "after" }
      );

      const updatedDoc = result?.value || result;

      if (!updatedDoc) {
        // Rollback on failure
        for (const d of deductions) {
          await db.collection("inventory").updateOne(
            { _id: new ObjectId(d.inventoryId) },
            { $inc: { currentStock: d.qty } }
          );
        }
        return NextResponse.json(
          { error: `Failed to reserve stock for ${menu.name || item.name}` },
          { status: 400 }
        );
      }

      deductions.push({
        inventoryId: invId.toString(),
        qty: deductQty,
      });
    }
    

    // If any critical items failed, rollback and fail order
    // if (failedItems.length > 0) {
    //   // Rollback successful deductions
    //   for (const d of deductions) {
    //     await db.collection("inventory").updateOne(
    //       { _id: new ObjectId(d.inventoryId) },
    //       { $inc: { currentStock: d.qty } }
    //     );
    //   }

    //   return NextResponse.json({
    //     error: "Insufficient stock for some items",
    //     insufficientItems: failedItems
    //   }, { status: 400 });
    // }

    // === CREATE FINAL ORDER ===
    // === GENERATE UNIQUE SEQUENTIAL ORDER NUMBER ===
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
      console.error("Counter document error:", counterResult);
      throw new Error("Failed to generate order number");
    }

    const orderNumber = `ORD-${String(counterDoc.seq).padStart(7, "0")}`; // ORD-0001, ORD-0002, etc.
    const subtotal = orderItems.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0);

    const orderData = {
      orderNumber,
      userId: user._id,
      customerId: customer._id,
      email: searchEmail,
      customerEmail: searchEmail,
      customerInfo: otpRecord.customerInfo || { name: "Guest", email: searchEmail },
      items: orderItems,
      totalAmount: otpRecord.totalAmount || subtotal,
      tableNumber: otpRecord.table || otpRecord.customerInfo?.table || otpRecord.tableNumber || otpRecord.customerInfo?.tableNumber || "A1",
      orderType: otpRecord.orderType || "dine-in",
      source: otpRecord.source || "qr-code",
      language: otpRecord.language || "en",
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: otpRecord.paymentMethod || "pending",
      itemTaxes: otpRecord.itemTaxes || 0,
      subtotal: subtotal.toFixed(2),
      createdAt: new Date(),
      updatedAt: new Date(),
      partialOrder: true,
      billPay:false
    };

    const orderResult = await db.collection("orders").insertOne(orderData);
    const orderId = orderResult.insertedId.toString();
    // Link order to user
    await db.collection("users").updateOne(
      { _id: user._id },
      { $push: { orders: orderId }, $set: { updatedAt: new Date() } }
    );

    // Log stock movements (only successful deductions)
    if (deductions.length > 0) {
      await db.collection("stock_movements").insertMany(
        deductions.map(d => ({
          inventoryId: new ObjectId(d.inventoryId),
          type: "out",
          quantity: d.qty,
          reason: `Order #${orderNumber}`,
          orderId: new ObjectId(orderId),
          date: new Date(),
        }))
      );
    }

    // Generate JWT
    const token = await new SignJWT({
      id: user._id.toString(),
      email: searchEmail,
      role: 'customer'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(searchEmail, {
        orderItems: orderItems,
        totalAmount: otpRecord.totalAmount,
        currency,
        orderId,
        orderDate: new Date(),
      });
    } catch (e) {
      console.error("Confirmation email failed:", e);
    }

    // Emit event
    try {
      emitEvent("orders1:update", { orderId, type: "new", status: "pending" });
      
      // Send Push Notification
      await sendPushToAuthorizedUsers({
        title: "New Customer Order",
        body: `Order #${orderNumber} from Table ${orderData.tableNumber}`,
        data: {
          url: "/orders",
          orderId: orderId
        }
      });
    } catch (e) {
      console.error("SSE/Push failed:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Order confirmed successfully",
      orderId,
      customerId: customer._id.toString(),
      token,
    });

  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

