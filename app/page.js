"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useAuthToken } from "@/lib/useAuthToken"
import DashboardShell from "@/components/dashboard/DashboardShell"
import DashboardOverview from "@/components/dashboard/DashboardOverview"
import { useDashboardData } from "@/hooks/useDashboardData"

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState(null)
  const token = useAuthToken()

  // Use custom hook with parallel requests and race-condition cancellation
  const {
    stats,
    salesChart,
    popularItems,
    recentOrders,
    tableOccupancy,
    lowStockList,
    loading: dataLoading,
    refetch,
  } = useDashboardData(user, token)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!token) return
    let active = true

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok && active) {
          const dataG = await response.json()
          setSettings(dataG)
        }
      } catch (error) {
        console.error("Error fetching settings.general:", error)
      }
    }
    fetchSettings()

    return () => {
      active = false
    }
  }, [token])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardShell user={user} settings={settings} logout={logout}>
      <DashboardOverview
        user={user}
        settings={settings}
        dashboardData={{
          stats,
          salesChart,
          popularItems,
          recentOrders,
          tableOccupancy,
          lowStockList,
        }}
        loading={dataLoading}
        onRefresh={refetch}
      />
    </DashboardShell>
  )
}
