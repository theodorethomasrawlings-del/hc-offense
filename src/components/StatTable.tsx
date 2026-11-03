import { fmtPct, fmtPPP } from '../engine/format'
import type { Stats } from '../engine/windows'

interface Row {
  label: string
  stats: Stats
}

export const STAT_COLS = ['Poss', 'Pts', 'PPP', 'Score %', '2FG', '3FG', 'FT', 'eFG%', 'TO', 'OREB', 'Top', '2nd', '3rd', 'Good shot %', 'Paint', 'Runs', 'Droughts'] as const
const KEY_COLS = new Set(['PPP', 'Good shot %'])

export function statCells(s: Stats): string[] {
  return [
    String(s.poss),
    String(s.pts),
    fmtPPP(s.ppp),
    fmtPct(s.scorePct),
    `${s.fgm2}/${s.fga2}`,
    `${s.fgm3}/${s.fga3}`,
    `${s.ftm}/${s.fta}`,
    fmtPct(s.efg),
    String(s.tos),
    String(s.orebs),
    String(s.tier.TOP),
    String(s.tier.SECOND),
    String(s.tier.THIRD),
    fmtPct(s.desirablePct),
    `${s.paintPoss}/${s.poss}`,
    String(s.runs),
    String(s.droughts),
  ]
}

export default function StatTable({ rows, hotPPP = false }: { rows: Row[]; hotPPP?: boolean }) {
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          {STAT_COLS.map((c) => (
            <th key={c} className={KEY_COLS.has(c) ? 'key' : undefined}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className={hotPPP && r.stats.poss > 0 && (r.stats.ppp ?? 0) < 0.8 ? 'hot' : undefined}>
            <td>{r.label}</td>
            {statCells(r.stats).map((c, i) => (
              <td key={i} className={KEY_COLS.has(STAT_COLS[i]) ? 'key' : undefined}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
