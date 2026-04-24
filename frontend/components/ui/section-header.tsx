import { HakkaLabel } from '@/components/ui/hakka-label'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  hakka?: boolean   // default true，用 HakkaLabel 包標題（顯示羅馬拼音）
  action?: React.ReactNode
  icon?: LucideIcon
  variant?: 'hero' | 'section'  // hero=置中（預設）；section=左標右action
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  hakka = true,
  action,
  icon: Icon,
  variant = 'hero',
  className,
}: SectionHeaderProps) {
  if (variant === 'section') {
    return (
      <div className={cn('flex justify-between items-center', className)}>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-1.5">
          {Icon && <Icon size={15} className="text-primary" />}
          {hakka ? <HakkaLabel text={title} /> : title}
        </h2>
        {action && <div>{action}</div>}
      </div>
    )
  }

  return (
    <div className={cn('mb-10 text-center', className)}>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        {Icon && <Icon size={24} className="inline-block mr-2 text-primary" />}
        {hakka ? <HakkaLabel text={title} /> : title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
