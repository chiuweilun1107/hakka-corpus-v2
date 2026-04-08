'use client'

import Link from 'next/link'
import { Mail, FileText, ArrowUp, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const footerLinks = [
  {
    title: '語料庫系統',
    links: [
      { name: '語料檢索系統', href: '#search' },
      { name: '客語斷詞標注', href: '#segmentation' },
      { name: '客語詞彙剖析', href: '#analysis' },
    ],
  },
  {
    title: '語言資源',
    links: [
      { name: '特色詞彙', href: '#featured' },
    ],
  },
  {
    title: '關於我們',
    links: [
      { name: '最新消息', href: '#news' },
      { name: '使用說明', href: '#guide' },
      { name: '研究團隊', href: '#team' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="flex flex-col">
      <div className="bg-hakka-navy py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-hakka-navy">
                  <svg viewBox="0 0 40 40" className="h-7 w-7" fill="currentColor">
                    <rect x="8" y="8" width="24" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <rect x="12" y="13" width="16" height="3" rx="1.5" />
                    <rect x="12" y="20" width="16" height="3" rx="1.5" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">臺灣客語語料庫</div>
                  <div className="text-xs text-white/50 uppercase tracking-widest">Taiwan Hakka Corpus</div>
                </div>
              </Link>
              <p className="text-sm text-white/60 mb-6 leading-relaxed max-w-sm">
                執行單位：國立政治大學臺灣客語語料庫團隊<br />
                指導單位：中華民國客家委員會
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/20">
                  <FileText className="h-4 w-4 mr-2" /> 權利聲明
                </Button>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/20">
                  <Mail className="h-4 w-4 mr-2" /> 意見信箱
                </Button>
              </div>
            </div>

            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-hakka-gold rounded-full" />
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-muted py-8 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs text-muted-foreground text-center md:text-left space-y-2">
            <p>客家委員會 版權所有 © Hakka Affairs Council. All Rights Reserved.</p>
            <p>242030 新北市新莊區中平路439號北棟17樓 | (02) 8995-6988</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#privacy" className="text-xs text-muted-foreground hover:underline">隱私權保護</Link>
            <Link href="#security" className="text-xs text-muted-foreground hover:underline">資訊安全</Link>
            <Button variant="outline" size="icon" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="rounded-full shadow-sm">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}