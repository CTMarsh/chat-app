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
        a: 'Visit the sign-up page and enter your email and a strong password. You will then be prompted to set up multi-factor authentication (MFA) using an authenticator app such as Google Authenticator, Authy, or 1Password.',
      },
      {
        q: 'Why is MFA mandatory?',
        a: 'ChatArk requires TOTP-based multi-factor authentication for all accounts to protect against credential theft and unauthorised access. This is a core security requirement that cannot be disabled.',
      },
      {
        q: 'Which authenticator apps are supported?',
        a: 'Any app that supports TOTP (Time-based One-Time Passwords) will work. Popular options include Google Authenticator, Authy, 1Password, Bitwarden, and the built-in Passwords app on Apple devices.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot password" on the login page. We will send a password-reset link to your registered email address. After resetting your password you will need to verify your MFA code to complete sign-in.',
      },
      {
        q: 'How do I manage my active sessions?',
        a: 'Go to Settings > Security to view all active sessions across your devices. You can revoke individual sessions or sign out from all devices at once.',
      },
      {
        q: 'Can I change my email address?',
        a: 'At present, email changes are handled by our support team. Contact support@chatark.io from your registered email and we will guide you through the verification process.',
      },
      {
        q: 'How do I change my display name or username?',
        a: 'Go to Settings > Profile. You can update your display name at any time. Usernames must be unique and can only contain lowercase letters, numbers, and underscores.',
      },
      {
        q: 'What password requirements does ChatArk enforce?',
        a: 'Passwords must be at least 8 characters long. We strongly recommend using a password manager and a unique, randomly generated password that you do not reuse on other services.',
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
        a: 'Supported formats include images (JPEG, PNG, GIF, WebP, HEIC), documents (PDF, TXT, RTF), archives (ZIP, GZIP), audio (MP3, WAV), and video (MP4). The maximum file size is 50 MB per upload.',
      },
      {
        q: 'Are uploaded files scanned for viruses?',
        a: 'Yes. All file uploads are automatically scanned using ClamAV before they are stored. Files that fail the scan are rejected immediately and never reach other users.',
      },
      {
        q: 'Can I edit or delete messages?',
        a: 'Yes. You can edit your own messages after sending, or delete them. Deleted messages are soft-deleted and no longer visible to other participants in the conversation.',
      },
      {
        q: 'How do @mentions work?',
        a: 'Type @ followed by a username to mention someone. They will receive a notification even if they have muted the conversation. Mentions are highlighted in the message body.',
      },
      {
        q: 'Can I react to messages with emoji?',
        a: 'Yes. Hover over or long-press a message to open the reaction picker. You can add multiple reactions to any message, and see who reacted with each emoji.',
      },
      {
        q: 'How do I pin a message?',
        a: 'Open the message menu and select "Pin message". Pinned messages are accessible from the pin icon in the conversation header. Only group admins and conversation participants can pin messages.',
      },
      {
        q: 'Do you support link previews?',
        a: 'Yes. When you send a message containing a URL, ChatArk automatically generates a rich link preview showing the page title, description, and thumbnail where available.',
      },
    ],
  },
  {
    title: 'Groups & conversations',
    questions: [
      {
        q: 'What is the difference between a conversation and a workspace?',
        a: 'Conversations are individual or group chats between ChatArk users. Workspaces are organisational containers for teams that include member management, role-based access, and embeddable chat widgets for websites.',
      },
      {
        q: 'How do I create a group conversation?',
        a: 'From the conversation list, tap "New Conversation" and select multiple participants. You can set a group name and avatar after creation.',
      },
      {
        q: 'Is there a limit to the number of people in a group?',
        a: 'Group conversations support up to 100 participants. For larger teams, consider creating a workspace where you can manage members and channels more effectively.',
      },
      {
        q: 'How do I leave a group conversation?',
        a: 'Open the conversation settings and select "Leave conversation". Your messages will remain visible to other participants, but you will no longer receive new messages.',
      },
      {
        q: 'Can I mute a conversation?',
        a: 'Yes. Open the conversation settings and toggle "Mute notifications". You will still see new messages when you open the conversation, but you will not receive push notifications or sounds.',
      },
      {
        q: 'What roles are available in group conversations?',
        a: 'Group conversations have two roles: the creator (who can manage members and settings) and participants. For more granular role management, use workspaces.',
      },
      {
        q: 'Can I add someone to an existing group?',
        a: 'Yes. Open the conversation settings, tap "Members", and select "Add member". The new member will be able to see messages sent after they joined.',
      },
      {
        q: 'How do read receipts work in groups?',
        a: 'Read receipts show which participants have seen each message. You can disable read receipts for your account in Settings > Privacy if you prefer not to share this information.',
      },
    ],
  },
  {
    title: 'Privacy & data',
    questions: [
      {
        q: 'How can I block another user?',
        a: 'Go to Settings > Privacy > Blocked Users. You can also block a user from their profile popover in a conversation. Blocked users cannot send you messages or see your online status.',
      },
      {
        q: 'Can I hide my online status?',
        a: 'Yes. Go to Settings > Privacy and set your status to "Invisible". You will appear offline to other users while still being able to use the service normally.',
      },
      {
        q: 'How do I request my data or delete my account?',
        a: 'Contact us at privacy@chatark.io to request a data export or account deletion. We will respond within one month as required by UK GDPR.',
      },
      {
        q: 'What data does ChatArk collect?',
        a: 'We collect your email address, profile information you provide, messages, uploaded files, and basic usage analytics. We do not sell your data to third parties. See our Privacy Notice for full details.',
      },
      {
        q: 'Are messages encrypted?',
        a: 'Messages are encrypted in transit using TLS and encrypted at rest in our Supabase-hosted PostgreSQL database. All database access is protected by row-level security policies.',
      },
      {
        q: 'Can I disable read receipts?',
        a: 'Yes. Go to Settings > Privacy and toggle "Read receipts" off. Other users will no longer see when you have read their messages, and you will not see their read receipts either.',
      },
      {
        q: 'How long are deleted messages retained?',
        a: 'Deleted messages are soft-deleted and hidden from all participants immediately. The underlying data is permanently purged within 30 days of deletion.',
      },
      {
        q: 'Where is my data stored?',
        a: 'ChatArk uses Supabase infrastructure hosted on AWS. Data is stored in EU-based data centres. For more details, see our Privacy Notice.',
      },
    ],
  },
  {
    title: 'Workspaces & widgets',
    questions: [
      {
        q: 'How do I create a workspace?',
        a: 'From the main menu, select "Create Workspace". Give it a name, invite team members, and assign roles (owner, admin, or agent). Workspaces are designed for teams that want to manage customer-facing chat.',
      },
      {
        q: 'How do I embed a chat widget on my website?',
        a: 'Go to your workspace settings and navigate to the Widgets section. Create a new widget, configure its appearance, and copy the embed script tag. Paste it into the HTML of any page where you want the widget to appear.',
      },
      {
        q: 'What are agent roles in workspaces?',
        a: 'Agents are team members who can participate in widget conversations with visitors. They can respond to incoming chats but cannot manage workspace settings or member roles. Owners and admins can promote members to agents.',
      },
      {
        q: 'Can I customise the widget appearance?',
        a: 'Yes. Widgets support configuration options including primary colour, position (bottom-left or bottom-right), welcome message, offline message, and whether to require visitor email or name before starting a conversation.',
      },
      {
        q: 'Can I restrict which domains can embed my widget?',
        a: 'Yes. Each widget has an "allowed origins" setting where you can specify which domains are permitted to load the widget. Requests from unlisted domains will be rejected.',
      },
    ],
  },
  {
    title: 'Troubleshooting',
    questions: [
      {
        q: 'I cannot sign in to my account.',
        a: 'Make sure you are entering the correct email address and password. If you have forgotten your password, use the "Forgot password" link. Ensure your authenticator app is synced with the correct time (TOTP codes are time-sensitive). If you are still locked out, contact support@chatark.io.',
      },
      {
        q: 'I lost access to my authenticator app.',
        a: 'If you can no longer generate MFA codes, contact support@chatark.io from your registered email address. We will verify your identity and help you re-enrol MFA. For security, this process may take up to 48 hours.',
      },
      {
        q: 'My messages are not sending.',
        a: 'Check your internet connection and try refreshing the page. If the problem persists, check the ChatArk status page for any ongoing incidents. Large file attachments may also fail if they exceed the 50 MB limit or fail the virus scan.',
      },
      {
        q: 'I am not receiving push notifications.',
        a: 'Ensure notifications are enabled in your device settings and in ChatArk under Settings > Notifications. On iOS and macOS, you must grant notification permission when prompted. If you have "Do Not Disturb" enabled in ChatArk settings, notifications will be silenced during scheduled hours.',
      },
      {
        q: 'My file upload was rejected.',
        a: 'File uploads can be rejected for three reasons: the file exceeds 50 MB, the file type is not in our supported formats list, or the ClamAV virus scan flagged the file. If you believe a file was incorrectly flagged, contact support@chatark.io.',
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
