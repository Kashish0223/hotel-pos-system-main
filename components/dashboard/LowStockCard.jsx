"use client";

import React from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { AlertTriangle, ChevronRight, PackageCheck } from "lucide-react";

export default function LowStockCard({ items = [], lowStockCount = 0 }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className={`${styles.panelCard} ${styles.colSpan12}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <AlertTriangle size={18} className="text-amber-500" />
          <span>Inventory Attention & Low Stock</span>
          <span className={styles.badgeDanger}>
            {lowStockCount || items.length} Critical
          </span>
        </h2>
        <Link href="/inventory" className={styles.panelActionLink}>
          <span>Open Inventory</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {!hasItems && lowStockCount === 0 ? (
        <div className={styles.emptyStateContainer}>
          <PackageCheck size={28} className="text-green-600 mb-1" />
          <p className="font-semibold text-gray-800">All supplies are adequately stocked</p>
          <p className="text-xs text-gray-500">
            No ingredients or raw materials are currently below their minimum reorder point.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className={styles.stockTable}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Threshold</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {hasItems ? (
                items.map((item, idx) => (
                  <tr key={item._id || item.id || idx}>
                    <td className="font-semibold">{item.name || "Raw Material"}</td>
                    <td>{item.category || "Pantry / Dairy"}</td>
                    <td className="font-bold text-red-600">
                      {item.quantity ?? item.stock ?? 0} {item.unit || "units"}
                    </td>
                    <td>{item.minQuantity ?? item.minStock ?? 5} {item.unit || "units"}</td>
                    <td>
                      <span className={styles.badgeDanger}>Low Stock</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href="/inventory"
                        className="text-xs font-semibold text-amber-700 hover:underline"
                      >
                        Reorder →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="font-semibold">Amul Butter 500g</td>
                  <td>Dairy & Fats</td>
                  <td className="font-bold text-red-600">2 packs</td>
                  <td>5 packs</td>
                  <td>
                    <span className={styles.badgeDanger}>Low Stock</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href="/inventory"
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Reorder →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
