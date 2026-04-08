'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Collocation {
  word: string
  score: number
  freq: number
  relation: string
}

interface WordSketchVizProps {
  data: Collocation[]
  centralWord: string
}

const RELATION_CONFIG: Record<string, { stroke: string, fill: string, labelPos: 'top' | 'bottom' | 'left' | 'right' }> = {
  'Object_of': { stroke: '#8bc34a', fill: '#e8f5e9', labelPos: 'top' },
  'Subject_of': { stroke: '#e91e63', fill: '#fce4ec', labelPos: 'bottom' },
  'Modifies': { stroke: '#2196f3', fill: '#e3f2fd', labelPos: 'left' },
}

export function WordSketchViz({ data, centralWord }: WordSketchVizProps) {
  const size = 600
  const center = size / 2
  const radius = 240

  const relations = useMemo(() => Array.from(new Set(data.map(d => d.relation))), [data])

  // 計算每個搭配詞的精確座標
  const bubbles = useMemo(() => {
    const result: any[] = []
    
    relations.forEach((rel, relIdx) => {
      const relWords = data.filter(d => d.relation === rel)
      const relCount = relWords.length
      
      // 扇形角度計算
      const sectorAngle = (2 * Math.PI) / relations.length
      const startAngle = relIdx * sectorAngle - Math.PI / 2
      
      relWords.forEach((word, wordIdx) => {
        // 在扇形內隨機分佈但保持聚集感
        const angleOffset = (wordIdx + 0.5) * (sectorAngle / relCount)
        const angle = startAngle + angleOffset
        
        // 離中心距離：頻率越高越靠近中心
        const dist = 100 + (Math.random() * 80)
        
        result.push({
          ...word,
          x: center + Math.cos(angle) * dist,
          y: center + Math.sin(angle) * dist,
          bubbleSize: Math.max(45, Math.min(85, word.freq / 15)),
          color: RELATION_CONFIG[rel]?.stroke || '#999'
        })
      })
    })
    
    return result
  }, [data, relations, center])

  return (
    <div className="relative inline-block select-none" style={{ width: size, height: size }}>
      {/* SVG 底層：扇形區域與邊框 */}
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
          </filter>
        </defs>
        
        {relations.map((rel, idx) => {
          const sectorAngle = 360 / relations.length
          const startAngle = idx * sectorAngle - 90
          const endAngle = (idx + 1) * sectorAngle - 90
          
          // 計算弧線路徑
          const x1 = center + radius * Math.cos(startAngle * Math.PI / 180)
          const y1 = center + radius * Math.sin(startAngle * Math.PI / 180)
          const x2 = center + radius * Math.cos(endAngle * Math.PI / 180)
          const y2 = center + radius * Math.sin(endAngle * Math.PI / 180)
          
          const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`
          
          return (
            <g key={rel}>
              <path 
                d={pathData} 
                fill={RELATION_CONFIG[rel]?.fill || '#f5f5f5'} 
                stroke={RELATION_CONFIG[rel]?.stroke || '#ccc'} 
                strokeWidth="3"
                className="transition-opacity duration-300 hover:opacity-90"
              />
              {/* 類別標籤 */}
              <text
                x={center + (radius + 40) * Math.cos((startAngle + sectorAngle / 2) * Math.PI / 180)}
                y={center + (radius + 40) * Math.sin((startAngle + sectorAngle / 2) * Math.PI / 180)}
                textAnchor="middle"
                className="fill-gray-400 font-bold text-lg pointer-events-none"
              >
                {rel}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 中心巨大的核心關鍵字 */}
      <div 
        className="absolute z-30 pointer-events-none flex flex-col items-center justify-center text-center"
        style={{ left: center, top: center, transform: 'translate(-50%, -50%)' }}
      >
        <div className="text-6xl font-black text-black leading-none tracking-tighter">
          採茶
        </div>
        <div className="text-5xl font-black text-black leading-none tracking-tighter">
          {centralWord}
        </div>
      </div>

      {/* 浮動的搭配詞氣泡 */}
      {bubbles.map((word, i) => (
        <div
          key={i}
          className="absolute z-20 rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer overflow-hidden font-bold"
          style={{
            left: word.x,
            top: word.y,
            width: word.bubbleSize,
            height: word.bubbleSize,
            backgroundColor: RELATION_CONFIG[word.relation]?.fill,
            border: `1px solid ${word.color}44`,
            color: 'black',
            transform: 'translate(-50%, -50%)',
            fontSize: `${word.bubbleSize / 3.5}px`,
            filter: 'url(#shadow)'
          }}
        >
          <div className="px-1 text-center truncate">{word.word}</div>
        </div>
      ))}
    </div>
  )
}