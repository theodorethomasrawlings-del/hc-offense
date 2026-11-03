import { create } from 'zustand'
import { db, newId } from '../db/db'
import { chunkPoints } from '../domain/labels'
import type { Chunk, Continuation, Draft, Game, Half, Player, Possession, Side, TimeoutKind } from '../domain/types'
import { tagPossessions, type Tagged } from '../engine/streaks'

export type GameSetup = Omit<Game, 'id' | 'timeouts' | 'hcTimeouts' | 'oppTimeouts' | 'halfEnds' | 'status' | 'createdAt' | 'teamFouls' | 'rosterUs' | 'rosterThem' | 'arrowUs'> &
  Partial<Pick<Game, 'rosterUs' | 'rosterThem' | 'arrowUs'>>

export interface GameState {
  game: Game | null
  possessions: Possession[]
  tagged: Tagged[]
  draft: Draft
  loaded: boolean
  committing: boolean
  load(): Promise<void>
  startGame(g: GameSetup): Promise<void>
  setDraft(patch: Draft): void
  clearDraft(): void
  commitPossession(): Promise<void>
  /** We kept the ball (OREB, floor foul): bank this shot, same possession number, fresh screen. */
  continuePossession(cont: Continuation): void
  editPossession(id: string, patch: Partial<Possession>): Promise<void>
  undoLast(): Promise<void>
  undoMark(): Promise<void>
  reopenGame(id: string): Promise<void>
  mediaTimeout(): Promise<void>
  hcTimeout(kind?: TimeoutKind): Promise<void>
  endHalf(): Promise<void>
  endGame(): Promise<void>
  /** Foul chart. */
  setRosters(us: Player[], them: Player[]): Promise<void>
  /** Set a player's personal fouls; a rise also adds a team foul in the current half, a drop removes one. */
  setPlayerFouls(side: Side, num: string, fouls: number): Promise<void>
  setTeamFouls(side: Side, half: Half, fouls: number): Promise<void>
  oppTimeout(kind?: TimeoutKind): Promise<void>
  undoOppTimeout(): Promise<void>
  undoHcTimeout(): Promise<void>
  toggleArrow(): Promise<void>
  currentHalf(): Half
  currentSegment(): number
  nextN(): number
}

export function normalizeGame(g: Game): Game {
  return {
    ...g,
    timeouts: g.timeouts ?? [],
    hcTimeouts: g.hcTimeouts ?? [],
    oppTimeouts: g.oppTimeouts ?? [],
    halfEnds: g.halfEnds ?? [],
    rosterUs: (g.rosterUs ?? []).map((p) => ({ ...p, fouls: p.fouls ?? 0 })),
    rosterThem: (g.rosterThem ?? []).map((p) => ({ ...p, fouls: p.fouls ?? 0 })),
    teamFouls: { us: g.teamFouls?.us ?? [0, 0, 0], them: g.teamFouls?.them ?? [0, 0, 0] },
    arrowUs: g.arrowUs ?? true,
  }
}

export function normalizePossession(p: Possession): Possession {
  return {
    ...p,
    shot: p.shot ?? 'NONE',
    result: p.result ?? 'NONE',
    ftm: p.ftm ?? 0,
    fta: p.fta ?? 0,
    family: p.family ?? '',
    action: p.action ?? '',
    transition: p.transition ?? false,
    trigger: p.trigger ?? null,
    lateClock: p.lateClock ?? null,
    clock: p.clock ?? null,
    paintTouches: p.paintTouches ?? 0,
    reversals: p.reversals ?? 0,
    orebs: p.orebs ?? 0,
    note: p.note ?? '',
    chunks: p.chunks ?? [],
  }
}

export function draftChunk(d: Draft): Chunk {
  return {
    shot: d.shot ?? 'NONE',
    result: d.result ?? 'NONE',
    ftm: d.ftm ?? 0,
    fta: d.fta ?? 0,
    family: d.family ?? '',
    action: d.action ?? '',
    paintTouches: d.paintTouches ?? 0,
    reversals: d.reversals ?? 0,
    cont: null,
  }
}

/** Does the draft describe a finished chunk? A shot needs a result; a TO or foul stands alone. */
export function draftComplete(d: Draft): boolean {
  if (!d.result || d.result === 'NONE') return false
  if (d.result === 'MADE' || d.result === 'MISSED') return !!d.shot && d.shot !== 'NONE'
  return true
}

