import type { Player } from '../domain/types'

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

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Which roster file matches a typed opponent name: exact team or alias, else a team whose name contains the typed words. */
export function matchRoster(entries: IndexEntry[], typed: string): IndexEntry | null {
  const t = norm(typed)
  if (!t) return null
  const names = (e: IndexEntry) => [e.team, ...(e.aliases ?? [])].map(norm)
  return entries.find((e) => names(e).includes(t)) ?? entries.find((e) => names(e).some((n) => n.includes(t) || t.includes(n))) ?? null
}

const base = () => (import.meta.env?.BASE_URL ?? './').replace(/\/?$/, '/')

export async function loadRoster(team: string): Promise<Player[]> {
  try {
    const idx = (await (await fetch(`${base()}rosters/index.json`, { cache: 'no-cache' })).json()) as IndexEntry[]
    const hit = matchRoster(idx, team)
    if (!hit) return []
    const r = (await (await fetch(`${base()}rosters/${hit.file}`, { cache: 'no-cache' })).json()) as RosterFile
    return r.players.map((p) => ({ num: String(p.num), name: p.name, fouls: 0 }))
  } catch {
    return []
  }
}
