import { STAT_COLS, statCells } from '../components/StatTable'
import type { Game } from '../domain/types'
import { byFamily, byPaintTouch, byPlay, type Row } from '../engine/breakdowns'
import { fmtPct, fmtRatio } from '../engine/format'
import type { Tagged } from '../engine/streaks'
import { bunchesOf10, byHalf, segments, stats, type Stats } from '../engine/windows'

const pad = (s: string, w: number) => s.padStart(w)
const line = (label: string, s: Stats) => `${label.padEnd(22).slice(0, 22)} ${statCells(s).map((c) => pad(c, 8)).join('')}`
const header = () => `${''.padEnd(22)} ${STAT_COLS.map((c) => pad(c, 8)).join('')}`

export function toText(game: Game, ts: Tagged[]): string {
  const g = stats(ts)
  const halves = byHalf(ts)
  const [paint, noPaint] = byPaintTouch(ts)
  const out: string[] = []
  out.push(`HOLY CROSS ${game.home ? 'VS' : 'AT'} ${game.opponent.toUpperCase()}, ${game.date} - OFFENSIVE REPORT`)
  out.push('')
  out.push(`SCORED ON ${fmtPct(g.scorePct)} (${fmtRatio(g.scores, g.poss)}) · TO ${g.tos}`)
  out.push(`1st half ${fmtPct(halves[1].scorePct)} (${halves[1].scores}/${halves[1].poss}) · 2nd half ${fmtPct(halves[2].scorePct)} (${halves[2].scores}/${halves[2].poss})`)
  out.push(`PAINT TOUCH on ${fmtRatio(g.paintPoss, g.poss)} · scored ${fmtPct(paint.stats.scorePct)} with vs ${fmtPct(noPaint.stats.scorePct)} without`)
  out.push('')
  out.push(header())
  out.push(line('Game', g))
  out.push(line('1st half', halves[1]))
  out.push(line('2nd half', halves[2]))
  if (halves[3].poss) out.push(line('OT', halves[3]))
  out.push('')
  const block = (title: string, rows: Row[]) => {
    const shown = rows.filter((r) => r.stats.poss > 0)
    if (!shown.length) return
    out.push(title)
    out.push(header())
    for (const r of shown) out.push(line(r.label, r.stats))
    out.push('')
  }
  block('BY FAMILY', byFamily(ts))
  block('BY PLAY', byPlay(ts))
  block('PAINT TOUCH', byPaintTouch(ts))
  block('BUNCHES OF 10', bunchesOf10(ts).map((b) => ({ label: b.label, stats: b.stats })))
  block('BY SEGMENT', segments(ts, game))
  return out.join('\n')
}
