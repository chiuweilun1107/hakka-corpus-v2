'use client'
import { useState, useEffect, useRef } from 'react'
import { fetchPinyinRecommend, fetchPinyinSearch } from '@/lib/api'

export interface DedupedPinyinItem {
  word: string
  dialects: { dialect: string; pinyin_full: string }[]
}

export interface PinyinSearchGroup {
  word: string
  dialects: { dialect: string; pinyin_full: string; definition: string | null }[]
}

type SuggestMode = 'hanzi' | 'pinyin'

function detectMode(q: string): SuggestMode {
  return /[一-鿿㐀-䶿]/.test(q) ? 'hanzi' : 'pinyin'
}

export function usePinyinSuggest(query: string, isTyping: boolean) {
  const [mode, setMode] = useState<SuggestMode>('hanzi')
  const [hanziItems, setHanziItems] = useState<DedupedPinyinItem[]>([])
  const [pinyinGroups, setPinyinGroups] = useState<PinyinSearchGroup[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query || query.length < 1 || !isTyping) {
      setHanziItems([])
      setPinyinGroups([])
      setShowPanel(false)
      return
    }

    const m = detectMode(query)
    setMode(m)

    const timer = setTimeout(() => {
      if (m === 'hanzi') {
        fetchPinyinRecommend(query)
          .then((data) => {
            if (data?.items && data.items.length > 0) {
              const deduped = data.items.reduce<DedupedPinyinItem[]>((acc, item) => {
                const existing = acc.find(i => i.word === item.word)
                if (existing) {
                  const seen = new Set(existing.dialects.map(d => d.dialect))
                  item.dialects.forEach(d => { if (!seen.has(d.dialect)) existing.dialects.push(d) })
                } else {
                  acc.push({ word: item.word, dialects: [...item.dialects] })
                }
                return acc
              }, [])
              setHanziItems(deduped)
              setPinyinGroups([])
              setShowPanel(true)
            } else {
              setHanziItems([])
              setShowPanel(false)
            }
          })
          .catch(() => { setHanziItems([]); setShowPanel(false) })
      } else {
        fetchPinyinSearch(query, 20)
          .then((data) => {
            if (data?.results && data.results.length > 0) {
              const groups = data.results.reduce<PinyinSearchGroup[]>((acc, r) => {
                const found = acc.find(g => g.word === r.word)
                const entry = { dialect: r.dialect, pinyin_full: r.pinyin_full, definition: r.definition }
                if (found) {
                  if (!found.dialects.some(d => d.dialect === r.dialect && d.pinyin_full === r.pinyin_full)) {
                    found.dialects.push(entry)
                  }
                } else {
                  acc.push({ word: r.word, dialects: [entry] })
                }
                return acc
              }, [])
              setPinyinGroups(groups)
              setHanziItems([])
              setShowPanel(true)
            } else {
              setPinyinGroups([])
              setShowPanel(false)
            }
          })
          .catch(() => { setPinyinGroups([]); setShowPanel(false) })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, isTyping])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return { mode, hanziItems, pinyinGroups, showPanel, setShowPanel, containerRef }
}
