import { create } from 'zustand'
import { fetchCertifiedVocabBatch } from '@/lib/api'

type GradeMap = Record<string, string | null>

interface VocabGradeState {
  // cache key: "word1,word2:dialect" → GradeMap
  cache: Record<string, GradeMap>
  // inflight keys to prevent duplicate concurrent fetches
  inflight: Set<string>
  fetchGrades: (chars: string[], dialectLabel?: string) => Promise<GradeMap>
}

function cacheKey(chars: string[], dialectLabel?: string): string {
  return `${[...chars].sort().join(',')}:${dialectLabel ?? ''}`
}

export const useVocabGradeStore = create<VocabGradeState>((set, get) => ({
  cache: {},
  inflight: new Set(),

  fetchGrades: async (chars, dialectLabel) => {
    if (chars.length === 0) return {}
    const key = cacheKey(chars, dialectLabel)

    // cache hit
    const cached = get().cache[key]
    if (cached) return cached

    // deduplicate concurrent fetches for the same key
    if (get().inflight.has(key)) {
      // poll until resolved (max 3s)
      return new Promise((resolve) => {
        const id = setInterval(() => {
          const result = get().cache[key]
          if (result) { clearInterval(id); resolve(result) }
        }, 50)
        setTimeout(() => { clearInterval(id); resolve({}) }, 3000)
      })
    }

    set(s => ({ inflight: new Set([...s.inflight, key]) }))
    try {
      const results = await fetchCertifiedVocabBatch(chars, dialectLabel)
      const map: GradeMap = {}
      results.forEach(r => { map[r.word] = r.grade })
      set(s => ({
        cache: { ...s.cache, [key]: map },
        inflight: new Set([...s.inflight].filter(k => k !== key)),
      }))
      return map
    } catch {
      set(s => ({ inflight: new Set([...s.inflight].filter(k => k !== key)) }))
      return {}
    }
  },
}))