/** Sum the chunks into the possession's top-level fields. Shot, result and play come from the last chunk. */
export function rollUp(chunks: Chunk[]): Pick<Possession, 'points' | 'shot' | 'result' | 'ftm' | 'fta' | 'family' | 'action' | 'paintTouches' | 'reversals' | 'orebs'> {
  const last = chunks[chunks.length - 1]
  const points = Math.min(4, chunks.reduce((a, c) => a + chunkPoints(c), 0)) as Possession['points']
  return {
    points,
    shot: last?.shot ?? 'NONE',
    result: last?.result ?? 'NONE',
    ftm: chunks.reduce((a, c) => a + c.ftm, 0),
    fta: chunks.reduce((a, c) => a + c.fta, 0),
    family: last?.family ?? '',
    action: last?.action ?? '',
    paintTouches: chunks.reduce((a, c) => a + c.paintTouches, 0),
    reversals: chunks.reduce((a, c) => a + c.reversals, 0),
    orebs: chunks.filter((c) => c.cont === 'OREB' || c.cont === 'DEAD_OREB').length,
  }
}

export function createGameStore() {
  return create<GameState>((set, get) => {
    const lastN = () => {
      const ps = get().possessions
      return ps.length ? ps[ps.length - 1].n : 0
    }
    const putGame = async (patch: Partial<Game>) => {
      const game = get().game
      if (!game) return
      const next = { ...game, ...patch }
      await db.games.put(next)
      set({ game: next })
    }
    const setPossessions = (possessions: Possession[]) => set({ possessions, tagged: tagPossessions(possessions) })

    return {
      game: null,
      possessions: [],
      tagged: [],
      draft: {},
      loaded: false,
      committing: false,

      async load() {
        const game = (await db.games.where('status').equals('LIVE').toArray()).sort((a, b) => b.createdAt - a.createdAt)[0]
        if (!game) {
          set({ game: null, possessions: [], tagged: [], draft: {}, loaded: true })
          return
        }
        const possessions = (await db.possessions.where('gameId').equals(game.id).sortBy('n')).map(normalizePossession)
        set({ game: normalizeGame(game), possessions, tagged: tagPossessions(possessions), draft: {}, loaded: true })
      },

      async startGame(g) {
        const game: Game = normalizeGame({ ...g, id: newId(), timeouts: [], hcTimeouts: [], oppTimeouts: [], halfEnds: [], teamFouls: { us: [0, 0, 0], them: [0, 0, 0] }, status: 'LIVE', createdAt: Date.now() } as Game)
        await db.games.put(game)
        set({ game, possessions: [], tagged: [], draft: {}, loaded: true })
      },

      setDraft(patch) {
        set({ draft: { ...get().draft, ...patch } })
      },

      clearDraft() {
        set({ draft: {} })
      },

      async commitPossession() {
        const { game, draft } = get()
        if (!game) throw new Error('No live game')
        if (!draftComplete(draft)) throw new Error('Tap how it ended first')
        if (get().committing) throw new Error('Already saving')
        set({ committing: true })
        try {
          const chunks: Chunk[] = [...(draft.chunks ?? []), draftChunk(draft)]
          const roll = rollUp(chunks)
          const p: Possession = {
            id: newId(),
            gameId: game.id,
            n: get().nextN(),
            half: get().currentHalf(),
            ...roll,
            transition: draft.transition ?? false,
            trigger: draft.trigger ?? null,
            lateClock: draft.lateClock ?? null,
            clock: draft.clock ?? null,
            note: draft.note ?? '',
            chunks: chunks.length > 1 ? chunks : [],
            segment: get().currentSegment(),
            createdAt: Date.now(),
          }
          await db.possessions.put(p)
          setPossessions([...get().possessions, p])
          set({ draft: {} })
        } finally {
          set({ committing: false })
        }
      },

      continuePossession(cont) {
        const d = get().draft
        const chunk: Chunk = { ...draftChunk(d), cont }
        // Trigger, clock and note belong to the possession; the next chunk starts with a blank shot and play.
        set({ draft: { chunks: [...(d.chunks ?? []), chunk], transition: d.transition, trigger: d.trigger, lateClock: d.lateClock, clock: d.clock, note: d.note } })
      },

      async editPossession(id, patch) {
        const ps = get().possessions
        const i = ps.findIndex((p) => p.id === id)
        if (i < 0) return
        const next = { ...ps[i], ...patch, id }
        await db.possessions.put(next)
        setPossessions([...ps.slice(0, i), next, ...ps.slice(i + 1)])
      },

      async undoLast() {
        const ps = get().possessions
        if (!ps.length || !get().game) return
        await db.possessions.delete(ps[ps.length - 1].id)
        setPossessions(ps.slice(0, -1))
      },

      async undoMark() {
        const game = get().game
        if (!game) return
        const marks = [...game.timeouts, ...game.halfEnds, ...game.hcTimeouts.map((t) => t.n)]
        if (!marks.length) return
        const latest = Math.max(...marks)
        const hcIdx = game.hcTimeouts.map((t) => t.n).lastIndexOf(latest)
        if (hcIdx >= 0) {
          await putGame({ hcTimeouts: game.hcTimeouts.filter((_, i) => i !== hcIdx) })
          return
        }
        const halfEnds = game.halfEnds.filter((n) => n !== latest)
        const timeouts = halfEnds.length !== game.halfEnds.length ? game.timeouts : game.timeouts.filter((n) => n !== latest)
        await putGame({ timeouts, halfEnds })
      },

      async reopenGame(id) {
        const game = await db.games.get(id)
        if (!game) return
        const next = normalizeGame({ ...game, status: 'LIVE' as const })
        await db.games.put(next)
        const possessions = (await db.possessions.where('gameId').equals(id).sortBy('n')).map(normalizePossession)
        set({ game: next, possessions, tagged: tagPossessions(possessions), draft: {}, loaded: true })
      },

      async mediaTimeout() {
        const game = get().game
        const n = lastN()
        if (!game || n === 0 || game.timeouts.includes(n)) return
        await putGame({ timeouts: [...game.timeouts, n] })
      },

      async hcTimeout(kind = 'FULL') {
        const game = get().game
        if (!game) return
        await putGame({ hcTimeouts: [...game.hcTimeouts, { n: lastN(), half: get().currentHalf(), kind }] })
      },

      async endHalf() {
        const game = get().game
        const n = lastN()
        if (!game || n === 0 || game.halfEnds.includes(n)) return
        await putGame({ halfEnds: [...game.halfEnds, n] })
      },

      async endGame() {
        await putGame({ status: 'FINAL' })
      },

      async setRosters(us, them) {
        await putGame({ rosterUs: us, rosterThem: them })
      },

      async setPlayerFouls(side, num, fouls) {
        const game = get().game
        if (!game) return
        const key = side === 'us' ? 'rosterUs' : 'rosterThem'
        const roster = game[key]
        const i = roster.findIndex((p) => p.num === num)
        if (i < 0) return
        const next = Math.max(0, Math.min(5, fouls))
        const delta = next - roster[i].fouls
        const half = get().currentHalf()
        const tf = { ...game.teamFouls, [side]: [...game.teamFouls[side]] }
        tf[side][half - 1] = Math.max(0, Math.min(10, tf[side][half - 1] + delta))
        await putGame({ [key]: roster.map((p, j) => (j === i ? { ...p, fouls: next } : p)), teamFouls: tf })
      },

      async setTeamFouls(side, half, fouls) {
        const game = get().game
        if (!game) return
        const tf = { ...game.teamFouls, [side]: [...game.teamFouls[side]] }
        tf[side][half - 1] = Math.max(0, Math.min(10, fouls))
        await putGame({ teamFouls: tf })
      },

      async oppTimeout(kind = 'THIRTY') {
        const game = get().game
        if (!game) return
        await putGame({ oppTimeouts: [...game.oppTimeouts, { n: lastN(), half: get().currentHalf(), kind }] })
      },

      async undoOppTimeout() {
        const game = get().game
        if (!game || !game.oppTimeouts.length) return
        await putGame({ oppTimeouts: game.oppTimeouts.slice(0, -1) })
      },

      async undoHcTimeout() {
        const game = get().game
        if (!game || !game.hcTimeouts.length) return
        await putGame({ hcTimeouts: game.hcTimeouts.slice(0, -1) })
      },

      async toggleArrow() {
        const game = get().game
        if (game) await putGame({ arrowUs: !game.arrowUs })
      },

      currentHalf() {
        const game = get().game
        if (!game) return 1
        const n = get().nextN()
        return Math.min(3, 1 + game.halfEnds.filter((m) => m < n).length) as Half
      },

      currentSegment() {
        const game = get().game
        if (!game) return 0
        const n = get().nextN()
        return new Set([...game.timeouts, ...game.halfEnds, ...game.hcTimeouts.map((t) => t.n)].filter((m) => m < n)).size
      },

      nextN() {
        return lastN() + 1
      },
    }
  })
}

export const useGameStore = createGameStore()
