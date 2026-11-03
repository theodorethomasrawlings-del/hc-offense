import type { Game } from '../domain/types'
import type { Tagged } from './streaks'
import { stats, type Stats } from './windows'

export interface GameSummary {
  gameId: string
  label: string
  date: string
  stats: Stats
}

export function gameSummaries(games: Game[], byGame: Record<string, Tagged[]>): GameSummary[] {
  return [...games]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map((g) => ({ gameId: g.id, label: `${g.home ? 'vs' : 'at'} ${g.opponent}`, date: g.date, stats: stats(byGame[g.id] ?? []) }))
}
