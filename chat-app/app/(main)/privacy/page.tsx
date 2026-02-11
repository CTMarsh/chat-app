import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Privacy Notice - ChatArk',
  description: 'ChatArk privacy notice explaining how we collect, use, and protect your personal data under UK GDPR.',
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-2">Privacy Notice</h1>
          <p className="text-muted-foreground mb-10">Last updated: 11 February 2026</p>

          <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
            <Section title="1. Who we are">
              <p>
                ChatArk (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is the data controller responsible for your
                personal data. We are registered in England and Wales.
              </p>
              <p>
                If you have any questions about this privacy notice or how we handle your personal data,
                please contact us at{' '}
                <a href="mailto:privacy@chatark.io" className="text-primary hover:underline">
                  privacy@chatark.io
                </a>.
              </p>
            </Section>

            <Section title="2. What data we collect">
              <p>We collect the following categories of personal data:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li><strong>Account information</strong> &mdash; email address, display name, username, and avatar image</li>
                <li><strong>Authentication data</strong> &mdash; hashed password, MFA enrolment status, and session tokens</li>
                <li><strong>Messages and content</strong> &mdash; text messages, file attachments, reactions, and read receipts you send through the service</li>
                <li><strong>Usage data</strong> &mdash; IP address, device type, browser user agent, pages visited, and feature interactions</li>
                <li><strong>Preferences</strong> &mdash; theme, notification settings, online status preference, and accessibility choices</li>
                <li><strong>Push notification tokens</strong> &mdash; device tokens for delivering push notifications</li>
              </ul>
            </Section>

            <Section title="3. How we use your data">
              <p>We process your personal data for the following purposes and under the following lawful bases:</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                      <th className="text-left py-2 font-semibold">Lawful basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="py-2 pr-4">Providing the messaging service</td>
                      <td className="py-2">Contract performance</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Account creation and authentication (including MFA)</td>
                      <td className="py-2">Contract performance</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Sending push notifications</td>
                      <td className="py-2">Consent</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Virus scanning uploaded files</td>
                      <td className="py-2">Legitimate interest (platform security)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Preventing abuse and enforcing rate limits</td>
                      <td className="py-2">Legitimate interest (platform integrity)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Analytics and performance monitoring</td>
                      <td className="py-2">Legitimate interest (service improvement)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Responding to legal requests or obligations</td>
                      <td className="py-2">Legal obligation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="4. How we share your data">
              <p>We do not sell your personal data. We share data only with:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li><strong>Supabase Inc.</strong> &mdash; our infrastructure provider for database hosting, authentication, file storage, and real-time messaging (data processed in the EU/US)</li>
                <li><strong>Apple Inc.</strong> &mdash; for delivering push notifications via Apple Push Notification service (APNs)</li>
                <li><strong>Vercel Inc.</strong> &mdash; for web application hosting and analytics</li>
                <li><strong>Law enforcement or regulators</strong> &mdash; when required by applicable UK law</li>
              </ul>
            </Section>

            <Section title="5. International transfers">
              <p>
                Some of our service providers process data outside the UK. Where this occurs, we ensure
                appropriate safeguards are in place, such as the UK International Data Transfer Agreement
                (IDTA) or reliance on adequacy decisions by the UK Secretary of State.
              </p>
            </Section>

            <Section title="6. How long we keep your data">
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Account data</strong> &mdash; retained while your account is active and for 30 days after deletion</li>
                <li><strong>Messages and files</strong> &mdash; retained while the conversation exists; deleted messages are soft-deleted and permanently removed after 90 days</li>
                <li><strong>Session data</strong> &mdash; retained until the session expires or is revoked</li>
                <li><strong>Server logs</strong> &mdash; retained for up to 90 days for security and debugging purposes</li>
              </ul>
            </Section>

            <Section title="7. How we protect your data">
              <p>We implement appropriate technical and organisational measures including:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>Mandatory multi-factor authentication (TOTP) for all accounts</li>
                <li>AES-GCM encryption for data shared between app components</li>
                <li>Row-level security (RLS) on all database tables</li>
                <li>TLS encryption for all data in transit</li>
                <li>ClamAV virus scanning on all uploaded files</li>
                <li>Rate limiting and input sanitisation to prevent abuse</li>
                <li>Passwords hashed using bcrypt via Supabase Auth</li>
              </ul>
            </Section>

            <Section title="8. Your rights">
              <p>Under UK GDPR, you have the following rights:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li><strong>Access</strong> &mdash; request a copy of the personal data we hold about you</li>
                <li><strong>Rectification</strong> &mdash; ask us to correct inaccurate or incomplete data</li>
                <li><strong>Erasure</strong> &mdash; ask us to delete your personal data (&quot;right to be forgotten&quot;)</li>
                <li><strong>Restriction</strong> &mdash; ask us to limit how we process your data</li>
                <li><strong>Portability</strong> &mdash; request your data in a structured, machine-readable format</li>
                <li><strong>Objection</strong> &mdash; object to processing based on legitimate interests</li>
                <li><strong>Withdraw consent</strong> &mdash; where processing is based on consent, you may withdraw it at any time</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:privacy@chatark.io" className="text-primary hover:underline">
                  privacy@chatark.io
                </a>.
                We will respond within one month.
              </p>
            </Section>

            <Section title="9. Cookies">
              <p>
                We use essential cookies to maintain your authentication session and preferences.
                We do not use third-party advertising or tracking cookies. For more details, see
                our{' '}
                <Link href="/cookies" className="text-primary hover:underline">
                  Cookie Policy
                </Link>.
              </p>
            </Section>

            <Section title="10. Children">
              <p>
                ChatArk is not intended for use by anyone under the age of 13. We do not knowingly
                collect personal data from children. If you believe a child has provided us with
                personal data, please contact us and we will delete it promptly.
              </p>
            </Section>

            <Section title="11. Changes to this notice">
              <p>
                We may update this privacy notice from time to time. We will notify you of significant
                changes by posting a notice on our website or sending you an in-app notification.
                The &quot;last updated&quot; date at the top of this page indicates when the notice was
                last revised.
              </p>
            </Section>

            <Section title="12. Complaints">
              <p>
                If you are unhappy with how we have handled your personal data, you have the right to
                lodge a complaint with the Information Commissioner&apos;s Office (ICO):
              </p>
              <div className="mt-2 rounded-lg border border-border/50 bg-card/50 p-4 text-sm">
                <p className="font-medium">Information Commissioner&apos;s Office</p>
                <p className="text-muted-foreground mt-1">
                  Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF
                </p>
                <p className="text-muted-foreground">
                  Telephone: 0303 123 1113
                </p>
                <p className="text-muted-foreground">
                  Website:{' '}
                  <a
                    href="https://ico.org.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ico.org.uk
                  </a>
                </p>
              </div>
            </Section>
          </div>
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
