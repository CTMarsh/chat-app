import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatProvider } from '@/components/providers/chat-provider'
import { ChatLayout } from '@/components/chat/chat-layout'

export default async function ChatRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ChatProvider userId={user.id}>
      <ChatLayout>{children}</ChatLayout>
    </ChatProvider>
  )
}
