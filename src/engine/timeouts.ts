import type { Game, Half, TimeoutKind } from '../domain/types'

/** NCAA men's: one full (60s) and three 30s a game; at most 3 carry into the 2nd half (a 30 is the one lost); one 30 per OT. */
export const FULL_PER_GAME = 1
export const THIRTY_PER_GAME = 3
export const MAX_CARRY_TO_2ND = 3
export const THIRTY_PER_OT = 1

export interface TimeoutsLeft {
  full: number
  thirty: number
}

export function hcTimeoutsLeft(game: Pick<Game, 'hcTimeouts'>, half: Half): TimeoutsLeft {
  return timeoutsLeft(game.hcTimeouts, half)
}

/** Same rules for either team. */
export function timeoutsLeft(used_: { half: Half; kind?: TimeoutKind }[], half: Half): TimeoutsLeft {
  const used = (kind: TimeoutKind, halves: Half[]) =>
    used_.filter((t) => (t.kind ?? 'FULL') === kind && halves.includes(t.half)).length
  const full = Math.max(0, FULL_PER_GAME - used('FULL', [1, 2, 3]))
  if (half === 1) return { full, thirty: Math.max(0, THIRTY_PER_GAME - used('THIRTY', [1])) }
  let thirty = Math.max(0, THIRTY_PER_GAME - used('THIRTY', [1]))
  // use it or lose it: only 3 total come into the 2nd half, and the 30 is the one that goes
  thirty = Math.min(thirty, MAX_CARRY_TO_2ND - full)
  thirty = Math.max(0, thirty - used('THIRTY', [2]))
  if (half === 2) return { full, thirty }
  return { full, thirty: Math.max(0, thirty + THIRTY_PER_OT - used('THIRTY', [3])) }
}

export const fmtTimeouts = (t: TimeoutsLeft): string => `${t.full} FULL · ${t.thirty} 30s`
