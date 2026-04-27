'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, User, ChevronDown, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from 'next-intl'

interface NavItem {
  name: string
  href?: string
  external?: boolean
  children?: Array<{ name: string; href: string; external?: boolean }>
}

function getNavItems(t: ReturnType<typeof useTranslations<'nav'>>): NavItem[] {
  return [
    {
      name: t('categories.corpusSearch.label'),
      children: [
        { name: t('categories.corpusSearch.children.cooccurrence'), href: '/cooccurrence' },
        { name: t('categories.corpusSearch.children.wordSketch'), href: '/sketch' },
        { name: t('categories.corpusSearch.children.visualization'), href: '/viz' },
        { name: t('categories.corpusSearch.children.multimedia'), href: '/media' },
      ],
    },
    {
      name: t('categories.languageResources.label'),
      children: [
        { name: t('categories.languageResources.children.corpus'), href: '/corpus' },
        { name: t('categories.languageResources.children.examples'), href: '/examples' },
        { name: t('categories.languageResources.children.coreVocabulary'), href: 'https://corpus.hakka.gov.tw/#/corevocabulary', external: true },
        { name: t('categories.languageResources.children.gradedVocabulary'), href: 'https://corpus.hakka.gov.tw/#/gradedvocabulary', external: true },
        { name: t('categories.languageResources.children.semiAffix'), href: 'https://corpus.hakka.gov.tw/#/semiaffix', external: true },
        { name: t('categories.languageResources.children.coverage'), href: 'https://corpus.hakka.gov.tw/#/coverage', external: true },
      ],
    },
    {
      name: t('categories.aiFeatures.label'),
      children: [
        { name: t('categories.aiFeatures.children.aiAssistant'), href: '/ai', external: true },
        { name: t('categories.aiFeatures.children.segmenter'), href: 'https://corpus.hakka.gov.tw/corpus/#/segmenter', external: true },
      ],
    },
    {
      name: t('categories.news.label'),
      href: 'https://corpus.hakka.gov.tw/#/news',
      external: true,
    },
    {
      name: t('categories.about.label'),
      children: [
        { name: t('categories.about.children.aboutUs'), href: 'https://corpus.hakka.gov.tw/#/about-us', external: true },
        { name: t('categories.about.children.corpusInfo'), href: 'https://corpus.hakka.gov.tw/#/corpus-info', external: true },
        { name: t('categories.about.children.sitemap'), href: 'https://corpus.hakka.gov.tw/#/sitemap', external: true },
        { name: t('categories.about.children.copyright'), href: 'https://corpus.hakka.gov.tw/#/copyright', external: true },
      ],
    },
  ]
}

function Dropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 h-auto text-sm font-medium text-foreground/80 hover:text-primary"
      >
        {item.name}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black/5 py-1 z-[100]">
          {item.children?.map((child) => (
            child.external ? (
              <a
                key={child.name}
                href={child.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                {child.name}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            ) : (
              <Link
                key={child.name}
                href={child.href}
                className="block px-4 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                {child.name}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const t = useTranslations('nav')
  const navItems = getNavItems(t)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <header
      className={cn(
        "fixed top-0 z-[200] w-full transition-all duration-300 border-b backdrop-blur-md",
        scrolled
          ? "border-border/80 shadow-sm py-2"
          : "border-transparent py-3"
      )}
      style={{ background: 'var(--header-bg)' }}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        {t('skipToContent')}
      </a>
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <Logo size={36} className="transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground tracking-tight leading-tight">臺灣客語語料庫</span>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Taiwan Hakka Corpus</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center">
          {navItems.map((item) =>
            item.children ? (
              <Dropdown key={item.name} item={item} />
            ) : item.external ? (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {item.name}
              </a>
            ) : (
              <Link
                key={item.name}
                href={item.href || '/'}
                className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            )
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <LanguageSwitcher />
          <Button className="hidden md:flex rounded-full px-5 h-9 text-sm shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90">
            <User className="h-4 w-4 mr-1.5" />
            {t('login')}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden absolute top-full left-0 right-0 border-b shadow-xl transition-all duration-300 overflow-hidden bg-background",
          mobileMenuOpen ? "max-h-[80vh] opacity-100 border-border" : "max-h-0 opacity-0 border-transparent"
        )}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <div className="px-3 py-2 text-sm font-bold text-foreground">{item.name}</div>
                  {item.children.map((child) => (
                    child.external ? (
                      <a
                        key={child.name}
                        href={child.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-6 py-2 text-sm text-muted-foreground hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block px-6 py-2 text-sm text-muted-foreground hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    )
                  ))}
                </>
              ) : (
                item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm font-bold text-foreground hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    href={item.href || '/'}
                    className="block px-3 py-2 text-sm font-bold text-foreground hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
          ))}
          <div className="pt-3 mt-2 border-t border-border">
            <Button className="w-full rounded-full bg-primary hover:bg-primary/90">{t('login')}</Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
