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
    description: 'Create your account, set up MFA, and send your first message.',
  },
  {
    icon: Shield,
    title: 'Security & MFA',
    description: 'Multi-factor authentication, session management, and privacy controls.',
  },
  {
    icon: Users,
    title: 'Group conversations',
    description: 'Create groups, manage participants, assign roles, and pin messages.',
  },
  {
    icon: Paperclip,
    title: 'File sharing',
    description: 'Upload images, documents, and media. Supported formats and size limits.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Push notifications, Do Not Disturb schedules, and notification preferences.',
  },
  {
    icon: Smartphone,
    title: 'Multi-platform',
    description: 'Using ChatArk on iOS, iPadOS, macOS, watchOS, and web.',
  },
]

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-muted-foreground mb-12">
            Everything you need to know about using ChatArk.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <div
                key={guide.title}
                className="group rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-200 hover:border-primary/30 hover:bg-card/60"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <guide.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-base font-semibold mb-1">{guide.title}</h2>
                <p className="text-sm text-muted-foreground">{guide.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border/50 bg-card/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Full documentation is coming soon. In the meantime, check out our{' '}
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
