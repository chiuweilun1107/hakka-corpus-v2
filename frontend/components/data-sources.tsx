import { Fragment } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataSourceItem {
  label: string
  href: string
}

const DEFAULT_SOURCES: DataSourceItem[] = [
  { label: '萌典 Moedict 客語辭典 API', href: 'https://www.moedict.tw/' },
  { label: '臺灣客語語料庫', href: 'https://corpus.hakka.gov.tw/' },
]

interface DataSourcesProps {
  sources?: DataSourceItem[]
  className?: string
}

export function DataSources({ sources = DEFAULT_SOURCES, className }: DataSourcesProps) {
  return (
    <div className={cn('mt-8 py-4 border-t border-border flex flex-wrap items-center gap-2 text-xs text-muted-foreground', className)}>
      <span className="font-semibold text-foreground">資料來源：</span>
      {sources.map((s, i) => (
        <Fragment key={s.href}>
          {i > 0 && <span>|</span>}
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary flex items-center gap-1"
          >
            {s.label} <ExternalLink className="h-3 w-3" />
          </a>
        </Fragment>
      ))}
    </div>
  )
}
