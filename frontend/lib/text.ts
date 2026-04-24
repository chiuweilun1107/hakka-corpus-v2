export const CJK_REGEX = /[一-鿿]/

export function splitCjkChars(text: string): string[] {
  return [...text].filter(c => CJK_REGEX.test(c))
}

export const GRADE_ORDER = ['高級', '中高級', '中級', '初級', '基礎級'] as const

export type Grade = typeof GRADE_ORDER[number]

export function getHighestGrade(gradeMap: Record<string, string | null>): string | null {
  let top: string | null = null
  for (const grade of Object.values(gradeMap)) {
    if (!grade) continue
    const idx = GRADE_ORDER.indexOf(grade as Grade)
    const topIdx = top ? GRADE_ORDER.indexOf(top as Grade) : 999
    if (idx !== -1 && idx < topIdx) top = grade
  }
  return top
}
