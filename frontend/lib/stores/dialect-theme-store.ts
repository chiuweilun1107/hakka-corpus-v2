'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DialectTheme = 'default' | 'sixian' | 'hailu'

interface DialectThemeState {
  dialectTheme: DialectTheme
  setDialectTheme: (theme: DialectTheme) => void
}

export const useDialectThemeStore = create<DialectThemeState>()(
  persist(
    (set) => ({
      dialectTheme: 'default',
      setDialectTheme: (theme) => set({ dialectTheme: theme }),
    }),
    { name: 'hakka-dialect-theme' }
  )
)
