import type { Metadata } from 'next'
import { Header, Footer } from '@/components/landing'
import { Code, Lock, Zap, Webhook } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Documentation - ChatArk',
  description: 'Developer documentation for the ChatArk API and embeddable chat widget.',
}

const endpoints = [
  {
    icon: Webhook,
    title: 'Embeddable widget',
    description: 'Drop a chat widget into any website with a single script tag. Configure appearance, collect visitor details, and route conversations to your workspace.',
    status: 'Available',
  },
  {
    icon: Lock,
    title: 'Authentication',
    description: 'Supabase Auth with mandatory TOTP MFA. OAuth, magic links, and password-based flows with AAL2 enforcement on all protected operations.',
    status: 'Available',
  },
  {
    icon: Zap,
    title: 'Real-time',
    description: 'Subscribe to messages, typing indicators, presence, and reactions via Supabase Realtime channels with PostgreSQL change events and broadcast.',
    status: 'Available',
  },
  {
    icon: Code,
    title: 'REST API',
    description: 'Full CRUD access to conversations, messages, profiles, and workspaces via Supabase PostgREST with row-level security.',
    status: 'Coming soon',
  },
]

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
          <p className="text-muted-foreground mb-12">
            Integrate ChatArk into your applications and workflows.
          </p>

          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.title}
                className="group rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-200 hover:border-primary/30 hover:bg-card/60"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <endpoint.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-base font-semibold">{endpoint.title}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          endpoint.status === 'Available'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        }`}
                      >
                        {endpoint.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border/50 bg-card/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Full API reference documentation is coming soon. For widget integration help, contact us at{' '}
              <a href="mailto:developers@chatark.io" className="text-primary hover:underline">
                developers@chatark.io
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
