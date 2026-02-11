import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Welcome to ChatArk: Secure Messaging for Everyone - ChatArk Blog',
  description:
    'Introducing ChatArk, a messaging platform built from the ground up with privacy and security at its core.',
}

export default function WelcomeToChatArkPost() {
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
                Welcome to ChatArk: Secure Messaging for Everyone
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <time>11 February 2026</time>
                <span aria-hidden="true">&middot;</span>
                <span>4 min read</span>
              </div>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
              <Section title="Why we built ChatArk">
                <p>
                  Most messaging platforms treat security as an afterthought. They bolt it on once
                  the product is already built, resulting in privacy features that feel like an
                  inconvenience rather than a foundation. We wanted to take a different approach.
                </p>
                <p>
                  ChatArk was built from the first line of code with one guiding principle: your
                  conversations are yours. Every architectural decision, every feature, and every
                  line of policy exists to protect the privacy and integrity of the people using the
                  platform. Security is not a premium tier. It is the baseline.
                </p>
                <p>
                  We believe that private communication is a fundamental right, not a luxury feature.
                  Whether you are messaging a friend, coordinating with a team, or sharing sensitive
                  files, you should never have to wonder whether your data is safe.
                </p>
              </Section>

              <Section title="What ChatArk offers">
                <p>
                  At its core, ChatArk is a real-time messaging platform that supports direct
                  messages and group conversations. But beyond the basics, every feature is designed
                  with security woven in.
                </p>
                <ul className="list-disc pl-6 space-y-1.5 mt-2">
                  <li>
                    <strong>Mandatory multi-factor authentication</strong> &mdash; every account
                    requires TOTP-based MFA. There is no option to skip it, no &ldquo;set it up
                    later&rdquo; prompt. From the moment you create your account, your identity is
                    protected by a second factor.
                  </li>
                  <li>
                    <strong>File sharing with virus scanning</strong> &mdash; you can share files up
                    to 50 MB in any conversation. Every file is scanned by ClamAV before it reaches
                    another user, so malicious uploads are caught before they can cause harm.
                  </li>
                  <li>
                    <strong>Row-level security</strong> &mdash; your messages, conversations, and
                    profile data are protected at the database level. Even if an attacker gained
                    access to the API, they would only see what the security policies allow them to
                    see: nothing that does not belong to them.
                  </li>
                  <li>
                    <strong>Real-time presence and typing indicators</strong> &mdash; see who is
                    online, who is typing, and when messages are read, with full control over your
                    own visibility through{' '}
                    <Link href="/docs" className="text-primary hover:underline">
                      privacy settings
                    </Link>.
                  </li>
                  <li>
                    <strong>Reactions, mentions, and pinned messages</strong> &mdash; the
                    conversational features you expect, built to work seamlessly in both direct and
                    group chats.
                  </li>
                </ul>
              </Section>

              <Section title="Available everywhere you are">
                <p>
                  ChatArk runs on the web with a responsive Next.js application and natively across
                  Apple platforms. Our{' '}
                  <Link href="/blog/building-across-platforms" className="text-primary hover:underline">
                    native clients
                  </Link>{' '}
                  cover iPhone, iPad, Mac, and Apple Watch, all sharing a single SwiftUI codebase
                  with platform-specific adaptations. Whether you are at your desk or glancing at
                  your wrist, your conversations follow you.
                </p>
                <p>
                  Push notifications keep you informed across all devices, and our background sync
                  ensures messages are waiting for you when you open the app, not loading after the
                  fact.
                </p>
              </Section>

              <Section title="Built on transparency">
                <p>
                  We believe trust is earned through transparency. Our{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    privacy notice
                  </Link>{' '}
                  explains exactly what data we collect, why we collect it, and how long we keep it.
                  Our{' '}
                  <Link href="/blog/security-first-approach" className="text-primary hover:underline">
                    security architecture
                  </Link>{' '}
                  is documented publicly because we want you to understand the protections in place,
                  not just take our word for it.
                </p>
                <p>
                  We do not sell your data. We do not serve advertisements. We do not use your
                  messages for training machine learning models. Your conversations exist to serve
                  you, not our bottom line.
                </p>
              </Section>

              <Section title="What is coming next">
                <p>
                  ChatArk is actively evolving. Here is a glimpse of what we are working on:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 mt-2">
                  <li>
                    <strong>Workspaces</strong> &mdash; dedicated team spaces with embeddable chat
                    widgets, so you can bring ChatArk into your product without building messaging
                    from scratch.
                  </li>
                  <li>
                    <strong>Voice and video calls</strong> &mdash; encrypted audio and video calling
                    built directly into conversations.
                  </li>
                  <li>
                    <strong>Message search</strong> &mdash; find any message across all your
                    conversations instantly.
                  </li>
                  <li>
                    <strong>Custom themes and personalisation</strong> &mdash; make ChatArk yours
                    with accent colours, fonts, and layout options.
                  </li>
                </ul>
                <p>
                  We are building ChatArk for the long term. If you have feedback, feature requests,
                  or just want to say hello, reach out at{' '}
                  <a href="mailto:hello@chatark.io" className="text-primary hover:underline">
                    hello@chatark.io
                  </a>. We read every message.
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
