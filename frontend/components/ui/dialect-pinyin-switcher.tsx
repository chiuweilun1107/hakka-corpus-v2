'use client'
import { DialectPillGroup } from '@/components/ui/dialect-pill'
import { PinyinText } from '@/components/ui/pinyin-text'
import type { Dialect } from '@/lib/types'
import { dialectFromLabel } from '@/lib/dialect'

interface PinyinEntry {
  dialect: string
  pinyin_full: string
}

interface Props {
  pinyinByDialect: PinyinEntry[]
  activeDialect: Dialect | null
  onSelect: (d: Dialect) => void
  size?: 'sm' | 'md'
  emptyHint?: string
}

export function DialectPinyinSwitcher({
  pinyinByDialect,
  activeDialect,
  onSelect,
  size = 'md',
  emptyHint = '選擇腔調查看發音',
}: Props) {
  const uniqueDialects = Array.from(
    new Map(pinyinByDialect.map(p => [p.dialect, p])).values()
  )
  if (uniqueDialects.length === 0) return null

  const activePinyin = uniqueDialects.find(p => dialectFromLabel(p.dialect) === activeDialect)

  return (
    <div className="space-y-2">
      <DialectPillGroup
        dialects={uniqueDialects.map(p => p.dialect)}
        activeDialect={activeDialect}
        onSelect={onSelect}
      />
      <div className="flex items-baseline justify-center">
        {activePinyin ? (
          <PinyinText
            value={activePinyin.pinyin_full}
            size={size === 'sm' ? 'sm' : 'md'}
            breakAll
            className="max-w-3xl text-center"
          />
        ) : (
          <span className="text-sm text-muted-foreground">{emptyHint}</span>
        )}
      </div>
    </div>
  )
}
