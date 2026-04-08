'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Search, User, Globe, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mainNav = [
  { name: '語料檢索', href: '/cooccurrence?q=客家' },
  { name: 'Word Sketch', href: '/sketch?q=客家' },
  { name: '視覺化', href: '/viz?q=客家' },
  { name: '多媒體整合', href: '/media?q=客家' },
  { name: 'AI 助手', href: '/ai' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled 
          ? "bg-background/90 backdrop-blur-md border-border shadow-sm py-2" 
          : "bg-background border-transparent py-4"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="臺灣客語語料庫" className="h-10 w-10 rounded-xl shadow-sm transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground tracking-tight">臺灣客語語料庫</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Taiwan Hakka Corpus</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-full border border-border/50">
          {mainNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-4 py-2 rounded-full text-sm font-medium text-foreground/80 hover:text-primary hover:bg-background transition-all"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex rounded-full hover:bg-primary/10 hover:text-primary">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex rounded-full hover:bg-primary/10 hover:text-primary">
            <Globe className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" className="hidden md:flex rounded-full px-4 border-primary/20 text-primary hover:bg-primary/5" asChild>
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              管理後台
            </Link>
          </Button>

          <Button className="hidden md:flex rounded-full px-6 shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90">
            <User className="h-4 w-4 mr-2" />
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

      <div
        className={cn(
          'lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b shadow-xl transition-all duration-300 overflow-hidden',
          mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 border-transparent'
        )}
      >
        <nav className="container mx-auto px-4 py-6 flex flex-col gap-4 overflow-y-auto">
          {mainNav.map((item) => (
            <div key={item.name} className="border-b border-border/50 pb-4 last:border-0">
              <Link
                href={item.href}
                className="text-lg font-semibold text-foreground hover:text-primary block mb-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            </div>
          ))}
          <div className="pt-4 flex gap-4">
            <Button variant="outline" className="flex-1 rounded-full border-primary/20 text-primary" asChild>
              <Link href="/admin">管理後台</Link>
            </Button>
            <Button className="flex-1 rounded-full bg-primary hover:bg-primary/90">登入系統</Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
