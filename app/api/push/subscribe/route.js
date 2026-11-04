import clientPromise from "@/lib/mongodb";
import { jwtVerify } from "jose";

export async function POST(request) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

  const body = await request.json();
  const { subscription } = body;

  if (!subscription?.endpoint) {
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  // JWT verification using jose
  let payload;
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    payload = verified.payload;
  } catch (e) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const { id, role, permissions, name, email } = payload;
  const userId = id || payload.userId; 
  const userRole = (role || "").toLowerCase();

  const requiredPerms = ["manage_orders", "kitchen_display", "view_orders", "*"];
  const authorizedRoles = ["superadmin", "manager", "chef", "waiter", "cashier", "bartender"];

  const hasPerm = (permissions && requiredPerms.some(p => permissions.includes(p))) || authorizedRoles.includes(userRole);

  if (!hasPerm) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Save subscription in MongoDB (native driver)
  const pushSub = await db.collection("push_subscriptions").updateOne(
    { "subscription.endpoint": subscription.endpoint },
    {
      $set: {
        userId,
        userName: name || "Unknown",
        email: email || "unknown",
        role,
        permissions,
        subscription,
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log("Push Subscribe:",pushSub)

  return Response.json({ success: true });
}


// app/api/push/subscribe/route.js
// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/dbConnect";
// import PushSubscription from "@/models/PushSubscription";
// import { jwtVerify } from "jose";

// export async function POST(request) {
//   await dbConnect();

//   const body = await request.json();
//   const { subscription } = body;

//   if (!subscription?.endpoint) {
//     return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
//   }

//   const authHeader = request.headers.get("authorization");
//   if (!authHeader?.startsWith("Bearer ")) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const token = authHeader.split(" ")[1];

//   // Proper JWT verification (replace 'your-secret' with env.JWT_SECRET)
//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret');
//   } catch (e) {
//     return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//   }

//   const userId = decoded.userId || decoded.sub || "unknown";
//   const role = decoded.role || "unknown";
//   const permissions = decoded.permissions || [];
//   const name = decoded.name || "Unknown";
//   const email = decoded.email || "unknown";

//   // NEW: Check required permissions before saving
//   const requiredPerms = ["manage-order", "kitchen-display"];
//   const hasPerm = requiredPerms.some(p => permissions.includes(p));
//   if (!hasPerm) {
//     return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
//   }

//   // Upsert – unchanged
//   await PushSubscription.findOneAndUpdate(
//     { "subscription.endpoint": subscription.endpoint },
//     {
//       userId,
//       userName: name,
//       email,
//       role,
//       permissions,
//       subscription,
//       updatedAt: new Date(),
//     },
//     { upsert: true, new: true }
//   );

//   return NextResponse.json({ success: true });
// }

// // app/api/push/subscribe/route.js
// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/dbConnect";
// import PushSubscription from "@/models/PushSubscription";
// import jwt from 'jsonwebtoken';  // NEW
// export async function POST(request) {
//   await dbConnect();

//   const body = await request.json();
//   const { subscription } = body;

//   if (!subscription?.endpoint) {
//     return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
//   }

//   const authHeader = request.headers.get("authorization");
//   if (!authHeader?.startsWith("Bearer ")) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const token = authHeader.split(" ")[1];

//   // ← Your existing token verification logic here
//   // For example (adjust to your real JWT decode method):
//   let decoded;
//   try {
//     // Use your jwt library or whatever you use
//     decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
//   } catch (e) {
//     return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//   }

//   const userId    = decoded.userId || decoded.sub || "unknown";
//   const role      = decoded.role || "unknown";
//   const permissions = decoded.permissions || [];
//   const name      = decoded.name   || "Unknown";
//   const email     = decoded.email  || "unknown";

//   // Upsert – update if endpoint already exists (same device/browser re-subscribe)
//   await PushSubscription.findOneAndUpdate(
//     { "subscription.endpoint": subscription.endpoint },
//     {
//       userId,
//       userName: name,
//       email,
//       role,
//       permissions,
//       subscription,
//       updatedAt: new Date(),
//     },
//     { upsert: true, new: true }
//   );

//   return NextResponse.json({ success: true });
// }
// // import { NextResponse } from "next/server";
// // import dbConnect from "@/lib/dbConnect"; // your existing dbConnect
// // import User from "@/models/User"; // adjust path if needed

// // export async function POST(request) {
// //   try {
// //     await dbConnect();
// //     const { subscription } = await request.json();

// //     if (!subscription) {
// //       return NextResponse.json({ message: "Subscription is required" }, { status: 400 });
// //     }

// //     const authHeader = request.headers.get("authorization");
// //     if (!authHeader?.startsWith("Bearer ")) {
// //       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
// //     }

// //     const token = authHeader.split("Bearer ")[1];
// //     // You already have a way to verify token and get userId in other APIs
// //     // Replace this with your actual token verification logic
// //     const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
// //     const userId = payload.userId;

// //     // Save or update the push subscription
// //     await User.findByIdAndUpdate(
// //       userId,
// //       { pushSubscription: subscription },
// //       { upsert: false }
// //     );

// //     return NextResponse.json({ success: true, message: "Push subscription saved" });
// //   } catch (error) {
// //     console.error("Error saving push subscription:", error);
// //     return NextResponse.json({ message: "Server error" }, { status: 500 });
// //   }
// // }