import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  const locale = await getLocale()
  const keywords = t.raw('keywords') as string[]
  return {
    title: `${t('title')} | Taiwan Hakka Corpus`,
    description: t('description'),
    keywords,
    authors: [{ name: '客家委員會' }],
    generator: 'v0.app',
    icons: { icon: '/logo.png', apple: '/logo.png' },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale.replace('-', '_'),
      type: 'website',
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1a9b9e' },
    { media: '(prefers-color-scheme: dark)', color: '#0d4d4f' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster richColors position="bottom-right" />
        <Analytics />
      </body>
    </html>
  )
}
