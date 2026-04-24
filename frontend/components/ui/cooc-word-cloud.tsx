import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CoocItem {
  partner: string
  logdice: number
}

interface Props {
  items: CoocItem[]
  href?: (word: string) => string
  minRem?: number
  maxRem?: number
  className?: string
}

export function CoocWordCloud({
  items,
  href = (w) => `/cooccurrence?q=${encodeURIComponent(w)}`,
  minRem = 0.7,
  maxRem = 1.2,
  className,
}: Props) {
  if (items.length === 0) return null
  const maxLogdice = items[0]?.logdice ?? 1
  return (
    <div className={cn('flex flex-wrap gap-2 items-baseline justify-center', className)}>
      {items.map((c) => {
        const ratio = maxLogdice > 0 ? c.logdice / maxLogdice : 0.5
        const fontSize = minRem + ratio * (maxRem - minRem)
        return (
          <Link
            key={c.partner}
            href={href(c.partner)}
            className="text-foreground/70 hover:text-primary transition-colors"
            style={{ fontSize: `${fontSize}rem` }}
          >
            {c.partner}
          </Link>
        )
      })}
    </div>
  )
}
