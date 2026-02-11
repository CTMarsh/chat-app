import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Building ChatArk Across Every Apple Platform - ChatArk Blog',
  description:
    'How we built a single SwiftUI codebase that runs on iPhone, iPad, Mac, Apple Watch, and Vision Pro with platform-specific adaptations.',
}

export default function BuildingAcrossPlatformsPost() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to blog
          </Link>

          <article>
            <header className="mb-10">
              <h1 className="text-4xl font-bold mb-3">
                Building ChatArk Across Every Apple Platform
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <time>28 January 2026</time>
                <span aria-hidden="true">&middot;</span>
                <span>4 min read</span>
              </div>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
              <p>
                When we set out to build the native ChatArk clients, we had one goal: a single
                codebase that delivers a first-class experience on every Apple platform. Not a
                compromise that works passably everywhere, but an app that feels genuinely native on
                iPhone, iPad, Mac, Apple Watch, and Vision Pro. Here is how we approached it.
              </p>

              <Section title="One codebase, five platforms">
                <p>
                  The ChatArk Apple client is a single Xcode project that produces targets for iOS,
                  iPadOS, macOS, visionOS, and watchOS. The core architecture &mdash; networking,
                  data models, authentication, and state management &mdash; is shared across all
                  platforms via Swift packages and shared frameworks.
                </p>
                <p>
                  The UI layer is built entirely in SwiftUI, which lets us write views that adapt to
                  the platform they run on. A conversation list, for example, uses a{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NavigationSplitView</code>{' '}
                  on iPad and Mac for a sidebar-detail layout, but collapses to a{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NavigationStack</code>{' '}
                  on iPhone for a push-based flow. The data and logic behind both are identical.
                </p>
                <p>
                  watchOS is the exception. Due to the constrained screen size and interaction model,
                  watchOS has its own dedicated target with a simplified UI. It shares the networking
                  and model layers but has bespoke views designed for quick glances and short replies.
                </p>
              </Section>

              <Section title="Platform-specific adaptations">
                <p>
                  Sharing code does not mean ignoring platform conventions. Each platform gets
                  adaptations that make ChatArk feel at home:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 mt-2">
                  <li>
                    <strong>iPhone</strong> &mdash; compact layout with gesture-based navigation,
                    haptic feedback on message actions, and optimised keyboard handling for rapid
                    messaging.
                  </li>
                  <li>
                    <strong>iPad</strong> &mdash; multi-column layout with a persistent conversation
                    sidebar, drag-and-drop file sharing, and pointer hover effects for trackpad and
                    mouse users.
                  </li>
                  <li>
                    <strong>Mac</strong> &mdash; full keyboard shortcut support, menu bar
                    integration, native window management, and a toolbar that follows macOS Human
                    Interface Guidelines.
                  </li>
                  <li>
                    <strong>Apple Watch</strong> &mdash; simplified message list, quick reply with
                    dictation and scribble, complication for unread count, and haptic alerts for new
                    messages.
                  </li>
                  <li>
                    <strong>Vision Pro</strong> &mdash; spatial layout with depth and volume, gaze-
                    and gesture-based interaction, and immersive notification cards.
                  </li>
                </ul>
                <p>
                  We use conditional compilation and environment checks to swap between these
                  adaptations at build time, keeping the core codebase clean and free of platform
                  clutter.
                </p>
              </Section>

              <Section title="Share extension">
                <p>
                  The ChatArk share extension lets you send content from any app directly into a
                  ChatArk conversation. Select a photo in the Photos app, tap Share, choose ChatArk,
                  pick a conversation, and the file is on its way.
                </p>
                <p>
                  Under the hood, the share extension runs in a separate process with its own memory
                  and lifecycle constraints. It communicates with the main app through an app group
                  container, and all data passing through that container is encrypted with AES-GCM
                  using keys stored in the device keychain. This ensures that shared content is
                  protected even in transit between app components. For more on our encryption
                  approach, see our{' '}
                  <Link href="/blog/security-first-approach" className="text-primary hover:underline">
                    security article
                  </Link>.
                </p>
              </Section>

              <Section title="Widgets and live activities">
                <p>
                  ChatArk includes home screen and lock screen widgets built with WidgetKit. The
                  widgets show your most recent conversations, unread counts, and the status of your
                  contacts, all updated on a smart timeline that balances freshness with battery
                  efficiency.
                </p>
                <p>
                  For active conversations, we use Live Activities to pin a conversation to the
                  Dynamic Island and lock screen. When a friend is typing, when a file is uploading,
                  or when you are in a group discussion, the live activity gives you a persistent,
                  glanceable summary without opening the app. Updates are pushed via Apple Push
                  Notification service (APNs) so they arrive in real time.
                </p>
              </Section>

              <Section title="Push notifications">
                <p>
                  Every ChatArk platform supports push notifications via APNs. The notification
                  payload includes the sender name, conversation title, and a message preview, all
                  delivered through a Notification Service Extension that decrypts and formats the
                  content before display.
                </p>
                <p>
                  Users have granular control over notifications through their{' '}
                  <Link href="/help" className="text-primary hover:underline">
                    notification settings
                  </Link>: per-conversation muting, Do Not Disturb schedules, and the choice between
                  banners, badges, or silent delivery. The watchOS client supports haptic-only alerts
                  for discreet notification in meetings.
                </p>
              </Section>

              <Section title="The multi-platform philosophy">
                <p>
                  Building for five platforms from one codebase is not about saving time. It is about
                  consistency. When we fix a bug in the networking layer, it is fixed everywhere.
                  When we add a feature to the message model, it is available everywhere. When we
                  improve security, every platform benefits immediately.
                </p>
                <p>
                  The alternative &mdash; maintaining five separate codebases &mdash; would mean
                  five times the bugs, five times the security surface, and five different user
                  experiences that slowly drift apart. A shared codebase with targeted adaptations
                  gives us the best of both worlds: native feel with unified reliability.
                </p>
                <p>
                  ChatArk is available now on the web and across Apple platforms. Try it at{' '}
                  <Link href="/" className="text-primary hover:underline">
                    chatark.io
                  </Link>{' '}
                  or read our{' '}
                  <Link href="/docs" className="text-primary hover:underline">
                    documentation
                  </Link>{' '}
                  to get started.
                </p>
              </Section>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
