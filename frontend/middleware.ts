import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, LOCALE_COOKIE, type Locale } from '@/i18n/config'

function pickLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value as Locale | undefined
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie
  const accept = req.headers.get('accept-language') ?? ''
  for (const tag of accept.split(',').map(s => s.split(';')[0].trim())) {
    const hit = locales.find(
      l => l.toLowerCase() === tag.toLowerCase() ||
           tag.toLowerCase().startsWith(l.toLowerCase() + '-')
    )
    if (hit) return hit
  }
  if (accept.toLowerCase().startsWith('zh')) return 'zh-TW'
  return defaultLocale
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  if (!req.cookies.get(LOCALE_COOKIE)) {
    res.cookies.set(LOCALE_COOKIE, pickLocale(req), {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
