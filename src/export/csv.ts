import { LATE_LABEL, playLabel, TRIGGER_LABEL } from '../domain/labels'
import { endedText } from '../components/PossessionChart'
import type { Game, Possession } from '../domain/types'
import type { Tagged } from '../engine/streaks'

export const CSV_HEADER = ['POSS', 'HALF', 'SEGMENT', 'PTS', 'STREAK', 'TRANSITION', 'PLAY', 'ENDED', 'CLOCK', 'TRIGGER', 'LATE', 'PAINT', 'REV', 'OREB', 'NOTE']

const cell = (v: string | number): string => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const possessionRow = (t: Tagged): (string | number)[] => [
  t.n,
  t.half === 3 ? 'OT' : t.half,
  t.segment + 1,
  t.points,
  t.tag,
  t.transition ? 'T' : '',
  t.chunks.length ? [...new Set(t.chunks.map(playLabel).filter(Boolean))].join(' > ') : playLabel(t),
  endedText(t),
  t.clock ?? '',
  t.trigger ? TRIGGER_LABEL[t.trigger] : '',
  t.lateClock ? LATE_LABEL[t.lateClock] : '',
  t.paintTouches || '',
  t.reversals || '',
  t.orebs || '',
  t.note,
]

export function toCSV(_game: Game, ts: Tagged[]): string {
  return [CSV_HEADER.join(','), ...ts.map((t) => possessionRow(t).map(cell).join(','))].join('\n')
}

export function toJSON(game: Game, ps: Possession[]): string {
  return JSON.stringify({ ...game, possessions: ps }, null, 2)
}

export const fileStem = (game: Game): string => `HC O ${game.home ? 'vs' : 'at'} ${game.opponent} ${game.date}`.replace(/[^\w .-]+/g, '')
