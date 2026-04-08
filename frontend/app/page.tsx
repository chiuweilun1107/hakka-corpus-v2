'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { Header } from '@/components/header'
import { NewsSection } from '@/components/news-section'
import { HeroSection } from '@/components/hero-section'
import { DailyQuote } from '@/components/daily-quote'
import { TrendingSection } from '@/components/trending-section'
import { StatsSection } from '@/components/stats-section'

import { Footer } from '@/components/footer'

export default function HomePage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <DailyQuote />
          <TrendingSection />
          <StatsSection />
          <NewsSection />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
