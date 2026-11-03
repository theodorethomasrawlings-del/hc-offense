import type { Player } from '../domain/types'
import INDEX_JSON from './data/index.json'

export interface RosterFile {
  team: string
  aliases?: string[]
  players: { num: string; name: string }[]
}

interface IndexEntry {
  team: string
  aliases?: string[]
  file: string
}

// Every roster is compiled into the app, so loading needs no network, no service worker, no server.
const INDEX = INDEX_JSON as IndexEntry[]
const FILES = import.meta.glob<RosterFile>('./data/*.json', { eager: true, import: 'default' })

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Which roster file matches a typed opponent name: exact team or alias, else a team whose name contains the typed words. */
export function matchRoster(entries: IndexEntry[], typed: string): IndexEntry | null {
  const t = norm(typed)
  if (!t) return null
  const names = (e: IndexEntry) => [e.team, ...(e.aliases ?? [])].map(norm)
  return entries.find((e) => names(e).includes(t)) ?? entries.find((e) => names(e).some((n) => n.includes(t) || t.includes(n))) ?? null
}

/** Players for a team name, or [] when we have no roster for it. Synchronous: the data ships inside the app. */
export function rosterFor(team: string): Player[] {
  const hit = matchRoster(INDEX, team)
  const file = hit && FILES[`./data/${hit.file}`]
  if (!file) return []
  return file.players.map((p) => ({ num: String(p.num), name: p.name, fouls: 0 }))
}

export async function loadRoster(team: string): Promise<Player[]> {
  return rosterFor(team)
}
