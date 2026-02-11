import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Help Centre - ChatArk',
  description: 'Frequently asked questions and support for ChatArk.',
}

const faqSections = [
  {
    title: 'Account & security',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Visit the sign-up page and enter your email and a strong password. You will then be prompted to set up multi-factor authentication (MFA) using an authenticator app.',
      },
      {
        q: 'Why is MFA mandatory?',
        a: 'ChatArk requires TOTP-based multi-factor authentication for all accounts to protect against credential theft and unauthorised access. This is a core security requirement.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot password" on the login page. We will send a password reset link to your registered email address.',
      },
      {
        q: 'How do I manage my active sessions?',
        a: 'Go to Settings > Security to view all active sessions. You can revoke individual sessions or sign out from all devices at once.',
      },
    ],
  },
  {
    title: 'Messaging',
    questions: [
      {
        q: 'What is the maximum message length?',
        a: 'Messages can be up to 10,000 characters long.',
      },
      {
        q: 'What file types can I upload?',
        a: 'Supported formats include images (JPEG, PNG, GIF, WebP, HEIC), documents (PDF, TXT, RTF), archives (ZIP, GZIP), audio (MP3, WAV), and video (MP4). The maximum file size is 50MB.',
      },
      {
        q: 'Are uploaded files scanned for viruses?',
        a: 'Yes. All file uploads are automatically scanned using ClamAV before they are stored. Files that fail the scan are rejected.',
      },
      {
        q: 'Can I edit or delete messages?',
        a: 'Yes. You can edit your own messages after sending, or delete them. Deleted messages are soft-deleted and no longer visible to other participants.',
      },
    ],
  },
  {
    title: 'Groups & workspaces',
    questions: [
      {
        q: 'What is the difference between a conversation and a workspace?',
        a: 'Conversations are individual or group chats. Workspaces are organisational containers for managing teams, members, and embeddable chat widgets.',
      },
      {
        q: 'How do I create a group conversation?',
        a: 'From the conversation list, tap "New Conversation" and select multiple participants. You can set a group name and avatar.',
      },
      {
        q: 'What roles are available in workspaces?',
        a: 'Workspaces have owners, admins, and agents. Owners have full control. Admins can manage members and settings. Agents can participate in widget conversations.',
      },
    ],
  },
  {
    title: 'Privacy & data',
    questions: [
      {
        q: 'How can I block another user?',
        a: 'Go to Settings > Privacy > Blocked Users. You can also block a user from their profile popover in a conversation.',
      },
      {
        q: 'Can I hide my online status?',
        a: 'Yes. Go to Settings > Privacy and set your status to "Invisible". You will appear offline to other users while still being able to use the service.',
      },
      {
        q: 'How do I request my data or delete my account?',
        a: 'Contact us at privacy@chatark.io to request a data export or account deletion. We will respond within one month as required by UK GDPR.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Help Centre</h1>
          <p className="text-muted-foreground mb-12">
            Find answers to common questions about ChatArk.
          </p>

          <div className="space-y-10">
            {faqSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                <div className="space-y-4">
                  {section.questions.map((faq) => (
                    <details
                      key={faq.q}
                      className="group rounded-xl border border-border/50 bg-card/30 transition-colors hover:border-primary/30"
                    >
                      <summary className="cursor-pointer px-5 py-4 text-sm font-medium select-none list-none flex items-center justify-between">
                        {faq.q}
                        <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border/50 bg-card/30 p-6 text-center">
            <h2 className="text-base font-semibold mb-2">Still need help?</h2>
            <p className="text-sm text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? Contact our support team at{' '}
              <a href="mailto:support@chatark.io" className="text-primary hover:underline">
                support@chatark.io
              </a>. Also see our{' '}
              <Link href="/docs" className="text-primary hover:underline">
                Documentation
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Notice
              </Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
