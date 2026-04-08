'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MousePointer2 } from 'lucide-react'
import { DIALECTS, Dialect } from '@/lib/types'
import { cn } from '@/lib/utils'

const DIALECT_COLORS: Record<string, string> = {
  sixian: 'bg-[#009688]',
  hailu: 'bg-[#4CAF50]',
  dapu: 'bg-[#E91E63]',
  raoping: 'bg-[#FF9800]',
  zhaoan: 'bg-[#3F51B5]',
  sihai: 'bg-[#03A9F4]',
}

// 修正 Leaflet 標記顏色與立體感
const createCustomIcon = (colorClass: string, isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-md ${colorClass}"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// 定義腔調分佈與具體縣市（含 tooltip 方向避免重疊）
type TipDir = 'left' | 'right' | 'top' | 'bottom'
interface DialectLocation { coords: [number, number]; label: string; tipDir: TipDir }
const DIALECT_DISTRIBUTION: Record<Dialect, { locations: DialectLocation[]; color: string }> = {
  sixian: {
    locations: [
      { coords: [24.56, 120.82], label: '苗栗', tipDir: 'left' },
      { coords: [22.65, 120.52], label: '屏東六堆', tipDir: 'left' },
      { coords: [23.15, 121.15], label: '臺東縱谷', tipDir: 'right' },
      { coords: [24.95, 121.22], label: '桃園中壢', tipDir: 'right' },
    ],
    color: 'bg-[#009688]',
  },
  hailu: {
    locations: [
      { coords: [24.81, 121.05], label: '新竹', tipDir: 'right' },
      { coords: [24.93, 121.08], label: '桃園新屋', tipDir: 'top' },
      { coords: [23.85, 121.50], label: '花蓮鳳林', tipDir: 'right' },
    ],
    color: 'bg-[#4CAF50]',
  },
  dapu: {
    locations: [
      { coords: [24.26, 120.83], label: '東勢', tipDir: 'left' },
      { coords: [24.40, 120.75], label: '卓蘭', tipDir: 'left' },
    ],
    color: 'bg-[#E91E63]',
  },
  raoping: {
    locations: [
      { coords: [24.87, 121.02], label: '竹北', tipDir: 'left' },
      { coords: [24.03, 120.54], label: '員林', tipDir: 'left' },
    ],
    color: 'bg-[#FF9800]',
  },
  zhaoan: {
    locations: [
      { coords: [23.77, 120.35], label: '崙背', tipDir: 'left' },
    ],
    color: 'bg-[#3F51B5]',
  },
  sihai: {
    locations: [
      { coords: [25.05, 121.25], label: '桃園', tipDir: 'right' },
      { coords: [23.40, 121.40], label: '花蓮玉里', tipDir: 'right' },
    ],
    color: 'bg-[#03A9F4]',
  },
}

function ResetButton({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  return (
    <div className="leaflet-top leaflet-left" style={{ top: 80 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={() => map.setView(center, zoom)}
          title="重新定位"
          className="flex items-center justify-center cursor-pointer"
          style={{ width: 32, height: 32, backgroundColor: 'white', border: 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function MapInitializer({ enabled }: { enabled: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (!map) return
    if (enabled) {
      map.scrollWheelZoom.enable()
      map.dragging.enable()
    } else {
      map.scrollWheelZoom.disable()
      map.dragging.disable()
    }
  }, [map, enabled])

  useEffect(() => {
    if (!map) return
    const handleResize = () => {
      if (map) map.invalidateSize()
    }
    const timer = setTimeout(() => {
      if (map) map.invalidateSize()
    }, 100)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [map])
  return null
}

interface InteractiveMapProps {
  selectedDialects: Set<string>
  onDialectToggle: (id: string) => void
}

export default function InteractiveMap({ selectedDialects, onDialectToggle }: InteractiveMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInteractionEnabled, setIsInteractionEnabled] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMounted) return <div className="h-full w-full bg-muted/20 animate-pulse" />

  const taiwanCenter: [number, number] = isMobile ? [23.6, 120.8] : [23.6, 121.0]
  const defaultZoom = isMobile ? 6.5 : 7.3

  return (
    <div
      className="h-full w-full overflow-hidden relative group cursor-default z-0"
      onClick={() => {
        if (!isInteractionEnabled) setIsInteractionEnabled(true)
      }}
    >
      <style>{`
        .leaflet-container {
          background: #fdfaf5 !important;
          z-index: 0 !important;
        }
        .permanent-dialect-label {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(4px) !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06) !important;
          border-radius: 6px !important;
          padding: 3px 8px !important;
          font-family: var(--font-sans) !important;
          pointer-events: none !important;
        }
        .leaflet-tooltip-left:before, .leaflet-tooltip-right:before,
        .leaflet-tooltip-top:before, .leaflet-tooltip-bottom:before {
          display: none !important;
        }
        .leaflet-bar {
          border: none !important;
          border-radius: 10px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06) !important;
          overflow: hidden !important;
        }
        .leaflet-bar a {
          background-color: white !important;
          color: #888 !important;
          border-bottom: 1px solid #f0f0f0 !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
        }
        .leaflet-bar a:hover {
          background-color: #f8f8f8 !important;
          color: #555 !important;
        }
        .leaflet-bar a:first-child {
          border-top-left-radius: 10px !important;
          border-top-right-radius: 10px !important;
        }
        .leaflet-bar a:last-child {
          border-bottom-left-radius: 10px !important;
          border-bottom-right-radius: 10px !important;
          border-bottom: none !important;
        }
      `}</style>
      
      {!isInteractionEnabled && (
        <div className="absolute inset-0 z-10 bg-black/5 flex items-center justify-center cursor-pointer group-hover:bg-black/8 transition-colors duration-200">
          <div className="bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg ring-1 ring-black/5 flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-500">
            <MousePointer2 className="h-4 w-4 text-hakka-light-brown animate-bounce" />
            <span className="text-sm font-semibold text-hakka-light-brown">點擊地圖以進行互動</span>
          </div>
        </div>
      )}

      <MapContainer 
        key={isMobile ? 'mobile' : 'desktop'}
        center={taiwanCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={false}
        dragging={false}
        className="h-full w-full z-0"
        zoomControl={false}
        whenReady={() => setMapReady(true)}
      >
        <MapInitializer enabled={isInteractionEnabled} />
        <ZoomControl position="topleft" />
        <ResetButton center={taiwanCenter} zoom={defaultZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {mapReady && DIALECTS.map((d) => {
          const dist = DIALECT_DISTRIBUTION[d.id as Dialect]
          if (!dist) return null
          if (!selectedDialects.has(d.id)) return null

          return dist.locations.map((loc, idx) => (
            <Marker
              key={`${d.id}-${idx}`}
              position={loc.coords}
              icon={createCustomIcon(dist.color, true)}
              eventHandlers={{
                click: () => {
                  if (isInteractionEnabled) {
                    onDialectToggle(d.id)
                  }
                },
              }}
            >
              <Tooltip
                permanent
                direction={loc.tipDir}
                offset={loc.tipDir === 'left' ? [-10, 0] : loc.tipDir === 'right' ? [10, 0] : loc.tipDir === 'top' ? [0, -10] : [0, 10]}
                className="permanent-dialect-label"
              >
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dist.color}`} />
                  <span className="font-bold text-[11px] text-foreground leading-none whitespace-nowrap">{loc.label}</span>
                </div>
              </Tooltip>
            </Marker>
          ))
        })}
      </MapContainer>
      
      {/* 腔調選擇面板 */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-md ring-1 ring-black/5 p-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">腔調分佈</div>
        <div className="space-y-0.5">
          {DIALECTS.map((d) => {
            const isActive = selectedDialects.has(d.id)
            return (
              <button
                key={d.id}
                onClick={() => onDialectToggle(d.id)}
                className={cn(
                  'flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium transition-all',
                  isActive
                    ? 'bg-primary/8 text-gray-800'
                    : 'bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                )}
              >
                <span className={cn(
                  'w-2.5 h-2.5 rounded-full shrink-0 transition-opacity',
                  DIALECT_COLORS[d.id],
                  !isActive && 'opacity-40'
                )} />
                {d.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}