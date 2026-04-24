import type { DedupedPinyinItem } from '@/lib/hooks/use-pinyin-suggest'

interface Props {
  items: DedupedPinyinItem[]
}

export function PinyinSuggestPanel({ items }: Props) {
  if (items.length === 0) return null
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-4 z-50">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
        客語拼音推薦
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.word} className="space-y-1.5">
            <div className="text-base font-bold text-foreground">{item.word}</div>
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
          </div>
        ))}
      </div>
    </div>
  )
}
