'use client'

import { MessageSquare, Link2, Keyboard, Eye } from 'lucide-react'
import { SettingSection } from '@/components/settings/setting-section'
import { SettingRow } from '@/components/settings/setting-row'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMessagePreferences } from '@/components/providers/preferences-provider'

export default function MessagesSettingsPage() {
  const {
    enterKeyBehavior,
    linkPreviewsEnabled,
    sendTypingIndicators,
    sendReadReceipts,
    emojiSkinTone,
    setEnterKeyBehavior,
    setLinkPreviewsEnabled,
    setSendTypingIndicators,
    setSendReadReceipts,
    setEmojiSkinTone,
  } = useMessagePreferences()

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages & Chat</h1>
        <p className="mt-2 text-muted-foreground">
          Configure your messaging experience
        </p>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Enter Key Behavior */}
        <SettingSection title="Keyboard" description="Input controls">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Keyboard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Enter Key</p>
              <p className="text-xs text-muted-foreground">What happens when you press Enter</p>
            </div>
          </div>
          <Select
            value={enterKeyBehavior}
            onValueChange={(value) => setEnterKeyBehavior(value as 'send' | 'newline')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="send">Send message</SelectItem>
              <SelectItem value="newline">New line</SelectItem>
            </SelectContent>
          </Select>
        </SettingSection>

        {/* Link Previews */}
        <SettingSection title="Link Previews" description="Show previews for URLs">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Link2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Show Previews</p>
              <p className="text-xs text-muted-foreground">Display rich link cards</p>
            </div>
            <Switch
              checked={linkPreviewsEnabled}
              onCheckedChange={setLinkPreviewsEnabled}
            />
          </div>
        </SettingSection>

        {/* Emoji Skin Tone */}
        <SettingSection title="Emoji" description="Personalize your emoji">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
              👋
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Skin Tone</p>
              <p className="text-xs text-muted-foreground">Default for hand emoji</p>
            </div>
          </div>
          <Select
            value={emojiSkinTone}
            onValueChange={(value) =>
              setEmojiSkinTone(value as 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark')
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default 👋</SelectItem>
              <SelectItem value="light">Light 👋🏻</SelectItem>
              <SelectItem value="medium-light">Medium Light 👋🏼</SelectItem>
              <SelectItem value="medium">Medium 👋🏽</SelectItem>
              <SelectItem value="medium-dark">Medium Dark 👋🏾</SelectItem>
              <SelectItem value="dark">Dark 👋🏿</SelectItem>
            </SelectContent>
          </Select>
        </SettingSection>

        {/* Typing Indicators */}
        <SettingSection title="Typing Indicator" description="Show when you're typing">
          <SettingRow
            label="Send Typing Status"
            description="Let others see when you're composing a message"
          >
            <Switch
              checked={sendTypingIndicators}
              onCheckedChange={setSendTypingIndicators}
            />
          </SettingRow>
        </SettingSection>

        {/* Read Receipts */}
        <SettingSection title="Read Receipts" description="Message read status">
          <SettingRow
            label="Send Read Receipts"
            description="Let others know when you've read their messages"
          >
            <Switch
              checked={sendReadReceipts}
              onCheckedChange={setSendReadReceipts}
            />
          </SettingRow>
        </SettingSection>
      </div>
    </div>
  )
}
