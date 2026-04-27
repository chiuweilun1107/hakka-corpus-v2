'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, BookOpen, BarChart3, Play } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { PageSearchBar } from '@/components/page-search-bar'
import { UnderlineTabs } from '@/components/ui/underline-tabs'

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
        <div className="bg-background pt-2">
          <div className="container mx-auto px-4">
            <UnderlineTabs
              items={navItems.map((item) => ({
                value: item.href,
                label: item.name,
                icon: item.icon,
                href: tabHref(item.href),
              }))}
              align="start"
              size="md"
            />
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
