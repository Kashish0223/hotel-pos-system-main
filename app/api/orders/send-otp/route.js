import { sendOTPEmail } from "@/lib/email";
import { getDatabase } from "@/lib/db-config";
import { NextResponse } from "next/server";

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { email, orderItems, totalAmount, customerInfo, tableNumber, orderType, source, language,paymentStatus = 'unpaid',
  paymentMethod = 'pending',itemTaxes } = await request.json();

    // Validate input
    if (!email || !orderItems || !totalAmount) {
      return NextResponse.json(
        { error: "Email, order items, and total amount are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const db = await getDatabase();

    // Get settings for currency
    const settings = await db.collection("settings").findOne({ hotelName: { $exists: true } });
    const currency = settings?.currency || "₹";

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Store OTP in database
    await db.collection("otps").insertOne({
      email,
      otp,
      expiresAt,
      orderItems,
      totalAmount,
      customerInfo,
      tableNumber,
      orderType: orderType || "dine-in",
      source: source || "qr-code",
      language: language || "en",
      createdAt: new Date(),
      verified: false,
      paymentStatus,
      paymentMethod,
      itemTaxes,
    });

    // For development/demo purposes, we'll return the OTP directly in the response
    // In production, you would want to send this via email only
    let emailSent = false;
    let emailError = null;
    
    // Try to send OTP email using our centralized function
    try {
      await sendOTPEmail(email, otp, {
        orderItems,
        totalAmount,
        currency
      });
      
      // console.log('OTP email sent successfully');
      emailSent = true;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      emailError = error;
      // Continue with the process even if email fails
      // We'll still store the OTP in the database
    }

    // Include the OTP in the response for development/demo purposes
    // In production, you would want to remove this
    return NextResponse.json({ 
      success: true, 
      message: emailSent ? "OTP sent successfully to your email" : "OTP created successfully",
      // Only include these fields in development mode
      development: {
        otp: otp,
        emailSent: emailSent,
        emailError: emailError ? {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response
        } : null
      }
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Failed to send OTP", details: error.message },
      { status: 500 }
    );
  }
}