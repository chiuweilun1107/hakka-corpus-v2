import Link from 'next/link'
import { ChevronLeft, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackLinkProps {
  href: string
  label: string
  icon?: 'chevron' | 'arrow'
  className?: string
}

export function BackLink({ href, label, icon = 'chevron', className }: BackLinkProps) {
  const Icon = icon === 'arrow' ? ArrowLeft : ChevronLeft
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors', className)}
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}
