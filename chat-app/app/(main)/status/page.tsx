import type { Metadata } from 'next'
import { Header, Footer } from '@/components/landing'
import { CheckCircle2 } from 'lucide-react'

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

export default function StatusPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">System Status</h1>
          <p className="text-muted-foreground mb-8">
            Current operational status of ChatArk services.
          </p>

          <div className="mb-8 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              All systems operational
            </span>
          </div>

          <div className="space-y-3">
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

          <div className="mt-12 rounded-xl border border-border/50 bg-card/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Experiencing issues? Contact us at{' '}
              <a href="mailto:support@chatark.io" className="text-primary hover:underline">
                support@chatark.io
              </a>. For infrastructure status, see{' '}
              <a
                href="https://status.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Supabase Status
              </a>{' '}
              and{' '}
              <a
                href="https://www.vercel-status.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Vercel Status
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
