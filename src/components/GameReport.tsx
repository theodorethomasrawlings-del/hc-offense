import type { Game } from '../domain/types'
import { byFamily, byPaintTouch, byPlay, type Row } from '../engine/breakdowns'
import { fmtPct, fmtRatio } from '../engine/format'
import type { Tagged } from '../engine/streaks'
import { bunchesOf10, byHalf, segments, stats, windowSlice } from '../engine/windows'
import StatTable from './StatTable'

function Section({ title, rows, hot = true }: { title: string; rows: Row[]; hot?: boolean }) {
  const shown = rows.filter((r) => r.stats.poss > 0)
  if (!shown.length) return null
  return (
    <section>
      <h2>{title}</h2>
      <StatTable rows={shown} hotPPP={hot} />
    </section>
  )
}

/** The whole summary body, shared by the live Summary screen and the History detail. */
export default function GameReport({ game, tagged }: { game: Game; tagged: Tagged[] }) {
  const g = stats(tagged)
  const halves = byHalf(tagged)
  const seg = stats(windowSlice(tagged, 'SEGMENT', game))
  const [paint, noPaint] = byPaintTouch(tagged)

  const rows = [
    { label: 'Game', stats: g },
    { label: '1st half', stats: halves[1] },
    { label: '2nd half', stats: halves[2] },
    ...(halves[3].poss ? [{ label: 'OT', stats: halves[3] }] : []),
    { label: 'Since TO', stats: seg },
  ]

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div style={{ fontSize: 26, fontWeight: 800 }}>
        Scored on {fmtPct(g.scorePct)} ({fmtRatio(g.scores, g.poss)})
        <span className="muted" style={{ fontWeight: 500, fontSize: 20 }}>
          {' '}· TO {g.tos}
        </span>
        <div className="muted" style={{ fontWeight: 500, fontSize: 20 }} aria-label="paint touch">
          Paint touch on {fmtRatio(g.paintPoss, g.poss)} ({fmtPct(g.poss ? g.paintPoss / g.poss : null)}) · scored {fmtPct(paint.stats.scorePct)} with a paint touch vs {fmtPct(noPaint.stats.scorePct)} without
        </div>
      </div>

      <StatTable rows={rows} />

      <Section title="By family" rows={byFamily(tagged)} />
      <Section title="By play" rows={byPlay(tagged)} />
      <Section title="Paint touch" rows={byPaintTouch(tagged)} />
      <Section title="Bunches of 10" rows={bunchesOf10(tagged).map((b) => ({ label: b.label, stats: b.stats }))} />
      <Section title="By segment" rows={segments(tagged, game)} />
    </div>
  )
}
