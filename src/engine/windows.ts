import { isThree, SHOT_TIER } from '../domain/labels'
import type { Chunk, Game, Half, Tier } from '../domain/types'
import type { Tagged } from './streaks'

export interface Stats {
  poss: number
  pts: number
  ppp: number | null
  scores: number
  scorePct: number | null
  fga2: number
  fgm2: number
  fga3: number
  fgm3: number
  fta: number
  ftm: number
  tos: number
  toPct: number | null
  orebs: number
  efg: number | null
  /** Field-goal attempts by tier. */
  tier: Record<Tier, number>
  /** Points from shots (and the FTs on them) by tier. */
  tierPts: Record<Tier, number>
  /** Top + second tier attempts over all attempts. */
  desirablePct: number | null
  paintTouches: number
  /** Possessions with at least one paint touch. */
  paintPoss: number
  reversals: number
  runs: number
  droughts: number
}

/** The shots inside a possession: its chunks, or the possession itself when it had one. */
export function chunksOf(t: Pick<Tagged, 'chunks' | 'shot' | 'result' | 'ftm' | 'fta' | 'family' | 'action' | 'paintTouches' | 'reversals'>): Chunk[] {
  if (t.chunks?.length) return t.chunks
  return [{ shot: t.shot, result: t.result, ftm: t.ftm ?? 0, fta: t.fta ?? 0, family: t.family, action: t.action, paintTouches: t.paintTouches ?? 0, reversals: t.reversals ?? 0, cont: null }]
}

const isFGA = (c: Chunk) => c.shot !== 'NONE' && (c.result === 'MADE' || c.result === 'MISSED')

export function stats(ts: Tagged[]): Stats {
  const s: Stats = {
    poss: ts.length, pts: 0, ppp: null, scores: 0, scorePct: null,
    fga2: 0, fgm2: 0, fga3: 0, fgm3: 0, fta: 0, ftm: 0, tos: 0, toPct: null, orebs: 0, efg: null,
    tier: { TOP: 0, SECOND: 0, THIRD: 0 }, tierPts: { TOP: 0, SECOND: 0, THIRD: 0 }, desirablePct: null,
    paintTouches: 0, paintPoss: 0, reversals: 0, runs: 0, droughts: 0,
  }
  for (const t of ts) {
    s.pts += t.points
    if (t.isScore) s.scores += 1
    if (t.run) s.runs += 1
    if (t.drought) s.droughts += 1
    s.orebs += t.orebs ?? 0
    let touched = false
    for (const c of chunksOf(t)) {
      s.paintTouches += c.paintTouches
      s.reversals += c.reversals
      if (c.paintTouches > 0) touched = true
      s.fta += c.fta
      s.ftm += c.ftm
      if (c.result === 'TO') s.tos += 1
      if (isFGA(c)) {
        const three = isThree(c.shot)
        if (three) {
          s.fga3 += 1
          if (c.result === 'MADE') s.fgm3 += 1
        } else {
          s.fga2 += 1
          if (c.result === 'MADE') s.fgm2 += 1
        }
        const tier = SHOT_TIER[c.shot]
        if (tier) {
          s.tier[tier] += 1
          s.tierPts[tier] += (c.result === 'MADE' ? (three ? 3 : 2) : 0) + c.ftm
        }
      }
    }
    if (touched) s.paintPoss += 1
  }
  const fga = s.fga2 + s.fga3
  s.ppp = s.poss ? s.pts / s.poss : null
  s.scorePct = s.poss ? s.scores / s.poss : null
  s.toPct = s.poss ? s.tos / s.poss : null
  s.efg = fga ? (s.fgm2 + 1.5 * s.fgm3) / fga : null
  s.desirablePct = fga ? (s.tier.TOP + s.tier.SECOND) / fga : null
  return s
}

export type WindowKey = 'LAST3' | 'LAST10' | 'SEGMENT' | 'HALF' | 'HALF1' | 'GAME'

export const WINDOW_LABEL: Record<WindowKey, string> = {
  LAST3: 'Last 3',
  LAST10: 'Last 10',
  SEGMENT: 'Since TO',
  HALF: 'Half',
  HALF1: '1st half',
  GAME: 'Game',
}

type GameWindows = Pick<Game, 'timeouts' | 'halfEnds'> & Partial<Pick<Game, 'hcTimeouts'>>

const allMarks = (game: GameWindows): number[] => [...game.timeouts, ...game.halfEnds, ...(game.hcTimeouts ?? []).map((t) => t.n)]

export function windowSlice(ts: Tagged[], key: WindowKey, game: GameWindows): Tagged[] {
  if (ts.length === 0) return []
  switch (key) {
    case 'LAST3':
      return ts.slice(-3)
    case 'LAST10':
      return ts.slice(-10)
    case 'SEGMENT': {
      const lastN = ts[ts.length - 1].n
      const marks = allMarks(game).filter((n) => n < lastN)
      const start = marks.length ? Math.max(...marks) : 0
      return ts.filter((t) => t.n > start)
    }
    case 'HALF': {
      const half = ts[ts.length - 1].half
      return ts.filter((t) => t.half === half)
    }
    case 'HALF1':
      return ts.filter((t) => t.half === 1)
    case 'GAME':
      return ts
  }
}

export function byHalf(ts: Tagged[]): Record<Half, Stats> {
  return {
    1: stats(ts.filter((t) => t.half === 1)),
    2: stats(ts.filter((t) => t.half === 2)),
    3: stats(ts.filter((t) => t.half === 3)),
  }
}

export interface Bunch {
  label: string
  stats: Stats
  running: Stats
}

export function bunchesOf10(ts: Tagged[]): Bunch[] {
  const out: Bunch[] = []
  for (let i = 0; i < ts.length; i += 10) {
    const chunk = ts.slice(i, i + 10)
    out.push({ label: `${i + 1}-${i + chunk.length}`, stats: stats(chunk), running: stats(ts.slice(0, i + chunk.length)) })
  }
  return out
}

/** Segments between timeouts and half ends, in order. */
export function segments(ts: Tagged[], game: GameWindows): { label: string; stats: Stats }[] {
  if (ts.length === 0) return []
  const marks = [...new Set(allMarks(game))].sort((a, b) => a - b)
  const out: { label: string; stats: Stats }[] = []
  let start = 0
  for (const m of [...marks, ts[ts.length - 1].n]) {
    if (m <= start) continue
    const chunk = ts.filter((t) => t.n > start && t.n <= m)
    if (chunk.length) out.push({ label: `${start + 1}-${m}`, stats: stats(chunk) })
    start = m
  }
  return out
}
