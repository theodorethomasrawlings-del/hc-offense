import type { Chunk, Possession } from '../../domain/types'

let id = 0
export function poss(over: Partial<Possession> = {}): Possession {
  id += 1
  return {
    id: `p${id}`,
    gameId: 'g',
    n: id,
    half: 1,
    points: 0,
    shot: 'NONE',
    result: 'NONE',
    ftm: 0,
    fta: 0,
    family: '',
    action: '',
    transition: false,
    trigger: null,
    lateClock: null,
    clock: null,
    paintTouches: 0,
    reversals: 0,
    orebs: 0,
    note: '',
    chunks: [],
    segment: 0,
    createdAt: 0,
    ...over,
  }
}
export const chunk = (over: Partial<Chunk> = {}): Chunk => ({ shot: 'NONE', result: 'NONE', ftm: 0, fta: 0, family: '', action: '', paintTouches: 0, reversals: 0, cont: null, ...over })
export const reset = () => {
  id = 0
}
