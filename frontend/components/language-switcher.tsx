'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setLocale } from '@/app/actions/set-locale'
import { locales, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

const LOCALE_FLAGS: Record<Locale, string> = {
  'zh-TW':       '🇹🇼',
  'hak-sixian':  '客₄',
  'hak-hailu':   '客₆',
  'en':          '🇺🇸',
}

export function LanguageSwitcher() {
  const t = useTranslations('language')
  const ta11y = useTranslations('a11y')
  const currentLocale = useLocale() as Locale
  const router = useRouter()
  const handleSelect = async (locale: Locale) => {
    if (locale === currentLocale) return
    await setLocale(locale)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-sm"
          aria-label={ta11y('switchLanguage')}
        >
          <Globe size={15} />
          <span className="hidden sm:inline">{t(currentLocale)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px] bg-background border shadow-md">
        {locales.map(locale => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleSelect(locale)}
            className={cn(
              'gap-2 cursor-pointer',
              locale === currentLocale && 'font-semibold text-primary',
            )}
          >
            <span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>
            <span>{t(locale)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
