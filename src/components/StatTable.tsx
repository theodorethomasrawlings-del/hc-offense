import { fmtPct } from '../engine/format'
import type { Stats } from '../engine/windows'

interface Row {
  label: string
  stats: Stats
}

export const STAT_COLS = ['Poss', 'Scored', 'Score %', 'TO', 'Paint touch', 'Paint %', 'Runs', 'Droughts'] as const
const KEY_COLS = new Set(['Score %', 'Paint %'])

export function statCells(s: Stats): string[] {
  return [String(s.poss), String(s.scores), fmtPct(s.scorePct), String(s.tos), `${s.paintPoss}/${s.poss}`, fmtPct(s.poss ? s.paintPoss / s.poss : null), String(s.runs), String(s.droughts)]
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
          <tr key={r.label} className={hotPPP && r.stats.poss > 0 && (r.stats.scorePct ?? 0) < 0.4 ? 'hot' : undefined}>
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
