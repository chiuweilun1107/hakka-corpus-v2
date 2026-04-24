'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search } from 'lucide-react'
import { ThemeSixianLayers } from './theme-sixian-layers'
import { ThemeHailuLayers } from './theme-hailu-layers'
import { useDialectThemeStore, type DialectTheme } from '@/lib/stores/dialect-theme-store'

const THEME_META: Record<DialectTheme, {
  name: string
  region: string
  word: string
  wordRoman: string
  tagline: string
  cardBg: string
  cardBorder: string
  cardText: string
  pillActive: string
  pillInactive: string
}> = {
  default: {
    name: '客語',
    region: '臺灣各地',
    word: '客家',
    wordRoman: 'hak-kâ',
    tagline: '千年客語，根在臺灣',
    cardBg: 'rgba(248,246,242,0.85)',
    cardBorder: '1px solid rgba(160,140,110,0.3)',
    cardText: '#3a2e1a',
    pillActive: '#7a6340',
    pillInactive: 'rgba(122,99,64,0.18)',
  },
  sixian: {
    name: '四縣腔',
    region: '苗栗 · 新竹',
    word: '油桐花',
    wordRoman: 'yù tûng fâ',
    tagline: '春雪飄飄，山中客語正綻放',
    cardBg: 'rgba(238,242,236,0.72)',
    cardBorder: '1px solid rgba(94,117,98,0.3)',
    cardText: '#2d3e2f',
    pillActive: '#5E7562',
    pillInactive: 'rgba(94,117,98,0.18)',
  },
  hailu: {
    name: '海陸腔',
    region: '新竹 · 桃園',
    word: '花布',
    wordRoman: 'fâ pu',
    tagline: '花布錦繡，喜慶客家正傳承',
    cardBg: 'rgba(246,236,216,0.82)',
    cardBorder: '1px solid rgba(184,134,11,0.4)',
    cardText: '#3a1a0a',
    pillActive: '#8B2C2C',
    pillInactive: 'rgba(139,44,44,0.18)',
  },
}

const TOGGLES: { id: DialectTheme; label: string }[] = [
  { id: 'sixian', label: '四縣' },
  { id: 'hailu', label: '海陸' },
]

export function DialectHero() {
  const { dialectTheme, setDialectTheme } = useDialectThemeStore()
  const meta = THEME_META[dialectTheme]
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    startTransition(() => {
      router.push(`/cooccurrence?q=${encodeURIComponent(q)}`)
    })
  }

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: 'calc(100vh - 64px)' }}
      aria-label={`${meta.name}主題入口`}
    >
      {/* ── Atmospheric background layers ── */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: dialectTheme === 'sixian' ? 1 : 0, pointerEvents: 'none' }}
      >
        <ThemeSixianLayers />
      </div>
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: dialectTheme === 'hailu' ? 1 : 0, pointerEvents: 'none' }}
      >
        <ThemeHailuLayers />
      </div>

      {/* ── Dialect toggle (top-right) ── */}
      <div
        className="absolute top-5 right-5 z-20 flex gap-1 p-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
        role="radiogroup"
        aria-label="腔調主題切換"
      >
        {TOGGLES.map(({ id, label }) => (
          <button
            key={id}
            role="radio"
            aria-checked={dialectTheme === id}
            onClick={() => setDialectTheme(id)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              background: dialectTheme === id ? meta.pillActive : THEME_META[id].pillInactive,
              color: dialectTheme === id ? '#fff' : meta.cardText,
              boxShadow: dialectTheme === id ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Centre card ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 rounded-2xl px-8 py-10 md:px-14 md:py-12 mx-4 max-w-xl w-full text-center transition-all duration-500"
        style={{
          background: meta.cardBg,
          border: meta.cardBorder,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          color: meta.cardText,
        }}
      >
        {/* Dialect name + region */}
        <div>
          <p className="text-xs tracking-widest uppercase opacity-60 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
            {meta.region}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            {meta.name}
          </h1>
        </div>

        {/* Representative word showcase */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-3xl md:text-4xl tracking-wider" style={{ fontFamily: 'var(--font-serif)', opacity: 0.85 }}>
            {meta.word}
          </span>
          <span className="text-xs tracking-wider opacity-50">{meta.wordRoman}</span>
        </div>

        {/* Tagline */}
        <p className="text-sm md:text-base opacity-70 leading-relaxed">{meta.tagline}</p>

        {/* Search input */}
        <form onSubmit={handleSearch} className="w-full flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="輸入詞彙檢索語料…"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-shadow"
            style={{
              background: 'rgba(255,255,255,0.65)',
              border: meta.cardBorder,
              color: meta.cardText,
            }}
          />
          <button
            type="submit"
            className="rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
            style={{ background: meta.pillActive }}
            aria-label="開始檢索"
          >
            <Search size={15} />
            <span className="hidden sm:inline">檢索</span>
          </button>
        </form>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-40">
        <span className="text-xs tracking-widest" style={{ color: meta.cardText }}>探索更多</span>
        <ChevronDown size={18} className="animate-bounce" style={{ color: meta.cardText }} />
      </div>
    </section>
  )
}
