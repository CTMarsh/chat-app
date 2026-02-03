'use client'

import { useState, useEffect } from 'react'
import { Loader2, X, UserX, Eye, EyeOff, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SettingSection } from '@/components/settings/setting-section'
import { SettingRow } from '@/components/settings/setting-row'
import { Switch } from '@/components/ui/switch'
import { usePrivacyPreferences } from '@/components/providers/preferences-provider'
import { getBlockedUsers, unblockUser } from '@/lib/actions/settings'
import type { BlockedUserWithProfile } from '@/lib/types/database'

export default function PrivacySettingsPage() {
  const {
    showOnlineStatus,
    showReadReceipts,
    showTypingIndicator,
    setShowOnlineStatus,
    setShowReadReceipts,
    setShowTypingIndicator,
  } = usePrivacyPreferences()

  const [blockedUsers, setBlockedUsers] = useState<BlockedUserWithProfile[]>([])
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      const { data, error } = await getBlockedUsers()
      if (!error) {
        setBlockedUsers(data)
      }
      setIsLoadingBlocked(false)
    }

    fetchBlockedUsers()
  }, [])

  const handleUnblock = async (blockedUserId: string) => {
    setUnblockingId(blockedUserId)
    const { error } = await unblockUser(blockedUserId)
    if (!error) {
      setBlockedUsers((prev) =>
        prev.filter((u) => u.blocked_user_id !== blockedUserId)
      )
    }
    setUnblockingId(null)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-2 text-muted-foreground">
          Control what others can see about you
        </p>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Online Status */}
        <SettingSection title="Online Status" description="Your presence visibility">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Show Status</p>
              <p className="text-xs text-muted-foreground">Let others see when you're online</p>
            </div>
            <Switch
              checked={showOnlineStatus}
              onCheckedChange={setShowOnlineStatus}
            />
          </div>
        </SettingSection>

        {/* Read Receipts */}
        <SettingSection title="Read Receipts" description="Message read status">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <EyeOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Show Receipts</p>
              <p className="text-xs text-muted-foreground">Let others see when you've read</p>
            </div>
            <Switch
              checked={showReadReceipts}
              onCheckedChange={setShowReadReceipts}
            />
          </div>
        </SettingSection>

        {/* Typing Indicator */}
        <SettingSection title="Typing Indicator" description="Composing visibility">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Show Typing</p>
              <p className="text-xs text-muted-foreground">Let others see when you're typing</p>
            </div>
            <Switch
              checked={showTypingIndicator}
              onCheckedChange={setShowTypingIndicator}
            />
          </div>
        </SettingSection>

        {/* Blocked Users - spans full width on lg */}
        <SettingSection
          title="Blocked Users"
          description="Users you've blocked can't message you"
          className="lg:col-span-3"
        >
          {isLoadingBlocked ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UserX className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                You haven't blocked anyone
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {blockedUsers.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={blocked.blocked_profile?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(
                          blocked.blocked_profile?.display_name ||
                            blocked.blocked_profile?.username
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {blocked.blocked_profile?.display_name ||
                          blocked.blocked_profile?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{blocked.blocked_profile?.username}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(blocked.blocked_user_id)}
                    disabled={unblockingId === blocked.blocked_user_id}
                  >
                    {unblockingId === blocked.blocked_user_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-1 h-4 w-4" />
                        Unblock
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SettingSection>
      </div>
    </div>
  )
}
