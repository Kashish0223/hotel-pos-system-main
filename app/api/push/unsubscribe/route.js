// app/api/push/unsubscribe/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Delete subscription by endpoint using native driver
    const result = await db.collection("push_subscriptions").deleteOne({ 
      "subscription.endpoint": endpoint 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Push subscription removed" });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
