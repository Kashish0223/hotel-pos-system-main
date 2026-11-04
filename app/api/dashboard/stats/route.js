import { getDatabase } from "@/lib/db-config";

export async function GET() {
  try {
    const db = await getDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's orders
    const todayOrders = await db.collection("orders").countDocuments({
      createdAt: { $gte: today },
    });

    // Today's revenue
    const todayRevenue = await db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$totalAmount" } } } },
      ])
      .toArray();

    // Today's sales
    const todaySales = await db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$totalAmount" } } } },
      ])
      .toArray();

    // Active orders
    const activeOrders = await db.collection("orders").countDocuments({
      status: { $in: ["pending", "preparing", "ready"] },
    });

    const pendingOrders = await db.collection("orders").countDocuments({
      status: { $in: ["pending"] },
    });

    // Total menu items
    const totalMenuItems = await db.collection("menu").countDocuments({
      available: true,
    });

    // Low stock items (inventory type only, to match inventory page)
    const lowStockItems = await db.collection("inventory").countDocuments({
      type: "inventory",
      $expr: { $lt: [{ $toDouble: "$currentStock" }, { $toDouble: "$minStock" }] }
    });

    // Total customers
    const totalCustomers = await db.collection("customers").countDocuments({
      status: "active",
    });

    // Total staff
    const totalStaff = await db.collection("staff").countDocuments({
      status: "active",
    });

    // Pending expenses
    const pendingExpenses = await db.collection("expenses").countDocuments({
      status: "pending",
    });

    return Response.json({
      todayOrders,
      todaySales: todaySales[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      activeOrders,
      totalMenuItems,
      lowStockItems,
      totalCustomers,
      totalStaff,
      pendingExpenses,
      pendingOrders
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}