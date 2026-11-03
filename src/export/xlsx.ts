import * as XLSX from 'xlsx'
import { STAT_COLS, statCells } from '../components/StatTable'
import type { Game } from '../domain/types'
import { afterOreb, byClock, byFamily, byLateClock, byPaintTouch, byPlay, byReversals, byTransition, byTrigger, shotChart, type Row as BRow } from '../engine/breakdowns'
import { fmtPct, fmtPPP } from '../engine/format'
import type { Tagged } from '../engine/streaks'
import { suggestions } from '../engine/suggest'
import { bunchesOf10, byHalf, segments, stats, type Stats } from '../engine/windows'
import { CSV_HEADER, possessionRow } from './csv'

type Row = (string | number | null)[]

const statRow = (label: string, s: Stats): Row => [label, ...statCells(s).map((c) => (c === '–' ? null : /^\d+$/.test(c) ? Number(c) : c))]
const block = (title: string, rows: BRow[]): Row[] => {
  const shown = rows.filter((r) => r.stats.poss > 0)
  return shown.length ? [[], [title, ...STAT_COLS], ...shown.map((r) => statRow(r.label, r.stats))] : []
}

export function toWorkbook(game: Game, ts: Tagged[]): XLSX.WorkBook {
  const g = stats(ts)
  const halves = byHalf(ts)
  const fga = g.fga2 + g.fga3
  const wb = XLSX.utils.book_new()
  const o = afterOreb(ts)

  const summary: Row[] = [
    [`HOLY CROSS ${game.home ? 'VS' : 'AT'} ${game.opponent.toUpperCase()} - OFFENSE`, game.date],
    ['PPP', fmtPPP(g.ppp), `${g.pts} / ${g.poss}`],
    ['Scored on', fmtPct(g.scorePct)],
    ['2FG', `${g.fgm2}/${g.fga2}`],
    ['3FG', `${g.fgm3}/${g.fga3}`],
    ['FT', `${g.ftm}/${g.fta}`],
    ['eFG%', fmtPct(g.efg)],
    ['Turnovers', g.tos, fmtPct(g.toPct)],
    ['OREB', g.orebs],
    ['Good shot %', fmtPct(g.desirablePct), `${g.tier.TOP + g.tier.SECOND} / ${fga}`],
    ['Paint touch possessions', g.paintPoss, `of ${g.poss}`],
    ['Reversals', g.reversals],
    ...(o.chances ? [['Second chance', `${o.pts} pts on ${o.chances}`, fmtPPP(o.pts / o.chances)] as Row] : []),
    [],
    ['Consider'],
    ...suggestions(ts, game).map((t): Row => [t]),
    [],
    ['', ...STAT_COLS],
    statRow('Game', g),
    statRow('1st half', halves[1]),
    statRow('2nd half', halves[2]),
    ...(halves[3].poss ? [statRow('OT', halves[3])] : []),
    ...block('Bunches of 10', bunchesOf10(ts).map((b) => ({ label: b.label, stats: b.stats }))),
    ...block('By segment', segments(ts, game)),
    ...block('By family', byFamily(ts)),
    ...block('By play', byPlay(ts)),
    ...block('Shot clock at half court', byClock(ts)),
    ...block('Transition vs half court', byTransition(ts)),
    ...block('Triggers', byTrigger(ts)),
    ...block('Late clock', byLateClock(ts)),
    ...block('Paint touch', byPaintTouch(ts)),
    ...block('Reversals', byReversals(ts)),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary')

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([CSV_HEADER, ...ts.map((t) => possessionRow(t) as Row)]), 'Possessions')

  const shots: Row[] = [['Shot', 'FGA', 'FGM', 'FG%', 'Share', 'Pts/shot'], ...shotChart(ts).map((r): Row => [r.label, r.fga, r.fgm, fmtPct(r.fga ? r.fgm / r.fga : null), fmtPct(fga ? r.fga / fga : null), fmtPPP(r.fga ? r.pts / r.fga : null)])]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(shots), 'Shot selection')
  return wb
}

export function toXlsx(game: Game, ts: Tagged[]): ArrayBuffer {
  return XLSX.write(toWorkbook(game, ts), { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}
