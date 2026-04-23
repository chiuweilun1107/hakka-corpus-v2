'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Search,
  BookOpen,
  BarChart3,
  Play,
  MessageSquare,
  Home,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Footer } from '@/components/footer'

export function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations('pageLayout')
  const tFooter = useTranslations('footer')

  const navItems = [
    { name: t('corpusSearch'), href: '/cooccurrence', icon: Search },
    { name: t('wordSketch'), href: '/sketch', icon: BookOpen },
    { name: t('visualization'), href: '/viz', icon: BarChart3 },
    { name: t('multimedia'), href: '/media', icon: Play },
    { name: t('aiAssistant'), href: '/ai', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/80">
        <div className="container mx-auto flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={36} className="transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground tracking-tight leading-tight">{tFooter('siteTitle')}</span>
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
                  href={item.href}
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
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary" title={t('backHome')} asChild>
              <Link href="/">
                <Home className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <Button variant="outline" className="hidden md:flex rounded-full px-4 border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 text-sm font-medium" asChild>
              <Link href="/admin">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                {t('adminPanel')}
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
                  href={item.href}
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

      {/* Footer — 與首頁共用 */}
      <Footer />
    </div>
  )
}
