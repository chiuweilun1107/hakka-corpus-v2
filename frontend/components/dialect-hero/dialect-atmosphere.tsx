'use client'

import { useEffect } from 'react'
import { useDialectThemeStore, type DialectTheme } from '@/lib/stores/dialect-theme-store'
import { ThemeSixianLayers } from './theme-sixian-layers'


const TOGGLES: { id: DialectTheme; label: string; sub: string; activeColor: string }[] = [
  { id: 'default', label: '一般', sub: '預設', activeColor: '#7A6048' },
  { id: 'sixian', label: '四縣', sub: '桐花雪', activeColor: '#5E7562' },
  { id: 'hailu', label: '海陸', sub: '花布情', activeColor: '#8B2C2C' },
]

export function SixianPetalLayer() {
  const { dialectTheme } = useDialectThemeStore()
  return (
    <div
      className="fixed inset-0 pointer-events-none transition-opacity duration-700"
      style={{ zIndex: -1, opacity: dialectTheme === 'sixian' ? 1 : 0 }}
      aria-hidden="true"
    >
      <ThemeSixianLayers pageWide />
    </div>
  )
}

export function DialectAtmosphere() {
  const { dialectTheme, setDialectTheme } = useDialectThemeStore()

  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('dialect-sixian', dialectTheme === 'sixian')
    html.classList.toggle('dialect-hailu', dialectTheme === 'hailu')
    return () => {
      html.classList.remove('dialect-sixian')
      html.classList.remove('dialect-hailu')
    }
  }, [dialectTheme])

  return (
    <>
      {/* 右下角浮動腔調切換器 */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
        role="radiogroup"
        aria-label="腔調主題切換"
      >
        {TOGGLES.map(({ id, label, sub, activeColor }) => {
          const active = dialectTheme === id
          return (
            <button
              key={id}
              role="radio"
              aria-checked={active}
              onClick={() => setDialectTheme(id)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white shadow-lg"
              style={{
                background: active ? activeColor : 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: active ? '#fff' : '#555',
                transform: active ? 'scale(1.1)' : 'scale(1)',
                boxShadow: active
                  ? '0 4px 20px rgba(0,0,0,0.28)'
                  : '0 2px 8px rgba(0,0,0,0.12)',
              }}
              title={`切換到${label}主題`}
            >
              <span className="text-base font-bold leading-none">{label}</span>
              <span className="text-[9px] opacity-75 mt-0.5 leading-none">{sub}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
