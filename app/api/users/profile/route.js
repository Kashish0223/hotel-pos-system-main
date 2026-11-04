import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function GET(request) {
  try {

        const headerList = await headers();
        const authHeader = headerList.get("Authorization");
        // console.log("STaff get header:---",authHeader);
    
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
    
    
    // Get email from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const db = await getDatabase();

    // Find user by email
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's orders
    let orders = [];
    if (user.orders && user.orders.length > 0) {
      // Convert string IDs to ObjectIds if needed
      const orderIds = user.orders.map(id => 
        typeof id === 'string' ? new ObjectId(id) : id
      );
      
      orders = await db.collection("orders")
        .find({ _id: { $in: orderIds } })
        .sort({ createdAt: -1 }) // Most recent first
        .toArray();
    }

    // Format the response
    const userProfile = {
      _id: user._id,
      email: user.email,
      name: user.name || null,
      phone: user.phone || null,
      createdAt: user.createdAt,
      orderCount: orders.length,
      orders: orders.map(order => ({
        _id: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        items: order.items
      }))
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile", details: error.message },
      { status: 500 }
    );
  }
}