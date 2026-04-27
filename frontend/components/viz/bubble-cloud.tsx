'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { CoocItem } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Plus, Minus, LocateFixed } from 'lucide-react'

// ===== Constants =====
const CAT_COLORS: Record<string, string> = {
  Subject_of: '#f472b6',
  Object_of: '#34d399',
  Modifies: '#60a5fa',
  N_Modifier: '#fb923c',
  Possession: '#a78bfa',
}

const CAT_LABELS: Record<string, string> = {
  Modifies: '修飾 (Modifies)',
  N_Modifier: '名詞修飾語 (N_Modifier)',
  Subject_of: '主語 (Subject_of)',
  Object_of: '賓語 (Object_of)',
  Possession: '領屬 (Possession)',
}

const CAT_LABELS_SHORT: Record<string, string> = {
  Modifies: '修飾',
  N_Modifier: '名修語',
  Subject_of: '主語',
  Object_of: '賓語',
  Possession: '領屬',
}

const SKETCH_DATA_CACHE: Record<string, Record<string, string[]>> = {
  '客家': {
    Modifies: ['文化節', '族群', '鄉親', '山歌', '文物館', '歌謠', '美食', '民謠', '本色'],
    N_Modifier: ['榮興', '美濃', '寶島', '永定', '全美', '中原', '東勢', '新竹縣', '鄭榮興'],
    Subject_of: ['採茶', '小炒', '醃漬', '講古', '現身', '說唱', '開館', '料理', '口述', '炒', '掛牌'],
    Object_of: ['品嚐', '發揚', '演唱', '保存', '認識', '變成', '展現', '非', '演出', '接見', '成立', '推出'],
    Possession: ['夜'],
  },
}

const CATEGORY_KEYS = Object.keys(CAT_COLORS)

// ===== Types =====
interface BubbleCloudProps {
  keyword: string
  data: CoocItem[]
  categoryState: Record<string, boolean>
  maxWords: number
}

interface PlacedBubble {
  word: string
  x: number
  y: number
  r: number
  ratio: number
  cat: string
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  word: string
  cat: string
  logdice: string
  mi: string
  count: string
}

// ===== Helpers =====
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount))
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount))
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount))
  return `rgb(${r},${g},${b})`
}

