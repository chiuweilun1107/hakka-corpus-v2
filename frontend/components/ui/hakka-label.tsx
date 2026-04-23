interface HakkaLabelProps {
  text: string
  className?: string
}

/**
 * Renders a translated string where any `(pinyin)` block is displayed
 * at 70% size with reduced opacity, keeping Hakka romanization visible
 * but visually subordinate to the Chinese characters.
 */
export function HakkaLabel({ text, className }: HakkaLabelProps) {
  const parts = text.split(/(\([^)]+\))/)

  if (parts.length === 1) {
    return className ? <span className={className}>{text}</span> : <>{text}</>
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^\([^)]+\)$/.test(part) ? (
          <span key={i} className="text-[0.72em] font-normal opacity-50 tracking-normal ml-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
}
