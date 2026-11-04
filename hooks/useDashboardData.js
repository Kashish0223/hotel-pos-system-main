// hooks/useDashboardData.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  adaptDashboardStats,
  adaptDashboardCharts,
  adaptRecentOrders,
  adaptTableOccupancy,
} from "@/lib/dashboard/adapters";

export function useDashboardData(user, token) {
  const [data, setData] = useState({
    stats: {
      todaySales: 0,
      formattedTodaySales: "₹0",
      todayOrders: 0,
      pendingOrders: 0,
      lowStockItems: 0,
      activeOrders: 0,
      totalStaff: 5,
      totalCustomers: 0,
    },
    salesChart: [],
    popularItems: [],
    recentOrders: [],
    tableOccupancy: {
      occupiedTables: 2,
      totalTables: 9,
    },
    lowStockList: [
      {
        name: "Amul Butter 500g",
        category: "Dairy & Fats",
        quantity: 2,
        minQuantity: 5,
        unit: "packs",
      },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Cancel any previous in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // Parallel execution of independent endpoints
      const [statsResult, chartsResult, ordersResult, tablesResult] =
        await Promise.allSettled([
          fetch("/api/dashboard/stats", { headers: authHeaders, signal }).then(
            (res) => (res.ok ? res.json() : Promise.reject(res.status))
          ),
          fetch("/api/dashboard/charts", { headers: authHeaders, signal }).then(
            (res) => (res.ok ? res.json() : Promise.reject(res.status))
          ),
          fetch("/api/orders", { headers: authHeaders, signal }).then(
            (res) => (res.ok ? res.json() : Promise.reject(res.status))
          ),
          fetch("/api/admin/tables", { headers: authHeaders, signal }).then(
            (res) => (res.ok ? res.json() : Promise.reject(res.status))
          ),
        ]);

      // Check if aborted before updating state
      if (signal.aborted) return;

      const adaptedStats =
        statsResult.status === "fulfilled"
          ? adaptDashboardStats(statsResult.value)
          : adaptDashboardStats({});

      const adaptedCharts =
        chartsResult.status === "fulfilled"
          ? adaptDashboardCharts(chartsResult.value)
          : adaptDashboardCharts({});

      const adaptedOrders =
        ordersResult.status === "fulfilled"
          ? adaptRecentOrders(ordersResult.value)
          : adaptRecentOrders({});

      const adaptedTables =
        tablesResult.status === "fulfilled"
          ? adaptTableOccupancy(tablesResult.value)
          : adaptTableOccupancy({});

      setData({
        stats: adaptedStats,
        salesChart: adaptedCharts.salesChart,
        popularItems: adaptedCharts.popularItems,
        recentOrders: adaptedOrders,
        tableOccupancy: adaptedTables,
        lowStockList: [
          {
            name: "Amul Butter 500g",
            category: "Dairy & Fats",
            quantity: 2,
            minQuantity: 5,
            unit: "packs",
          },
        ],
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Dashboard data fetching error:", err);
        setError("Failed to fetch some dashboard metrics.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, token]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  };
}
