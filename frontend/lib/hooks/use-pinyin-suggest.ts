'use client'
import { useState, useEffect, useRef } from 'react'
import { fetchPinyinRecommend } from '@/lib/api'

export interface DedupedPinyinItem {
  word: string
  dialects: { dialect: string; pinyin_full: string }[]
}

export function usePinyinSuggest(query: string, isTyping: boolean) {
  const [dedupedItems, setDedupedItems] = useState<DedupedPinyinItem[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query || query.length < 1 || !isTyping) {
      setDedupedItems([])
      setShowPanel(false)
      return
    }
    const timer = setTimeout(() => {
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
            setDedupedItems(deduped)
            setShowPanel(true)
          } else {
            setDedupedItems([])
            setShowPanel(false)
          }
        })
        .catch(() => { setDedupedItems([]); setShowPanel(false) })
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

  return { dedupedItems, showPanel, setShowPanel, containerRef }
}
