import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { cookies } from 'next/headers'
import { locales, defaultLocale, LOCALE_COOKIE } from './config'

type Messages = Record<string, unknown>

function deepMerge(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base }
  for (const key of Object.keys(override)) {
    const b = base[key]
    const o = override[key]
    if (
      b !== null && o !== null &&
      typeof b === 'object' && typeof o === 'object' &&
      !Array.isArray(b) && !Array.isArray(o)
    ) {
      result[key] = deepMerge(b as Messages, o as Messages)
    } else {
      result[key] = o
    }
  }
  return result
}

export default getRequestConfig(async () => {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = hasLocale(locales, raw) ? raw : defaultLocale

  const messages = (await import(`../messages/${locale}.json`)).default as Messages

  if (locale === 'zh-TW') {
    return { locale, messages, now: new Date(), timeZone: 'Asia/Taipei' }
  }

  const fallback = (await import('../messages/zh-TW.json')).default as Messages
  return {
    locale,
    messages: deepMerge(fallback, messages),
    now: new Date(),
    timeZone: 'Asia/Taipei',
  }
})
