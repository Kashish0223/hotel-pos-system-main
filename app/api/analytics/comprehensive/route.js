import { getDatabase } from "@/lib/db-config";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import {headers} from "next/headers";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);



export async function GET(request) {
  try {
    const authHeader = (await headers()).get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    await jwtVerify(authHeader.split("Bearer ")[1], secret);

    const { searchParams } = new URL(request.url);

    const NOW = new Date();
    const TODAY_END = new Date();
    TODAY_END.setHours(23, 59, 59, 999);

    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Parse user input
    const rawStart = searchParams.get("startDate");
    const rawEnd = searchParams.get("endDate");

    let userStart = rawStart ? new Date(rawStart) : THIRTY_DAYS_AGO;
    let userEnd = rawEnd ? new Date(rawEnd) : NOW;

    // Fix invalid dates
    if (isNaN(userStart.getTime())) userStart = THIRTY_DAYS_AGO;
    if (isNaN(userEnd.getTime())) userEnd = TODAY_END;

    // 1. CRITICAL: If start > end → INVALID RANGE
    if (userStart > userEnd) {
      return Response.json({
        error: "Invalid date range",
        message: "Start date cannot be after end date",
        hasData: false
      }, { status: 400 });
    }

    const isStartInFuture = userStart > NOW;
    const isEndInFuture = userEnd > NOW;

    // 2. BOTH dates in future → No data
// NEW: If ANY part of the range is in the future → show zero data gracefully
const isAnyDateInFuture = userStart > NOW || userEnd > NOW;

if (isAnyDateInFuture) {
  return Response.json({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderAmount: 0,
    salesTrend: [],
    categoryPerformance: [],
    paymentMethods: [],
    dateWisePayments: [],
    customerInsights: {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      activeCustomers: 0,
    },
    hasData: false,
    message: "No data available for future dates"
  });
}
// if (isStartInFuture) {
//   return Response.json({
//     totalRevenue: 0,
//     totalOrders: 0,
//     avgOrderAmount: 0,
//     salesTrend: [],
//     categoryPerformance: [],
//     paymentMethods: [],
//     customerInsights: {
//       totalCustomers: 0,
//       newCustomers: 0,
//       returningCustomers: 0,
//       activeCustomers: 0,
//     },
//     hasData: false,
//     message: "No data available for future start date"
//   });
// }


//     if (isStartInFuture && isEndInFuture) {
//       return Response.json({
//         totalRevenue: 0,
//         totalOrders: 0,
//         avgOrderAmount: 0,
//         salesTrend: [],
//         categoryPerformance: [],
//         paymentMethods: [],
//         customerInsights: {
//           totalCustomers: 0,
//           newCustomers: 0,
//           returningCustomers: 0,
//           activeCustomers: 0,
//         },
//         hasData: false,
//         message: "No data available for future date ranges"
//       });
//     }

    // 3. Only end is in future → cap to today
    let queryStart = userStart;
    let queryEnd = isEndInFuture ? TODAY_END : userEnd;

    // Final bounds
    queryStart.setHours(0, 0, 0, 0);
    queryEnd.setHours(23, 59, 59, 999);

    const db = await getDatabase();

    const [result] = await db.collection("orders").aggregate([
      {
        $match: {
          createdAt: { $gte: queryStart, $lte: queryEnd },
          status: { $ne: "cancelled" }
        }
      },
      {
        $facet: {
          overallStats: [
            { $group: { _id: null, totalRevenue: { $sum: { $convert: { input: "$totalAmount", to: "double", onError: 0, onNull: 0 } } }, totalOrders: { $sum: 1 }, avgOrderAmount: { $avg: { $convert: { input: "$totalAmount", to: "double", onError: 0, onNull: 0 } } } } },
            { $project: { _id: 0, totalRevenue: { $round: ["$totalRevenue", 2] }, totalOrders: 1, avgOrderAmount: { $round: ["$avgOrderAmount", 2] } } }
          ],
          salesTrend: [
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: { $convert: { input: "$totalAmount", to: "double", onError: 0, onNull: 0 } } }, orders: { $sum: 1 }, quantity: {
        $sum: {
          $sum: "$items.quantity"  // ← This fixes Quantity = 0
        }
      }} },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", revenue: { $round: ["$revenue", 2] }, orders: 1,quantity: 1 } }
          ],
          categoryPerformance: [
            { $unwind: "$items" },
            { $group: { _id: "$items.category", value: { $sum: { $multiply: [{ $convert: { input: "$items.price", to: "double", onError: 0, onNull: 0 } }, { $ifNull: ["$items.quantity", 0] }] } } } },
            { $sort: { value: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, name: "$_id", value: { $round: ["$value", 2] } } }
          ],
          paymentMethods: [
            { $match: { billPay: true, paymentMethod: { $exists: true, $ne: null } } },
            { $group: { _id: "$paymentMethod", amount: { $sum: { $convert: { input: "$totalAmount", to: "double", onError: 0, onNull: 0 } } }, count: { $sum: 1 } } },
            { $sort: { amount: -1 } },
            { $project: { _id: 0, name: "$_id", amount: { $round: ["$amount", 2] }, count: 1 } }
          ],
      // Existing pie chart data (unchanged!)
          // paymentMethods: [
          //   {
          //     $group: {
          //       _id: "$paymentMethod",
          //       amount: { $sum: { $convert: { input: "$totalAmount", to: "double" } } },
          //       count: { $sum: 1 }
          //     }
          //   },
          //   { $sort: { amount: -1 } },
          //   { $project: { _id: 0, name: "$_id", amount: { $round: ["$amount", 2] }, count: 1 } }
          // ],

          // NEW: Date-wise payment method breakdown (for Excel)
dateWisePayments: [
  // 1. Filter ONLY valid payment methods EARLY (prevents null/empty issues)
  {
    $match: {
      paymentMethod: { $exists: true, $ne: "pending", $type: "string" }
    }
  },
  // 2. Group by date + method
  {
    $group: {
      _id: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        method: "$paymentMethod"
      },
      amount: {
        $sum: { $convert: { input: "$totalAmount", to: "double", onError: 0, onNull: 0 } }
      }
    }
  },
  // 3. Collect all methods per day
  {
    $group: {
      _id: "$_id.date",
      paymentsArray: {
        $push: {
          k: { $ifNull: ["$_id.method", "unknown"] }, // safe key
          v: { $round: ["$amount", 2] }
        }
      }
    }
  },
  // 4. Convert to object — only if we have valid pairs
  {
    $project: {
      date: "$_id",
      payments: {
        $cond: {
          if: { $gt: [{ $size: "$paymentsArray" }, 0] },
          then: { $arrayToObject: "$paymentsArray" },
          else: {} // empty object for days with no payments
        }
      }
    }
  },
  { $sort: { date: 1 } }
],
          customerInsights: [
            { $group: { _id: "$customerEmail", orderCount: { $sum: 1 }, lastOrderDate: { $max: "$createdAt" } } },
            {
              $group: {
                _id: null,
                totalCustomers: { $sum: 1 },
                newCustomers: { $sum: { $cond: [{ $eq: ["$orderCount", 1] }, 1, 0] } },
                returningCustomers: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } },
                activeCustomers: { $sum: { $cond: [{ $gte: ["$lastOrderDate", new Date(Date.now() - 30*24*60*60*1000)] }, 1, 0] } }
              }
            }
          ]
        }
      },
      {
        $project: {
          totalRevenue:     { $ifNull: [{ $arrayElemAt: ["$overallStats.totalRevenue", 0] }, 0] },
          totalOrders:      { $ifNull: [{ $arrayElemAt: ["$overallStats.totalOrders", 0] }, 0] },
          avgOrderAmount:   { $ifNull: [{ $arrayElemAt: ["$overallStats.avgOrderAmount", 0] }, 0] },
          salesTrend:       { $ifNull: ["$salesTrend", []] },
          categoryPerformance: { $ifNull: ["$categoryPerformance", []] },
          paymentMethods:   { $ifNull: ["$paymentMethods", []] },
          dateWisePayments: { $ifNull: ["$dateWisePayments", []] }, // ← NEW!,
          customerInsights: {
            $ifNull: [
              { $arrayElemAt: ["$customerInsights", 0] },
              { totalCustomers: 0, newCustomers: 0, returningCustomers: 0, activeCustomers: 0 }
            ]
          },
          hasData: { $gt: [{ $size: { $ifNull: ["$salesTrend", []] } }, 0] }
        }
      }
    ]).toArray();

    return Response.json(result || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderAmount: 0,
      salesTrend: [],
      categoryPerformance: [],
      paymentMethods: [],
      dateWisePayments: [],
      customerInsights: { totalCustomers: 0, newCustomers: 0, returningCustomers: 0, activeCustomers: 0 },
      hasData: false
    });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}


