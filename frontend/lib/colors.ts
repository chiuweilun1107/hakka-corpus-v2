/** 腔調色（Tailwind bg class，用於 hero-section / interactive-map） */
export const DIALECT_BG: Record<string, string> = {
  sixian: 'bg-[#009688]',
  hailu: 'bg-[#4CAF50]',
  dapu: 'bg-[#E91E63]',
  raoping: 'bg-[#FF9800]',
  zhaoan: 'bg-[#3F51B5]',
  sihai: 'bg-[#03A9F4]',
}

/** 腔調色（hex，用於圖表 / Recharts） */
export const DIALECT_CHART_COLORS: Record<string, string> = {
  '四縣': '#009688',
  '海陸': '#4CAF50',
  '大埔': '#E91E63',
  '饒平': '#FF9800',
  '詔安': '#3F51B5',
  '南四縣': '#03A9F4',
}

/** 文體色（hex，用於圖表） */
export const GENRE_COLORS: Record<string, string> = {
  '散文': '#009688',
  '口語': '#6366f1',
  '歌謠': '#f59e0b',
  '戲劇': '#ef4444',
  '報導': '#8b5cf6',
}
