import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Group Conversations - ChatArk Documentation',
  description: 'Learn how to create and manage group conversations in ChatArk, including roles, mentions, and pinned messages.',
}

export default function GroupConversationsPage() {
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
            <span className="text-foreground font-medium">Group Conversations</span>
          </nav>

          <h1 className="text-4xl font-bold mb-8">Group Conversations</h1>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold mb-3">Creating a Group</h2>
              <p className="mb-3">
                To start a group conversation, click the compose button in the sidebar and select &quot;New group.&quot; You will be asked to give the group a name, optionally upload a group avatar, and then search for users to add as initial participants. You need at least one other participant to create a group.
              </p>
              <p>
                Group names should be descriptive so participants can easily identify the conversation in their sidebar. You can change the group name and avatar at any time from the group settings panel, which is accessible via the header of the conversation view.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Adding and Removing Participants</h2>
              <p className="mb-3">
                Group admins and moderators can add new participants at any time by opening the group settings and selecting &quot;Add members.&quot; Search for users by their display name or username and select them from the results. Added members will see the full conversation history from the point they join.
              </p>
              <p>
                To remove a participant, open the member list in group settings, find the user, and select &quot;Remove from group.&quot; Only admins and moderators can remove members. Removed members lose access to the conversation immediately and will not receive further messages from the group.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Group Roles</h2>
              <p className="mb-3">
                Each participant in a group conversation has one of three roles: admin, moderator, or member. The user who creates the group is automatically assigned the admin role.
              </p>
              <p className="mb-3">
                Admins have full control over the group. They can rename the group, change the avatar, add and remove any participant, promote members to moderator or admin, and delete the group entirely. Moderators share most of these abilities but cannot remove other moderators or admins, and cannot delete the group. Members can send messages, share files, and react to messages, but cannot modify group settings or manage participants.
              </p>
              <p>
                Admins can promote or demote participants from the member list in group settings. Tap on a member and select &quot;Change role&quot; to adjust their permissions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Pinning Messages</h2>
              <p>
                Important messages can be pinned to make them easy to find later. To pin a message, hover over it (or long-press on mobile) and select &quot;Pin message&quot; from the context menu. Pinned messages appear in a dedicated pinned messages panel accessible from the conversation header. Any group member can pin a message, and admins or moderators can unpin messages pinned by others. Pinned messages are especially useful for sharing meeting links, deadlines, or key decisions that the group needs to reference frequently.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Group Avatar and Name</h2>
              <p>
                Every group can have a custom avatar image and a display name. The avatar appears in the sidebar conversation list and at the top of the chat view. If no custom avatar is set, ChatArk generates a default icon using the initials of the group name. Admins and moderators can update the group avatar by clicking on it in the group settings panel and uploading a new image. The avatar follows the same upload rules as profile avatars -- it is automatically resized and stored securely.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Mentioning Users</h2>
              <p>
                Type the @ symbol followed by a participant&apos;s name to mention them in a message. An autocomplete dropdown will appear showing matching participants as you type. Selecting a user from the dropdown inserts a styled mention tag into your message. Mentioned users receive a notification even if they have muted the group, ensuring they do not miss messages directed at them. Mentions are highlighted visually in the message text so they stand out from regular content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Leaving a Group</h2>
              <p>
                If you no longer want to participate in a group conversation, open the group settings and select &quot;Leave group.&quot; You will be removed from the participant list and will stop receiving new messages. Your previous messages will remain visible to other members. If you are the only admin in the group, you must promote another member to admin before you can leave. This ensures the group always has someone who can manage settings and participants.
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
