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
    description:
      'Drop a chat widget into any website with a single script tag. Configure appearance, collect visitor details, and route conversations to your workspace.',
    status: 'Available',
  },
  {
    icon: Lock,
    title: 'Authentication',
    description:
      'Supabase Auth with mandatory TOTP MFA. OAuth, magic links, and password-based flows with AAL2 enforcement on all protected operations.',
    status: 'Available',
  },
  {
    icon: Zap,
    title: 'Real-time',
    description:
      'Subscribe to messages, typing indicators, presence, and reactions via Supabase Realtime channels with PostgreSQL change events and broadcast.',
    status: 'Available',
  },
  {
    icon: Code,
    title: 'REST API',
    description:
      'Full CRUD access to conversations, messages, profiles, and workspaces via Supabase PostgREST with row-level security.',
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

          {/* Endpoint overview cards */}
          <div className="space-y-4 mb-16">
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

          {/* Widget integration */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Widget integration</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Add a ChatArk widget to any website with a single script tag. Create a widget in
                your workspace settings, copy the embed code, and paste it into your HTML just
                before the closing <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">&lt;/body&gt;</code> tag.
              </p>
              <pre className="font-mono text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto">
                <code>{`<script
  src="https://your-domain.com/widget/embed.js"
  data-widget-id="YOUR_WIDGET_ID"
></script>`}</code>
              </pre>
              <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                The widget will automatically render a chat launcher in the bottom corner of your
                page. Visitors can start conversations without creating a ChatArk account, and
                messages are routed to your workspace agents in real time.
              </p>
            </div>
          </section>

          {/* Configuration options */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Configuration options</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Customise the widget by passing data attributes on the script tag or by configuring
                them in your workspace dashboard.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 font-medium">Option</th>
                      <th className="text-left py-2 pr-4 font-medium">Type</th>
                      <th className="text-left py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">primaryColor</code></td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Hex colour for the widget header and launcher button. Defaults to ChatArk brand blue.</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">position</code></td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Launcher position: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">bottom-right</code> (default) or <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">bottom-left</code>.</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">welcomeMessage</code></td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Greeting shown when a visitor opens the widget for the first time.</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">offlineMessage</code></td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Message displayed when no agents are available.</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">requireEmail</code></td>
                      <td className="py-2 pr-4">boolean</td>
                      <td className="py-2">Require visitors to provide an email before starting a chat. Defaults to <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">false</code>.</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">collectName</code></td>
                      <td className="py-2 pr-4">boolean</td>
                      <td className="py-2">Prompt visitors for their name before starting a chat. Defaults to <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">false</code>.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">allowedOrigins</code></td>
                      <td className="py-2 pr-4">string[]</td>
                      <td className="py-2">Array of domains permitted to embed the widget. Requests from unlisted origins are rejected.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Authentication flow */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Authentication flow</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                ChatArk uses Supabase Auth with mandatory TOTP multi-factor authentication.
                Every authenticated session must reach Authenticator Assurance Level 2 (AAL2)
                before accessing protected resources.
              </p>
              <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed mb-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                  <span><strong className="text-foreground">Sign up</strong> &mdash; User creates an account with email and password via <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">supabase.auth.signUp()</code>. Session starts at AAL1.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                  <span><strong className="text-foreground">Enrol TOTP</strong> &mdash; User is redirected to <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/mfa/setup</code> where they scan a QR code with their authenticator app and verify with a one-time code.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                  <span><strong className="text-foreground">Verify each session</strong> &mdash; On subsequent logins, after entering their password, users are prompted at <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/mfa/verify</code> to enter a TOTP code. Successful verification elevates the session to AAL2.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">4</span>
                  <span><strong className="text-foreground">Access granted</strong> &mdash; All protected server actions and RLS policies check <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">aalData.currentLevel === &apos;aal2&apos;</code> before proceeding. Requests at AAL1 are rejected.</span>
                </li>
              </ol>
              <pre className="font-mono text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto">
                <code>{`// Check MFA status in a server action
const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

if (aalData?.currentLevel !== 'aal2') {
  return { error: 'MFA verification required' }
}`}</code>
              </pre>
            </div>
          </section>

          {/* Real-time subscriptions */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Real-time subscriptions</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                ChatArk uses Supabase Realtime for live message delivery, typing indicators, and
                presence. There are two primary subscription patterns.
              </p>

              <h3 className="text-sm font-semibold mb-2">PostgreSQL changes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Subscribe to database changes on the <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">messages</code> table
                to receive new messages in real time. Row-level security policies ensure you only
                receive events for conversations you belong to.
              </p>
              <pre className="font-mono text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto mb-4">
                <code>{`const channel = supabase.channel('room:123')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: 'conversation_id=eq.123',
    },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()`}</code>
              </pre>

              <h3 className="text-sm font-semibold mb-2">Broadcast channels</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Use broadcast channels for ephemeral state like typing indicators. These events are
                not persisted in the database and are delivered only to currently connected clients.
              </p>
              <pre className="font-mono text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto">
                <code>{`const typingChannel = supabase.channel('typing:123')

// Send a typing indicator
typingChannel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { user_id: currentUser.id, is_typing: true },
})

// Listen for typing indicators
typingChannel
  .on('broadcast', { event: 'typing' }, (payload) => {
    console.log('User typing:', payload.payload.user_id)
  })
  .subscribe()`}</code>
              </pre>
            </div>
          </section>

          {/* Rate limits */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Rate limits</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                ChatArk applies rate limits to protect the platform and ensure fair usage for all
                users. Limits are enforced per authenticated user.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 font-medium">Endpoint</th>
                      <th className="text-left py-2 pr-4 font-medium">Limit</th>
                      <th className="text-left py-2 font-medium">Window</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4">Send message</td>
                      <td className="py-2 pr-4">60 requests</td>
                      <td className="py-2">per minute</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4">File upload</td>
                      <td className="py-2 pr-4">20 requests</td>
                      <td className="py-2">per minute</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4">Authentication</td>
                      <td className="py-2 pr-4">10 requests</td>
                      <td className="py-2">per minute</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4">Profile updates</td>
                      <td className="py-2 pr-4">30 requests</td>
                      <td className="py-2">per minute</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Widget API</td>
                      <td className="py-2 pr-4">120 requests</td>
                      <td className="py-2">per minute per widget</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                Exceeding a rate limit returns a <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">429 Too Many Requests</code> response
                with a <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Retry-After</code> header indicating how many seconds to
                wait before retrying.
              </p>
            </div>
          </section>

          {/* Contact */}
          <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Full REST API reference documentation is coming soon. For widget integration help
              or API questions, contact us at{' '}
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
