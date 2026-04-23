import { create } from 'zustand'
import { Dialect } from '@/lib/types'

export type HubTab = 'today' | 'quote' | 'trending'

interface ExploreState {
  activeDialect: Dialect
  activeCounty: string | null
  activeWord: string | null
  activeFestival: string | null
  activeHubTab: HubTab | null
  setActiveDialect: (dialect: Dialect) => void
  setActiveCounty: (county: string | null) => void
  setActiveWord: (word: string | null) => void
  setActiveFestival: (slug: string | null) => void
  setActiveHubTab: (tab: HubTab | null) => void
}

export const useExploreStore = create<ExploreState>((set) => ({
  activeDialect: 'sixian',
  activeCounty: null,
  activeWord: null,
  activeFestival: null,
  activeHubTab: null,
  setActiveDialect: (dialect) => set({ activeDialect: dialect }),
  setActiveCounty: (county) => set({ activeCounty: county }),
  setActiveWord: (word) => set({ activeWord: word }),
  setActiveFestival: (slug) => set({ activeFestival: slug }),
  setActiveHubTab: (tab) => set({ activeHubTab: tab }),
}))
