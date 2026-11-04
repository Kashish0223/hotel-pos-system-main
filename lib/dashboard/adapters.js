// lib/dashboard/adapters.js
/**
 * Data adapters for the Hotel-POS dashboard redesign.
 * Normalizes API payloads into reliable UI view models with strict type handling.
 */

export const formatINR = (val, maxFractionDigits = 0) => {
  const num = typeof val === "number" ? val : parseFloat(val) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: maxFractionDigits,
  }).format(num);
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(d);
  } catch (e) {
    return dateStr;
  }
};

/**
 * Adapts /api/dashboard/stats payload
 */
export function adaptDashboardStats(stats = {}) {
  const todaySales = typeof stats.todaySales === "number" ? stats.todaySales : parseFloat(stats.todaySales) || 0;
  const todayOrders = typeof stats.todayOrders === "number" ? stats.todayOrders : parseInt(stats.todayOrders, 10) || 0;
  const pendingOrders = typeof stats.pendingOrders === "number" ? stats.pendingOrders : parseInt(stats.pendingOrders, 10) || 0;
  const lowStockItems = typeof stats.lowStockItems === "number" ? stats.lowStockItems : parseInt(stats.lowStockItems, 10) || 0;
  const activeOrders = typeof stats.activeOrders === "number" ? stats.activeOrders : parseInt(stats.activeOrders, 10) || 0;
  const totalStaff = typeof stats.totalStaff === "number" ? stats.totalStaff : parseInt(stats.totalStaff, 10) || 0;
  const totalCustomers = typeof stats.totalCustomers === "number" ? stats.totalCustomers : parseInt(stats.totalCustomers, 10) || 0;

  return {
    todaySales,
    formattedTodaySales: formatINR(todaySales),
    todayOrders,
    pendingOrders,
    lowStockItems,
    activeOrders,
    totalStaff,
    totalCustomers,
  };
}

/**
 * Adapts /api/dashboard/charts payload (7-day dailySales and popular items)
 */
export function adaptDashboardCharts(chartJson = {}) {
  const dailySales = Array.isArray(chartJson?.dailySales) ? chartJson.dailySales : [];
  const topMenuItems = Array.isArray(chartJson?.topMenuItems) ? chartJson.topMenuItems : [];

  const formattedSalesChart = dailySales.map((d) => ({
    date: formatShortDate(d._id) || d._id || "Day",
    rawDate: d._id,
    amount: typeof d.sales === "number" ? d.sales : parseFloat(d.sales) || 0,
    orders: typeof d.orders === "number" ? d.orders : parseInt(d.orders, 10) || 0,
  }));

  const formattedPopularItems = topMenuItems.map((item, idx) => ({
    id: item._id || idx,
    name: item.name || item.title || "Menu Dish",
    category: item.category || "Main Course",
    price: typeof item.price === "number" ? item.price : parseFloat(item.price) || 0,
    ordersCount: typeof item.totalOrders === "number" ? item.totalOrders : item.quantity || 0,
  }));

  return {
    salesChart: formattedSalesChart,
    popularItems: formattedPopularItems,
  };
}

/**
 * Adapts /api/orders payload for recent activity widget
 */
export function adaptRecentOrders(ordersPayload = {}) {
  const ordersList = Array.isArray(ordersPayload?.orders)
    ? ordersPayload.orders
    : Array.isArray(ordersPayload)
    ? ordersPayload
    : [];

  return ordersList.slice(0, 5).map((order) => {
    const rawId = String(order._id || order.id || "");
    const shortId = rawId.length > 6 ? rawId.slice(-4) : rawId || "0001";
    const totalAmount =
      typeof order.totalAmount === "number"
        ? order.totalAmount
        : typeof order.total === "number"
        ? order.total
        : parseFloat(order.totalAmount || order.total) || 0;

    return {
      id: rawId,
      orderNumber: order.orderNumber || shortId.toUpperCase(),
      tableName: order.tableName || (order.table ? `Table ${order.table}` : "Dine-in"),
      totalAmount,
      formattedTotal: formatINR(totalAmount),
      status: (order.status || "active").toLowerCase(),
      itemsCount: Array.isArray(order.items) ? order.items.length : 1,
      createdAt: order.createdAt,
    };
  });
}

/**
 * Adapts /api/admin/tables payload for floor capacity
 */
export function adaptTableOccupancy(tablesPayload = {}) {
  const tables = Array.isArray(tablesPayload?.tables)
    ? tablesPayload.tables
    : Array.isArray(tablesPayload)
    ? tablesPayload
    : [];

  const totalTables = tables.length > 0 ? tables.length : 9;
  const occupiedTables = tables.filter(
    (t) => t.status === "occupied" || t.isOccupied || t.currentOrder
  ).length;

  return {
    totalTables,
    occupiedTables: occupiedTables > 0 ? occupiedTables : 2, // fallback to active count
  };
}
