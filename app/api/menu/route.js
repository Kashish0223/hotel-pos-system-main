import {
  findDocuments,
  insertDocument,
  getCollection,
  getDatabase,
} from "@/lib/db-config";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

// export async function GET(request) {
//   try {
  
//     const { searchParams } = new URL(request.url);
//     const searchTerm = searchParams.get("searchTerm") || "";
//     const category = searchParams.get("category") || "all";
//     const itemType = searchParams.get("itemType") || "all";
//     const cursor = searchParams.get("cursor") || null;
//     const source = searchParams.get("source") || "menu"; // 'menu' or 'orders'
//     const limit = 30;

//     const db = (await clientPromise).db(
//       process.env.MONGODB_NAME || "hotel_pos"
//     );

//     const filter = { available: true };
//     if (searchTerm) filter.name = { $regex: searchTerm, $options: "i" };
//     if (category && category !== "all") filter.category = category;
//     if (itemType && itemType !== "all") filter.itemType = itemType;
//     if (cursor) filter._id = { $gt: new ObjectId(cursor) };

//     const pipeline = [
//       { $match: filter },
//       { $sort: {  name: 1, _id: 1 } },
//       // { $sort: { _id: 1 } },
//       { $limit: limit + 1 },

//       // LEFT JOIN: inventory → only if linkedInventory exists
//       {
//         $lookup: {
//           from: "inventory",
//           let: { invId: "$linkedInventory" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$_id", "$$invId"] },
//               },
//             },
//             { $project: { currentStock: 1 } },
//           ],
//           as: "inv",
//         },
//       },

//       // Add currentStock field with SAFE logic
//       {
//         $addFields: {
//           currentStock: {
//             $switch: {
//               branches: [
//                 // Case 1: Retail + has inventory → real stock
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ["$itemType", "retail"] },
//                       { $gt: [{ $size: "$inv" }, 0] },
//                     ],
//                   },
//                   then: { $arrayElemAt: ["$inv.currentStock", 0] },
//                 },
//                 // Case 2: Retail + no inventory → 0 (out of stock)
//                 {
//                   case: { $eq: ["$itemType", "retail"] },
//                   then: 0,
//                 },
//               ],
//               // Default: Kitchen items → always available
//               default: 999999,
//             },
//           },
//         },
//       },

//       // Cleanup
//       { $project: { inv: 0, linkedInventory: 0 } },
//     ];

//     const items = await db.collection("menu").aggregate(pipeline).toArray();

//     const hasMore = items.length > limit;
//     const nextCursor = hasMore ? items[limit - 1]._id.toString() : "";

//     return Response.json({
//       items: hasMore ? items.slice(0, limit) : items,
//       nextCursor,
//     });
//   } catch (error) {
//     console.error("Error in /api/menu:", error);
//     return new Response(JSON.stringify({ error: "Failed to fetch menu" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }

  export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url);

      // Shared params
      const searchTerm = searchParams.get("searchTerm")?.trim() || "";
      const category = searchParams.get("category") || "all";
      const itemType = searchParams.get("itemType") || "all";

      // Pagination params
      const page = parseInt(searchParams.get("page") || "1", 10);
      const cursor = searchParams.get("cursor"); // for cursor-based
      const limit = parseInt(searchParams.get("limit") || "30", 10);

      // const useCursor = !!cursor;
      // const usePage = page > 0 && !useCursor; // prefer cursor if provided
      // Force cursor-based for orders/new page
  // const isOrdersPage = searchParams.get("source") === "orders";
  // const useCursor = isOrdersPage || !!cursor;
  // const usePage = !useCursor;
//   const limit = parseInt(searchParams.get("limit") || "30", 10);
// const cursor = searchParams.get("cursor");

