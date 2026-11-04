"use client";

import React from "react";
import styles from "./dashboard.module.css";
import DashboardKpiCard from "./DashboardKpiCard";
import SalesOverviewChart from "./SalesOverviewChart";
import ServiceOverviewCard from "./ServiceOverviewCard";
import PopularItemsCard from "./PopularItemsCard";
import RecentActivityCard from "./RecentActivityCard";
import TeamSummaryCard from "./TeamSummaryCard";
import LowStockCard from "./LowStockCard";
import DashboardCards from "@/components/DashboardCards";
import { hasPermission } from "@/lib/rbac";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertCircle,
  RotateCw,
  ChefHat,
  ShieldCheck,
} from "lucide-react";

export default function DashboardOverview({
  user,
  settings,
  dashboardData = {},
  loading = false,
  onRefresh,
}) {
  const {
    stats = {},
    salesChart = [],
    popularItems = [],
    recentOrders = [],
    tableOccupancy = { occupiedTables: 2, totalTables: 9 },
    lowStockList = [],
  } = dashboardData;

  const {
    formattedTodaySales = "₹0",
    todayOrders = 0,
    pendingOrders = 0,
    lowStockItems = 0,
    activeOrders = 0,
    totalStaff = 5,
  } = stats;

  // RBAC Permission Gates
  const canViewFinancials = hasPermission(user, [
    "view_reports",
    "view_analysis",
    "manage_settings",
    "view_bill",
  ]);

  const canViewStaff = hasPermission(user, ["view_staff", "manage_staff"]);
  const canViewInventory = hasPermission(user, [
    "view_inventory",
    "manage_inventory",
    "edit_inventory",
  ]);

  return (
    <div className="w-full">
      {/* 1. Page Heading Area */}
      <div className={styles.pageHeadingArea}>
        <div>
          <h1 className={styles.pageTitle}>Today</h1>
          <p className={styles.pageSubtitle}>
            Welcome back, {user?.name || "Hotel Admin"} ({user?.role || "Staff"}) • Live operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className={styles.iconButton}
              title="Refresh dashboard metrics"
              aria-label="Refresh metrics"
            >
              <RotateCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          )}
          <div className={styles.headingContextBadge}>
            <span className={styles.pulseDot} />
            <span>Service Terminal Active</span>
          </div>
        </div>
      </div>

      {/* 2. Four Pastel KPI Cards Row */}
      <section className={styles.kpiRowGrid} aria-label="Key Performance Indicators">
        {loading ? (
          <>
            <div className={`${styles.kpiCard} ${styles.kpiClay}`}>
              <div className={styles.skeletonBar} style={{ width: "50%", height: "14px" }} />
              <div className={styles.skeletonBar} style={{ width: "70%", height: "24px", margin: "12px 0" }} />
              <div className={styles.skeletonBar} style={{ width: "40%", height: "12px" }} />
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSage}`}>
              <div className={styles.skeletonBar} style={{ width: "50%", height: "14px" }} />
              <div className={styles.skeletonBar} style={{ width: "70%", height: "24px", margin: "12px 0" }} />
              <div className={styles.skeletonBar} style={{ width: "40%", height: "12px" }} />
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSand}`}>
              <div className={styles.skeletonBar} style={{ width: "50%", height: "14px" }} />
              <div className={styles.skeletonBar} style={{ width: "70%", height: "24px", margin: "12px 0" }} />
              <div className={styles.skeletonBar} style={{ width: "40%", height: "12px" }} />
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSky}`}>
              <div className={styles.skeletonBar} style={{ width: "50%", height: "14px" }} />
              <div className={styles.skeletonBar} style={{ width: "70%", height: "24px", margin: "12px 0" }} />
              <div className={styles.skeletonBar} style={{ width: "40%", height: "12px" }} />
            </div>
          </>
        ) : (
          <>
            <DashboardKpiCard
              variant="clay"
              title={canViewFinancials ? "Today's Sales" : "Live Service"}
              value={canViewFinancials ? formattedTodaySales : "Active"}
              footerText={canViewFinancials ? "Gross restaurant revenue" : "Operations in progress"}
              icon={canViewFinancials ? <TrendingUp size={16} /> : <ShieldCheck size={16} />}
            />
            <DashboardKpiCard
              variant="sage"
              title="Today's Orders"
              value={`${todayOrders} orders`}
              footerText="Dining room & takeaway"
              icon={<ShoppingBag size={16} />}
            />
            <DashboardKpiCard
              variant="sand"
              title="Pending Orders"
              value={`${pendingOrders} tickets`}
              footerText="Awaiting settlement"
              icon={<Clock size={16} />}
            />
            <DashboardKpiCard
              variant="sky"
              title="Low Stock Items"
              value={`${lowStockItems} items`}
              footerText="Reorder alert"
              icon={<AlertCircle size={16} />}
            />
          </>
        )}
      </section>

      {/* 3. 12-Column Row 1: Sales Chart (8) + Service Overview (4) */}
      <section className={styles.contentGrid12} aria-label="Sales and Service Overview">
        {canViewFinancials ? (
          <SalesOverviewChart data={salesChart} loading={loading} />
        ) : (
          <div className={`${styles.panelCard} ${styles.colSpan8}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <ChefHat size={18} className="text-amber-500" />
                <span>Culinary & Kitchen Queue</span>
              </h2>
              <span className={styles.panelTag}>Staff View</span>
            </div>
            <div className={styles.emptyStateContainer} style={{ height: "260px" }}>
              <ChefHat size={36} className="text-gray-400 mb-2" />
              <p className="font-semibold text-gray-800">Kitchen Operations Mode</p>
              <p className="text-xs text-gray-500 max-w-sm">
                Financial revenue charts are restricted to management and cashier personnel. Head to the Kitchen Display to manage live tickets.
              </p>
            </div>
          </div>
        )}

        <ServiceOverviewCard
          activeOrders={activeOrders}
          pendingOrders={pendingOrders}
          occupiedTables={tableOccupancy.occupiedTables}
          totalTables={tableOccupancy.totalTables}
        />
      </section>

      {/* 4. 12-Column Row 2: Three 4-Column Cards */}
      <section className={styles.contentGrid12} aria-label="Secondary Insights">
        <PopularItemsCard items={popularItems} />
        <RecentActivityCard orders={recentOrders} />
        <TeamSummaryCard totalStaff={totalStaff} canManage={canViewStaff} />
      </section>

      {/* 5. 12-Column Row 3: Full-width Low Stock Panel */}
      {canViewInventory && (
        <section className={styles.contentGrid12} aria-label="Inventory Alerts">
          <LowStockCard items={lowStockList} lowStockCount={lowStockItems} />
        </section>
      )}

      {/* 6. Preserved Module Shortcuts Grid */}
      <section className="mt-8 pt-6 border-t border-black/5" aria-label="Operational Modules">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-800">Quick Access Modules</h2>
          <p className="text-xs text-gray-500">All permitted POS management and back-office tools</p>
        </div>
        <DashboardCards user={user} />
      </section>
    </div>
  );
}
