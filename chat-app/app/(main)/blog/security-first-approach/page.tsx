import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Security-First Approach to Messaging - ChatArk Blog',
  description:
    'A deep dive into the security architecture behind ChatArk: mandatory MFA, row-level security, virus scanning, encryption, and more.',
}

export default function SecurityFirstApproachPost() {
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
                Our Security-First Approach to Messaging
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <time>4 February 2026</time>
                <span aria-hidden="true">&middot;</span>
                <span>4 min read</span>
              </div>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
              <p>
                Security in messaging is not a feature you toggle on. It is an architectural
                decision that shapes everything from database design to error handling. At ChatArk,
                every layer of the stack is built to protect your data, and we want to show you
                exactly how. For the full picture of what data we collect and why, see our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  privacy notice
                </Link>.
              </p>

              <Section title="Mandatory multi-factor authentication">
                <p>
                  Most platforms offer MFA as an optional extra. ChatArk requires it. When you
                  create an account, you must enrol a TOTP authenticator before you can access any
                  conversations. There is no grace period, no &ldquo;remind me later&rdquo; button,
                  and no way to disable it once enrolled.
                </p>
                <p>
                  Our authentication flow enforces this at the middleware level. Every protected
                  route checks the Authenticator Assurance Level (AAL) of the current session. If
                  the session is not at AAL2 &mdash; meaning the user has not verified their second
                  factor &mdash; the request is redirected to the MFA verification page. This check
                  happens server-side, so it cannot be bypassed by client-side manipulation.
                </p>
                <p>
                  Server actions that perform sensitive operations include an additional AAL2 check.
                  Even if a session token is compromised, an attacker cannot send messages, modify
                  profiles, or access conversations without passing the MFA verification step.
                </p>
              </Section>

              <Section title="Row-level security">
                <p>
                  ChatArk uses Supabase with PostgreSQL row-level security (RLS) enabled on every
                  table in the database. RLS policies define which rows a given user can read, insert,
                  update, or delete, and these rules are enforced by the database engine itself, not
                  by application code.
                </p>
                <p>
                  For example, a user can only read messages in conversations they participate in.
                  This is enforced by a helper function,{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    is_conversation_participant()
                  </code>, which checks the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    conversation_participants
                  </code>{' '}
                  table at query time. Even if an attacker crafts a direct API request with a valid
                  session, the database will return only the rows that the security policies permit.
                </p>
                <p>
                  This defence-in-depth approach means that a bug in application code cannot
                  accidentally expose data from another user&apos;s conversations. The database
                  itself is the last line of defence.
                </p>
              </Section>

              <Section title="Error sanitisation">
                <p>
                  Detailed error messages are a gift to attackers. They reveal stack traces, database
                  table names, query structures, and internal logic. ChatArk sanitises all errors
                  before they reach the client.
                </p>
                <p>
                  Server actions catch errors, log the full details to internal monitoring, and
                  return a generic, safe message to the frontend. The client never sees a raw
                  database error or a stack trace. This prevents information leakage that could be
                  used to map the internal architecture of the system.
                </p>
              </Section>

              <Section title="Rate limiting and input sanitisation">
                <p>
                  Every public-facing endpoint is rate-limited. Authentication attempts, message
                  sending, file uploads, and API calls all have configurable thresholds that prevent
                  brute-force attacks and abuse. When a threshold is exceeded, the user receives a
                  clear but non-specific error, and the attempt is logged for review.
                </p>
                <p>
                  All user input is sanitised before it reaches the database. Message content,
                  display names, usernames, and file metadata are validated for type, length, and
                  content. This prevents SQL injection, cross-site scripting (XSS), and other
                  injection attacks at the application boundary.
                </p>
              </Section>

              <Section title="ClamAV virus scanning">
                <p>
                  File sharing is one of the most common vectors for malware distribution. ChatArk
                  scans every uploaded file with ClamAV before it is stored or delivered to
                  recipients. The scan runs via a Supabase Edge Function that sends the file to a
                  ClamAV REST API.
                </p>
                <p>
                  If a file is flagged as malicious, the upload is rejected and the user is
                  notified. The file never reaches storage, and it is never visible to other
                  participants in the conversation. This protects users even if they are sharing
                  files from untrusted sources.
                </p>
              </Section>

              <Section title="AES-GCM encryption for app extensions">
                <p>
                  ChatArk&apos;s native clients use app extensions for features like the share
                  extension and widgets. Data shared between the main app and its extensions passes
                  through a shared app group container, which is encrypted using AES-GCM with
                  256-bit keys stored in the device keychain.
                </p>
                <p>
                  This ensures that even if another process on the device could read the shared
                  container, the data would be unintelligible without the encryption key. The key
                  never leaves the secure enclave of the device.
                </p>
              </Section>

              <Section title="The security mindset">
                <p>
                  Security is not a checklist. It is a mindset that influences every decision, from
                  choosing libraries to writing error messages. At ChatArk, we assume that every
                  input is hostile, every network is compromised, and every client is untrusted. We
                  then build the safeguards to make that assumption irrelevant.
                </p>
                <p>
                  If you want to know more about how we handle your data specifically, read our{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    privacy notice
                  </Link>. If you have a security concern to report, contact us at{' '}
                  <a href="mailto:security@chatark.io" className="text-primary hover:underline">
                    security@chatark.io
                  </a>. We take every report seriously.
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
