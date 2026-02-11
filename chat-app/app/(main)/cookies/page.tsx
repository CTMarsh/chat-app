import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Cookie Policy - ChatArk',
  description: 'ChatArk cookie policy explaining how we use cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground mb-10">Last updated: 11 February 2026</p>

          <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
            <Section title="1. What are cookies?">
              <p>
                Cookies are small text files placed on your device when you visit a website. They are
                widely used to make websites work efficiently, provide information to site owners, and
                improve the user experience.
              </p>
            </Section>

            <Section title="2. How we use cookies">
              <p>
                ChatArk uses only <strong>strictly necessary cookies</strong> that are essential for
                the Service to function. We do not use advertising, analytics, or third-party tracking
                cookies.
              </p>
            </Section>

            <Section title="3. Cookies we set">
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold">Cookie name</th>
                      <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                      <th className="text-left py-2 pr-4 font-semibold">Type</th>
                      <th className="text-left py-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                      <td className="py-2 pr-4">Supabase authentication session — stores your encrypted access and refresh tokens</td>
                      <td className="py-2 pr-4">Essential</td>
                      <td className="py-2">Session / 1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token-code-verifier</td>
                      <td className="py-2 pr-4">PKCE code verifier for secure OAuth and password reset flows</td>
                      <td className="py-2 pr-4">Essential</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">theme</td>
                      <td className="py-2 pr-4">Stores your light/dark/system theme preference</td>
                      <td className="py-2 pr-4">Essential</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-muted-foreground">
                The <code className="text-xs bg-muted px-1 py-0.5 rounded">*</code> in cookie names
                represents your Supabase project reference, which varies between environments.
              </p>
            </Section>

            <Section title="4. Third-party cookies">
              <p>
                We do not permit any third parties to set cookies through our Service. Our
                infrastructure providers (Supabase, Vercel) do not set additional tracking cookies
                in the context of your use of ChatArk.
              </p>
            </Section>

            <Section title="5. Managing cookies">
              <p>
                Because we only use strictly necessary cookies, we do not display a cookie consent
                banner. Under UK GDPR and the Privacy and Electronic Communications Regulations
                (PECR), consent is not required for cookies that are strictly necessary for a service
                explicitly requested by the user.
              </p>
              <p>
                You can control or delete cookies through your browser settings. However, if you
                disable or delete the authentication cookies listed above, you will be signed out
                and unable to use the Service until you sign in again.
              </p>
              <p>Common browser cookie settings:</p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>
                  <strong>Chrome</strong> &mdash; Settings &gt; Privacy and Security &gt; Cookies and
                  other site data
                </li>
                <li>
                  <strong>Firefox</strong> &mdash; Settings &gt; Privacy &amp; Security &gt; Cookies
                  and Site Data
                </li>
                <li>
                  <strong>Safari</strong> &mdash; Preferences &gt; Privacy &gt; Manage Website Data
                </li>
                <li>
                  <strong>Edge</strong> &mdash; Settings &gt; Cookies and site permissions &gt;
                  Manage and delete cookies
                </li>
              </ul>
            </Section>

            <Section title="6. Similar technologies">
              <p>
                In addition to cookies, the Service uses <strong>localStorage</strong> in your browser
                to persist your theme preference across page loads. This data stays on your device and
                is not transmitted to our servers.
              </p>
            </Section>

            <Section title="7. Changes to this policy">
              <p>
                We may update this cookie policy if we introduce new cookies or change how existing
                ones are used. Changes will be reflected in the &quot;last updated&quot; date at the
                top of this page. If we begin using non-essential cookies in the future, we will
                obtain your consent before setting them.
              </p>
            </Section>

            <Section title="8. More information">
              <p>
                For more details on how we handle your personal data, see our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Notice
                </Link>
                . If you have questions about our use of cookies, contact us at{' '}
                <a href="mailto:privacy@chatark.io" className="text-primary hover:underline">
                  privacy@chatark.io
                </a>.
              </p>
              <p>
                You can also learn more about cookies at{' '}
                <a
                  href="https://ico.org.uk/for-the-public/online/cookies/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ico.org.uk/for-the-public/online/cookies
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