// ===== Component =====
export function BubbleCloud({ keyword, data, categoryState, maxWords }: BubbleCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, word: '', cat: '', logdice: '-', mi: '-', count: '-',
  })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dimensions, setDimensions] = useState({ w: 700, h: 560 })

  // Observe container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ w: Math.round(width), h: Math.round(height) })
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Build cooc lookup map
  const coocMap = useMemo(() => {
    const map: Record<string, CoocItem> = {}
    data.forEach((d) => { map[d.partner] = d })
    return map
  }, [data])

  // Distribute cooc data across grammar categories (deduplicated)
  const sketchData = useMemo(() => {
    const simulated: Record<string, string[]> = {}
    CATEGORY_KEYS.forEach((cat) => { simulated[cat] = [] })
    const seen = new Set<string>([keyword])
    data.forEach((d, i) => {
      if (seen.has(d.partner)) return
      seen.add(d.partner)
      const cat = CATEGORY_KEYS[i % CATEGORY_KEYS.length]
      simulated[cat].push(d.partner)
    })
    return simulated
  }, [keyword, data])

  // Calculate layout
  const layout = useMemo(() => {
    const containerW = dimensions.w
    const containerH = dimensions.h
    const centerX = containerW / 2
    const centerY = containerH / 2
    const kwRadius = 30

    // Active categories
    const activeCats = CATEGORY_KEYS.filter(
      (cat) => categoryState[cat] && sketchData[cat] && sketchData[cat].length > 0
    )
    const numCats = activeCats.length
    if (numCats === 0) return { activeCats: [], catBubbles: {}, sectorAngles: [], pieR: 0, centerX, centerY }

    const startAngle = -Math.PI / 2

    // Bubble sizes per category
    const isMobile = containerW < 640
    const catBubbles: Record<string, Array<{ word: string; r: number; ratio: number; x: number; y: number }>> = {}
    activeCats.forEach((cat) => {
      const words = sketchData[cat].slice(0, maxWords)
      catBubbles[cat] = words.map((word, wi) => {
        const ratio = 1 - wi / Math.max(words.length, 1)
        return { word, r: (isMobile ? 13 : 16) + ratio * (isMobile ? 18 : 26), ratio, x: 0, y: 0 }
      })
    })

    // Sector angles proportional to total bubble area
    const catAreas: Record<string, number> = {}
    let totalArea = 0
    activeCats.forEach((cat) => {
      let area = 0
      catBubbles[cat].forEach((b) => { area += Math.PI * b.r * b.r })
      catAreas[cat] = area
      totalArea += area
    })

    const minAngle = 0.25
    const remainAngle = 2 * Math.PI - numCats * minAngle
    const sectorAngles: Array<{ start: number; end: number }> = []
    let currentAngle = startAngle
    activeCats.forEach((cat) => {
      const proportion = totalArea > 0 ? catAreas[cat] / totalArea : 1 / numCats
      const angle = minAngle + proportion * remainAngle
      sectorAngles.push({ start: currentAngle, end: currentAngle + angle })
      currentAngle += angle
    })

    // Greedy circle packing
    const allPlaced: Array<{ x: number; y: number; r: number }> = []

    function overlaps(cx: number, cy: number, cr: number): boolean {
      for (let i = 0; i < allPlaced.length; i++) {
        const p = allPlaced[i]
        const dx = cx - p.x
        const dy = cy - p.y
        if (Math.sqrt(dx * dx + dy * dy) < cr + p.r + 3) return true
      }
      const dkw = Math.sqrt((cx - centerX) ** 2 + (cy - centerY) ** 2)
      if (dkw < cr + kwRadius + 5) return true
      return false
    }

    function inSector(cx: number, cy: number, cr: number, s1: number, s2: number, maxR: number): boolean {
      const dist = Math.sqrt((cx - centerX) ** 2 + (cy - centerY) ** 2)
      if (dist + cr > maxR - 2) return false
      if (dist < kwRadius + cr + 5) return false
      let ang = Math.atan2(cy - centerY, cx - centerX)
      while (ang < s1 - 0.01) ang += 2 * Math.PI
      while (ang > s1 + 2 * Math.PI) ang -= 2 * Math.PI
      const angMargin = dist > cr ? Math.atan2(cr, Math.sqrt(dist * dist - cr * cr)) : Math.PI / 4
      if (ang - angMargin < s1 + 0.02) return false
      if (ang + angMargin > s2 - 0.02) return false
      return true
    }

    let pieR = Math.min(containerW, containerH) * (isMobile ? 0.36 : 0.40)

    for (let attempt = 0; attempt < 5; attempt++) {
      allPlaced.length = 0
      let allFound = true

      for (let ci = 0; ci < activeCats.length; ci++) {
        const cat = activeCats[ci]
        const s1 = sectorAngles[ci].start
        const s2 = sectorAngles[ci].end
        const bubbles = catBubbles[cat]

        for (let bi = 0; bi < bubbles.length; bi++) {
          const b = bubbles[bi]
          let found = false

          for (let distStep = kwRadius + b.r + 8; distStep < pieR - b.r; distStep += 5) {
            const angPad = distStep > b.r ? Math.atan2(b.r + 4, Math.sqrt(distStep * distStep - b.r * b.r)) : 0.5
            for (let angOff = angPad + 0.03; angOff < (s2 - s1) - angPad; angOff += 0.06) {
              const tryAng = s1 + angOff
              if (tryAng > s2 - angPad) break
              const tx = centerX + distStep * Math.cos(tryAng)
              const ty = centerY + distStep * Math.sin(tryAng)
              if (inSector(tx, ty, b.r, s1, s2, pieR) && !overlaps(tx, ty, b.r)) {
                b.x = tx
                b.y = ty
                allPlaced.push({ x: tx, y: ty, r: b.r })
                found = true
                break
              }
            }
            if (found) break
          }

          if (!found) {
            const mid = (s1 + s2) / 2
            b.x = centerX + pieR * 0.6 * Math.cos(mid)
            b.y = centerY + pieR * 0.6 * Math.sin(mid)
            allPlaced.push({ x: b.x, y: b.y, r: b.r })
            allFound = false
          }
        }
      }
      if (allFound) break
      pieR += 30
    }

    return { activeCats, catBubbles, sectorAngles, pieR, centerX, centerY }
  }, [keyword, sketchData, categoryState, maxWords, dimensions])

  const handleBubbleMouseEnter = useCallback((
    e: React.MouseEvent,
    word: string,
    cat: string,
  ) => {
    const stats = coocMap[word]
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltip({
      visible: true,
      x: rect.right + 8,
      y: rect.top,
      word,
      cat: CAT_LABELS[cat] || cat,
      logdice: stats ? stats.logdice.toFixed(2) : '-',
      mi: stats ? stats.mi_score.toFixed(3) : '-',
      count: stats ? String(stats.co_count) : '-',
    })
  }, [coocMap])

  const handleBubbleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  const { activeCats, catBubbles, sectorAngles, pieR, centerX, centerY } = layout

  const isMobile = dimensions.w < 640
  const chartHeight = isMobile ? 380 : 560

  if (activeCats.length === 0 && data.length > 0) {
    return (
      <div ref={containerRef} className="w-full relative" style={{ height: chartHeight }}>
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          請開啟至少一個語法分類
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div ref={containerRef} className="w-full relative" style={{ height: chartHeight }}>
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          查無共現詞資料
        </div>
      </div>
    )
  }

  const containerW = dimensions.w
  const containerH = dimensions.h

  return (
    <div ref={containerRef} className="w-full relative overflow-hidden" style={{ height: chartHeight }}>
      {/* Zoomable inner area */}
      <div
        className="w-full relative transition-transform duration-200"
        style={{
          height: containerH,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }}
      >
        {/* SVG sector backgrounds */}
        <svg
          className="absolute left-0 top-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${containerW} ${containerH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {activeCats.map((cat, ci) => {
            const color = CAT_COLORS[cat]
            const a1 = sectorAngles[ci].start
            const a2 = sectorAngles[ci].end
            const x1 = centerX + pieR * Math.cos(a1)
            const y1 = centerY + pieR * Math.sin(a1)
            const x2 = centerX + pieR * Math.cos(a2)
            const y2 = centerY + pieR * Math.sin(a2)
            const large = (a2 - a1) > Math.PI ? 1 : 0
            const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${pieR} ${pieR} 0 ${large} 1 ${x2} ${y2} Z`
            return (
              <path
                key={cat}
                d={d}
                fill={color}
                fillOpacity={0.1}
                stroke={color}
                strokeOpacity={0.25}
                strokeWidth={1.5}
              />
            )
          })}
        </svg>

        {/* Word bubbles */}
        {activeCats.map((cat) => {
          const color = CAT_COLORS[cat]
          return catBubbles[cat].map((b) => {
            const diameter = b.r * 2
            const fontSize = Math.max(10, Math.round(b.r * 0.55))
            return (
              <div
                key={`${cat}-${b.word}`}
                className="absolute rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 z-[1] hover:scale-[1.15] hover:z-20"
                style={{
                  left: b.x - b.r,
                  top: b.y - b.r,
                  width: diameter,
                  height: diameter,
                  background: hexToRgba(color, 0.2 + b.ratio * 0.15),
                  border: `2px solid ${hexToRgba(color, 0.4)}`,
                }}
                onMouseEnter={(e) => handleBubbleMouseEnter(e, b.word, cat)}
                onMouseLeave={handleBubbleMouseLeave}
              >
                <span
                  className="pointer-events-none font-bold"
                  style={{
                    fontSize,
                    color: darkenColor(color, 0.45),
                    textShadow: '0 0 3px rgba(255,255,255,0.8)',
                  }}
                >
                  {b.word}
                </span>
              </div>
            )
          })
        })}

        {/* Category labels */}
        {activeCats.map((cat, ci) => {
          const color = CAT_COLORS[cat]
          const mid = (sectorAngles[ci].start + sectorAngles[ci].end) / 2
          let lx = centerX + (pieR + 16) * Math.cos(mid)
          let ly = centerY + (pieR + 16) * Math.sin(mid)
          lx = Math.max(5, Math.min(containerW - (isMobile ? 60 : 120), lx))
          ly = Math.max(5, Math.min(containerH - 20, ly))
          return (
            <div
              key={`label-${cat}`}
              className="absolute whitespace-nowrap pointer-events-none"
              style={{
                left: lx,
                top: ly,
                fontSize: isMobile ? 11 : 13,
                fontWeight: 600,
                color,
                opacity: 0.7,
              }}
            >
              {isMobile ? (CAT_LABELS_SHORT[cat] || cat) : (CAT_LABELS[cat] || cat)}
            </div>
          )
        })}

        {/* Center keyword */}
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: centerX,
            top: centerY,
            transform: 'translate(-50%, -50%)',
            fontSize: 36,
            fontWeight: 900,
            color: '#1a3a3a',
            textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff',
          }}
        >
          {keyword}
        </div>
      </div>

      {/* Tooltip (fixed position) */}
      {tooltip.visible && (
        <div
          className="fixed z-[999] bg-white/97 border border-gray-200 rounded-lg px-3.5 py-2.5 shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-bold text-sm mb-1">{tooltip.word}</div>
          <div className="text-[10px] text-gray-400 mb-1">{tooltip.cat}</div>
          <div className="text-xs text-gray-600">
            LogDice: <strong>{tooltip.logdice}</strong>
          </div>
          <div className="text-xs text-gray-600">
            MI-score: <strong>{tooltip.mi}</strong>
          </div>
          <div className="text-xs text-gray-600">
            共現次數: <strong>{tooltip.count}</strong>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoomLevel((z) => Math.min(3, z * 1.2))}
          title="放大"
          className="w-9 h-9 rounded-t-md rounded-b-none border-b-0 shadow-sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoomLevel((z) => Math.max(0.4, z * 0.8))}
          title="縮小"
          className="w-9 h-9 rounded-none border-b-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoomLevel(1)}
          title="重新定位"
          className="w-9 h-9 rounded-b-md rounded-t-none"
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Export constants for parent usage
export { CAT_COLORS, CAT_LABELS, CATEGORY_KEYS, SKETCH_DATA_CACHE }
