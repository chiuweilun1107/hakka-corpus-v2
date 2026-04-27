'use client'

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Network, CircleDot, Download } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { fetchCooc, type CoocItem } from '@/lib/api'
import { LoadingState } from '@/components/loading-state'
import { DataSources } from '@/components/data-sources'
import { PageHeader } from '@/components/page-header'
import {
  CAT_COLORS,
  CAT_LABELS,
  CATEGORY_KEYS,
  SKETCH_DATA_CACHE,
} from '@/components/viz/bubble-cloud'

// Dynamic imports (no SSR for chart components)
const BubbleCloud = dynamic(
  () => import('@/components/viz/bubble-cloud').then((m) => ({ default: m.BubbleCloud })),
  { ssr: false, loading: () => <LoadingState message="正在載入圖表..." className="h-[380px] sm:h-[560px] py-0" /> }
)

const ForceGraph = dynamic(
  () => import('@/components/viz/force-graph').then((m) => ({ default: m.ForceGraph })),
  { ssr: false, loading: () => <LoadingState message="正在載入圖表..." className="h-[380px] sm:h-[560px] py-0" /> }
)

type ViewMode = 'network' | 'bubble'
type MetricType = 'logdice' | 'mi'

function VizContent() {
  const searchParams = useSearchParams()
  const keyword = searchParams.get('q') || ''

  // State
  const [coocData, setCoocData] = useState<CoocItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('network')
  const [metric, setMetric] = useState<MetricType>('logdice')
  const [maxNetworkItems, setMaxNetworkItems] = useState(20)
  const [maxBubbleWords, setMaxBubbleWords] = useState(8)
  const [nodeMinSize, setNodeMinSize] = useState(15)
  const [nodeMaxSize, setNodeMaxSize] = useState(55)
  const [lineMinWidth, setLineMinWidth] = useState(1)
  const [lineMaxWidth, setLineMaxWidth] = useState(10)
  const [categoryState, setCategoryState] = useState<Record<string, boolean>>({})

  // Determine if we have sketch data for this keyword
  const hasSketchData = useMemo(() => {
    return SKETCH_DATA_CACHE[keyword] !== undefined || coocData.length > 0
  }, [keyword, coocData])

  // Initialize category toggles
  useEffect(() => {
    const sketchData = SKETCH_DATA_CACHE[keyword]
    const newState: Record<string, boolean> = {}
    CATEGORY_KEYS.forEach((cat) => {
      if (sketchData) {
        const count = (sketchData[cat] || []).length
        newState[cat] = count > 0
      } else {
        // For simulated data, all categories enabled
        newState[cat] = true
      }
    })
    setCategoryState(newState)
  }, [keyword])

  // Load data
  useEffect(() => {
    if (!keyword) {
      setLoading(false)
      setCoocData([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCooc(keyword, 'logdice', 50)
      .then((resp) => {
        if (cancelled) return
        setCoocData(resp.results)
        setMaxNetworkItems(resp.results.length)

        // Default to bubble if sketch data exists
        if (SKETCH_DATA_CACHE[keyword]) {
          setViewMode('bubble')
        }
      })
      .catch(() => {
        if (cancelled) return
        setError('無法載入資料，請確認伺服器已啟動。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [keyword])

  // Category toggle handler
  const handleCategoryToggle = useCallback((cat: string, enabled: boolean) => {
    setCategoryState((prev) => ({ ...prev, [cat]: enabled }))
  }, [])

  // Get category word counts for toggle labels
  const categoryCounts = useMemo(() => {
    const sketchData = SKETCH_DATA_CACHE[keyword]
    const counts: Record<string, number> = {}
    CATEGORY_KEYS.forEach((cat) => {
      if (sketchData) {
        counts[cat] = (sketchData[cat] || []).length
      } else {
        // Simulated: distribute cooc data count
        counts[cat] = Math.ceil(coocData.length / CATEGORY_KEYS.length)
      }
    })
    return counts
  }, [keyword, coocData])

  // Download bubble image (simplified approach using canvas)
  const handleDownloadImage = useCallback(() => {
    const container = document.querySelector('[data-bubble-canvas]')
    if (!container) return

    // Use SVG foreignObject fallback
    const w = (container as HTMLElement).offsetWidth
    const h = (container as HTMLElement).offsetHeight
    const svgStr =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
      `<foreignObject width="100%" height="100%">` +
      `<div xmlns="http://www.w3.org/1999/xhtml" style="background:#f7f9fa;width:${w}px;height:${h}px;position:relative;font-family:Noto Sans TC,sans-serif">` +
      container.innerHTML +
      `</div></foreignObject></svg>`

    const img = new Image()
    img.onload = () => {
      const cvs = document.createElement('canvas')
      cvs.width = w * 2
      cvs.height = h * 2
      const ctx = cvs.getContext('2d')
      if (!ctx) return
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.download = `${keyword}_word_sketch.png`
      link.href = cvs.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)
  }, [keyword])

  const viewToggle = (
    <SegmentedControl
      items={[
        { value: 'network', label: '網路圖', icon: Network },
        { value: 'bubble', label: '泡泡詞雲', icon: CircleDot },
      ]}
      value={viewMode}
      onValueChange={(v) => setViewMode(v as ViewMode)}
      variant="primary"
      size="sm"
    />
  )

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title={viewMode === 'network' ? '共現詞網路圖' : 'Word Sketch 泡泡詞雲'}
          subtitle={keyword ? (
            <>以「<span className="font-semibold text-primary">{keyword}</span>」為中心的{viewMode === 'network' ? '力導向關係圖' : '語法分類詞雲'}</>
          ) : '輸入關鍵詞後顯示視覺化圖表'}
          action={viewToggle}
        />

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {/* Main layout: chart + controls */}
          <div className="flex flex-col lg:flex-row">
            {/* Chart area */}
            <div className="flex-1 min-w-0">
              {!keyword ? (
                <div className="flex items-center justify-center text-muted-foreground text-sm h-[380px] sm:h-[560px]">
                  請在上方搜尋欄輸入關鍵詞
                </div>
              ) : loading ? (
                <LoadingState message="正在載入共現詞資料..." className="h-[380px] sm:h-[560px] py-0" />
              ) : error ? (
                <div className="flex items-center justify-center text-muted-foreground text-sm h-[380px] sm:h-[560px]">
                  {error}
                </div>
              ) : coocData.length === 0 ? (
                <div className="flex items-center justify-center text-muted-foreground text-sm h-[380px] sm:h-[560px]">
                  查無共現詞資料
                </div>
              ) : viewMode === 'network' ? (
                <div data-network-chart>
                  <ForceGraph
                    keyword={keyword}
                    data={coocData}
                    maxItems={maxNetworkItems}
                    metric={metric}
                    nodeMinSize={nodeMinSize}
                    nodeMaxSize={nodeMaxSize}
                    lineMinWidth={lineMinWidth}
                    lineMaxWidth={lineMaxWidth}
                  />
                </div>
              ) : (
                <div data-bubble-canvas>
                  <BubbleCloud
                    keyword={keyword}
                    data={coocData}
                    categoryState={categoryState}
                    maxWords={maxBubbleWords}
                  />
                </div>
              )}
            </div>

            {/* Right control panel */}
            <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-border p-4 space-y-4 bg-muted/30">
              {viewMode === 'network' ? (
                <NetworkControls
                  data={coocData}
                  maxItems={maxNetworkItems}
                  setMaxItems={setMaxNetworkItems}
                  metric={metric}
                  setMetric={setMetric}
                  nodeMinSize={nodeMinSize}
                  setNodeMinSize={setNodeMinSize}
                  nodeMaxSize={nodeMaxSize}
                  setNodeMaxSize={setNodeMaxSize}
                  lineMinWidth={lineMinWidth}
                  setLineMinWidth={setLineMinWidth}
                  lineMaxWidth={lineMaxWidth}
                  setLineMaxWidth={setLineMaxWidth}
                />
              ) : (
                <BubbleControls
                  categoryState={categoryState}
                  categoryCounts={categoryCounts}
                  onCategoryToggle={handleCategoryToggle}
                  maxWords={maxBubbleWords}
                  totalWords={coocData.length}
                  setMaxWords={setMaxBubbleWords}
                  onDownload={handleDownloadImage}
                />
              )}
            </div>
          </div>
        </div>

        <DataSources />
      </div>
    </>
  )
}

// ===== Network Controls =====
interface NetworkControlsProps {
  data: CoocItem[]
  maxItems: number
  setMaxItems: (n: number) => void
  metric: MetricType
  setMetric: (m: MetricType) => void
  nodeMinSize: number
  setNodeMinSize: (n: number) => void
  nodeMaxSize: number
  setNodeMaxSize: (n: number) => void
  lineMinWidth: number
  setLineMinWidth: (n: number) => void
  lineMaxWidth: number
  setLineMaxWidth: (n: number) => void
}

function NetworkControls({
  data, maxItems, setMaxItems, metric, setMetric,
  nodeMinSize, setNodeMinSize, nodeMaxSize, setNodeMaxSize,
  lineMinWidth, setLineMinWidth, lineMaxWidth, setLineMaxWidth,
}: NetworkControlsProps) {
  return (
    <>
      {/* Display count slider */}
      <ControlCard title="顯示數量">
        <Slider
          min={5}
          max={data.length || 20}
          value={[maxItems]}
          onValueChange={(val) => setMaxItems(val[0])}
          className="mt-2"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
          <span>5</span>
          <span className="font-semibold text-foreground">{maxItems}</span>
          <span>{data.length || 20}</span>
        </div>
      </ControlCard>

      {/* Metric toggle */}
      <ControlCard title="排序與連線依據">
        <div className="mt-1.5">
          <SegmentedControl
            items={[
              { value: 'logdice', label: 'LogDice' },
              { value: 'mi', label: 'MI-score' },
            ]}
            value={metric}
            onValueChange={(v) => setMetric(v as MetricType)}
            variant="primary"
            size="sm"
            className="w-full"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">切換後會重新排序共現詞</p>
      </ControlCard>

      {/* Node size range */}
      <ControlCard title="節點大小">
        <div className="space-y-2.5 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-7 shrink-0">最小</span>
            <Slider
              min={5}
              max={40}
              step={1}
              value={[nodeMinSize]}
              onValueChange={(val) => setNodeMinSize(val[0])}
              className="flex-1"
            />
            <span className="text-xs font-semibold text-foreground w-5 text-right shrink-0">{nodeMinSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-7 shrink-0">最大</span>
            <Slider
              min={30}
              max={100}
              step={1}
              value={[nodeMaxSize]}
              onValueChange={(val) => setNodeMaxSize(val[0])}
              className="flex-1"
            />
            <span className="text-xs font-semibold text-foreground w-5 text-right shrink-0">{nodeMaxSize}</span>
          </div>
        </div>
      </ControlCard>

      {/* Link width range */}
      <ControlCard title="連線粗細">
        <div className="space-y-2.5 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-7 shrink-0">最細</span>
            <Slider
              min={0.5}
              max={5}
              step={0.5}
              value={[lineMinWidth]}
              onValueChange={(val) => setLineMinWidth(val[0])}
              className="flex-1"
            />
            <span className="text-xs font-semibold text-foreground w-5 text-right shrink-0">{lineMinWidth}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-7 shrink-0">最粗</span>
            <Slider
              min={5}
              max={25}
              step={1}
              value={[lineMaxWidth]}
              onValueChange={(val) => setLineMaxWidth(val[0])}
              className="flex-1"
            />
            <span className="text-xs font-semibold text-foreground w-5 text-right shrink-0">{lineMaxWidth}</span>
          </div>
        </div>
      </ControlCard>
    </>
  )
}

// ===== Bubble Controls =====
interface BubbleControlsProps {
  categoryState: Record<string, boolean>
  categoryCounts: Record<string, number>
  onCategoryToggle: (cat: string, enabled: boolean) => void
  maxWords: number
  totalWords: number
  setMaxWords: (n: number) => void
  onDownload: () => void
}

function BubbleControls({
  categoryState,
  categoryCounts,
  onCategoryToggle,
  maxWords,
  totalWords,
  setMaxWords,
  onDownload,
}: BubbleControlsProps) {
  return (
    <>
      {/* Category toggles */}
      <ControlCard title="語法分類">
        <div className="space-y-2.5 mt-2">
          {CATEGORY_KEYS.map((cat) => {
            const color = CAT_COLORS[cat]
            const label = CAT_LABELS[cat] || cat
            const count = categoryCounts[cat] || 0
            const disabled = count === 0
            return (
              <div key={cat} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-foreground truncate">{label}</span>
                  <span className="text-[10px] text-muted-foreground">({count})</span>
                </div>
                <Switch
                  checked={categoryState[cat] ?? false}
                  onCheckedChange={(checked) => onCategoryToggle(cat, checked)}
                  disabled={disabled}
                />
              </div>
            )
          })}
        </div>
      </ControlCard>

      {/* Word count slider */}
      <ControlCard title="共現詞數量">
        <Slider
          min={3}
          max={Math.max(12, Math.ceil(totalWords / 5))}
          value={[maxWords]}
          onValueChange={(val) => setMaxWords(val[0])}
          className="mt-2"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
          <span>較少</span>
          <span className="font-semibold text-foreground">{maxWords}</span>
          <span>較多</span>
        </div>
      </ControlCard>

      {/* Download button */}
      <ControlCard>
        <Button
          onClick={onDownload}
          className="w-full text-xs font-semibold"
          size="sm"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          下載圖片
        </Button>
      </ControlCard>

      {/* Info card */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <strong className="block mb-1">Word Sketch 泡泡詞雲</strong>
          每個色圈代表一種語法關係，文字大小對應在該分類中的排序。中心為查詢詞。
        </p>
      </div>
    </>
  )
}

// ===== Shared ControlCard =====
function ControlCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {title && (
        <div className="text-xs font-semibold text-foreground mb-1">{title}</div>
      )}
      {children}
    </div>
  )
}

// ===== Page wrapper =====
export default function VizPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VizContent />
    </Suspense>
  )
}
