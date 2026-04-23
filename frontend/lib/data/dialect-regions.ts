/**
 * 腔調地域分佈資料 — 從 interactive-map.tsx 抽出共用，
 * 供 DialectExplorer（Tab 聯動）與 InteractiveMap（地圖 marker）共同使用
 */

import { Dialect } from '@/lib/types'

type TipDir = 'left' | 'right' | 'top' | 'bottom'

export interface DialectLocation {
  coords: [number, number]
  label: string
  labelEn: string
  tipDir: TipDir
}

export interface DialectDistributionEntry {
  locations: DialectLocation[]
  color: string
}

export const DIALECT_DISTRIBUTION: Record<Dialect, DialectDistributionEntry> = {
  sixian: {
    locations: [
      { coords: [24.56, 120.82], label: '苗栗', labelEn: 'Miaoli', tipDir: 'left' },
      { coords: [22.65, 120.52], label: '屏東六堆', labelEn: 'Liudui, Pingtung', tipDir: 'left' },
      { coords: [23.15, 121.15], label: '臺東縱谷', labelEn: 'Taitung Rift Valley', tipDir: 'right' },
      { coords: [24.95, 121.22], label: '桃園中壢', labelEn: 'Zhongli, Taoyuan', tipDir: 'right' },
    ],
    color: 'bg-[#009688]',
  },
  hailu: {
    locations: [
      { coords: [24.81, 121.05], label: '新竹', labelEn: 'Hsinchu', tipDir: 'right' },
      { coords: [24.93, 121.08], label: '桃園新屋', labelEn: 'Xinwu, Taoyuan', tipDir: 'top' },
      { coords: [23.85, 121.50], label: '花蓮鳳林', labelEn: 'Fenglin, Hualien', tipDir: 'right' },
    ],
    color: 'bg-[#4CAF50]',
  },
  dapu: {
    locations: [
      { coords: [24.26, 120.83], label: '東勢', labelEn: 'Dongshi', tipDir: 'left' },
      { coords: [24.40, 120.75], label: '卓蘭', labelEn: 'Zhuolan', tipDir: 'left' },
    ],
    color: 'bg-[#E91E63]',
  },
  raoping: {
    locations: [
      { coords: [24.87, 121.02], label: '竹北', labelEn: 'Zhubei', tipDir: 'left' },
      { coords: [24.03, 120.54], label: '員林', labelEn: 'Yuanlin', tipDir: 'left' },
    ],
    color: 'bg-[#FF9800]',
  },
  zhaoan: {
    locations: [
      { coords: [23.77, 120.35], label: '崙背', labelEn: 'Lunbei', tipDir: 'left' },
    ],
    color: 'bg-[#3F51B5]',
  },
  sihai: {
    locations: [
      { coords: [25.05, 121.25], label: '桃園', labelEn: 'Taoyuan', tipDir: 'right' },
      { coords: [23.40, 121.40], label: '花蓮玉里', labelEn: 'Yuli, Hualien', tipDir: 'right' },
    ],
    color: 'bg-[#03A9F4]',
  },
}

/** label → Dialect 反查表（供 InteractiveMap marker click 聯動 DialectExplorer） */
export const LABEL_TO_DIALECT: Record<string, Dialect> = Object.entries(
  DIALECT_DISTRIBUTION
).reduce<Record<string, Dialect>>((acc, [code, entry]) => {
  for (const loc of entry.locations) {
    acc[loc.label] = code as Dialect
  }
  return acc
}, {})
