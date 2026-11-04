import { getDatabase } from "@/lib/db-config";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request) {
  try {
    // 🔐 Decode JWT
    const headerList = await headers();
    const authHeader = headerList.get("Authorization");

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

    const { searchParams } = new URL(request.url);
    const startDate = new Date(
      searchParams.get("startDate") ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const endDate = new Date(searchParams.get("endDate") || new Date());
    endDate.setHours(23, 59, 59, 999);

    // Daily sales trend
    const dailySales = await db
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
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalSales: { $sum: { $toDouble: "$totalAmount" } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Top selling items
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
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: {
                $multiply: ["$items.quantity", { $toDouble: "$items.price" }],
              },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Sales by category
    const categoryStats = await db
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
          $lookup: {
            from: "menu",
            localField: "items.name",
            foreignField: "name",
            as: "menuItem",
          },
        },
        { $unwind: "$menuItem" },
        {
          $group: {
            _id: "$menuItem.category",
            revenue: {
              $sum: {
                $multiply: ["$items.quantity", { $toDouble: "$items.price" }],
              },
            },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .toArray();

    // Peak hours analysis
    const peakHours = await db
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
            _id: { $hour: "$createdAt" },
            orderCount: { $sum: 1 },
            revenue: { $sum: { $toDouble: "$totalAmount" } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return Response.json({
      dailySales,
      topItems,
      categoryStats,
      peakHours,
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
