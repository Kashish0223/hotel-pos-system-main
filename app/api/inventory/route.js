import { getDatabase } from "@/lib/db-config"
import c from 'ansi-colors'
import { ObjectId } from "mongodb";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function GET(request) {
  try {
        const headerList = await headers();
        const authHeader = headerList.get("Authorization");
        // console.log("Inventory get header:---",authHeader);
    
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
    
    const db = await getDatabase()
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const filter = url.searchParams.get("filter")?.toLowerCase()
    const category = url.searchParams.get("category")
    const cursor = url.searchParams.get("cursor") || ''
    const source = url.searchParams.get("source") || ''



    if(source === 'bills'){

  try {
    const db = await getDatabase()

    const query = {}
    // if (type && typeof type === "string" && type.trim()) {
    //   query.type = type
    // }

    const inventory = await db
      .collection("inventory")
      .find(query)
      .sort({ name: 1, createdAt: -1 })
      .toArray()

    return Response.json(inventory)
  } catch (error) {
    return Response.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }


    }

    // Base query for type and category (always applied)
    const baseQuery = {}
    if (type && typeof type === "string" && type.trim()) {
      baseQuery.type = type
    }
    if (category && category !== 'all') {
      baseQuery.category = { $regex: `^${category}$`, $options: "i" }
    }

    // Additional filters for items (not for counts)
    const itemQuery = { ...baseQuery }

    const now = new Date();
    const startOfToday = now.toISOString().split('T')[0];
    const thresholdDate = new Date(now);
    thresholdDate.setDate(now.getDate() + 7);
    const threshold = thresholdDate.toISOString().split('T')[0];

    // console.log(`current cursor is ${cursor}`)

    // stock/expiry filters (only apply to items, not counts)
  //   if(filter && filter !== "all") {
  //     if (filter === "low") {
  //       itemQuery.$expr = { $lte: ["$currentStock", "$minStock"] }
  //     } else if (filter === "out") {
  //       itemQuery.currentStock = 0
  //     } else if (filter === "expiring") {
  //       itemQuery.expiryDate = { $gte: startOfToday, $lte: threshold }

  // } else if (filter === "expired") {
  //       itemQuery.expiryDate = { $lt: startOfToday }
  //   } else if (filter === "overstocked") {
  //       itemQuery.$expr = { $gt: ["$currentStock", "$maxStock"] }
  //     } else {
  //       itemQuery.condition = { $regex: `^${filter}$`, $options: "i" }
  //     }
  //   }
//----------------------------------------Last Sucessfull COde used---------------------------------------------------------
// if (filter && filter !== "all") {
//   // For ALL filters except "all" and "expired", exclude expired items
//   if (filter !== "expired" && (type?.toLowerCase() === "inventory" || type?.toLowerCase() === "housekeeping")) {
//     itemQuery.expiryDate = { $gte: startOfToday };
//   }

//   if (filter === "expired") {
//     if (type?.toLowerCase() === "inventory" || type?.toLowerCase() === "housekeeping") {
//       itemQuery.expiryDate = { $lt: startOfToday }; // strictly expired
//     } else {
//       itemQuery.condition = "__NO_MATCH__"; // crockery has no expiry
//     }
//   } 
//   else if (filter === "out") {
//     itemQuery.currentStock = 0;
//   } 
//   else if (filter === "expiring") {
//     itemQuery.expiryDate = { $gte: startOfToday, $lte: threshold };
//   } 
//   else if (filter === "low") {
//     itemQuery.$expr = { $lte: ["$currentStock", "$minStock"] };
//     // Also ensure it's not out of stock (optional, but cleaner)
//     itemQuery.currentStock = { $gt: 0 };
//   } 
//   else if (filter === "overstocked") {
//     itemQuery.$expr = { $gt: ["$currentStock", "$maxStock"] };
//     // itemQuery.$and = [
//     // { maxStock: { $gt: 0 } },
//     // { $expr: { $gt: ["$currentStock", "$maxStock"] } }
//   // ];
//   } 
//   else {
//     // Condition-based filters (new/fair/broken etc. for crockery)
//     itemQuery.condition = { $regex: `^${filter}$`, $options: "i" };
//   }
// }
// ===========================================================================
if (filter && filter !== "all") {
  // For ALL filters except "all" and "expired", exclude expired items
  if (filter !== "expired" && (type?.toLowerCase() === "inventory" || type?.toLowerCase() === "housekeeping")) {
    itemQuery.expiryDate = { $gte: startOfToday };
  }

  if (filter === "expired") {
    if (type?.toLowerCase() === "inventory" || type?.toLowerCase() === "housekeeping") {
      itemQuery.expiryDate = { $lt: startOfToday }; // strictly expired
    } else {
      itemQuery.condition = "__NO_MATCH__"; // crockery has no expiry
    }
  } 
  else if (filter === "out") {
    itemQuery.currentStock = 0;
  } 
  else if (filter === "expiring") {
    itemQuery.expiryDate = { $gte: startOfToday, $lte: threshold };
  } 
  else if (filter === "low") {
    itemQuery.$expr = { $lte: ["$currentStock", "$minStock"] };
    // Also ensure it's not out of stock (optional, but cleaner)
    itemQuery.currentStock = { $gt: 0 };
  } 
  else if (filter === "overstocked") {
    itemQuery.$expr = { $gt: ["$currentStock", "$maxStock"] };
    // itemQuery.$and = [
    // { maxStock: { $gt: 0 } },
    // { $expr: { $gt: ["$currentStock", "$maxStock"] } }
  // ];
  } 
  else {
    // Condition-based filters (new/fair/broken etc. for crockery)
    itemQuery.condition = { $regex: `^${filter}$`, $options: "i" };
  }
}
  
    // Add cursor for pagination (only for items)
    if(cursor && ObjectId.isValid(cursor)){
      itemQuery._id = {$gt: new ObjectId(cursor) };
    }

    const limit = 20;

    // // DEBUG: Log the queries
    // console.log(c.yellowBright('=== DEBUG INFO ==='))
    // console.log(c.yellowBright(`baseQuery: ${JSON.stringify(baseQuery, null, 2)}`))
    // console.log(c.yellowBright(`itemQuery: ${JSON.stringify(itemQuery, null, 2)}`))
    
    // DEBUG: Count total documents matching baseQuery
    const totalDocsInBase = await db.collection("inventory").countDocuments(baseQuery)
    // console.log(c.yellowBright(`Total docs matching baseQuery: ${totalDocsInBase}`))
    
    // DEBUG: Count documents matching itemQuery (with cursor)
    const docsAfterCursor = await db.collection("inventory").countDocuments(itemQuery)
    // console.log(c.yellowBright(`Docs matching itemQuery (after cursor): ${docsAfterCursor}`))

    // Query for total count (only type filter, no category or other filters)
    const totalCountQuery = {}
    if (type && typeof type === "string" && type.trim()) {
      totalCountQuery.type = type
    }
    if (category && category !== 'all') {
      totalCountQuery.category = { $regex: `^${category}$`, $options: "i" }
    }

    // Define counts stage based on type (using baseQuery for category-filtered counts)
    let countsStage

    // if (type?.toLowerCase() === "inventory" || type?.toLowerCase() === "housekeeping") {
    //   countsStage = [
    //     { $match: baseQuery },
    //     {
    //       $group: {
    //         _id: null,
    //         expired: {
    //           $sum: { $cond: [{ $lt: ["$expiryDate", startOfToday] }, 1, 0] }
    //         },
    //         expiring: {
    //           $sum: {
    //             $cond: [
    //               { $and: [
    //                 { $gte: ["$expiryDate", startOfToday] },
    //                 { $lte: ["$expiryDate", threshold] }
    //               ] },
    //               1,
    //               0
    //             ]
    //           }
    //         },
    //         out: {
    //           $sum: { $cond: [{ $eq: ["$currentStock", 0] }, 1, 0] }
    //         },
    //         low: {
    //           $sum: { $cond: [{ $lt: ["$currentStock", "$minStock"] }, 1, 0] }
    //         },
    //         overstocked: {
    //           $sum: { $cond: [{ $gt: ["$currentStock", "$maxStock"] }, 1, 0] }
    //         }
    //       }
    //     }
    //   ]
    // } 
 if (type?.toLowerCase() === "inventory" || type?.toLowerCase() === "housekeeping") {
  countsStage = [
    { $match: baseQuery },
    // {
    //   // $addFields: {
    //   //   status: {
    //   //     $cond: [
    //   //       { $lt: ["$expiryDate", startOfToday] },
    //   //       "expired",

    //   //       { $eq: ["$currentStock", 0] },
    //   //       "out",

    //   //       {
    //   //         $and: [
    //   //           { $gte: ["$expiryDate", startOfToday] },
    //   //           { $lte: ["$expiryDate", threshold] }
    //   //         ]
    //   //       },
    //   //       "expiring",

    //   //       { $lte: ["$currentStock", "$minStock"] },
    //   //       "low",

    //   //       { $gt: ["$currentStock", "$maxStock"] },
    //   //       "overstocked",

    //   //       "normal" // default
    //   //     ]
    //   //   }
    //   // }
      
    // },
    {
      // --------------------------------------------------last used code----------------------------------------------------
  // $addFields: {
  //   status: {
  //     $cond: {
  //       if: { $lt: ["$expiryDate", startOfToday] },
  //       then: "expired",
  //       else: {
  //         $cond: {
  //           if: { $eq: ["$currentStock", 0] },
  //           then: "out",
  //           else: {
  //             $cond: {
  //               if: {
  //                 $and: [
  //                   { $gte: ["$expiryDate", startOfToday] },
  //                   { $lte: ["$expiryDate", threshold] }
  //                 ]
  //               },
  //               then: "expiring",
  //               else: {
  //                 $cond: {
  //                   if: { $lte: ["$currentStock", "$minStock"] },
  //                   then: "low",
  //                   else: {
  //                     $cond: {
  //                       if: { $gt: ["$currentStock", "$maxStock"] },
  //                       then: "overstocked",
  //                       else: "normal"
  //                     }
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
  $addFields: {
    status: {
      $cond: {
        if: { $lt: ["$expiryDate", startOfToday] },
        then: "expired",

        else: {
          $cond: {
            if: { $eq: ["$currentStock", 0] },
            then: "out",

            else: {
              $cond: {
                // Expiring takes priority over low stock
                if: {
                  $and: [
                    { $gte: ["$expiryDate", startOfToday] },
                    { $lte: ["$expiryDate", threshold] }
                  ]
                },
                then: "expiring",

                else: {
                  $cond: {
                    // Low stock only if not expiring, out, or expired
                    if: {
                      $and: [
                        { $lte: ["$currentStock", "$minStock"] },
                        { $gt: ["$currentStock", 0] }  // optional: exclude out of stock
                      ]
                    },
                    then: "low",

                    else: {
                      $cond: {
                        if: { $gt: ["$currentStock", "$maxStock"] },
                        then: "overstocked",
                        else: "normal"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

},
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        expired: { $sum: { $cond: [{ $eq: ["$_id", "expired"] }, "$count", 0] } },
        expiring: { $sum: { $cond: [{ $eq: ["$_id", "expiring"] }, "$count", 0] } },
        out: { $sum: { $cond: [{ $eq: ["$_id", "out"] }, "$count", 0] } },
        low: { $sum: { $cond: [{ $eq: ["$_id", "low"] }, "$count", 0] } },
        overstocked: { $sum: { $cond: [{ $eq: ["$_id", "overstocked"] }, "$count", 0] } },
        normal: { $sum: { $cond: [{ $eq: ["$_id", "normal"] }, "$count", 0] } }
      }
    }
  ];
} else if (type?.toLowerCase() === "crockery") {
  // Crockery uses condition field
  countsStage = [
    { $match: baseQuery },
    {
      $group: {
        _id: { $toLower: "$condition" },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        new: { $sum: { $cond: [{ $eq: ["$_id", "new"] }, "$count", 0] } },
        fair: { $sum: { $cond: [{ $eq: ["$_id", "fair"] }, "$count", 0] } },
        broken: { $sum: { $cond: [{ $eq: ["$_id", "broken"] }, "$count", 0] } },
        retired: { $sum: { $cond: [{ $eq: ["$_id", "retired"] }, "$count", 0] } }
      }
    }
  ];
} else {
  countsStage = [{ $match: baseQuery }, { $group: { _id: null, count: { $sum: 1 } } }];
}

    // run aggregation
    const [result] = await db.collection("inventory").aggregate([
      {
        $facet: {
          items: [
            { $match: itemQuery },
            { $sort: {  _id: 1 } },            
            { $limit: limit }
          ],
          counts: countsStage,
          totalCount: [
            { $match: totalCountQuery },
            { $count: "total" }
          ]
        }
      }
    ]).toArray()

    const items = result.items
    const counts = result.counts[0] || { low: 0, out: 0, expiring: 0, expired: 0 }
    const totalCount = result.totalCount[0]?.total || 0

    // // DEBUG: Log results
    // console.log(c.yellowBright(`Items returned: ${items.length}`))
    // console.log(c.yellowBright(`First item _id: ${items[0]?._id}`))
    // console.log(c.yellowBright(`Last item _id: ${items[items.length - 1]?._id}`))
    
    // console.log(c.greenBright(`next cursor is ${result.items[result.items.length-1]?._id || "null"}`))

    return Response.json(
      {
        items,
        counts,
        totalCount,
        nextCursor: items.length > 0 ? items[items.length - 1]._id : ""
      },
      { status: 200 }
    )
  } catch (error) {
    // console.log(`Error: ${error.message}`)
    return Response.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
       // 🔐 Decode JWT
        const headerList = await headers();
        const authHeader = headerList.get("Authorization");
    
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "No token provided" }, { status: 401 });
        }
    
        const token = authHeader.split("Bearer ")[1];
        let payloadI;
        try {
          const verified = await jwtVerify(token, secret);
          payloadI = verified.payload;
        } catch (e) {
          console.error("JWT verification failed:", e);
          return Response.json(
            { error: "Invalid or expired token" },
            { status: 401 }
          );
        }
    
        const tokenRole = payloadI.role;
        const tokenPermissions = Array.isArray(payloadI.permissions)
          ? payloadI.permissions
          : [];
        const isSuperAdmin = payloadI.isSuperAdmin || false;
    
        if (!tokenRole)
          return Response.json(
            { error: "Invalid token (missing role)" },
            { status: 401 }
          );
    const db = await getDatabase()
    const data = await request.json()

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
    // 1️⃣ Generate sequential inventory invoice number
    const today = new Date()
    const datePart = today.toISOString().split("T")[0].replace(/-/g, "") // e.g. 20251101

    const counters = db.collection("bill_counters")

    // Increment global inventory counter atomically
    const counterResult = await counters.findOneAndUpdate(
      { _id: "global_inventory_seq" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    )

    // Safely extract seq value
    const seq = counterResult?.value?.seq ?? counterResult?.seq ?? 1
    const formattedSeq = seq.toString().padStart(6, "0")

    // Build invoice number: ININV-YYYYMMDD-XXXXXX
    const inventoryInvoiceNo = `ININV-${datePart}-${formattedSeq}`

    // 2️⃣ Prepare and insert inventory payload
    const payload = {
      ...data,
      invoiceNo: inventoryInvoiceNo,
      type: data?.type && typeof data.type === "string" ? data.type : "inventory",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("inventory").insertOne(payload)

    // console.log("✅ Inventory Invoice Generated:", inventoryInvoiceNo)

    // 3️⃣ Return response
    return Response.json({
      success: true,
      id: result.insertedId,
      invoiceNo: inventoryInvoiceNo,
    })
  } catch (error) {
    console.error("❌ Failed to create inventory item:", error)
    return Response.json(
      { error: "Failed to create inventory item", details: error.message },
      { status: 500 }
    )
  }
}

