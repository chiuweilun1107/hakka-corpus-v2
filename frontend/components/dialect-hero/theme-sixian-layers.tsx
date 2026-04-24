'use client'

import { useEffect, useState } from 'react'

interface PetalData {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
  drift: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const PETAL_COUNT = 40

const PETALS: PetalData[] = Array.from({ length: PETAL_COUNT }, (_, i) => ({
  id: i,
  left: seededRandom(i * 7 + 1) * 100,
  delay: seededRandom(i * 7 + 2) * 14,
  duration: 10 + seededRandom(i * 7 + 3) * 8,
  size: 13 + seededRandom(i * 7 + 4) * 10,
  opacity: 0.55 + seededRandom(i * 7 + 5) * 0.38,
  drift: (seededRandom(i * 7 + 6) - 0.5) * 120,
}))

function TungPetal({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="0" cy="-5.5" rx="3.2" ry="6"
          fill="#FDFCFB"
          transform={`rotate(${deg})`}
          opacity="0.92"
        />
      ))}
      <circle cx="0" cy="0" r="2" fill="#F4D0C0" />
    </svg>
  )
}

interface ThemeSixianLayersProps {
  pageWide?: boolean
}

export function ThemeSixianLayers({ pageWide = false }: ThemeSixianLayersProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 非全頁模式：顯示底色 + 三層山景 + 薄霧 */}
      {!pageWide && (
        <>
          <div className="absolute inset-0" style={{ backgroundColor: '#EEF2EC' }} />

          <svg
            className="absolute bottom-0 left-0 w-full"
            style={{ height: '62%' }}
            viewBox="0 0 1440 560"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 280 C 180 200 360 240 540 180 C 720 120 900 160 1080 110 C 1260 60 1380 90 1440 70 L1440 560 L0 560 Z"
              fill="#D8DFD4"
            />
          </svg>

          <svg
            className="absolute bottom-0 left-0 w-full"
            style={{ height: '50%' }}
            viewBox="0 0 1440 450"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 280 C 120 230 280 260 420 200 C 560 140 680 180 820 130 C 960 80 1080 120 1200 80 C 1320 40 1400 60 1440 50 L1440 450 L0 450 Z"
              fill="#A3B5A0"
            />
          </svg>

          <svg
            className="absolute bottom-0 left-0 w-full"
            style={{ height: '36%' }}
            viewBox="0 0 1440 325"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 200 C 90 170 200 195 320 155 C 440 115 560 145 700 110 C 840 75 960 105 1100 75 C 1240 45 1360 65 1440 55 L1440 325 L0 325 Z"
              fill="#5E7562"
            />
          </svg>

          <div
            className="absolute inset-0 hakka-mist-drift"
            style={{
              background:
                'radial-gradient(ellipse 80% 40% at 50% 60%, rgba(255,255,255,0.28) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* 全頁模式：落花飄過整個頁面，大量花瓣 */}
      {visible &&
        PETALS.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 hakka-petal-fall"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: 1,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties}
          >
            <TungPetal size={pageWide ? p.size * 1.2 : p.size} />
          </div>
        ))}

      {/* 非全頁模式：底部漸層 */}
      {!pageWide && (
        <div
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background: 'linear-gradient(to top, rgba(248,246,242,1) 0%, rgba(248,246,242,0) 100%)',
          }}
        />
      )}
    </div>
  )
}
