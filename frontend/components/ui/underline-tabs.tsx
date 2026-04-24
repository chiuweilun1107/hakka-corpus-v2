'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface TabItem {
  value: string
  label: string
  icon?: LucideIcon
  href?: string
}

export interface UnderlineTabsProps {
  items: TabItem[]
  // controlled
  value?: string
  onValueChange?: (v: string) => void
  // autoplay
  autoplay?: boolean
  autoplayInterval?: number
  pauseOnHover?: boolean
  // expose active value to parent (autoplay mode)
  onActiveChange?: (v: string) => void
  // style
  align?: 'center' | 'start'
  size?: 'sm' | 'md'
  className?: string
}

export function UnderlineTabs({
  items,
  value: controlledValue,
  onValueChange,
  autoplay = false,
  autoplayInterval = 7000,
  pauseOnHover = true,
  onActiveChange,
  align = 'center',
  size = 'md',
  className,
}: UnderlineTabsProps) {
  const pathname = usePathname()
  const paused = useRef(false)
  const [internalValue, setInternalValue] = useState(items[0]?.value ?? '')

  // Mode B: any item has href => router mode
  const isRouterMode = items.some((i) => i.href)

  const activeValue = isRouterMode
    ? (items.find((i) => i.href && pathname.startsWith(i.href.split('?')[0]))?.value ?? '')
    : (controlledValue ?? internalValue)

  const setActive = (v: string) => {
    setInternalValue(v)
    onValueChange?.(v)
    onActiveChange?.(v)
  }

  // Keep internalValue in sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  // Autoplay (Mode C) — only in non-router mode
  useEffect(() => {
    if (!autoplay || isRouterMode) return
    const tick = () => {
      if (paused.current || document.hidden) return
      setInternalValue((prev) => {
        const idx = items.findIndex((i) => i.value === prev)
        const next = items[(idx + 1) % items.length].value
        onValueChange?.(next)
        onActiveChange?.(next)
        return next
      })
    }
    const id = setInterval(tick, autoplayInterval)
    return () => clearInterval(id)
  }, [autoplay, autoplayInterval, isRouterMode, items, onActiveChange, onValueChange])

  const tabClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap font-medium',
      size === 'sm' ? 'pb-2 px-3 text-xs' : 'pb-3 px-5 text-sm',
      isActive
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
    )

  const wrapperHandlers =
    pauseOnHover && autoplay
      ? {
          onMouseEnter: () => { paused.current = true },
          onMouseLeave: () => { paused.current = false },
        }
      : {}

  return (
    <div
      className={cn(
        'flex border-b border-border/60',
        align === 'center' ? 'justify-center' : '',
        className
      )}
      {...wrapperHandlers}
    >
      {items.map((item) => {
        const isActive = isRouterMode
          ? !!(item.href && pathname.startsWith(item.href.split('?')[0]))
          : item.value === activeValue
        const Icon = item.icon
        const content = (
          <>
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {item.label}
          </>
        )
        if (item.href) {
          return (
            <Link key={item.value} href={item.href} className={tabClass(isActive)}>
              {content}
            </Link>
          )
        }
        return (
          <button
            key={item.value}
            type="button"
            className={tabClass(isActive)}
            onClick={() => setActive(item.value)}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
