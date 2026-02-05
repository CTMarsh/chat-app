'use client'

import { useEffect, useState } from 'react'

interface LiveRegionProps {
  /** The message to announce to screen readers */
  message: string
  /** The politeness level of the announcement */
  mode?: 'polite' | 'assertive'
  /** Whether to clear the message after announcement */
  clearAfter?: number
}

/**
 * A reusable live region component for screen reader announcements.
 * Use 'polite' for non-urgent updates, 'assertive' for critical alerts.
 */
export function LiveRegion({
  message,
  mode = 'polite',
  clearAfter = 0
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message)

  useEffect(() => {
    setCurrentMessage(message)

    if (clearAfter > 0 && message) {
      const timer = setTimeout(() => {
        setCurrentMessage('')
      }, clearAfter)
      return () => clearTimeout(timer)
    }
  }, [message, clearAfter])

  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  )
}

interface AnnouncerProps {
  /** List of announcements to cycle through */
  announcements: string[]
}

/**
 * A live region that announces each new item in the announcements array.
 * Useful for new messages, typing indicators, etc.
 */
export function Announcer({ announcements }: AnnouncerProps) {
  const [lastAnnouncement, setLastAnnouncement] = useState('')

  useEffect(() => {
    const latest = announcements[announcements.length - 1]
    if (latest && latest !== lastAnnouncement) {
      setLastAnnouncement(latest)
    }
  }, [announcements, lastAnnouncement])

  return (
    <div
      role="log"
      aria-live="polite"
      aria-atomic="false"
      className="sr-only"
    >
      {lastAnnouncement}
    </div>
  )
}
