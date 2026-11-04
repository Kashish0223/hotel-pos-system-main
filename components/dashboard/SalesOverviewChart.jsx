"use client";

import React from "react";
import styles from "./dashboard.module.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";

export default function SalesOverviewChart({ data = [], loading = false }) {
  // If no live data passed, use truthful empty state or formatted 7-day structure
  const hasData = Array.isArray(data) && data.length > 0;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className={`${styles.panelCard} ${styles.colSpan8}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <BarChart3 size={18} className="text-gray-500" />
          <span>Sales Overview</span>
        </h2>
        <span className={styles.panelTag}>Last 7 Days (Verified)</span>
      </div>

      <div style={{ width: "100%", height: "260px", minHeight: "260px" }}>
        {loading ? (
          <div className={styles.emptyStateContainer} style={{ height: "100%" }}>
            <div className={styles.skeletonBar} style={{ width: "80%", height: "20px" }} />
            <div className={styles.skeletonBar} style={{ width: "60%", height: "16px" }} />
          </div>
        ) : !hasData ? (
          <div className={styles.emptyStateContainer} style={{ height: "100%" }}>
            <p className="font-medium">No sales recorded in the last 7-day period.</p>
            <p className="text-xs">New settled orders will populate this chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--dash-border)"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--dash-muted)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                tick={{ fontSize: 11, fill: "var(--dash-muted)" }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          backgroundColor: "var(--dash-card)",
                          border: "1px solid var(--dash-border)",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          boxShadow: "var(--dash-card-shadow)",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ color: "var(--dash-muted)", marginBottom: "4px" }}>
                          {label}
                        </div>
                        <div style={{ fontWeight: "700", color: "var(--dash-text)" }}>
                          {formatCurrency(payload[0].value)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="amount"
                fill="var(--dash-accent)"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
