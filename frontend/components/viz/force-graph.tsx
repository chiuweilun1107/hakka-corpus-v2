'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { CoocItem } from '@/lib/api'

// Lazy-load echarts to avoid SSR issues
let echartsModule: typeof import('echarts') | null = null
async function getEcharts() {
  if (!echartsModule) {
    echartsModule = await import('echarts')
  }
  return echartsModule
}

interface ForceGraphProps {
  keyword: string
  data: CoocItem[]
  maxItems: number
  metric: 'logdice' | 'mi'
  nodeMinSize: number
  nodeMaxSize: number
  lineMinWidth: number
  lineMaxWidth: number
}

const NODE_COLORS = [
  '#14b8a6', '#0d9488', '#0891b2', '#0284c7', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4',
]

export function ForceGraph({ keyword, data, maxItems, metric, nodeMinSize, nodeMaxSize, lineMinWidth, lineMaxWidth }: ForceGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<ReturnType<typeof import('echarts')['init']> | null>(null)

  const buildChart = useCallback(async () => {
    if (!chartRef.current || data.length === 0) return

    const echarts = await getEcharts()

    if (chartInstance.current) {
      chartInstance.current.dispose()
    }
    chartInstance.current = echarts.init(chartRef.current)
    const chart = chartInstance.current

    // Sort data by current metric, deduplicate, exclude keyword itself
    const seen = new Set<string>([keyword])
    const sorted = [...data]
      .sort((a, b) => metric === 'logdice' ? b.logdice - a.logdice : b.mi_score - a.mi_score)
      .filter((d) => {
        if (seen.has(d.partner)) return false
        seen.add(d.partner)
        return true
      })
    const filtered = sorted.slice(0, maxItems)

    // Build nodes
    const counts = filtered.map((d) => d.co_count)
    const minCount = Math.min(...counts)
    const maxCount = Math.max(...counts)
    const metrics = filtered.map((d) => metric === 'logdice' ? d.logdice : d.mi_score)
    const minMetric = Math.min(...metrics)
    const maxMetric = Math.max(...metrics)

    const nodeMin = nodeMinSize
    const nodeMax = nodeMaxSize
    const lineMin = lineMinWidth
    const lineMax = lineMaxWidth

    interface GraphNode {
      name: string
      symbolSize: number
      x?: number
      y?: number
      itemStyle: Record<string, unknown>
      label: Record<string, unknown>
      fixed?: boolean
      logdice?: number
      mi_score?: number
      co_count?: number
    }

    interface GraphLink {
      source: string
      target: string
      lineStyle: Record<string, unknown>
    }

    const nodes: GraphNode[] = [{
      name: keyword,
      symbolSize: 60,
      x: 300,
      y: 280,
      itemStyle: { color: '#007278', shadowBlur: 20, shadowColor: 'rgba(0,114,120,0.4)' },
      label: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
      fixed: true,
    }]
    const links: GraphLink[] = []

    filtered.forEach((d, i) => {
      const countRatio = maxCount > minCount ? (d.co_count - minCount) / (maxCount - minCount) : 0.5
      const size = nodeMin + countRatio * (nodeMax - nodeMin)
      const color = NODE_COLORS[i % NODE_COLORS.length]
      const metricVal = metric === 'logdice' ? d.logdice : d.mi_score
      const metricRatio = maxMetric > minMetric ? (metricVal - minMetric) / (maxMetric - minMetric) : 0.5
      const lineWidth = lineMin + metricRatio * (lineMax - lineMin)

      nodes.push({
        name: d.partner,
        symbolSize: size,
        itemStyle: { color, opacity: 1, borderColor: '#fff', borderWidth: 2 },
        label: { fontSize: Math.max(11, size / 3), color: '#374151' },
        logdice: d.logdice,
        mi_score: d.mi_score,
        co_count: d.co_count,
      })
      links.push({
        source: keyword,
        target: d.partner,
        lineStyle: { color, opacity: 0.5 + metricRatio * 0.3, width: lineWidth },
      })
    })

    chart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151', fontSize: 12 },
        formatter: (params: Record<string, unknown>) => {
          const d = params.data as GraphNode | undefined
          if (params.dataType === 'node' && d?.logdice !== undefined) {
            return (
              `<div style="font-weight:700;font-size:14px;margin-bottom:4px">${params.name}</div>` +
              `<div style="color:#6b7280;font-size:11px">` +
              `LogDice: <b>${d.logdice?.toFixed(2)}</b><br/>` +
              `MI-score: <b>${d.mi_score?.toFixed(3)}</b><br/>` +
              `共現次數: <b>${d.co_count}</b></div>`
            )
          }
          return params.name as string
        },
      },
      animationDuration: 800,
      animationEasingUpdate: 'quinticInOut',
      series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links,
        roam: true,
        draggable: true,
        force: {
          repulsion: 280,
          gravity: 0.15,
          edgeLength: [80, 200],
          friction: 0.6,
        },
        label: { show: true },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4, opacity: 0.8 },
        },
      }],
    })
  }, [keyword, data, maxItems, metric, nodeMinSize, nodeMaxSize, lineMinWidth, lineMaxWidth])

  useEffect(() => {
    buildChart()
  }, [buildChart])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  // Zoom controls
  const handleZoom = useCallback((factor: number) => {
    if (!chartInstance.current) return
    const opt = chartInstance.current.getOption() as { series: Array<{ zoom?: number }> }
    const currentZoom = opt.series?.[0]?.zoom || 1
    chartInstance.current.setOption({ series: [{ zoom: currentZoom * factor }] })
  }, [])

  const handleReset = useCallback(() => {
    buildChart()
  }, [buildChart])

  return (
    <div className="w-full relative" style={{ height: 560 }}>
      <div ref={chartRef} className="w-full h-full" />

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-0">
        <button
          onClick={() => handleZoom(1.3)}
          title="放大"
          className="w-9 h-9 border border-gray-300 bg-white rounded-t-md flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => handleZoom(0.7)}
          title="縮小"
          className="w-9 h-9 border border-gray-300 border-t-0 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={handleReset}
          title="重新定位"
          className="w-9 h-9 border border-gray-300 border-t-0 bg-white rounded-b-md flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      </div>

      {/* Loading state */}
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          查無共現詞資料
        </div>
      )}
    </div>
  )
}
