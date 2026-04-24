'use client'

interface ThemeHailuLayersProps {
  pageWide?: boolean
}

export function ThemeHailuLayers({ pageWide = false }: ThemeHailuLayersProps) {
  // 全頁模式：花布底紋低透明度鋪底，不蓋住現有內容
  const tileOpacity = pageWide ? 0.14 : 1

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 花布底紋 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/patterns/peony-tile.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: pageWide ? '320px 320px' : '280px 280px',
          opacity: tileOpacity,
        }}
      />
      {/* 全頁模式不加暗角（讓現有內容保持可讀）；hero 模式加暗角聚焦 */}
      {!pageWide && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 50% 50%, transparent 0%, rgba(74,14,14,0.45) 70%, rgba(50,8,8,0.72) 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-28"
            style={{ background: 'linear-gradient(to bottom, rgba(40,6,6,0.55), transparent)' }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32"
            style={{ background: 'linear-gradient(to top, rgba(248,246,242,1) 0%, rgba(248,246,242,0) 100%)' }}
          />
        </>
      )}
    </div>
  )
}
