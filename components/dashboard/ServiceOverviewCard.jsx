"use client";

import React from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { Utensils, PlusCircle, Grid, Clock } from "lucide-react";

export default function ServiceOverviewCard({
  activeOrders = 0,
  pendingOrders = 0,
  occupiedTables = 0,
  totalTables = 9,
}) {
  return (
    <div className={`${styles.panelCard} ${styles.colSpan4}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <Utensils size={18} className="text-gray-500" />
          <span>Service & Floor</span>
        </h2>
        <span className={styles.panelTag}>Live Floor</span>
      </div>

      <div className={styles.widgetList}>
        <div className={styles.widgetRow}>
          <div className={styles.widgetRowMain}>
            <span className={styles.widgetRowTitle}>Active Kitchen Tickets</span>
            <span className={styles.widgetRowMeta}>Orders currently preparing</span>
          </div>
          <div className={styles.widgetRowEnd}>
            <span className={styles.badgeWarning}>
              <Clock size={12} className="mr-1 inline" />
              {activeOrders} In Progress
            </span>
          </div>
        </div>

        <div className={styles.widgetRow}>
          <div className={styles.widgetRowMain}>
            <span className={styles.widgetRowTitle}>Pending Settlements</span>
            <span className={styles.widgetRowMeta}>Bills awaiting payment</span>
          </div>
          <div className={styles.widgetRowEnd}>
            <span className={styles.badgeSuccess}>{pendingOrders} Awaiting</span>
          </div>
        </div>

        <div className={styles.widgetRow}>
          <div className={styles.widgetRowMain}>
            <span className={styles.widgetRowTitle}>Dining Room Occupancy</span>
            <span className={styles.widgetRowMeta}>Occupied table capacity</span>
          </div>
          <div className={styles.widgetRowEnd}>
            <span className={styles.widgetRowPrice}>
              {occupiedTables} / {totalTables}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className={styles.quickActionGrid}>
        <Link href="/orders/new" className={styles.quickActionTile}>
          <PlusCircle size={18} className="text-amber-600" />
          <span className={styles.quickActionLabel}>Open Register</span>
          <span className="text-xs text-gray-500">Take table order</span>
        </Link>
        <Link href="/admin/tables" className={styles.quickActionTile}>
          <Grid size={18} className="text-blue-600" />
          <span className={styles.quickActionLabel}>Floor View</span>
          <span className="text-xs text-gray-500">View table map</span>
        </Link>
      </div>
    </div>
  );
}
