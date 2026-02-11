import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Getting Started - ChatArk Documentation',
  description: 'Create your ChatArk account, set up multi-factor authentication, and learn how to navigate the app.',
}

export default function GettingStartedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">Getting Started</span>
          </nav>

          <h1 className="text-4xl font-bold mb-8">Getting Started</h1>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold mb-3">Creating Your Account</h2>
              <p className="mb-3">
                To get started with ChatArk, visit the sign-up page and enter your email address along with a strong password. Your password must be at least eight characters and should include a mix of uppercase letters, lowercase letters, numbers, and symbols for maximum security.
              </p>
              <p>
                After submitting the form, check your inbox for a verification email. Click the confirmation link to activate your account. If the email does not arrive within a few minutes, check your spam or junk folder. You can also request a new confirmation email from the login page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Setting Up Multi-Factor Authentication</h2>
              <p className="mb-3">
                ChatArk requires multi-factor authentication (MFA) for every account. This is not optional -- it is a core part of how the platform keeps your conversations safe. After your first login, you will be redirected to the MFA setup screen automatically.
              </p>
              <p className="mb-3">
                Start by downloading an authenticator app such as Google Authenticator, Authy, or 1Password on your phone. On the MFA setup screen, scan the QR code displayed using your authenticator app. The app will generate a six-digit time-based one-time password (TOTP) that refreshes every thirty seconds.
              </p>
              <p>
                Enter the current six-digit code into the verification field and submit. Once confirmed, your MFA enrolment is complete. You will need to enter a fresh code from your authenticator app each time you start a new session.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Verifying MFA Each Session</h2>
              <p>
                Every time you sign in, ChatArk will prompt you for a TOTP code after entering your email and password. Open your authenticator app, find the ChatArk entry, and type the current six-digit code. This two-step process ensures that even if someone obtains your password, they cannot access your account without your authenticator device.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Navigating the Interface</h2>
              <p className="mb-3">
                The ChatArk interface is divided into three main areas. On the left you will find the conversation list, which shows all your direct messages and group chats sorted by most recent activity. Each conversation displays the other participant&apos;s avatar, name, a preview of the last message, and an unread count badge when applicable.
              </p>
              <p>
                The centre panel is the chat view where you read and compose messages. At the top of the chat view is a header showing the conversation name and participant details. The message input area at the bottom supports text, file attachments, and emoji. On the right side of the header, you can access conversation settings, pinned messages, and participant management for group chats.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Sending Your First Message</h2>
              <p>
                Select a conversation from the sidebar or start a new one by clicking the compose button. Type your message in the input field at the bottom of the chat view and press Enter to send, or click the send button. You can also attach files by clicking the paperclip icon, add emoji reactions to messages by hovering and clicking the reaction button, and reply to specific messages by selecting the reply option from the message context menu.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Customising Your Profile</h2>
              <p className="mb-3">
                Head to Settings and then Profile to personalise your account. You can upload a profile avatar, which will be automatically resized and stored securely. Set a display name that other users will see in conversations, choose a unique username that people can use to find you, and write a short bio to let others know a bit about you.
              </p>
              <p>
                Your profile information is visible to other ChatArk users you share conversations with. You can update these details at any time from the same settings page.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border/50">
            <Link href="/docs" className="text-sm text-primary hover:underline">
              Back to Documentation
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
