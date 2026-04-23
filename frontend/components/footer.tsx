'use client'

import Link from 'next/link'
import { Mail, FileText, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { useTranslations } from 'next-intl'

const footerLinkHrefs = {
  corpusSystem: {
    search: '#search',
    segmentation: '#segmentation',
    analysis: '#analysis',
  },
  languageResources: {
    featured: '#featured',
  },
  aboutUs: {
    news: '#news',
    guide: '#guide',
    team: '#team',
  },
}

export function Footer() {
  const t = useTranslations('footer')

  const footerGroups = [
    {
      titleKey: 'sections.corpusSystem.title' as const,
      links: [
        { nameKey: 'sections.corpusSystem.links.search' as const, href: footerLinkHrefs.corpusSystem.search },
        { nameKey: 'sections.corpusSystem.links.segmentation' as const, href: footerLinkHrefs.corpusSystem.segmentation },
        { nameKey: 'sections.corpusSystem.links.analysis' as const, href: footerLinkHrefs.corpusSystem.analysis },
      ],
    },
    {
      titleKey: 'sections.languageResources.title' as const,
      links: [
        { nameKey: 'sections.languageResources.links.featured' as const, href: footerLinkHrefs.languageResources.featured },
      ],
    },
    {
      titleKey: 'sections.aboutUs.title' as const,
      links: [
        { nameKey: 'sections.aboutUs.links.news' as const, href: footerLinkHrefs.aboutUs.news },
        { nameKey: 'sections.aboutUs.links.guide' as const, href: footerLinkHrefs.aboutUs.guide },
        { nameKey: 'sections.aboutUs.links.team' as const, href: footerLinkHrefs.aboutUs.team },
      ],
    },
  ]

  return (
    <footer className="flex flex-col">
      <div className="bg-hakka-navy py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <Logo size={48} />
                <div>
                  <div className="text-xl font-bold text-white">{t('siteTitle')}</div>
                  <div className="text-xs text-white/50 uppercase tracking-widest">{t('siteSubtitle')}</div>
                </div>
              </Link>
              <p className="text-sm text-white/60 mb-6 leading-relaxed max-w-sm">
                {t('executingUnit')}<br />
                {t('guidingUnit')}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/20">
                  <FileText className="h-4 w-4 mr-2" /> {t('links.rights')}
                </Button>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/20">
                  <Mail className="h-4 w-4 mr-2" /> {t('links.feedback')}
                </Button>
              </div>
            </div>

            {footerGroups.map((group) => (
              <div key={group.titleKey}>
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-hakka-gold rounded-full" />
                  {t(group.titleKey)}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.nameKey}>
                      <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                        {t(link.nameKey)}
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
            <p>{t('copyright')}</p>
            <p>{t('address')}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#privacy" className="text-xs text-muted-foreground hover:underline">{t('links.privacy')}</Link>
            <Link href="#security" className="text-xs text-muted-foreground hover:underline">{t('links.security')}</Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
              className="rounded-full shadow-sm"
              aria-label={t('backToTop')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
