import { STAT_COLS, statCells } from '../components/StatTable'
import type { Game } from '../domain/types'
import { afterOreb, byClock, byFamily, byLateClock, byPaintTouch, byPlay, byReversals, byTransition, byTrigger, shotChart, type Row } from '../engine/breakdowns'
import { fmtPct, fmtPPP, fmtRatio } from '../engine/format'
import type { Tagged } from '../engine/streaks'
import { suggestions } from '../engine/suggest'
import { bunchesOf10, byHalf, segments, stats, type Stats } from '../engine/windows'

const pad = (s: string, w: number) => s.padStart(w)
const line = (label: string, s: Stats) => `${label.padEnd(22).slice(0, 22)} ${statCells(s).map((c) => pad(c, 8)).join('')}`
const header = () => `${''.padEnd(22)} ${STAT_COLS.map((c) => pad(c, 8)).join('')}`

export function toText(game: Game, ts: Tagged[]): string {
  const g = stats(ts)
  const halves = byHalf(ts)
  const fga = g.fga2 + g.fga3
  const out: string[] = []
  out.push(`HOLY CROSS ${game.home ? 'VS' : 'AT'} ${game.opponent.toUpperCase()}, ${game.date} - OFFENSIVE REPORT`)
  out.push('')
  out.push(`PPP ${fmtPPP(g.ppp)} (${g.pts} pts / ${g.poss} poss) · scored on ${fmtPct(g.scorePct)}`)
  out.push(`1st half ${fmtPPP(halves[1].ppp)} (${halves[1].pts}/${halves[1].poss}) · 2nd half ${fmtPPP(halves[2].ppp)} (${halves[2].pts}/${halves[2].poss})`)
  out.push(`2FG ${g.fgm2}/${g.fga2} · 3FG ${g.fgm3}/${g.fga3} · FT ${g.ftm}/${g.fta} · eFG ${fmtPct(g.efg)} · TO ${g.tos} (${fmtPct(g.toPct)}) · OREB ${g.orebs}`)
  out.push(`GOOD SHOTS ${fmtPct(g.desirablePct)} (${fmtRatio(g.tier.TOP + g.tier.SECOND, fga)}) · top ${g.tier.TOP} · 2nd ${g.tier.SECOND} · 3rd ${g.tier.THIRD}`)
  out.push(`PAINT TOUCH on ${fmtRatio(g.paintPoss, g.poss)} · ${g.paintTouches} touches · ${g.reversals} reversals`)
  out.push('')
  const tips = suggestions(ts, game)
  if (tips.length) {
    out.push('CONSIDER')
    for (const t of tips) out.push(`- ${t}`)
    out.push('')
  }
  out.push(header())
  out.push(line('Game', g))
  out.push(line('1st half', halves[1]))
  out.push(line('2nd half', halves[2]))
  if (halves[3].poss) out.push(line('OT', halves[3]))
  out.push('')
  out.push('SHOT SELECTION')
  for (const r of shotChart(ts)) if (r.fga) out.push(`${r.label}: ${r.fgm}/${r.fga} (${fmtPct(r.fgm / r.fga)}), ${fmtPct(r.fga / fga)} of shots, ${fmtPPP(r.pts / r.fga)} pts/shot`)
  out.push('')
  const block = (title: string, rows: Row[]) => {
    const shown = rows.filter((r) => r.stats.poss > 0)
    if (!shown.length) return
    out.push(title)
    out.push(header())
    for (const r of shown) out.push(line(r.label, r.stats))
    out.push('')
  }
  block('BUNCHES OF 10', bunchesOf10(ts).map((b) => ({ label: b.label, stats: b.stats })))
  block('BY SEGMENT', segments(ts, game))
  block('BY FAMILY', byFamily(ts))
  block('BY PLAY', byPlay(ts))
  block('SHOT CLOCK AT HALF COURT', byClock(ts))
  block('TRANSITION VS HALF COURT', byTransition(ts))
  block('TRIGGERS', byTrigger(ts))
  block('LATE CLOCK', byLateClock(ts))
  block('PAINT TOUCH', byPaintTouch(ts))
  block('REVERSALS', byReversals(ts))
  const o = afterOreb(ts)
  if (o.chances) out.push(`SECOND CHANCE: ${o.chances} OREBs, scored on ${o.scored}, ${o.pts} pts, ${fmtPPP(o.pts / o.chances)} per chance`)
  return out.join('\n')
}
