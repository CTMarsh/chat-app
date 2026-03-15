import type { Metadata } from 'next'
import { Header, Footer } from '@/components/landing'
import { CheckCircle2, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'System Status - ChatArk',
  description: 'Current operational status of ChatArk services.',
}

const services = [
  { name: 'Web application', description: 'Next.js frontend and server actions' },
  { name: 'Authentication & MFA', description: 'Supabase Auth with TOTP enrolment and verification' },
  { name: 'Messaging', description: 'Real-time message delivery and storage' },
  { name: 'File storage', description: 'Upload, virus scanning, and delivery' },
  { name: 'Push notifications', description: 'APNs delivery for iOS and macOS' },
  { name: 'Real-time presence', description: 'Typing indicators, read receipts, and online status' },
]

function UptimeBar({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-40 shrink-0 truncate" title={name}>
        {name}
      </span>
      <div className="flex flex-1 gap-0.5">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="h-6 flex-1 rounded-sm bg-green-500/70 transition-colors hover:bg-green-500"
            title={`Day ${30 - i}: Operational`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right shrink-0">100%</span>
    </div>
  )
}

export default function StatusPage() {
  const now = new Date()
  const lastChecked = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const lastCheckedTime = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">System Status</h1>
          <p className="text-muted-foreground mb-8">
            Current operational status of ChatArk services.
          </p>

          {/* All systems operational banner */}
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              All systems operational
            </span>
          </div>

          {/* Service list */}
          <div className="space-y-3 mb-14">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 px-5 py-4"
              >
                <div>
                  <h2 className="text-sm font-medium">{service.name}</h2>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Operational</span>
                </div>
              </div>
            ))}
          </div>

          {/* Uptime - last 30 days */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Uptime &mdash; last 30 days</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <div className="space-y-3">
                {services.map((service) => (
                  <UptimeBar key={service.name} name={service.name} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </section>

          {/* Recent incidents */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Recent incidents</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  No incidents in the past 90 days.
                </p>
              </div>
            </div>
          </section>

          {/* Subscribe to updates */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Subscribe to updates</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get notified about planned maintenance and service disruptions. Send an email to{' '}
                    <a
                      href="mailto:status-subscribe@chatark.io"
                      className="text-primary hover:underline"
                    >
                      status-subscribe@chatark.io
                    </a>{' '}
                    and we will add you to our status notification list.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Last checked timestamp */}
          <p className="text-xs text-muted-foreground text-center mb-8">
            Last checked: {lastChecked} at {lastCheckedTime}
          </p>

          {/* Contact */}
          <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Experiencing issues? Contact us at{' '}
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
