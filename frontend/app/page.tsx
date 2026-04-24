import dynamic from 'next/dynamic'
import { Header } from '@/components/header'
import { SearchSection } from '@/components/search-section'
import { Footer } from '@/components/footer'

const DialectMapSection = dynamic(
  () => import('@/components/dialect-map-section').then(m => ({ default: m.DialectMapSection })),
  { loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-xl mx-4" /> }
)

const SpeakerProfile = dynamic(
  () => import('@/components/speaker-profile').then(m => ({ default: m.SpeakerProfile })),
  { loading: () => <div className="h-48 bg-muted/20 animate-pulse rounded-xl mx-4" /> }
)

const StatsSection = dynamic(
  () => import('@/components/stats-section').then(m => ({ default: m.StatsSection })),
  { loading: () => <div className="h-32 bg-muted/20 animate-pulse rounded-xl mx-4" /> }
)

const FestivalSection = dynamic(
  () => import('@/components/festival-section').then(m => ({ default: m.FestivalSection })),
  {
    loading: () => null,
  }
)

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <FestivalSection />
        <SearchSection />
        <DialectMapSection />
        <SpeakerProfile />
        <StatsSection />
      </main>
      <Footer />
    </div>
  )
}
