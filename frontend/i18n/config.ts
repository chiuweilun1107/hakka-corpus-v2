export const locales = ['zh-TW', 'hak-sixian', 'hak-hailu', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'zh-TW'
export const LOCALE_COOKIE = 'NEXT_LOCALE'
