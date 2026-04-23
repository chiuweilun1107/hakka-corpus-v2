'use client'

import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { DialectMapSection } from '@/components/dialect-map-section'
import { FestivalSection } from '@/components/festival-section'
import { SpeakerProfile } from '@/components/speaker-profile'
import { StatsSection } from '@/components/stats-section'
import { NewsSection } from '@/components/news-section'
import { Footer } from '@/components/footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <FestivalSection />
        <HeroSection />
        <DialectMapSection />
        <SpeakerProfile />
        <StatsSection />
        <NewsSection />
      </main>
      <Footer />
    </div>
  )
}
