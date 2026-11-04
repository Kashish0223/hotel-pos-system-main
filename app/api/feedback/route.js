// app/api/feedback/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"
import { sendEmail, EmailTemplate } from "@/lib/email"; // Import email utilities

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const feedbacks = await db
      .collection("feedbacks")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const collection = db.collection("feedbacks");

    const body = await request.json();

    const feedback = {
      food: body.food,
      service: body.service,
      cleanliness: body.cleanliness,
      email: body.email,
      money: body.money,
      staff: body.staff,
      suggestion: body.suggestion || "",
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const result = await collection.insertOne(feedback);

    if (!result.acknowledged) {
      throw new Error("Failed to save feedback");
    }

    // --- SEND FEEDBACK EMAIL TO MULTIPLE ADMINS ---
    try {
  const adminEmails = [
    "hitesh9398rao@gmail.com", // This will be the 'To' recipient
    "yobey81623@atinjo.com",    // This will be in 'BCC'
  ];

  const primaryAdmin = adminEmails[0];
  const otherAdmins = adminEmails.slice(1);

  // 1. Send Notification to Admins
//   await sendEmail({
//  from: body.email || "anonymous@feedback.com",
//     to: primaryAdmin,
//     subject: `New Feedback from ${body.email || 'Guest'}`,
//     template: EmailTemplate.FEEDBACK,
//     data: feedback,
//     bcc: otherAdmins  // Optional BCC for others
//     });
    // 1. Send Notification to Admins
await sendEmail({
  from: body.email || "anonymous@feedback.com",
  to: primaryAdmin,
  subject: `New Feedback from ${body.email || 'Guest'}`,
  template: EmailTemplate.FEEDBACK,
  data: feedback,
  bcc: otherAdmins  // BCC for remaining admins
});

// 2. Thank You email to Customer (FIXED: now using object syntax)
      if (body.email) {
        const thankYouEmailSent = await sendEmail({
          from: process.env.primaryAdmin,                  // Hotel's email (recommended)
          // or: from: `"Hotel-POS" <${process.env.EMAIL}>` for display name
          to: body.email,
          subject: "Thank you for your feedback!",
          template: EmailTemplate.THANK_YOU,
          data: {}  // No data needed for thank-you template
        });
        // console.log("Feedback emails processed successfully",thankYouEmailSent);
      }

  // console.log("Feedback emails processed successfully");
} catch (emailError) {
  console.error("Email processing failed:", emailError);
}
    // try {
    //   const adminEmails = [
    //     "hitesh9398rao@gmail.com",          // Primary admin
    //    // "another-email@example.com"
    //   ];

    //   await sendEmail(
    //     body.email || "anonymous@feedback.com",  // from
    //     adminEmails,                               // ← to
    //     `New Customer Feedback from ${body.email?.split('@')[0] || 'Anonymous'}`, // subject
    //       'feedback',            // template
    //      feedback                            // data
    //   );

    //   console.log("Feedback notification sent to admins");
    // } catch (emailError) {
    //   console.error("Failed to send feedback email:", emailError);
    //   // Don't fail the submission even if email fails
    // }

    return NextResponse.json(
      { success: true, message: "Feedback submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
// export async function POST(request) {
//   try {
//     const client = await clientPromise;
//     const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
//     const collection = db.collection("feedbacks"); // ← simple collection name

//     const body = await request.json();

//     // Optional: basic validation
//     if (!body.food || !body.service || !body.cleanliness || !body.rating) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // Prepare document (you can add more fields if needed)
//     const feedback = {
//       food: body.food,
//       service: body.service,
//       cleanliness: body.cleanliness,
//       rating: Number(body.rating),
//       suggestion: body.suggestion || "",
//       createdAt: body.createdAt || new Date().toISOString(),
//       // Optional: add more context if you want later
//       // ip: request.headers.get("x-forwarded-for") || "unknown",
//       // userAgent: request.headers.get("user-agent") || "unknown",
//     };

//     // Insert into MongoDB
//     const result = await collection.insertOne(feedback);

//     if (!result.acknowledged) {
//       throw new Error("Failed to save feedback");
//     }

//     return NextResponse.json(
//       { success: true, message: "Feedback submitted successfully" },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Feedback API error:", error);
//     return NextResponse.json(
//       { error: "Failed to submit feedback" },
//       { status: 500 }
//     );
//   }
// }