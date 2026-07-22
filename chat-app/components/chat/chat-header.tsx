'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Phone, Video, Info, Search, XCircle, Headphones, Building2, Ban, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useChat } from '@/components/providers/chat-provider'
import { SearchDialog } from './search-dialog'
import { ProfilePopover } from './profile-popover'
import { GroupInfoPanel } from './group-info-panel'
import { cn } from '@/lib/utils'
import { blockUser, isUserBlocked, unblockUser } from '@/lib/actions/settings'
import { useRouter } from 'next/navigation'

export function ChatHeader() {
  const { activeConversation, currentUser, endConversation } = useChat()
  const router = useRouter()
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [checkingBlocked, setCheckingBlocked] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)

  // Get the other participant for direct chats (needs to be before early returns for hooks)
  const otherParticipant = activeConversation?.participants?.find(
    p => p.user_id !== currentUser?.id
  )

  // Check if user is blocked when conversation changes
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (activeConversation?.type === 'direct' && otherParticipant?.user_id) {
        setCheckingBlocked(true)
        const blocked = await isUserBlocked(otherParticipant.user_id)
        setIsBlocked(blocked)
        setCheckingBlocked(false)
      }
    }
    checkBlockStatus()
  }, [activeConversation?.id, otherParticipant?.user_id])

  if (!activeConversation) return null

  const isWidget = activeConversation.type === 'widget'
  const isEnded = !!activeConversation.ended_at

  // Determine display name and avatar
  const displayName = isWidget
    ? activeConversation.visitor_session?.name || activeConversation.name || 'Visitor'
    : activeConversation.type === 'group'
      ? activeConversation.name
      : otherParticipant?.profile.display_name || otherParticipant?.profile.username

  const avatarUrl = isWidget
    ? null
    : activeConversation.type === 'group'
      ? activeConversation.avatar_url
      : otherParticipant?.profile.avatar_url

  const status = isWidget ? null : otherParticipant?.profile.status
  const participantCount = activeConversation.participants.length

  const handleEndConversation = async () => {
    setIsEnding(true)
    const result = await endConversation(activeConversation.id)
    setIsEnding(false)
    setShowEndDialog(false)

    if (result.error) {
      console.error('Failed to end conversation:', result.error)
    }
  }

  const handleBlockUser = async () => {
    if (!otherParticipant?.user_id) return

    setIsBlocking(true)
    const { error } = await blockUser(otherParticipant.user_id)
    setIsBlocking(false)
    setShowBlockDialog(false)

    if (error) {
      console.error('Failed to block user:', error)
    } else {
      setIsBlocked(true)
      // Redirect to conversation list
      router.push('/chat')
    }
  }

  const handleUnblockUser = async () => {
    if (!otherParticipant?.user_id) return

    setIsBlocking(true)
    const { error } = await unblockUser(otherParticipant.user_id)
    setIsBlocking(false)

    if (error) {
      console.error('Failed to unblock user:', error)
    } else {
      setIsBlocked(false)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusText = () => {
    if (isWidget) {
      if (isEnded) return 'Conversation ended'
      return activeConversation.widget?.workspace?.name || 'Support chat'
    }
    if (activeConversation.type === 'group') {
      return `${participantCount} members`
    }
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      case 'dnd': return 'Do Not Disturb'
      case 'suspended': return 'Suspended'
      default: return 'Offline'
    }
  }

  return (
    <>
      <header className="relative flex items-center justify-between border-b bg-card/30 px-4 py-3 backdrop-blur-sm">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="relative md:hidden">
            {/* Spacer for mobile menu button */}
            <div className="w-10" />
          </div>

          {isWidget ? (
            // Widget conversation avatar
            <div className="relative">
              <Avatar className={cn(
                "h-10 w-10 ring-2 ring-offset-2 ring-offset-background transition-all",
                isEnded ? "ring-border" : "ring-primary/30"
              )}>
                <AvatarFallback className={cn(
                  "font-medium",
                  isEnded ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                )}>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                'absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background',
                isEnded ? 'bg-ark-ink-3' : 'bg-ark-blue'
              )}>
                <Headphones className="h-3 w-3 text-white" />
              </span>
            </div>
          ) : activeConversation.type === 'direct' && otherParticipant?.profile ? (
            <ProfilePopover
              profile={otherParticipant.profile}
              isCurrentUser={false}
              side="bottom"
              align="start"
            >
              <button className="relative cursor-pointer" aria-label={`View ${displayName}'s profile`}>
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                  <AvatarImage src={avatarUrl || undefined} alt={`${displayName}'s avatar`} />
                  <AvatarFallback className="bg-primary/10 font-medium text-primary">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <span className={cn(
                  'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                  status === 'online' && 'bg-ark-good',
                  status === 'away' && 'bg-ark-warn',
                  status === 'dnd' && 'bg-ark-crit',
                  status === 'suspended' && 'bg-ark-crit',
                  (!status || status === 'offline') && 'bg-ark-ink-3'
                )} />
              </button>
            </ProfilePopover>
          ) : (
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                <AvatarImage src={avatarUrl || undefined} alt={`${displayName}'s avatar`} />
                <AvatarFallback className="bg-primary/10 font-medium text-primary">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </div>
          )}

          <div>
            <h2 className={cn("font-semibold", isEnded && "text-muted-foreground")}>{displayName}</h2>
            {isWidget && activeConversation.widget?.workspace?.name ? (
              <p className={cn("text-xs flex items-center gap-1", isEnded ? "text-ark-crit" : "text-muted-foreground")}>
                <Building2 className="h-3 w-3" />
                {isEnded ? 'Conversation ended' : activeConversation.widget.workspace.name}
              </p>
            ) : (
              <p className={cn("text-xs", isEnded ? "text-ark-crit" : "text-muted-foreground")}>{getStatusText()}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <SearchDialog
            trigger={
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors" aria-label="Search messages">
                <Search className="h-5 w-5" aria-hidden="true" />
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors" aria-label="More options">
                <MoreVertical className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg shadow-primary/5">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowGroupInfo(true)}>
                <Info className="mr-2 h-4 w-4" />
                View Info
              </DropdownMenuItem>

              {/* Block/Unblock for direct conversations */}
              {activeConversation.type === 'direct' && otherParticipant && (
                <>
                  <DropdownMenuSeparator />
                  {isBlocked ? (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleUnblockUser}
                      disabled={isBlocking}
                    >
                      {isBlocking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="mr-2 h-4 w-4" />
                      )}
                      Unblock User
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => setShowBlockDialog(true)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {isWidget && !isEnded && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => setShowEndDialog(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    End Conversation
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the chat for the visitor. They will be offered a transcript download and will need to start a new session to chat again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEnding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndConversation}
              disabled={isEnding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isEnding ? 'Ending...' : 'End Conversation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group Info Panel */}
      {activeConversation.type === 'group' && (
        <GroupInfoPanel
          open={showGroupInfo}
          onOpenChange={setShowGroupInfo}
          conversation={activeConversation}
        />
      )}

      {/* Block User Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocking this user will hide their messages and prevent them from contacting you.
              You can unblock them later from your privacy settings or from this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              disabled={isBlocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBlocking ? 'Blocking...' : 'Block User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
