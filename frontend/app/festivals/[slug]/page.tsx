import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FESTIVALS } from '@/lib/data/festivals'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return FESTIVALS.map((f) => ({ slug: f.slug }))
}

export default async function FestivalPage({ params }: Props) {
  const { slug } = await params
  const festival = FESTIVALS.find((f) => f.slug === slug)

  if (!festival) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">找不到此節慶</h1>
          <Button asChild variant="outline">
            <Link href="/">回首頁</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-24 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-lg mx-auto px-4">
        <div
          className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-3xl font-bold text-foreground/70 ${festival.color}`}
          aria-label={festival.iconLabel}
        >
          {festival.name.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{festival.name}</h1>
          <p className="text-muted-foreground mt-1">{festival.date}</p>
        </div>
        <p className="text-muted-foreground leading-relaxed">{festival.summary}</p>
        <div className="py-8 border-y border-dashed border-border">
          <p className="text-sm text-muted-foreground">節慶專題內容開發中，敬請期待</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/sketch?q=${encodeURIComponent(festival.name)}`}>搜尋相關詞彙</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">回首頁</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
