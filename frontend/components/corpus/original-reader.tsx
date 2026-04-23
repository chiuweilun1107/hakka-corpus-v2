'use client'

import { useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export type EntityType = 'keyword' | 'person' | 'place' | 'organization'

interface HighlightSpec {
  words: string[]
  type: EntityType
}

interface OriginalReaderProps {
  content: string
  highlights?: HighlightSpec[]
  className?: string
  /** 點擊高亮詞彙時觸發 */
  onWordClick?: (word: string) => void
}

const typeClass: Record<EntityType, string> = {
  keyword:       'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100',
  person:        'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
  place:         'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100',
  organization:  'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
}

/**
 * 將 content 切成 segments，每個 segment 要嘛是純文字，要嘛是高亮詞彙。
 * 使用所有 highlights 的 word 組合 regex（逐字位置比對）。
 */
function buildSegments(content: string, highlights: HighlightSpec[]): Array<{ text: string; type?: EntityType }> {
  if (!highlights.length) return [{ text: content }]

  // 建 word → type map（同字詞若多類型重複，以第一類型為主）
  const wordTypeMap = new Map<string, EntityType>()
  for (const h of highlights) {
    for (const w of h.words) {
      const trimmed = w.trim()
      if (trimmed && !wordTypeMap.has(trimmed)) {
        wordTypeMap.set(trimmed, h.type)
      }
    }
  }

  // 依長度排序（長詞先匹配，避免被短詞切開）
  const sortedWords = Array.from(wordTypeMap.keys()).sort((a, b) => b.length - a.length)
  if (!sortedWords.length) return [{ text: content }]

  const escaped = sortedWords.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'g')

  const parts = content.split(regex)
  return parts.filter((p) => p !== '').map((p) => {
    const t = wordTypeMap.get(p)
    return t ? { text: p, type: t } : { text: p }
  })
}

export function OriginalReader({ content, highlights = [], className, onWordClick }: OriginalReaderProps) {
  const segments = useMemo(() => buildSegments(content, highlights), [content, highlights])
  const containerRef = useRef<HTMLDivElement>(null)

  // 當高亮改變時，自動 scroll 到第一個高亮詞
  useEffect(() => {
    if (highlights.length === 0) return
    const firstMark = containerRef.current?.querySelector<HTMLElement>('mark[data-highlighted]')
    if (firstMark) {
      firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlights])

  return (
    <div
      ref={containerRef}
      className={cn(
        'whitespace-pre-wrap text-foreground leading-loose text-[15px] selection:bg-primary/20',
        className,
      )}
    >
      {segments.map((seg, idx) =>
        seg.type ? (
          <mark
            key={idx}
            data-highlighted
            data-type={seg.type}
            onClick={() => onWordClick?.(seg.text)}
            className={cn(
              'rounded px-0.5 cursor-pointer transition',
              typeClass[seg.type],
            )}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={idx}>{seg.text}</span>
        ),
      )}
    </div>
  )
}
