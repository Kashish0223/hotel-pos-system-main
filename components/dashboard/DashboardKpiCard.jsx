"use client";

import React from "react";
import styles from "./dashboard.module.css";

const VARIANT_CLASS_MAP = {
  clay: styles.kpiClay,
  sage: styles.kpiSage,
  sand: styles.kpiSand,
  sky: styles.kpiSky,
};

export default function DashboardKpiCard({
  title,
  value,
  footerText,
  variant = "clay",
  icon,
}) {
  const variantClass = VARIANT_CLASS_MAP[variant] || styles.kpiClay;

  return (
    <div className={`${styles.kpiCard} ${variantClass}`}>
      <div className={styles.kpiTopRow}>
        <span className={styles.kpiLabel}>{title}</span>
        {icon && <div className={styles.kpiIconBox}>{icon}</div>}
      </div>

      <div className={styles.kpiValueRow}>
        <span className={styles.kpiValue}>{value}</span>
      </div>

      <div className={styles.kpiFooter}>
        <span>{footerText}</span>
      </div>
    </div>
  );
}
