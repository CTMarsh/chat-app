'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useNotificationPreferences } from '@/components/providers/preferences-provider'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}

// Check if current time is within DND schedule
function isWithinDND(dndEnabled: boolean, dndStartTime: string | null, dndEndTime: string | null): boolean {
  if (!dndEnabled || !dndStartTime || !dndEndTime) {
    return false
  }

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  // Parse HH:MM time strings
  const [startHours, startMinutes] = dndStartTime.split(':').map(Number)
  const [endHours, endMinutes] = dndEndTime.split(':').map(Number)

  const startTimeMinutes = startHours * 60 + startMinutes
  const endTimeMinutes = endHours * 60 + endMinutes

  // Handle overnight DND (e.g., 22:00 to 07:00)
  if (startTimeMinutes > endTimeMinutes) {
    return currentTime >= startTimeMinutes || currentTime < endTimeMinutes
  }

  return currentTime >= startTimeMinutes && currentTime < endTimeMinutes
}

export function useNotifications() {
  const {
    desktopNotifications,
    soundNotifications,
    dndEnabled,
    dndStartTime,
    dndEndTime,
  } = useNotificationPreferences()

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.wav')
      audioRef.current.volume = 0.5
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }, [])

  // Check if notifications should be sent
  const shouldNotify = useCallback(() => {
    // Check DND schedule
    if (isWithinDND(dndEnabled, dndStartTime, dndEndTime)) {
      return false
    }
    return true
  }, [dndEnabled, dndStartTime, dndEndTime])

  // Send desktop notification
  const sendDesktopNotification = useCallback(async (options: NotificationOptions) => {
    if (!desktopNotifications || !shouldNotify()) {
      return null
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null
    }

    const hasPermission = await requestPermission()
    if (!hasPermission) {
      return null
    }

    // Don't notify if tab is focused
    if (document.hasFocus()) {
      return null
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      tag: options.tag,
      silent: true, // We handle sound separately
    })

    if (options.onClick) {
      notification.onclick = () => {
        window.focus()
        options.onClick?.()
        notification.close()
      }
    }

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000)

    return notification
  }, [desktopNotifications, shouldNotify, requestPermission])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundNotifications || !shouldNotify()) {
      return
    }

    // Don't play sound if tab is focused
    if (document.hasFocus()) {
      return
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Autoplay might be blocked, ignore error
      })
    }
  }, [soundNotifications, shouldNotify])

  // Send both notification and sound
  const notify = useCallback(async (options: NotificationOptions) => {
    await sendDesktopNotification(options)
    playNotificationSound()
  }, [sendDesktopNotification, playNotificationSound])

  return {
    notify,
    sendDesktopNotification,
    playNotificationSound,
    requestPermission,
    shouldNotify,
    hasPermission: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
  }
}
