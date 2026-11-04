"use client";

import React from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { Sparkles, ChevronRight } from "lucide-react";

export default function PopularItemsCard({ items = [] }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className={`${styles.panelCard} ${styles.colSpan4}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <Sparkles size={17} className="text-amber-500" />
          <span>Popular Menu Items</span>
        </h2>
        <Link href="/menu" className={styles.panelActionLink}>
          <span>Menu</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className={styles.widgetList}>
        {!hasItems ? (
          <div className={styles.emptyStateContainer}>
            <p className="font-medium">No sales recorded yet.</p>
            <p className="text-xs">Top dishes from orders will appear here.</p>
          </div>
        ) : (
          items.slice(0, 4).map((item, idx) => (
            <div key={item._id || item.id || idx} className={styles.widgetRow}>
              <div className={styles.widgetRowMain}>
                <span className={styles.widgetRowTitle}>
                  {idx + 1}. {item.name || item.title || "Menu Item"}
                </span>
                <span className={styles.widgetRowMeta}>
                  {item.category || "Main Course"}
                </span>
              </div>
              <div className={styles.widgetRowEnd}>
                <span className={styles.widgetRowPrice}>
                  {item.ordersCount ? `${item.ordersCount} sold` : `₹${item.price || 0}`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
