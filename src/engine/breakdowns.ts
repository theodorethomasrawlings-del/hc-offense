import { CLOCKS, LATE_LABEL, playLabel, SHOTS, TRIGGER_LABEL } from '../domain/labels'
import type { Shot } from '../domain/types'
import type { Tagged } from './streaks'
import { chunksOf, stats, type Stats } from './windows'

export interface Row {
  label: string
  stats: Stats
}

const group = (ts: Tagged[], key: (t: Tagged) => string | null): Row[] => {
  const map = new Map<string, Tagged[]>()
  for (const t of ts) {
    const k = key(t)
    if (k == null) continue
    ;(map.get(k) ?? map.set(k, []).get(k)!).push(t)
  }
  return [...map.entries()].map(([label, g]) => ({ label, stats: stats(g) })).sort((a, b) => b.stats.poss - a.stats.poss)
}

/** A possession counts under every family it ran (one per chunk). */
const familiesOf = (t: Tagged): string[] => [...new Set(chunksOf(t).map((c) => c.family).filter(Boolean))]
const playsOf = (t: Tagged): string[] => [...new Set(chunksOf(t).map(playLabel).filter(Boolean))]

const multi = (ts: Tagged[], keys: (t: Tagged) => string[]): Row[] => {
  const map = new Map<string, Tagged[]>()
  for (const t of ts) for (const k of keys(t)) (map.get(k) ?? map.set(k, []).get(k)!).push(t)
  return [...map.entries()].map(([label, g]) => ({ label, stats: stats(g) })).sort((a, b) => b.stats.poss - a.stats.poss)
}

export const byFamily = (ts: Tagged[]): Row[] => multi(ts, familiesOf)
export const byPlay = (ts: Tagged[]): Row[] => multi(ts, playsOf)

export const byTransition = (ts: Tagged[]): Row[] => [
  { label: 'Transition', stats: stats(ts.filter((t) => t.transition)) },
  { label: 'Half court', stats: stats(ts.filter((t) => !t.transition)) },
]
export const byTrigger = (ts: Tagged[]): Row[] => group(ts, (t) => (t.trigger ? TRIGGER_LABEL[t.trigger] : null))
export const byLateClock = (ts: Tagged[]): Row[] => group(ts, (t) => (t.lateClock ? LATE_LABEL[t.lateClock] : null))
export const byClock = (ts: Tagged[]): Row[] => {
  const rows = group(ts, (t) => t.clock)
  const order = CLOCKS.map((c) => c.key as string)
  return rows.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
}
export const byPaintTouch = (ts: Tagged[]): Row[] => [
  { label: 'Paint touch', stats: stats(ts.filter((t) => chunksOf(t).some((c) => c.paintTouches > 0))) },
  { label: 'No paint touch', stats: stats(ts.filter((t) => !chunksOf(t).some((c) => c.paintTouches > 0))) },
]
export const byReversals = (ts: Tagged[]): Row[] => {
  const n = (t: Tagged) => chunksOf(t).reduce((a, c) => a + c.reversals, 0)
  return [
    { label: '0 reversals', stats: stats(ts.filter((t) => n(t) === 0)) },
    { label: '1 reversal', stats: stats(ts.filter((t) => n(t) === 1)) },
    { label: '2+ reversals', stats: stats(ts.filter((t) => n(t) >= 2)) },
  ]
}

export interface ShotRow {
  shot: Shot
  label: string
  fga: number
  fgm: number
  pts: number
}

/** Every attempt by shot type. */
export function shotChart(ts: Tagged[]): ShotRow[] {
  const rows: ShotRow[] = SHOTS.map((s) => ({ shot: s.key, label: s.label, fga: 0, fgm: 0, pts: 0 }))
  for (const t of ts)
    for (const c of chunksOf(t)) {
      if (c.shot === 'NONE' || (c.result !== 'MADE' && c.result !== 'MISSED')) continue
      const r = rows.find((x) => x.shot === c.shot)!
      r.fga += 1
      if (c.result === 'MADE') {
        r.fgm += 1
        r.pts += SHOTS.find((s) => s.key === c.shot)!.value
      }
      r.pts += c.ftm
    }
  return rows
}

/** Second-chance: what happened after offensive rebounds. */
export function afterOreb(ts: Tagged[]): { chances: number; pts: number; scored: number } {
  let chances = 0
  let pts = 0
  let scored = 0
  for (const t of ts) {
    const cs = chunksOf(t)
    for (let i = 1; i < cs.length; i++) {
      if (cs[i - 1].cont !== 'OREB' && cs[i - 1].cont !== 'DEAD_OREB') continue
      chances += 1
      const p = (cs[i].result === 'MADE' ? (SHOTS.find((s) => s.key === cs[i].shot)?.value ?? 2) : 0) + cs[i].ftm
      pts += p
      if (p > 0) scored += 1
    }
  }
  return { chances, pts, scored }
}
