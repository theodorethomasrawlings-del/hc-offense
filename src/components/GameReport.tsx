import type { Game } from '../domain/types'
import { afterOreb, byClock, byFamily, byLateClock, byPaintTouch, byPlay, byReversals, byTrigger, shotChart, type Row } from '../engine/breakdowns'
import { fmtPct, fmtPPP, fmtRatio } from '../engine/format'
import type { Tagged } from '../engine/streaks'
import { suggestions } from '../engine/suggest'
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
  const half = stats(windowSlice(tagged, 'HALF', game))
  const tips = suggestions(tagged, game)
  const shots = shotChart(tagged)
  const oreb = afterOreb(tagged)
  const fga = g.fga2 + g.fga3

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
        PPP {fmtPPP(g.ppp)} ({g.pts} pts / {g.poss} poss)
        <span className="muted" style={{ fontWeight: 500, fontSize: 20 }}>
          {' '}· half {fmtPPP(half.ppp)} · since TO {fmtPPP(seg.ppp)} · scored on {fmtPct(g.scorePct)}
        </span>
        <div className="muted" style={{ fontWeight: 500, fontSize: 20 }}>
          2FG {g.fgm2}/{g.fga2} · 3FG {g.fgm3}/{g.fga3} · FT {g.ftm}/{g.fta} · eFG {fmtPct(g.efg)} · TO {g.tos} ({fmtPct(g.toPct)}) · OREB {g.orebs}
        </div>
        <div className="muted" style={{ fontWeight: 500, fontSize: 20 }} aria-label="shot selection">
          Good shots {fmtPct(g.desirablePct)} ({fmtRatio(g.tier.TOP + g.tier.SECOND, fga)}) · top {g.tier.TOP} · 2nd {g.tier.SECOND} · 3rd {g.tier.THIRD} · paint touch on {fmtRatio(g.paintPoss, g.poss)} · reversals {g.reversals}
        </div>
      </div>

      {tips.length > 0 && (
        <section className="panel">
          <h2>Consider</h2>
          <ul style={{ margin: '6px 0 0', paddingLeft: 22 }}>
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <StatTable rows={rows} />

      <section>
        <h2>Shot selection</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Tier</th>
              <th>FGA</th>
              <th>FGM</th>
              <th>FG%</th>
              <th>Share</th>
              <th className="key">Pts / shot</th>
            </tr>
          </thead>
          <tbody>
            {shots.map((r, i) => (
              <tr key={r.shot}>
                <td>{r.label}</td>
                <td>{i < 2 ? 'Top' : i < 4 ? '2nd' : '3rd'}</td>
                <td>{r.fga}</td>
                <td>{r.fgm}</td>
                <td>{fmtPct(r.fga ? r.fgm / r.fga : null)}</td>
                <td>{fmtPct(fga ? r.fga / fga : null)}</td>
                <td className="key">{fmtPPP(r.fga ? r.pts / r.fga : null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Section title="Bunches of 10" rows={bunchesOf10(tagged).map((b) => ({ label: b.label, stats: b.stats }))} />
      <Section title="By segment" rows={segments(tagged, game)} />
      <Section title="By family" rows={byFamily(tagged)} />
      <Section title="By play" rows={byPlay(tagged)} />
      <Section title="Shot clock at half court" rows={byClock(tagged)} />
      <Section title="Triggers" rows={byTrigger(tagged)} />
      <Section title="Late clock" rows={byLateClock(tagged)} />
      <Section title="Paint touch" rows={byPaintTouch(tagged)} />
      <Section title="Reversals" rows={byReversals(tagged)} />
      {oreb.chances > 0 && (
        <section>
          <h2>Second chance</h2>
          <div>
            {oreb.chances} offensive rebounds · scored on {oreb.scored} · {oreb.pts} pts · {fmtPPP(oreb.pts / oreb.chances)} per chance
          </div>
        </section>
      )}
    </div>
  )
}
