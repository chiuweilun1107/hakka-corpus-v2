'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Dialect } from './types'

type Style = 'traditional' | 'modern' | 'playful'

interface ThemeContextValue {
  dialect: Dialect
  style: Style
  setDialect: (dialect: Dialect) => void
  setStyle: (style: Style) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dialect, setDialect] = useState<Dialect>('sixian')
  const [style, setStyle] = useState<Style>('modern')

  return (
    <ThemeContext.Provider value={{ dialect, style, setDialect, setStyle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
