"use client";

import React from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { Users, ChevronRight, UserCheck } from "lucide-react";

export default function TeamSummaryCard({ totalStaff = 0 }) {
  return (
    <div className={`${styles.panelCard} ${styles.colSpan4}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <Users size={17} className="text-purple-500" />
          <span>Team & Operations</span>
        </h2>
        <Link href="/staff" className={styles.panelActionLink}>
          <span>Staff</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className={styles.widgetList}>
        <div className={styles.widgetRow}>
          <div className={styles.widgetRowMain}>
            <span className={styles.widgetRowTitle}>Active Staff Records</span>
            <span className={styles.widgetRowMeta}>Authorized staff in system</span>
          </div>
          <div className={styles.widgetRowEnd}>
            <span className={styles.widgetRowPrice}>{totalStaff} Team Members</span>
          </div>
        </div>

        <div className={styles.widgetRow}>
          <div className={styles.widgetRowMain}>
            <span className={styles.widgetRowTitle}>Kitchen Line (KDS)</span>
            <span className={styles.widgetRowMeta}>Chefs & preparation crew</span>
          </div>
          <div className={styles.widgetRowEnd}>
            <span className={styles.badgeSuccess}>
              <UserCheck size={12} className="mr-1 inline" />
              Online
            </span>
          </div>
        </div>

        <div className={styles.widgetRow}>
          <div className={styles.widgetRowMain}>
            <span className={styles.widgetRowTitle}>Floor & Service Staff</span>
            <span className={styles.widgetRowMeta}>Captains, waitstaff & cashiers</span>
          </div>
          <div className={styles.widgetRowEnd}>
            <span className={styles.badgeSuccess}>
              <UserCheck size={12} className="mr-1 inline" />
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
