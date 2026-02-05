'use client'

import { useState } from 'react'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Messages',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message (when Enter to Send is enabled)' },
      { keys: ['Shift', 'Enter'], description: 'New line (when Enter to Send is enabled)' },
      { keys: ['Ctrl', 'Enter'], description: 'Send message (when Enter for New Line is enabled)' },
      { keys: ['@'], description: 'Open mention picker in group chats' },
    ],
  },
  {
    title: 'Mention Picker',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate suggestions' },
      { keys: ['Enter'], description: 'Select suggestion' },
      { keys: ['Tab'], description: 'Select suggestion' },
      { keys: ['Escape'], description: 'Close picker' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['Escape'], description: 'Close dialogs and modals' },
      { keys: ['Tab'], description: 'Navigate between elements' },
      { keys: ['Shift', 'Tab'], description: 'Navigate backwards' },
      { keys: ['Space'], description: 'Activate buttons and toggles' },
    ],
  },
]

function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          {keyIndex > 0 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                          <KeyboardKey>{key}</KeyboardKey>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Tip: You can change the Enter key behavior in Settings → Messages.
        </p>
      </DialogContent>
    </Dialog>
  )
}
