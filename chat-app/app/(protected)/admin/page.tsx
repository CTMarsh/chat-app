'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Building2,
  MessageSquare,
  Mail,
  Code,
  Activity,
  MessagesSquare,
  Send,
} from 'lucide-react'
import { StatCard } from '@/components/admin/stat-card'
import { getAdminDashboardMetrics } from '@/lib/actions/admin'

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<{
    total_users: number
    total_workspaces: number
    total_conversations: number
    total_messages: number
    total_widgets: number
    active_today: number
    conversations_today: number
    messages_today: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await getAdminDashboardMetrics()
      if (data) setMetrics(data)
      if (error) setError(error)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Platform overview and key metrics.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={metrics?.total_users ?? 0}
          icon={Users}
          description="Registered accounts"
        />
        <StatCard
          title="Active Today"
          value={metrics?.active_today ?? 0}
          icon={Activity}
          description="Users seen in last 24h"
        />
        <StatCard
          title="Workspaces"
          value={metrics?.total_workspaces ?? 0}
          icon={Building2}
        />
        <StatCard
          title="Widgets"
          value={metrics?.total_widgets ?? 0}
          icon={Code}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Conversations"
          value={metrics?.total_conversations ?? 0}
          icon={MessageSquare}
        />
        <StatCard
          title="Conversations Today"
          value={metrics?.conversations_today ?? 0}
          icon={MessagesSquare}
          description="Started in last 24h"
        />
        <StatCard
          title="Total Messages"
          value={metrics?.total_messages ?? 0}
          icon={Mail}
        />
        <StatCard
          title="Messages Today"
          value={metrics?.messages_today ?? 0}
          icon={Send}
          description="Sent in last 24h"
        />
      </div>
    </div>
  )
}
