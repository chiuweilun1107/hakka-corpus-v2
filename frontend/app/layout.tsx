import type { Metadata, Viewport } from 'next'
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const notoSansTC = Noto_Sans_TC({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-sans',
})

const notoSerifTC = Noto_Serif_TC({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: '臺灣客語語料庫 | Taiwan Hakka Corpus',
  description: '探索臺灣客語的豐富語言資源。提供語料檢索、斷詞標注、詞彙剖析等功能，保存與推廣客家語言文化。',
  keywords: ['客語', '客家話', 'Hakka', '語料庫', 'corpus', '四縣腔', '海陸腔', '臺灣', '語言資源'],
  authors: [{ name: '客家委員會' }],
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: '臺灣客語語料庫 | Taiwan Hakka Corpus',
    description: '探索臺灣客語的豐富語言資源',
    locale: 'zh_TW',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1a9b9e' },
    { media: '(prefers-color-scheme: dark)', color: '#0d4d4f' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${notoSansTC.variable} ${notoSerifTC.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="bottom-right" />
        <Analytics />
      </body>
    </html>
  )
}
