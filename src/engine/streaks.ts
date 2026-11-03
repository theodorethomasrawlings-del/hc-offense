import type { Possession } from '../domain/types'

export interface Tagged extends Possession {
  isScore: boolean
  /** Consecutive scoring possessions (0 on an empty one). */
  scoreRun: number
  /** Consecutive empty possessions (0 on a score). */
  emptyRun: number
  /** 3 scores in a row; the count resets after. */
  run: boolean
  /** 3 empties in a row; the count resets after. */
  drought: boolean
  tag: string
}

export function tagPossessions(ps: Possession[]): Tagged[] {
  const out: Tagged[] = []
  let scoreRun = 0
  let emptyRun = 0
  for (const p of ps) {
    const isScore = p.points > 0
    let run = false
    let drought = false
    if (isScore) {
      emptyRun = 0
      scoreRun += 1
      if (scoreRun === 3) {
        run = true
        scoreRun = 0
      }
    } else {
      scoreRun = 0
      emptyRun += 1
      if (emptyRun === 3) {
        drought = true
        emptyRun = 0
      }
    }
    let tag: string
    if (isScore) {
      tag = `SCORE (${p.points})`
      const shown = run ? 3 : scoreRun
      if (shown >= 2) tag += ` – ${shown} IN A ROW`
      if (run) tag += ' – RUN'
    } else {
      tag = 'EMPTY'
      const shown = drought ? 3 : emptyRun
      if (shown >= 2) tag += ` – ${shown} IN A ROW`
      if (drought) tag += ' – DROUGHT'
    }
    out.push({ ...p, isScore, scoreRun, emptyRun, run, drought, tag })
  }
  return out
}
