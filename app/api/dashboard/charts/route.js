import { getDatabase } from "@/lib/db-config";

export async function GET() {
  try {
    const db = await getDatabase();

    // Get date ranges
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Daily Sales Chart Data (Last 7 days)
    const dailySales = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            sales: { $sum: { $toDouble: "$totalAmount" } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Category Sales Distribution
    const categorySales = await db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $gte: last30Days }, status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menu",
            localField: "items.menuId",
            foreignField: "_id",
            as: "menuItem",
          },
        },
        { $unwind: "$menuItem" },
        {
          $group: {
            _id: "$menuItem.category",
            sales: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { sales: -1 } },
      ])
      .toArray();

    // Top Menu Items
    const topMenuItems = await db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $gte: last30Days }, status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menu",
            localField: "items.menuId",
            foreignField: "_id",
            as: "menuItem",
          },
        },
        { $unwind: "$menuItem" },
        {
          $group: {
            _id: "$menuItem.name",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Monthly Revenue Trend (Last 6 months)
    const monthlyRevenue = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(today.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: { $toDouble: "$totalAmount" } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    // Outlet Performance
    const outletPerformance = await db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $gte: last30Days }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$outlet",
            revenue: { $sum: { $toDouble: "$totalAmount" } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .toArray();

    // Customer Tier Distribution
    const customerTiers = await db
      .collection("customers")
      .aggregate([
        { $match: { status: "active" } },
        {
          $group: {
            _id: "$membershipTier",
            count: { $sum: 1 },
            totalSpent: { $sum: "$totalSpent" },
          },
        },
      ])
      .toArray();

    // Inventory Status
    const inventoryStatus = await db
      .collection("inventory")
      .aggregate([
        {
          $project: {
            name: 1,
            category: 1,
            currentStock: 1,
            minStock: 1,
            status: {
              $cond: {
                if: { $lte: ["$currentStock", "$minStock"] },
                then: "Low Stock",
                else: {
                  $cond: {
                    if: { $lte: ["$currentStock", { $multiply: ["$minStock", 2] }] },
                    then: "Medium Stock",
                    else: "Good Stock",
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Expense Categories
    const expenseCategories = await db
      .collection("expenses")
      .aggregate([
        { $match: { date: { $gte: last30Days } } },
        {
          $group: {
            _id: "$category",
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ])
      .toArray();

    return Response.json({
      dailySales,
      categorySales,
      topMenuItems,
      monthlyRevenue,
      outletPerformance,
      customerTiers,
      inventoryStatus,
      expenseCategories,
    });
  } catch (error) {
    console.error("Dashboard charts error:", error);
    return Response.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}