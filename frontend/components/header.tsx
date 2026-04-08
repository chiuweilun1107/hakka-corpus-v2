'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, User, ChevronDown, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href?: string
  external?: boolean
  children?: Array<{ name: string; href: string; external?: boolean }>
}

const navItems: NavItem[] = [
  {
    name: '語料檢索',
    children: [
      { name: '共現詞檢索', href: '/cooccurrence' },
      { name: '詞彙剖析 (Word Sketch)', href: '/sketch' },
      { name: '共現詞視覺化', href: '/viz' },
      { name: '多媒體整合', href: '/media' },
    ],
  },
  {
    name: '語言資源',
    children: [
      { name: '基礎詞彙檢索', href: 'https://corpus.hakka.gov.tw/#/corevocabulary', external: true },
      { name: '詞語分級標準詞彙', href: 'https://corpus.hakka.gov.tw/#/gradedvocabulary', external: true },
      { name: '（類）詞綴表', href: 'https://corpus.hakka.gov.tw/#/semiaffix', external: true },
      { name: '覆蓋率統計', href: 'https://corpus.hakka.gov.tw/#/coverage', external: true },
    ],
  },
  {
    name: 'AI 智慧功能',
    children: [
      { name: 'AI 助手', href: '/ai' },
      { name: '客語斷詞暨詞性標注', href: 'https://corpus.hakka.gov.tw/corpus/#/segmenter', external: true },
    ],
  },
  {
    name: '最新消息',
    href: 'https://corpus.hakka.gov.tw/#/news',
    external: true,
  },
  {
    name: '關於',
    children: [
      { name: '語料庫說明', href: 'https://corpus.hakka.gov.tw/#/about-us', external: true },
      { name: '語料庫元資訊', href: 'https://corpus.hakka.gov.tw/#/corpus-info', external: true },
      { name: '導覽地圖', href: 'https://corpus.hakka.gov.tw/#/sitemap', external: true },
      { name: '權利聲明', href: 'https://corpus.hakka.gov.tw/#/copyright', external: true },
    ],
  },
]

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
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
      >
        {item.name}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-border/80 shadow-sm py-2"
          : "bg-background border-transparent py-3"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <img src="/logo.png" alt="臺灣客語語料庫" className="h-9 w-9 rounded-xl shadow-sm transition-transform group-hover:scale-105" />
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
        <div className="flex items-center gap-2 shrink-0">
          <Button className="hidden md:flex rounded-full px-5 h-9 text-sm shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90">
            <User className="h-4 w-4 mr-1.5" />
            登入
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b shadow-xl transition-all duration-300 overflow-hidden",
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
            <Button className="w-full rounded-full bg-primary hover:bg-primary/90">登入</Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
