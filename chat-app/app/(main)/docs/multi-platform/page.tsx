import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Multi-Platform - ChatArk Documentation',
  description: 'Use ChatArk across web, iOS, iPadOS, macOS, watchOS, and visionOS with seamless data sync.',
}

export default function MultiPlatformPage() {
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
            <span className="text-foreground font-medium">Multi-Platform</span>
          </nav>

          <h1 className="text-4xl font-bold mb-8">Multi-Platform</h1>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold mb-3">Web</h2>
              <p>
                The ChatArk web application is built with Next.js and works in all modern browsers including Chrome, Firefox, Safari, and Edge. The web version offers the complete ChatArk feature set: direct messages, group conversations, file sharing, notifications, and full settings management. The responsive layout adapts to any screen size, from widescreen monitors to tablet-sized browser windows. No installation is required -- simply navigate to the ChatArk URL and sign in.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">iOS and iPadOS</h2>
              <p className="mb-3">
                The native iOS app is built with SwiftUI and designed specifically for iPhone and iPad. On iPhone, the app follows a familiar navigation pattern with the conversation list on the main screen and a full-screen chat view when you tap into a conversation. The app takes full advantage of iOS features including haptic feedback, dynamic type for accessibility, and native share sheets.
              </p>
              <p>
                On iPad, the app uses a split-view layout so you can see your conversation list alongside the active chat. iPadOS keyboard shortcuts are supported for power users, including shortcuts for composing new messages, navigating between conversations, and searching. The iPad version also supports multitasking with Slide Over and Split View alongside other apps.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">macOS</h2>
              <p>
                ChatArk for macOS is a native application that integrates deeply with the desktop environment. The app includes a menu bar extra that shows your unread message count at a glance without opening the full window. A dedicated preferences window provides access to all settings with a native macOS look and feel. The app supports macOS notification centre, keyboard navigation throughout the interface, and native drag-and-drop for file sharing. You can resize the window freely, and the conversation layout adjusts dynamically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">watchOS</h2>
              <p>
                The ChatArk companion app for Apple Watch lets you stay connected from your wrist. The watch app displays your most recent conversations with unread counts and message previews. You can read messages directly on the watch and send quick replies using dictation, the Scribble input, or pre-set responses. Watch complications are available for several watch face styles, showing your total unread count at a glance so you can decide whether to check your phone or Mac.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">visionOS</h2>
              <p>
                ChatArk supports Apple Vision Pro through a visionOS-compatible build. The spatial computing interface presents conversations in a comfortable window that you can position and resize in your environment. The app leverages the platform&apos;s eye tracking and hand gesture input for a natural interaction model. Chat windows can coexist alongside other visionOS apps in your workspace, making it easy to message colleagues while working with other tools.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Share Extension and Widgets</h2>
              <p className="mb-3">
                On iOS, the ChatArk share extension lets you send content from other apps directly into a ChatArk conversation. When you encounter a link, photo, or document in Safari, Photos, or any other app that supports the system share sheet, select ChatArk from the share menu, choose a conversation, and send. The content is delivered as a message attachment with no need to switch apps.
              </p>
              <p>
                Home screen widgets are available in small, medium, and large sizes. Widgets display your most recent unread messages and conversations, updating in real time. Tapping a widget entry opens the app directly to that conversation. Live Activities on iOS show ongoing conversation activity on your lock screen and Dynamic Island, so you can follow an active group discussion without repeatedly unlocking your phone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Sync Across Platforms</h2>
              <p>
                All your ChatArk data is synchronised in real time across every platform through the Supabase backend. Messages sent from your iPhone appear instantly on your Mac and in the web app. Read status, notification preferences, online status, and profile changes propagate across all devices within seconds. There is no manual sync step -- simply sign into your account on any supported platform and your conversations, settings, and message history are immediately available. If you sign out on one device, your sessions on other devices remain active until you explicitly revoke them from the security settings.
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
