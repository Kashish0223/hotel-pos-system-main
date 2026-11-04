// app/api/bills/route.js
import { getDatabase } from "@/lib/db-config";
import { jwtVerify } from "jose";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// =======================================Fetch The bill from the bills collection =======================================================

export async function GET(request) {
  try {
    const headerList = await headers();
    const authHeader = headerList.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      await jwtVerify(token, secret);
    } catch (e) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);

    // Read cursor, limit & filter
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const filter = searchParams.get("filter");

    let baseFilter = {};
    if (filter === "paid" || filter === "true") {
      baseFilter = { $or: [{ paymentStatus: "paid" }, { billPay: true, isSettled: true }] };
    } else if (filter === "unpaid" || filter === "false") {
      baseFilter = { $or: [{ paymentStatus: { $in: ["unpaid", "partially_paid"] } }, { isSettled: { $ne: true } }] };
    }

    let query = { ...baseFilter };

    // Cursor-based pagination (newest first)
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("::");
      const cursorDateObj = new Date(cursorDate);

      const cursorCondition = {
        $or: [
          { createdAt: { $lt: cursorDateObj } },
          {
            createdAt: cursorDateObj,
            _id: { $lt: new ObjectId(cursorId) },
          },
        ],
      };

      query = Object.keys(baseFilter).length > 0
        ? { $and: [baseFilter, cursorCondition] }
        : cursorCondition;
    }

    // Fetch bills
    const bills = await db
      .collection("bills")
      .find(query, {
        projection: {
          "items.image": 0,
          "items.extraImages": 0,
          image: 0,
          extraImages: 0,
        },
      })
      .sort({ createdAt: -1, _id: -1 }) // newest first
      .limit(limit + 1)
      .toArray();

    const hasMore = bills.length > limit;
    const items = hasMore ? bills.slice(0, limit) : bills;

    const nextCursor =
      hasMore && items.length > 0
        ? `${items[items.length - 1].createdAt.toISOString()}::${items[items.length - 1]._id.toString()}`
        : null;

    return Response.json({
      bills: items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to fetch bills:", error);
    return Response.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

// =======================================Fetch The orders from the orders collection =======================================================
// // app/api/bills/route.js
// import { getDatabase } from "@/lib/db-config";
// import { jwtVerify } from "jose";
// import { headers } from "next/headers";
// import { ObjectId } from "mongodb";

// const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// export async function GET(request) {
//   try {
//  const headerList = await headers();
//     const authHeader = headerList.get("Authorization");


//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return Response.json({ error: "No token provided" }, { status: 401 });
//     }

//     const token = authHeader.split("Bearer ")[1];
//     try {
//       await jwtVerify(token, secret);
//     } catch (e) {
//       return Response.json({ error: "Invalid or expired token" }, { status: 401 });
//     }

//     const db = await getDatabase();
//     const { searchParams } = new URL(request.url);

//     // ✅ FIRST: read cursor & limit
//     const cursor = searchParams.get("cursor");
//     const limit = Math.min(
//       parseInt(searchParams.get("limit") || "20", 10),
//       100
//     );

//     // ✅ BASE QUERY: only unpaid bills
//     let query = { billPay: false };

//     // ✅ APPLY CURSOR SAFELY
//     if (cursor) {
//       const [cursorDate, cursorId] = cursor.split("::");
//       const cursorDateObj = new Date(cursorDate);

//       query = {
//         $and: [
//           { billPay: false },
//           {
//             $or: [
//               { createdAt: { $lt: cursorDateObj } },
//               {
//                 createdAt: cursorDateObj,
//                 _id: { $lt: new ObjectId(cursorId) },
//               },
//             ],
//           },
//         ],
//       };
//     }

//     // ✅ FETCH DATA
//     const bills = await db
//       .collection("orders")
//       .find(query, {
//         projection: {
//           "items.image": 0,
//           "items.extraImages": 0,
//           image: 0,
//           extraImages: 0,
//         },
//       })
//       .sort({ createdAt: -1, _id: -1 })
//       .limit(limit + 1)
//       .toArray();

//     const hasMore = bills.length > limit;
//     const items = hasMore ? bills.slice(0, limit) : bills;

//     const nextCursor =
//       hasMore && items.length > 0
//         ? `${items[items.length - 1].createdAt.toISOString()}::${items[
//             items.length - 1
//           ]._id.toString()}`
//         : null;

//     return Response.json({
//       bills: items,
//       nextCursor,
//       hasMore,
//     });
//   } catch (error) {
//     console.error("Failed to fetch bills:", error);
//     return Response.json({ error: "Failed to fetch bills" }, { status: 500 });
//   }
// }


// export async function GET(request) {
//   try {
    // const headerList = await headers();
    // const authHeader = headerList.get("Authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return Response.json({ error: "No token provided" }, { status: 401 });
//     }

//     const token = authHeader.split("Bearer ")[1];
//     try {
//       await jwtVerify(token, secret);
//     } catch (e) {
//       return Response.json({ error: "Invalid or expired token" }, { status: 401 });
//     }

//     const db = await getDatabase();

//     const { searchParams } = new URL(request.url);

//     // Your existing filter logic — unchanged
//     const filter = searchParams.get("filter");
    
    
//    let query = {
//   billPay: false
// };

// if (cursor) {
//   const [cursorDate, cursorId] = cursor.split("::");
//   const cursorDateObj = new Date(cursorDate);

//   query = {
//     $and: [
//       { billPay: false },
//       {
//         $or: [
//           { createdAt: { $lt: cursorDateObj } },
//           {
//             createdAt: cursorDateObj,
//             _id: { $lt: new ObjectId(cursorId) },
//           },
//         ],
//       },
//     ],
//   };
// }


//     // if (filter === "true") {
//     //   query.billPay = true;
//     // } else if (filter === "false") {
//     //   query.billPay = { $ne: true };
//     // }



//     // NEW: Infinite scroll support
//     const cursor = searchParams.get("cursor");     // ISO string of last bill's createdAt
//     const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

//     // if (cursor) {
//     //   query.createdAt = { $lt: new Date(cursor) };
//     // }
//      /* ---------- CURSOR ---------- */
//     if (cursor) {
//       try {
//         const [cursorDate, cursorId] = cursor.split("::");
//         const cursorDateObj = new Date(cursorDate);

//         query.$or = [
//           { createdAt: { $lt: cursorDateObj } },
//           {
//             createdAt: cursorDateObj,
//             _id: { $lt: new ObjectId(cursorId) },
//           },
//         ];
//       } catch (err) {
//         console.error("Invalid cursor, ignoring:", err);
//       }
//     }

//     // Fetch one extra to know if there's more
//     const bills = await db
//       .collection("orders")
//       .find(query, {
//         projection: {
//           "items.image": 0,
//           "items.extraImages": 0,
//           image: 0,
//           extraImages: 0,
//         },
//       })
//       .sort({ createdAt: -1, _id: -1 })
//       .limit(limit + 1)
//       .toArray();

//     const hasMore = bills.length > limit;
//     const items = hasMore ? bills.slice(0, limit) : bills;

//     console.log("Orders for bills fetched successfully",bills);

//     // const nextCursor = hasMore && items.length > 0
//     //   ? items[items.length - 1]._id
//     //   // ? items[items.length - 1].createdAt.toISOString()
//     //   : null;
//     const nextCursor =
//       hasMore && items.length > 0
//         ? `${items[items.length - 1].createdAt.toISOString()}::${items[
//             items.length - 1
//           ]._id.toString()}`
//         : null;

//     return Response.json({
//       bills: items,
//       nextCursor,
//       hasMore,
//     });

//   } catch (error) {
//     console.error("Failed to fetch bills:", error);
//     return Response.json({ error: "Failed to fetch bills" }, { status: 500 });
//   }
// }
//---------------------It's working fine for both paid and unpaid bill -------------------- app/api/bills/route.js
// import { getDatabase } from "@/lib/db-config";
// import { jwtVerify } from "jose";
// import { headers } from "next/headers";
// import { ObjectId } from "mongodb";

// const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// export async function GET(request) {
//   try {
//     const headerList = await headers();
//     const authHeader = headerList.get("Authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return Response.json({ error: "No token provided" }, { status: 401 });
//     }

//     const token = authHeader.split("Bearer ")[1];
//     try {
//       await jwtVerify(token, secret);
//     } catch (e) {
//       return Response.json({ error: "Invalid or expired token" }, { status: 401 });
//     }

//     const db = await getDatabase();

//     const { searchParams } = new URL(request.url);

//     // Your existing filter logic — unchanged
//     const filter = searchParams.get("filter");
    
//     let query = {};
//     if (filter === "Paid" || filter === "true") {
//       query.isSettled = true;
//     } else if (filter === "unpaid" || filter === "false") {
//       query.isSettled = { $ne: true };
//     }



//     // NEW: Infinite scroll support
//     const cursor = searchParams.get("cursor");     // ISO string of last bill's createdAt
//     const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

//     // if (cursor) {
//     //   query.createdAt = { $lt: new Date(cursor) };
//     // }
//      /* ---------- CURSOR ---------- */
//     if (cursor) {
//       try {
//         const [cursorDate, cursorId] = cursor.split("::");
//         const cursorDateObj = new Date(cursorDate);

//         query.$or = [
//           { createdAt: { $lt: cursorDateObj } },
//           {
//             createdAt: cursorDateObj,
//             _id: { $lt: new ObjectId(cursorId) },
//           },
//         ];
//       } catch (err) {
//         console.error("Invalid cursor, ignoring:", err);
//       }
//     }

//     // Fetch one extra to know if there's more
//     const bills = await db
//       .collection("bills")
//       .find(query, {
//         projection: {
//           "items.image": 0,
//           "items.extraImages": 0,
//           image: 0,
//           extraImages: 0,
//         },
//       })
//       .sort({ createdAt: -1, _id: -1 })
//       .limit(limit + 1)
//       .toArray();

//     const hasMore = bills.length > limit;
//     const items = hasMore ? bills.slice(0, limit) : bills;

//     // const nextCursor = hasMore && items.length > 0
//     //   ? items[items.length - 1]._id
//     //   // ? items[items.length - 1].createdAt.toISOString()
//     //   : null;
//     const nextCursor =
//       hasMore && items.length > 0
//         ? `${items[items.length - 1].createdAt.toISOString()}::${items[
//             items.length - 1
//           ]._id.toString()}`
//         : null;

//     return Response.json({
//       bills: items,
//       nextCursor,
//       hasMore,
//     });

//   } catch (error) {
//     console.error("Failed to fetch bills:", error);
//     return Response.json({ error: "Failed to fetch bills" }, { status: 500 });
//   }
// }

/////////////////-------------------------------------Only filter on the paid and unpaid bills.---------------------------------------------------
// import { getDatabase } from "@/lib/db-config"
// import { jwtVerify } from "jose";
// import { headers } from "next/headers";

// const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// export async function GET() {
//   try {
//     const headerList = await headers();
//         const authHeader = headerList.get("Authorization");
//         // console.log("STaff get header:---",authHeader);
    
//         if (!authHeader || !authHeader.startsWith("Bearer ")) {
//           return Response.json({ error: "No token provided" }, { status: 401 });
//         }
    
//         const token = authHeader.split("Bearer ")[1];
//         try {
//           const verified = await jwtVerify(token, secret);
//           const payload = verified.payload;
//           if (!payload.role)
//             return Response.json(
//               { error: "Invalid token (missing role)" },
//               { status: 401 }
//             );
//         } catch (e) {
//           // console.error("JWT verification failed:", e);
//           return Response.json(
//             { error: "Invalid or expired token" },
//             { status: 401 }
//           );
//         }
//     const db = await getDatabase()
//     // Return only bills whose orderStatus is delivered or completed (no lookup)
//     const bills = await db
//       .collection("bills")
//       .find(
//         {},
//         {
//           projection: {
//             "items.image": 0,
//             "items.extraImages": 0,
//             image: 0,
//             extraImages: 0
//           }
//         }
//       )
//       .sort({ createdAt: -1 })
//       .toArray()

//     return Response.json(bills)
//   } catch (error) {
//     return Response.json({ error: "Failed to fetch bills" }, { status: 500 })
//   }
// }


//----------------------In this code images are fetched and displayed on the bills API.-----------------------

// import { getDatabase } from "@/lib/db-config"

// export async function GET() {
//   try {
//     const db = await getDatabase()

//     // Return only bills whose orderStatus is delivered or completed (no lookup)
//     const bills = await db
//       .collection("bills")
//       .find({ orderStatus: { $in: ["delivered", "completed"] } })
//       .sort({ createdAt: -1 })
//       .toArray()

//     return Response.json(bills)
//   } catch (error) {
//     return Response.json({ error: "Failed to fetch bills" }, { status: 500 })
//   }
// }

