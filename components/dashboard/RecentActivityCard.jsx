"use client";

import React from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { Receipt, ChevronRight } from "lucide-react";

export default function RecentActivityCard({ orders = [] }) {
  const hasOrders = Array.isArray(orders) && orders.length > 0;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <div className={`${styles.panelCard} ${styles.colSpan4}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <Receipt size={17} className="text-blue-500" />
          <span>Recent Activity</span>
        </h2>
        <Link href="/orders" className={styles.panelActionLink}>
          <span>All Orders</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className={styles.widgetList}>
        {!hasOrders ? (
          <div className={styles.emptyStateContainer}>
            <p className="font-medium">No recent orders placed today.</p>
            <p className="text-xs">Live orders will show here in real time.</p>
          </div>
        ) : (
          orders.slice(0, 4).map((order) => {
            const isCompleted =
              order.status === "completed" ||
              order.status === "paid" ||
              order.status === "settled";

            return (
              <div
                key={order._id || order.id || order.orderNumber}
                className={styles.widgetRow}
              >
                <div className={styles.widgetRowMain}>
                  <span className={styles.widgetRowTitle}>
                    Order #{order.orderNumber || String(order._id || "").slice(-4)}
                  </span>
                  <span className={styles.widgetRowMeta}>
                    {order.tableName || `Table ${order.table || "Dine-in"}`} •{" "}
                    {order.items?.length || 1} items
                  </span>
                </div>
                <div className={styles.widgetRowEnd}>
                  <div className={styles.widgetRowPrice}>
                    {formatCurrency(order.totalAmount || order.total || 0)}
                  </div>
                  <div>
                    <span
                      className={
                        isCompleted ? styles.badgeSuccess : styles.badgeWarning
                      }
                    >
                      {order.status || "active"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
