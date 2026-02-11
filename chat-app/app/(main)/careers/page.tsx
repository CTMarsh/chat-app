import type { Metadata } from 'next'
import { Header, Footer } from '@/components/landing'
import {
  Shield,
  Heart,
  Code,
  Lightbulb,
  GraduationCap,
  MapPin,
  Clock,
  Laptop,
  BookOpen,
  Users,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers - ChatArk',
  description: 'Join the ChatArk team and help build the future of secure messaging.',
}

const values = [
  {
    icon: Shield,
    title: 'Security first',
    description:
      'Security is never an afterthought. We build with mandatory MFA, row-level security, virus scanning, and encryption baked into every layer of the stack.',
  },
  {
    icon: Heart,
    title: 'User privacy',
    description:
      'We believe messaging is inherently private. We collect the minimum data necessary, give users full control over their visibility, and comply with UK GDPR by default.',
  },
  {
    icon: Code,
    title: 'Craftsmanship',
    description:
      'We care about the details. Clean TypeScript, thoughtful APIs, accessible interfaces, and code that is a pleasure to read and maintain.',
  },
  {
    icon: Lightbulb,
    title: 'Open communication',
    description:
      'We practise what we build. Decisions are documented, feedback is direct and respectful, and everyone has a voice regardless of title.',
  },
  {
    icon: GraduationCap,
    title: 'Continuous learning',
    description:
      'Technology moves fast and we move with it. We invest in learning, experiment with new tools, and share knowledge across the team.',
  },
]

const qualities = [
  'A genuine passion for security and privacy in consumer software',
  'Attention to detail in both code quality and user experience',
  'Experience with TypeScript, React, or Swift for native platforms',
  'Understanding of real-time systems, WebSockets, and event-driven architectures',
  'Comfort working with PostgreSQL, row-level security, and Supabase',
  'An ability to communicate clearly and work asynchronously across time zones',
]

const perks = [
  {
    icon: MapPin,
    title: 'Remote-friendly',
    description:
      'Work from anywhere in the UK or Europe. We gather in Oxford for occasional team days but day-to-day work is fully remote.',
  },
  {
    icon: Clock,
    title: 'Flexible hours',
    description:
      'We care about output, not hours logged. Structure your day around your life, not the other way round.',
  },
  {
    icon: BookOpen,
    title: 'Learning budget',
    description:
      'Annual budget for conferences, courses, books, and certifications. If it makes you better at your craft, we will fund it.',
  },
  {
    icon: Laptop,
    title: 'Latest hardware',
    description:
      'Apple Silicon MacBook Pro, 4K display, and any peripherals you need. We refresh hardware on a two-year cycle.',
  },
]

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Careers</h1>
          <p className="text-muted-foreground mb-12">
            Join our team and help build the future of secure messaging.
          </p>

          {/* About ChatArk */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">About ChatArk</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                ChatArk is a real-time messaging platform built for people who take security
                seriously. We combine mandatory multi-factor authentication, ClamAV virus scanning,
                and fine-grained privacy controls with a clean, modern interface that works across
                web, iOS, iPadOS, macOS, and watchOS.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We are a small, focused team based in Oxford, United Kingdom. We ship on
                Next.js, Supabase, Swift, and Tailwind CSS. Every member of the team has a direct
                impact on the product and the people who rely on it every day.
              </p>
            </div>
          </section>

          {/* Our values */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Our values</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-200 hover:border-primary/30 hover:bg-card/60"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <value.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* What we look for */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">What we look for</h2>
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                We do not hire for specific roles on a fixed schedule. When we grow, we look for
                people who share our values and bring complementary skills. Here are the qualities
                we value most:
              </p>
              <ul className="space-y-3">
                {qualities.map((quality) => (
                  <li
                    key={quality}
                    className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {quality}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Perks */}
          <section className="mb-14">
            <h2 className="text-xl font-semibold mb-4">Perks</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  className="rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-200 hover:border-primary/30 hover:bg-card/60"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <perk.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Get in touch */}
          <section>
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/30 py-14 text-center px-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No open positions right now</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                We don&apos;t have any openings at the moment, but we&apos;re always interested in
                hearing from talented people who share our values. If you think you&apos;d be a
                great fit, introduce yourself at{' '}
                <a
                  href="mailto:careers@chatark.io"
                  className="text-primary hover:underline"
                >
                  careers@chatark.io
                </a>{' '}
                and tell us what excites you about secure messaging.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
