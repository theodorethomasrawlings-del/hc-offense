export const fmtPPP = (v: number | null | undefined): string => (v == null ? '–' : v.toFixed(2))

export const fmtPct = (v: number | null | undefined): string => (v == null ? '–' : `${Math.round(v * 100)}%`)

export const fmtRatio = (num: number, den: number): string => (den === 0 ? '–' : `${num}/${den}`)
