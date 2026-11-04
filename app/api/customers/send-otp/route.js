import { sendEmail, EmailTemplate } from "@/lib/email";
import { getDatabase } from "@/lib/db-config";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return Response.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // Connect to MongoDB
    const db = await getDatabase();

    // Check if customer exists
    let customer = await db.collection("customers").findOne({ email });
    let name = "Customer";

    if (customer && customer.firstName) {
      name = customer.firstName;
    }

    // Send the email using our email utility
    await sendEmail(
      email,
      'Hotel-POS - Account Verification Code',
      EmailTemplate.TEST, // Using TEST template as it's simpler
      {
        message: `
          <h2>Hello ${name},</h2>
          <p>Your verification code for Hotel-POS account is:</p>
          <div style="background-color: #DC2626; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 15 minutes. If you did not request this code, please ignore this email.</p>
        `
      }
    );

    return Response.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return Response.json({ error: "Failed to send OTP email" }, { status: 500 });
  }
}