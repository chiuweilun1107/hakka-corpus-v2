'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Play, Image, Globe, ExternalLink, Loader2 } from 'lucide-react'
import { PageLayout } from '@/components/page-layout'
import { PageSearchBar } from '@/components/page-search-bar'
import { fetchYoutube, fetchImages, fetchCooc, type CoocItem } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface CoocImage {
  word: string
  thumb: string
  query: string
}

interface CoocVideo {
  word: string
  query: string
  video: { id: string; title: string; channel: string; thumbnail: string; duration?: string; views?: string } | null
}

function MediaContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [coocWords, setCoocWords] = useState<CoocItem[]>([])
  const [coocImages, setCoocImages] = useState<CoocImage[]>([])
  const [coocVideos, setCoocVideos] = useState<CoocVideo[]>([])
  const [loadingImg, setLoadingImg] = useState(true)
  const [loadingYT, setLoadingYT] = useState(true)
  const [embeddedVideoId, setEmbeddedVideoId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!q) return

    // 1. Load cooc words
    let words: CoocItem[] = []
    try {
      const cooc = await fetchCooc(q, 'logdice', 6)
      words = Array.isArray(cooc) ? cooc : (cooc?.results ?? [])
      setCoocWords(words)
    } catch {
      setCoocWords([])
    }

    const topWords = words.slice(0, 6)

    // 2. Google Images: 每個共現詞各搜一張圖
    setLoadingImg(true)
    try {
      const imgResults = await Promise.all(
        topWords.map(async (w) => {
          const searchQ = `${q} ${w.partner}`
          try {
            const imgs = await fetchImages(searchQ, 1)
            const arr = Array.isArray(imgs) ? imgs : []
            return { word: w.partner, thumb: arr[0]?.thumb || '', query: searchQ }
          } catch {
            return { word: w.partner, thumb: '', query: searchQ }
          }
        })
      )
      setCoocImages(imgResults)
    } catch {
      setCoocImages([])
    } finally {
      setLoadingImg(false)
    }

    // 3. YouTube: 每個共現詞各搜一部影片
    setLoadingYT(true)
    try {
      const ytResults = await Promise.all(
        topWords.map(async (w) => {
          const searchQ = `${q} ${w.partner}`
          try {
            const vids = await fetchYoutube(searchQ, 1)
            const arr = Array.isArray(vids) ? vids : []
            return { word: w.partner, query: searchQ, video: arr[0] || null }
          } catch {
            return { word: w.partner, query: searchQ, video: null }
          }
        })
      )
      setCoocVideos(ytResults)
    } catch {
      setCoocVideos([])
    } finally {
      setLoadingYT(false)
    }
  }, [q])

  useEffect(() => { loadData() }, [loadData])

  return (
    <>
      <PageSearchBar defaultQuery={q} targetPath="/media" />

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* ===== Google 網頁搜尋 ===== */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Google 網頁搜尋</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {q ? `點擊搜尋「${q} + 共現詞」的 Google 網頁結果` : '輸入關鍵詞後顯示搜尋結果'}
          </p>
          {q ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(q)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {q}（關鍵詞）
                </div>
              </a>
              {coocWords.slice(0, 5).map((w) => (
                <a
                  key={w.partner}
                  href={`https://www.google.com/search?q=${encodeURIComponent(q + ' ' + w.partner)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {w.partner}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                    LogDice {w.logdice.toFixed(2)}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-muted/40 mx-auto mb-2" />
                  <div className="h-4 bg-muted/30 rounded w-16 mx-auto" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== Google 圖片搜尋 ===== */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Google 圖片搜尋</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {q ? `點擊搜尋「${q} + 共現詞」相關圖片` : '輸入關鍵詞後顯示相關圖片'}
          </p>
          {q ? (
            loadingImg ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">搜尋圖片中...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {coocImages.map((item) => (
                  <a
                    key={item.word}
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      {item.thumb ? (
                        <img
                          src={item.thumb}
                          alt={item.query}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          點擊搜尋
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium text-foreground truncate">{item.query}</div>
                      <div className="text-xs text-muted-foreground mt-1">點擊查看更多 Google 圖片</div>
                    </div>
                  </a>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                  <div className="aspect-video bg-muted/30" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-3 bg-muted/20 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== YouTube 客語影片 ===== */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">YouTube 客語影片</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {q ? `與「${q}」相關的客語影片資源` : '輸入關鍵詞後顯示相關影片'}
          </p>
          {q ? (
            loadingYT ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">搜尋影片中...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coocVideos.map((item) => (
                  <div
                    key={item.word}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    {item.video ? (
                      <>
                        <div className="relative aspect-video bg-black">
                          {embeddedVideoId === item.video.id ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${item.video.id}?autoplay=1`}
                              className="absolute inset-0 w-full h-full border-none"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          ) : (
                            <Button
                              variant="ghost"
                              className="w-full h-full relative group p-0 rounded-none"
                              onClick={() => setEmbeddedVideoId(item.video!.id)}
                            >
                              <img
                                src={item.video.thumbnail}
                                alt={item.video.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-10 bg-red-600/90 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                              {item.video.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                  {item.video.duration}
                                </div>
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-xs text-primary font-semibold mb-1">
                            {q} + {item.word}
                          </div>
                          <div className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
                            {item.video.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.video.channel}
                            {item.video.views && ` -- ${item.video.views}`}
                          </div>
                        </div>
                      </>
                    ) : (
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="h-36 bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">
                          點擊搜尋 YouTube
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-semibold text-foreground">{item.query}</div>
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                  <div className="aspect-video bg-muted/30 flex items-center justify-center">
                    <Play className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-3 bg-muted/20 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Data sources */}
        <div className="py-4 border-t border-border flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">資料來源：</span>
          <a href="https://www.moedict.tw/" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
            萌典 Moedict <ExternalLink className="h-3 w-3" />
          </a>
          <span>|</span>
          <a href="https://corpus.hakka.gov.tw/" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
            臺灣客語語料庫 <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </>
  )
}

export default function MediaPage() {
  return (
    <PageLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <MediaContent />
      </Suspense>
    </PageLayout>
  )
}