const useCursor = true; // force cursor pagination


      const db = (await clientPromise).db(process.env.MONGODB_NAME || "hotel_pos");

      // Base filter
      const filter = { available: true };
      if (searchTerm) filter.name = { $regex: searchTerm, $options: "i" };
      if (category && category !== "all") filter.category = category;
      if (itemType && itemType !== "all") filter.itemType = itemType;

      let items = [];

      if (useCursor) {
        // === CURSOR-BASED PAGINATION (infinite scroll) ===
        if (cursor) {
          filter._id = { $gt: new ObjectId(cursor) };
        }

        const pipeline = [
          { $match: filter },
          { $sort: { _id: 1 } },
          { $limit: limit + 1 }, // +1 to check hasMore

          // Inventory lookup
          {
            $lookup: {
              from: "inventory",
              let: { invId: "$linkedInventory" },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$invId"] } } },
                { $project: { currentStock: 1 } },
              ],
              as: "inv",
            },
          },

          // currentStock logic
          {
            $addFields: {
              currentStock: {
                $cond: {
                  if: { $eq: ["$itemType", "retail"] },
                  then: {
                    $cond: {
                      if: { $gt: [{ $size: "$inv" }, 0] },
                      then: { $arrayElemAt: ["$inv.currentStock", 0] },
                      else: 0,
                    },
                  },
                  else: 999999,
                },
              },
            },
          },

          { $project: { inv: 0, linkedInventory: 0 } },
        ];

        items = await db.collection("menu").aggregate(pipeline).toArray();

        const hasMore = items.length > limit;
        const nextCursor = hasMore ? items[limit - 1]._id.toString() : null;

        items = hasMore ? items.slice(0, limit) : items;

        return Response.json({
          // items,
            items: hasMore ? items.slice(0, limit) : items,
          nextCursor,
          hasMore,
          paginationType: "cursor",
        });
      } else {
        // === PAGE-BASED PAGINATION (traditional) ===
        const skip = (page - 1) * limit;

        const pipeline = [
          { $match: filter },
          { $sort: { name: 1, _id: 1 } },
          { $skip: skip },
          { $limit: limit },

          // Same inventory lookup
          {
            $lookup: {
              from: "inventory",
              let: { invId: "$linkedInventory" },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$invId"] } } },
                { $project: { currentStock: 1 } },
              ],
              as: "inv",
            },
          },

          {
            $addFields: {
              currentStock: {
                $cond: {
                  if: { $eq: ["$itemType", "retail"] },
                  then: {
                    $cond: {
                      if: { $gt: [{ $size: "$inv" }, 0] },
                      then: { $arrayElemAt: ["$inv.currentStock", 0] },
                      else: 0,
                    },
                  },
                  else: 999999,
                },
              },
            },
          },

          { $project: { inv: 0, linkedInventory: 0 } },
        ];

        items = await db.collection("menu").aggregate(pipeline).toArray();

        // Get total count for hasMore
        const totalCount = await db.collection("menu").countDocuments(filter);
        const hasMore = skip + items.length < totalCount;

        return Response.json({
          items,
          currentPage: page,
          limit,
          totalCount,
          hasMore,
          paginationType: "page",
        });
      }
    } catch (error) {
      console.error("Error in /api/menu:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch menu items" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

export async function POST(request) {
  try {
    const data = await request.json();

    // 🔐 Decode JWT
    const headerList = await headers();
    const authHeader = headerList.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (e) {
      console.error("JWT verification failed:", e);
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const tokenRole = payload.role;
    const tokenPermissions = Array.isArray(payload.permissions)
      ? payload.permissions
      : [];
    const isSuperAdmin = payload.isSuperAdmin || false;

    if (!tokenRole)
      return Response.json(
        { error: "Invalid token (missing role)" },
        { status: 401 }
      );

    // Validate requested permissions (only if not SuperAdmin)
    if (!(tokenRole === "superadmin" || isSuperAdmin)) {
      const requestedPermissions = Array.isArray(data.permissions)
        ? data.permissions
        : [];
      const forbidden = requestedPermissions.filter(
        (p) => !tokenPermissions.includes(p)
      );
      if (forbidden.length > 0) {
        return Response.json(
          {
            error: `Permission mismatch: You don't have permission: ${forbidden.join(
              ", "
            )}`,
          },
          { status: 403 }
        );
      }
    }

    // Assign default permissions
    const defaultPermissions = ROLE_PERMISSIONS[data.role] || [];
    let finalPermissions = defaultPermissions.filter((p) => p !== "*");

    // Merge custom permissions if allowed
    if (Array.isArray(data.permissions) && data.permissions.length > 0) {
      if (!canManagePermissions(tokenRole, isSuperAdmin)) {
        return Response.json(
          { error: "Only SuperAdmin can assign or modify permissions" },
          { status: 403 }
        );
      }
      finalPermissions = [
        ...new Set([...finalPermissions, ...data.permissions]),
      ];
    }

    // Parse price to ensure it's stored as a number
    const menuItem = {
      ...data,
      price: Number.parseFloat(data.price),
    };

    const result = await insertDocument("menu", menuItem);
    return Response.json({ success: true, id: result.insertedId });
  } catch (error) {
    return Response.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

