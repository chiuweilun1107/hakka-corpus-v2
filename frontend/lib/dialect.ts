import type { Dialect } from '@/lib/types'

export const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian',
  '南四縣': 'sihai',
  '海陸': 'hailu',
  '大埔': 'dapu',
  '饒平': 'raoping',
  '詔安': 'zhaoan',
}

export const DIALECT_DISPLAY_LABEL: Record<string, string> = {
  '四縣': '四縣',
  '南四縣': '四海',
  '海陸': '海陸',
  '大埔': '大埔',
  '饒平': '饒平',
  '詔安': '詔安',
}

export function dialectFromLabel(label: string): Dialect | undefined {
  return DB_LABEL_TO_DIALECT[label]
}

export function labelFromDialect(d: Dialect): string | undefined {
  return Object.keys(DB_LABEL_TO_DIALECT).find(k => DB_LABEL_TO_DIALECT[k] === d)
}

export function uniqueDialectPinyin<T extends { dialect: string }>(arr: T[]): T[] {
  return Array.from(new Map(arr.map(p => [p.dialect, p])).values())
}

export function findActivePinyin<T extends { dialect: string }>(
  arr: T[],
  active: Dialect | null
): T | undefined {
  return arr.find(p => DB_LABEL_TO_DIALECT[p.dialect] === active)
}
