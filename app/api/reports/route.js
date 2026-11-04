import { getDatabase } from "@/lib/db-config";
import { jwtVerify } from "jose";
import {headers} from "next/headers";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request) {
  try {
    // 🔐 Decode JWT
    const headerList = await headers();
    const authHeader = headerList.get("authorization");
    // console.log("Auth---Report-->>",authHeader)
    // const authHeader = headerList.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
        // console.log("token---Report-->>",token)

    try {
      const verified = await jwtVerify(token, secret);
      const payload = verified.payload;
      if (!payload.role)
        return Response.json(
          { error: "Invalid token (missing role)" },
          { status: 401 }
        );
    } catch (e) {
      console.error("JWT verification failed:", e);
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const db = await getDatabase();

    function normalizeDateStart(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeDateEnd(d) {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}


    const { searchParams } = new URL(request.url);
    const startDate = normalizeDateStart(searchParams.get("startDate"));
    // const endDate = new Date(searchParams.get("endDate"))
    // endDate.setHours(23, 59, 59, 999)

    const endDateB = normalizeDateEnd(searchParams.get("endDate") || Date.now());
    endDateB.setHours(23, 59, 59, 999);
    const endDate = endDateB;

    // console.log(`Dates for comprehensive report: ${startDate} to: ${endDate}`)

    // Total revenue and orders
    const totalStats = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: "$totalAmount" } },
            totalOrders: { $sum: 1 },
            // avgOrderAmount: { $avg: "$totalAmount" }
          },
        },
      ])
      .toArray();

    

    // -------------------- DAILY SALES REPORT --------------------
const dailySales = await db.collection("orders").aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
      },
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: { $toDouble: "$totalAmount" } },
      kitchenRevenue: {
        $sum: {
          $sum: {
            $map: {
              input: "$items",
              as: "i",
              in: {
                $cond: [
                  { $eq: ["$$i.itemType", "kitchen"] },
                  { $multiply: ["$$i.quantity", { $toDouble: "$$i.price" }] },
                  0
                ]
              }
            }
          }
        }
      },
      retailRevenue: {
        $sum: {
          $sum: {
            $map: {
              input: "$items",
              as: "i",
              in: {
                $cond: [
                  { $eq: ["$$i.itemType", "retail"] },
                  { $multiply: ["$$i.quantity", { $toDouble: "$$i.price" }] },
                  0
                ]
              }
            }
          }
        }
      }
    }
  },
  { $sort: { _id: 1 } },
  {
    $project: {
      _id: 0,
      date: "$_id",
      totalOrders: 1,
      totalRevenue: 1,
      kitchenRevenue: 1,
      retailRevenue: 1
    }
  }
]).toArray();

// -------------------- DAILY ITEM WISE SALES --------------------
const dailyItemSales = await db.collection("orders").aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" }
    }
  },
  { $unwind: "$items" },
  {
    $group: {
      _id: {
        date: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        itemName: {
          $ifNull: [
            "$items.name.en",
            { $ifNull: ["$items.name", "$items.nameEn"] }
          ]
        },
        itemType: "$items.itemType"
      },
      quantity: { $sum: "$items.quantity" },
      revenue: {
        $sum: {
          $multiply: ["$items.quantity", { $toDouble: "$items.price" }]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      date: "$_id.date",
      itemName: "$_id.itemName",
      itemType: "$_id.itemType",
      quantity: 1,
      revenue: { $round: ["$revenue", 2] }
    }
  },
  { $sort: { date: 1, revenue: -1 } }
]).toArray();



    // Top items
    const topItems = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              name: {
                $ifNull: [
                  "$items.name.en",
                  {
                    $ifNull: [
                      "$items.name",
                      { $ifNull: ["$items.nameEn", "$items.name.ja"] },
                    ],
                  },
                ],
              },
              itemType: "$items.itemType",
            },
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: {
                $multiply: ["$items.quantity", { $toDouble: "$items.price" }],
              },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 20 },
        {
          $project: {
            name: {
              $ifNull: [
                "$_id.name.en",
                {
                  $ifNull: [
                    "$_id.name",
                    { $ifNull: ["$_id.nameEn", "$_id.name.ja"] },
                  ],
                },
              ],
            },
            itemType: "$_id.itemType",
            quantity: 1,
            revenue: { $round: ["$revenue", 2] },
            _id: 0,
          },
        },
      ])
      .toArray();

    // Orders by type
    const ordersByType = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: "$orderType",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const ordersByTypeObj = {};
    ordersByType.forEach((item) => {
      ordersByTypeObj[item._id] = item.count;
    });

    // Stats per itemType ("kitchen" vs "retail")
    const itemTypeStats = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              orderId: "$_id",
              itemType: "$items.itemType",
            },
            orderRevenue: {
              $sum: {
                $multiply: ["$items.quantity", { $toDouble: "$items.price" }],
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.itemType",
            totalRevenue: { $sum: "$orderRevenue" },
            totalOrders: { $sum: 1 }, // unique orders per itemType
          },
        },
        {
          $project: {
            _id: 0,
            itemType: "$_id",
            totalRevenue: { $round: ["$totalRevenue", 2] },
            totalOrders: 1,
            averageOrderValue: {
              $cond: [
                { $eq: ["$totalOrders", 0] },
                0,
                { $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 2] },
              ],
            },
          },
        },
      ])
      .toArray();

    return Response.json({
      totalRevenue: totalStats[0]?.totalRevenue || 0,
      totalOrders: totalStats[0]?.totalOrders || 0,
      // avgOrderAmount: totalStats[0]?.avgOrderAmount || 0,
      topItems,
      ordersByType: ordersByTypeObj,
      itemTypeStats, // 👈 NEW
      dailySales,
      dailyItemSales // 👈 add

    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}


