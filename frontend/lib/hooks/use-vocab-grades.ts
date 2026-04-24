'use client'
import { useState, useEffect } from 'react'
import { useVocabGradeStore } from '@/lib/stores/vocab-grade-store'
import { getHighestGrade } from '@/lib/text'

interface UseVocabGradesResult {
  gradeMap: Record<string, string | null>
  highestGrade: string | null
  loaded: boolean
}

export function useVocabGrades(
  chars: string[],
  dialectLabel?: string
): UseVocabGradesResult {
  const fetchGrades = useVocabGradeStore(s => s.fetchGrades)
  const cacheKey = `${[...chars].sort().join(',')}:${dialectLabel ?? ''}`
  const cached = useVocabGradeStore(s => s.cache[cacheKey])

  const [loaded, setLoaded] = useState(!!cached)
  const [gradeMap, setGradeMap] = useState<Record<string, string | null>>(cached ?? {})

  useEffect(() => {
    if (chars.length === 0) { setLoaded(true); return }

    // already in cache — instant
    if (cached) {
      setGradeMap(cached)
      setLoaded(true)
      return
    }

    setLoaded(false)
    fetchGrades(chars, dialectLabel).then(map => {
      setGradeMap(map)
      setLoaded(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const highestGrade = getHighestGrade(gradeMap)
  const hasAny = Object.values(gradeMap).some(v => v !== null)

  return {
    gradeMap,
    highestGrade: hasAny ? highestGrade : null,
    loaded,
  }
}
