import { db } from './db'
import type { Game, Possession } from '../domain/types'
import { tagPossessions, type Tagged } from '../engine/streaks'
import { normalizePossession } from '../store/gameStore'

export async function loadAllGames(): Promise<{ games: Game[]; byGame: Record<string, Tagged[]>; raw: Record<string, Possession[]> }> {
  const games = await db.games.toArray()
  const ps = await db.possessions.toArray()
  const raw: Record<string, Possession[]> = {}
  for (const p of ps) (raw[p.gameId] ??= []).push(normalizePossession(p))
  const byGame: Record<string, Tagged[]> = {}
  for (const g of games) byGame[g.id] = tagPossessions((raw[g.id] ?? []).sort((a, b) => a.n - b.n))
  return { games, byGame, raw }
}

export async function loadGame(id: string): Promise<{ game: Game; possessions: Possession[]; tagged: Tagged[] } | null> {
  const game = await db.games.get(id)
  if (!game) return null
  const possessions = (await db.possessions.where('gameId').equals(id).sortBy('n')).map(normalizePossession)
  return { game, possessions, tagged: tagPossessions(possessions) }
}

export async function deleteGame(id: string): Promise<void> {
  await db.transaction('rw', db.games, db.possessions, async () => {
    await db.possessions.where('gameId').equals(id).delete()
    await db.games.delete(id)
  })
}
