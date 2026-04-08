'use client'

import React from 'react'
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search,
  Bell,
  UserCircle
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: '控制面板', href: '/admin', icon: LayoutDashboard },
    // { name: '語料庫管理', href: '/admin/corpus', icon: Database },
    { name: '視覺化分析', href: '/admin/analysis', icon: BarChart3 },
    { name: '系統設定', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-hakka-navy text-white hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-hakka-navy">
              <span className="font-bold">H</span>
            </div>
            <span className="font-bold tracking-tight">客語後台管理</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname === item.href 
                  ? "bg-white/10 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5 gap-3">
            <LogOut className="h-5 w-5" />
            登出系統
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜尋語料 ID、詞彙或管理員..." 
              className="border-none shadow-none focus-visible:ring-0 text-sm h-9"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">管理員 A</p>
                <p className="text-xs text-muted-foreground">語料庫總編輯</p>
              </div>
              <UserCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
