import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Notifications - ChatArk Documentation',
  description: 'Configure push notifications, Do Not Disturb schedules, desktop alerts, and in-app notification preferences.',
}

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">Notifications</span>
          </nav>

          <h1 className="text-4xl font-bold mb-8">Notifications</h1>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold mb-3">Push Notifications on iOS and macOS</h2>
              <p className="mb-3">
                ChatArk supports native push notifications on iOS, iPadOS, and macOS through Apple Push Notification service (APNs). When you first launch the native app, you will be prompted to allow notifications. We recommend allowing them so you never miss an important message.
              </p>
              <p>
                Push notifications are delivered even when the app is closed or running in the background. Each notification shows the sender name, a preview of the message content, and the conversation it belongs to. Tapping a notification opens the app directly to the relevant conversation. On iOS, notifications are grouped by conversation to keep your notification centre organised.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Notification Preferences</h2>
              <p className="mb-3">
                You can fine-tune your notification behaviour from Settings, then Notifications. The main toggle allows you to enable or disable push notifications entirely. Below that, you can control whether notification sounds play when a new message arrives. Sound preferences apply to both push notifications and in-app alerts.
              </p>
              <p>
                These preferences sync across your devices. If you disable sounds on the web, the same preference applies on your iPhone and Mac. This consistency ensures you have a uniform experience regardless of which platform you are using at any given time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Do Not Disturb Schedule</h2>
              <p className="mb-3">
                The Do Not Disturb (DND) feature lets you set a recurring quiet period during which notifications are silenced. Navigate to Settings, then Notifications, and look for the Do Not Disturb section. Set a start time and an end time to define your quiet window. For example, you might set DND from 22:00 to 07:00 to avoid overnight notifications.
              </p>
              <p>
                During DND hours, notifications are still received and stored -- they simply do not trigger sounds, banners, or badge updates. When the DND window ends, any unread messages will be visible in the app and your unread count will update. This way you stay informed without being interrupted during rest or focus periods.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Desktop Notifications on Web</h2>
              <p className="mb-3">
                The ChatArk web application supports browser-native desktop notifications. When you first visit the app, your browser will ask whether you want to allow notifications from ChatArk. Click &quot;Allow&quot; to enable them.
              </p>
              <p>
                Desktop notifications appear as system-level banners on Windows, macOS, and Linux. They include the sender name and a snippet of the message. Clicking the notification focuses the ChatArk browser tab and scrolls to the relevant conversation. If you later want to revoke notification permissions, you can do so through your browser&apos;s site settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">In-App Notification Centre</h2>
              <p>
                ChatArk includes a built-in notification centre accessible from the bell icon in the app header. The notification centre collects all your recent notifications in one place, including new messages, mentions, group invitations, and system alerts. Each notification entry shows a timestamp and a brief summary. Clicking a notification navigates you to the relevant conversation or settings page. Notifications can be marked as read individually or all at once using the &quot;Mark all read&quot; button at the top of the panel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Inline Reply from Notifications</h2>
              <p>
                On iOS and macOS, you can reply to messages directly from the notification banner without opening the app. When a push notification arrives, expand it (pull down on iOS or click the expand arrow on macOS) to reveal a text input field. Type your reply and press send. The message is delivered to the conversation immediately, and the notification is dismissed. This is especially useful for quick responses when you are focused on another task and do not want to switch apps. Inline reply supports text-only messages -- for file attachments or mentions, open the full app.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border/50">
            <Link href="/docs" className="text-sm text-primary hover:underline">
              Back to Documentation
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
