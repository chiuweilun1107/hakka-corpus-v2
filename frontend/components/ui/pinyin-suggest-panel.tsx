import type { DedupedPinyinItem, PinyinSearchGroup } from '@/lib/hooks/use-pinyin-suggest'

interface Props {
  mode: 'hanzi' | 'pinyin'
  hanziItems: DedupedPinyinItem[]
  pinyinGroups: PinyinSearchGroup[]
  onSelect: (word: string) => void
}

export function PinyinSuggestPanel({ mode, hanziItems, pinyinGroups, onSelect }: Props) {
  if (mode === 'hanzi' && hanziItems.length === 0) return null
  if (mode === 'pinyin' && pinyinGroups.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-4 z-50">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {mode === 'hanzi' ? '客語拼音推薦' : '對應客語文字'}
      </div>
      <div className="space-y-1">
        {mode === 'hanzi'
          ? hanziItems.map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => onSelect(item.word)}
                className="w-full text-left rounded-lg px-2 py-2 hover:bg-primary/5 transition-colors group"
              >
                <div className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary">{item.word}</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.dialects.map((d, di) => (
                    <span
                      key={`${d.dialect}-${di}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-xs"
                    >
                      <span className="font-semibold text-primary">{d.dialect}</span>
                      <span className="text-gray-500 font-mono">{d.pinyin_full}</span>
                    </span>
                  ))}
                </div>
              </button>
            ))
          : pinyinGroups.map((group) => (
              <button
                key={group.word}
                type="button"
                onClick={() => onSelect(group.word)}
                className="w-full text-left rounded-lg px-2 py-2 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-base font-bold text-foreground group-hover:text-primary">{group.word}</span>
                  {group.dialects[0]?.definition && (
                    <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                      {group.dialects[0].definition}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.dialects.map((d, di) => (
                    <span
                      key={`${d.dialect}-${di}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-xs"
                    >
                      <span className="font-semibold text-primary">{d.dialect}</span>
                      <span className="text-gray-500 font-mono">{d.pinyin_full}</span>
                    </span>
                  ))}
                </div>
              </button>
            ))
        }
      </div>
    </div>
  )
}
