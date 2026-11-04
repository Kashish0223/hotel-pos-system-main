// app/api/orders/place/route.js
import { getDatabase } from "@/lib/db-config";
import { sendEmail, EmailTemplate } from "@/lib/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      orderItems,
      totalAmount,
      customerInfo,
      tableNumber,
      paymentMethod,
      language = "en",
    } = body;

    if (!email || !orderItems || orderItems.length === 0) {
      return Response.json(
        { error: "Invalid order data" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP + pending order data
    await db.collection("otps").insertOne({
      email: email.toLowerCase().trim(),
      otp,
      orderData: body, // Save full order for later verification
      expiresAt,
      verified: false,
      createdAt: new Date(),
    });

    // Send OTP email
    const name = customerInfo?.name || "Customer";

    await sendEmail(
      email,
      "Hotel-POS - Verify Your Order",
      EmailTemplate.TEST, // Can be replaced with ORDER_OTP later
      {
        message: `
          <h2>Hello ${name},</h2>
          <p>Thank you for your order at Table ${tableNumber}!</p>
          <p>Your verification code is:</p>
          <div style="background-color: #DC2626; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 30px 0; letter-spacing: 8px;">
            ${otp}
          </div>
          <p>This code expires in 15 minutes.</p>
          <p><strong>Total Amount:</strong> ₹${Number(totalAmount).toFixed(0)}</p>
        `,
      }
    );

    return Response.json({
      success: true,
      message: "Order received. OTP sent to your email.",
      development: { otp }, // ❌ remove in production
    });

  } catch (error) {
    console.error("Place order error:", error);
    return Response.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
