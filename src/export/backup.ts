import { db } from '../db/db'
import type { Game, Possession } from '../domain/types'

export interface Backup {
  version: 1
  app: 'hc-offense'
  exportedAt: string
  games: Game[]
  possessions: Possession[]
}

export async function buildBackup(): Promise<Backup> {
  return { version: 1, app: 'hc-offense', exportedAt: new Date().toISOString(), games: await db.games.toArray(), possessions: await db.possessions.toArray() }
}

/** Merge by id: existing rows are replaced, nothing is deleted. */
export async function restoreBackup(b: Backup): Promise<{ games: number; possessions: number }> {
  if (b.version !== 1 || b.app !== 'hc-offense' || !Array.isArray(b.games) || !Array.isArray(b.possessions)) throw new Error('Not an HC Offense backup')
  await db.transaction('rw', db.games, db.possessions, async () => {
    await db.games.bulkPut(b.games)
    await db.possessions.bulkPut(b.possessions)
  })
  return { games: b.games.length, possessions: b.possessions.length }
}
