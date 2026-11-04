// src/app/api/kitchen-orders/route.ts
import { getDatabase } from "@/lib/db-config";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

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
    const db = await getDatabase();
    const orders = await db
      .collection("orders")
      .find({
        status: { $in: ["pending", "preparing", "ready"] },
      })
      .project({
        _id: 1,
        status: 1,
        createdAt: 1,
        orderType: 1,
        specialInstructions: 1,
        items: {
          $map: {
            input: "$items",
            as: "it",
            in: {
              _id: "$$it._id",
              name: "$$it.name",
              price: "$$it.price",
              quantity: "$$it.quantity",
              category: "$$it.category",
              available: "$$it.available",
              itemType: "$$it.itemType",
              tax: "$$it.tax",
            },
          },
        },
      })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch kitchen orders" },
      { status: 500 }
    );
  }
}

