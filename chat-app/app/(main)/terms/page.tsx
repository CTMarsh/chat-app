import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Terms of Service - ChatArk',
  description: 'ChatArk terms of service governing use of our real-time messaging platform.',
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-10">Last updated: 11 February 2026</p>

          <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
            <Section title="1. Introduction">
              <p>
                These terms of service (&quot;Terms&quot;) govern your use of the ChatArk messaging
                platform (&quot;Service&quot;) operated by ChatArk (&quot;we&quot;, &quot;us&quot;,
                &quot;our&quot;), a company registered in England and Wales.
              </p>
              <p>
                By creating an account or using the Service, you agree to be bound by these Terms. If
                you do not agree, you must not use the Service.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>
                You must be at least 13 years old to use the Service. If you are under 18, you confirm
                that you have the consent of a parent or guardian. By using the Service, you represent
                that you meet these requirements.
              </p>
            </Section>

            <Section title="3. Your account">
              <p>When you create an account, you agree to:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>Provide accurate and complete registration information</li>
                <li>Enrol in multi-factor authentication (MFA) as required by the Service</li>
                <li>Keep your login credentials and MFA devices secure</li>
                <li>Notify us immediately if you suspect unauthorised access to your account</li>
                <li>Accept responsibility for all activity that occurs under your account</li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate accounts that violate these Terms or that
                we reasonably believe have been compromised.
              </p>
            </Section>

            <Section title="4. Acceptable use">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>Send spam, unsolicited messages, or bulk communications</li>
                <li>Harass, threaten, abuse, or intimidate other users</li>
                <li>Upload malicious files, viruses, or harmful code</li>
                <li>Attempt to circumvent security measures, rate limits, or access controls</li>
                <li>Impersonate another person or entity</li>
                <li>Use the Service for any unlawful purpose under the laws of England and Wales</li>
                <li>Collect or harvest other users&apos; personal data without consent</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
              </ul>
              <p className="mt-3">
                We may remove content and suspend accounts that violate this policy at our discretion.
              </p>
            </Section>

            <Section title="5. Your content">
              <p>
                You retain ownership of the content you create and share through the Service
                (&quot;Your Content&quot;). By using the Service, you grant us a limited, non-exclusive
                licence to store, transmit, and display Your Content solely for the purpose of
                providing the Service to you and other participants in your conversations.
              </p>
              <p>
                You are responsible for ensuring you have the right to share any content you upload.
                We do not pre-screen content but may remove material that violates these Terms.
              </p>
            </Section>

            <Section title="6. File uploads">
              <p>The Service allows you to upload files subject to the following conditions:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>Individual files must not exceed 50MB</li>
                <li>All uploaded files are automatically scanned for viruses</li>
                <li>Files that fail virus scanning will be rejected</li>
                <li>Only supported file types (images, documents, audio, video, archives) are permitted</li>
              </ul>
            </Section>

            <Section title="7. Privacy">
              <p>
                Your use of the Service is also governed by our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Notice
                </Link>
                , which explains how we collect, use, and protect your personal data. By using the
                Service, you acknowledge that you have read and understood our Privacy Notice.
              </p>
            </Section>

            <Section title="8. Intellectual property">
              <p>
                The Service, including its design, code, logos, and documentation, is owned by ChatArk
                and protected by copyright, trade mark, and other intellectual property laws of England
                and Wales and international treaties.
              </p>
              <p>
                Nothing in these Terms grants you any right to use our trade marks, logos, or branding
                without our prior written consent.
              </p>
            </Section>

            <Section title="9. Third-party services">
              <p>
                The Service relies on third-party infrastructure providers including Supabase, Vercel,
                and Apple Push Notification service. We are not responsible for the availability,
                performance, or policies of these third-party services, though we take reasonable steps
                to ensure they meet appropriate standards.
              </p>
            </Section>

            <Section title="10. Availability and support">
              <p>
                We aim to keep the Service available at all times but do not guarantee uninterrupted
                access. We may temporarily suspend the Service for maintenance, updates, or
                circumstances beyond our reasonable control. Where possible, we will provide advance
                notice of planned downtime.
              </p>
            </Section>

            <Section title="11. Limitation of liability">
              <p>To the fullest extent permitted by law:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>
                  The Service is provided &quot;as is&quot; and &quot;as available&quot; without
                  warranties of any kind, whether express or implied
                </li>
                <li>
                  We shall not be liable for any indirect, incidental, special, consequential, or
                  punitive damages arising from your use of the Service
                </li>
                <li>
                  Our total aggregate liability to you for any claims arising from or related to these
                  Terms shall not exceed the greater of (a) the amount you paid us in the 12 months
                  preceding the claim, or (b) &pound;100
                </li>
              </ul>
              <p className="mt-3">
                Nothing in these Terms excludes or limits our liability for death or personal injury
                caused by our negligence, fraud, or any other liability that cannot be excluded by law.
              </p>
            </Section>

            <Section title="12. Indemnification">
              <p>
                You agree to indemnify and hold harmless ChatArk and its officers, directors, and
                employees from any claims, losses, or damages (including reasonable legal fees) arising
                from your breach of these Terms, your use of the Service, or your violation of any
                third-party rights.
              </p>
            </Section>

            <Section title="13. Termination">
              <p>
                You may close your account at any time by contacting us. We may suspend or terminate
                your access to the Service at any time if you breach these Terms, with or without
                notice depending on the severity of the breach.
              </p>
              <p>
                Upon termination, your right to use the Service ceases immediately. We will retain
                your data in accordance with our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Notice
                </Link>
                .
              </p>
            </Section>

            <Section title="14. Changes to these Terms">
              <p>
                We may update these Terms from time to time. We will notify you of material changes by
                posting a notice on our website or sending you an in-app notification at least 30 days
                before the changes take effect. Your continued use of the Service after the effective
                date constitutes acceptance of the updated Terms.
              </p>
            </Section>

            <Section title="15. Governing law and jurisdiction">
              <p>
                These Terms are governed by and construed in accordance with the laws of England and
                Wales. Any disputes arising from or in connection with these Terms shall be subject to
                the exclusive jurisdiction of the courts of England and Wales.
              </p>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions
                shall continue in full force and effect.
              </p>
            </Section>

            <Section title="16. Contact us">
              <p>
                If you have any questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@chatark.io" className="text-primary hover:underline">
                  legal@chatark.io
                </a>.
              </p>
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
