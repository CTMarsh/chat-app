import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import {
  MessageSquare,
  Shield,
  Users,
  Paperclip,
  Bell,
  Smartphone,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation - ChatArk',
  description: 'Learn how to use ChatArk — guides for messaging, security, teams, and more.',
}

const guides = [
  {
    icon: MessageSquare,
    title: 'Getting started',
    href: '/docs/getting-started',
    description: 'Create your account, set up MFA, and send your first message.',
  },
  {
    icon: Shield,
    title: 'Security & MFA',
    href: '/docs/security',
    description: 'Multi-factor authentication, session management, and privacy controls.',
  },
  {
    icon: Users,
    title: 'Group conversations',
    href: '/docs/group-conversations',
    description: 'Create groups, manage participants, assign roles, and pin messages.',
  },
  {
    icon: Paperclip,
    title: 'File sharing',
    href: '/docs/file-sharing',
    description: 'Upload images, documents, and media. Supported formats and size limits.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    href: '/docs/notifications',
    description: 'Push notifications, Do Not Disturb schedules, and notification preferences.',
  },
  {
    icon: Smartphone,
    title: 'Multi-platform',
    href: '/docs/multi-platform',
    description: 'Using ChatArk on iOS, iPadOS, macOS, watchOS, and web.',
  },
]

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">Documentation</span>
          </nav>

          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-muted-foreground mb-12">
            Everything you need to know about using ChatArk.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="group rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-200 hover:border-primary/30 hover:bg-card/60"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <guide.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-base font-semibold mb-1">{guide.title}</h2>
                <p className="text-sm text-muted-foreground">{guide.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border/50 bg-card/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need more help? Visit our{' '}
              <Link href="/help" className="text-primary hover:underline">
                Help Centre
              </Link>{' '}
              for common questions or contact us at{' '}
              <a href="mailto:support@chatark.io" className="text-primary hover:underline">
                support@chatark.io
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
