'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Search,
  BookOpen,
  BarChart3,
  Play,
  MessageSquare,
  Home,
  LayoutDashboard,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { name: '語料檢索', href: '/cooccurrence', icon: Search },
  { name: 'Word Sketch', href: '/sketch', icon: BookOpen },
  { name: '視覺化', href: '/viz', icon: BarChart3 },
  { name: '多媒體整合', href: '/media', icon: Play },
  { name: 'AI 助手', href: '/ai', icon: MessageSquare },
]

export function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/80">
        <div className="container mx-auto flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="臺灣客語語料庫" className="h-9 w-9 rounded-xl shadow-sm transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground tracking-tight leading-tight">臺灣客語語料庫</span>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">Taiwan Hakka Corpus</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 bg-muted/40 px-1.5 py-1 rounded-full">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href + (item.href !== '/ai' ? '?q=客家' : '')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background font-medium'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary" asChild>
              <Link href="/">
                <Home className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <Button variant="outline" className="hidden md:flex rounded-full px-4 border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 text-sm font-medium" asChild>
              <Link href="/admin">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                管理後台
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden border-t border-border/50 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1 px-4 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href + (item.href !== '/ai' ? '?q=客家' : '')}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted font-medium'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-hakka-navy border-t-4 border-primary/40">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Globe className="h-4 w-4 text-white/60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">臺灣客語語料庫</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Taiwan Hakka Corpus</p>
              </div>
            </div>
            <p className="text-xs text-white/40">
              客家委員會 版權所有
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
