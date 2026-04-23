'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RotateCcw } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { DIALECTS, type Dialect } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DIALECT_BG } from '@/lib/colors'
import { DIALECT_DISTRIBUTION } from '@/lib/data/dialect-regions'

const createCustomIcon = (colorClass: string, _isSelected: boolean) => {
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

function ResetButton({ center, zoom, title }: { center: [number, number]; zoom: number; title: string }) {
  const map = useMap()
  return (
    <div className="leaflet-top leaflet-left" style={{ top: 80 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={() => map.setView(center, zoom)}
          title={title}
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

function MapInitializer() {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    map.dragging.enable()
    map.scrollWheelZoom.disable()
  }, [map])

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
  onMarkerClick?: (dialectId: string, label: string) => void
  onShowAll?: () => void
  showLegend?: boolean
}

export default function InteractiveMap({ selectedDialects, onMarkerClick, onShowAll, showLegend = true }: InteractiveMapProps) {
  const t = useTranslations('map')
  const locale = useLocale()
  const [isMounted, setIsMounted] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
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
        <MapInitializer />
        <ZoomControl position="topleft" />
        <ResetButton center={taiwanCenter} zoom={defaultZoom} title={t('resetView')} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {mapReady && DIALECTS.map((d) => {
          const dist = DIALECT_DISTRIBUTION[d.id as Dialect]
          if (!dist) return null
          if (!selectedDialects.has(d.id)) return null

          return dist.locations.map((loc, idx) => {
            const displayLabel = locale === 'en' ? loc.labelEn : loc.label
            return (
            <Marker
              key={`${d.id}-${idx}`}
              position={loc.coords}
              icon={createCustomIcon(dist.color, true)}
              eventHandlers={{
                click: () => {
                  onMarkerClick?.(d.id, displayLabel)
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
                  <span className="font-bold text-[11px] text-foreground leading-none whitespace-nowrap">{displayLabel}</span>
                </div>
              </Tooltip>
            </Marker>
            )
          })
        })}
      </MapContainer>
      
      {showLegend && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-md ring-1 ring-black/5 p-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">{t('dialectDistribution')}</div>
          {selectedDialects.size < DIALECTS.length && (
            <button
              onClick={onShowAll}
              className="flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium bg-primary/8 hover:bg-primary/15 text-primary mb-1"
            >
              <RotateCcw className="w-3 h-3" />
              {t('showAll')}
            </button>
          )}
          <div className="space-y-0.5">
            {DIALECTS.map((d) => {
              const isActive = selectedDialects.has(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => onMarkerClick?.(d.id, locale === 'en' ? d.nameEn : d.name)}
                  className={cn(
                    'flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium transition-all',
                    isActive
                      ? 'bg-primary/8 text-gray-800'
                      : 'bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  )}
                >
                  <span className={cn(
                    'w-2.5 h-2.5 rounded-full shrink-0 transition-opacity',
                    DIALECT_BG[d.id],
                    !isActive && 'opacity-40'
                  )} />
                  {locale === 'en' ? d.nameEn : d.name}
                </button>
              )
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200/60 text-[10px] text-gray-500 leading-snug px-1">
            {t('clickMarker')}
          </div>
        </div>
      )}
    </div>
  )
}