import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Security & MFA - ChatArk Documentation',
  description: 'Learn about ChatArk security features including mandatory MFA, session management, encryption, and file scanning.',
}

export default function SecurityPage() {
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
            <span className="text-foreground font-medium">Security & MFA</span>
          </nav>

          <h1 className="text-4xl font-bold mb-8">Security & MFA</h1>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold mb-3">Why MFA Is Mandatory</h2>
              <p className="mb-3">
                ChatArk enforces multi-factor authentication for every user without exception. The platform uses time-based one-time passwords (TOTP) through authenticator apps such as Google Authenticator, Authy, or 1Password. This approach means that even if your password is compromised, an attacker cannot access your account without physical access to your authenticator device.
              </p>
              <p>
                Technically, ChatArk enforces Authenticator Assurance Level 2 (AAL2) at the session level. Every protected action -- reading messages, sending files, updating settings -- requires that your session has passed both password and TOTP verification. There is no way to downgrade to single-factor access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Session Management</h2>
              <p className="mb-3">
                You can view all your active sessions from Settings, then Security. Each session entry shows the device type, browser or app version, approximate location based on IP, and the last active timestamp. If you notice a session you do not recognise, you can revoke it immediately from this screen.
              </p>
              <p>
                The &quot;Sign out all devices&quot; option terminates every active session across all platforms, including the device you are currently using. This is useful if you suspect your account has been compromised. After signing out everywhere, you will need to re-authenticate with both your password and TOTP code.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Password Requirements and Reset</h2>
              <p className="mb-3">
                Passwords must be at least eight characters long. We strongly recommend using a password manager to generate a unique, high-entropy password for your ChatArk account. Avoid reusing passwords from other services.
              </p>
              <p>
                To reset a forgotten password, click &quot;Forgot password&quot; on the login screen. A reset link will be sent to your registered email address. After setting a new password, you will still need to verify your TOTP code to complete sign-in. You can also change your password proactively from the Security section of Settings while logged in.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Blocked Users and Privacy Controls</h2>
              <p>
                If another user is behaving inappropriately, you can block them from their profile popover or from Settings, then Privacy. Blocked users cannot send you direct messages, add you to group conversations, or see your online status. You will no longer receive notifications from blocked users, and their messages in shared group conversations will be hidden from your view. You can unblock a user at any time from the same privacy settings screen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Encryption</h2>
              <p>
                All data transmitted between your device and ChatArk servers is encrypted using TLS (Transport Layer Security). This applies to messages, file uploads, authentication tokens, and API requests. At the application level, sensitive data such as app group containers on Apple platforms is encrypted using AES-GCM. Database records are stored on Supabase infrastructure with encryption at rest enabled by default.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">File Scanning with ClamAV</h2>
              <p>
                Every file uploaded to ChatArk is automatically scanned for malware before it becomes available to recipients. The scanning is handled by a Supabase Edge Function that integrates with the ClamAV open-source antivirus engine. Files that fail the virus scan are rejected immediately and never delivered. This process runs transparently -- you simply upload a file and it will either appear in the conversation or be rejected with a warning if a threat is detected.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Rate Limiting</h2>
              <p>
                ChatArk implements rate limiting on authentication endpoints, message sending, and file uploads to protect against brute-force attacks and abuse. If you exceed the allowed number of requests in a given time window, you will see a temporary cooldown message. These limits are designed to be generous enough for normal use while preventing automated attacks. Rate limiting operates at both the IP level and the per-user level.
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
