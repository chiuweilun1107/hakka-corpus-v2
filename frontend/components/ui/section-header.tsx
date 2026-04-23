import { HakkaLabel } from '@/components/ui/hakka-label'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  hakka?: boolean   // default true，用 HakkaLabel 包標題（顯示羅馬拼音）
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  hakka = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-10 text-center', className)}>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        {hakka ? <HakkaLabel text={title} /> : title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  )
}
