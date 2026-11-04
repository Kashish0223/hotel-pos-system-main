// app/api/customers/verify-otp/route.js
import { getDatabase } from "@/lib/db-config";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return Response.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const db = await getDatabase();

    // Find OTP record — now supports both simple and order OTPs
    const otpRecord = await db.collection("otps").findOne({
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return Response.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Mark as verified
    await db.collection("otps").updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true, verifiedAt: new Date() } }
    );

    // If this OTP has orderData → this is an ORDER verification
    if (otpRecord.orderData) {
      const orderData = otpRecord.orderData;

      // Create the actual order in 'orders' collection
      const orderResult = await db.collection("orders").insertOne({
        // ...orderData,
        status: orderData.status,
        paymentMethod: "pending",
        createdAt: new Date(),
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        totalAmount: orderData.totalAmount,
        items: orderData.orderItems,
        customerInfo: orderData.customerInfo,
        tableNumber: orderData.tableNumber,
        paymentStatus: "unpaid",
        source: "qr-code",
      });

      const orderId = orderResult.insertedId;

      // Get customer
      let customer = await db.collection("customers").findOne({
        email: email.toLowerCase().trim(),
      });
      if (!customer) {
        const res = await db.collection("customers").insertOne({
          email: email.toLowerCase().trim(),
          name: orderData.customerInfo.name || "Guest",
          createdAt: new Date(),
        });
        // customer = { _id: res.insertedId, ...res.ops[0] };
        customer = {
          _id: res.insertedId,
          email: email.toLowerCase().trim(),
          name: orderData.customerInfo.name || "Guest",
        };

      }

      return Response.json({
        success: true,
        message: "Order placed successfully",
        orderId: orderId.toString(),
        customer: {
          _id: customer._id.toString(),
          email: customer.email,
          name: customer.name || "Guest",
        },
      });
    }

    // Otherwise, it's just account verification (old flow)
    let customer = await db.collection("customers").findOne({
      email: email.toLowerCase().trim(),
    });
    if (!customer) {
      const res = await db.collection("customers").insertOne({
        email: email.toLowerCase().trim(),
        name: "Guest",
        createdAt: new Date(),
      });
      customer = { _id: res.insertedId, email: email.toLowerCase().trim(), name: "Guest" };
    }

    return Response.json({
      success: true,
      message: "OTP verified successfully",
      customer: {
        _id: customer._id.toString(),
        email: customer.email,
        name: customer.name || "Guest",
      },
    });

  } catch (error) {
    console.error("verify-otp error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}


