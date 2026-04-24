'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Search, BookOpen, BarChart3, Play } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { PageSearchBar } from '@/components/page-search-bar'

function SearchLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQ = searchParams.get('q') || ''
  const t = useTranslations('pageLayout')

  const navItems = [
    { name: t('corpusSearch'), href: '/cooccurrence', icon: Search },
    { name: t('wordSketch'), href: '/sketch', icon: BookOpen },
    { name: t('visualization'), href: '/viz', icon: BarChart3 },
    { name: t('multimedia'), href: '/media', icon: Play },
  ]

  const tabHref = (href: string) =>
    currentQ ? `${href}?q=${encodeURIComponent(currentQ)}` : href

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16">
        <PageSearchBar defaultQuery={currentQ} targetPath={pathname} />

        {/* 4-tab sub-nav */}
        <div className="border-b border-border/60 bg-background">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={tabHref(item.href)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all',
                      isActive
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border font-medium'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {children}
      </main>

      <Footer />
    </div>
  )
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <SearchLayoutInner>{children}</SearchLayoutInner>
    </Suspense>
  )
}
