import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SettingSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  accent?: boolean
}

export function SettingSection({
  title,
  description,
  children,
  className,
  accent = false,
}: SettingSectionProps) {
  return (
    <Card
      className={cn(
        'h-fit overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-lg',
        accent && 'ring-1 ring-primary/20',
        className
      )}
    >
      {accent && (
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
      )}
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-muted-foreground/80">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">{children}</CardContent>
    </Card>
  )
}
