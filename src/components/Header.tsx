import { useNavigate } from 'react-router-dom'
import type { Game, Half } from '../domain/types'
import type { Tagged } from '../engine/streaks'
import { fmtPct, fmtPPP } from '../engine/format'
import { fmtTimeouts, hcTimeoutsLeft } from '../engine/timeouts'
import { stats } from '../engine/windows'
import QuickAsk from './QuickAsk'

interface Props {
  game: Game
  tagged: Tagged[]
  n: number
  half: Half
}

export function streakBadge(last: Tagged | undefined): { text: string; tone: 'stop' | 'score' | '' } {
  if (!last) return { text: 'NO POSSESSIONS YET', tone: '' }
  if (last.run) return { text: 'RUN! 3 SCORES IN A ROW', tone: 'stop' }
  if (last.drought) return { text: 'DROUGHT · 3 EMPTY IN A ROW', tone: 'score' }
  if (last.isScore) return { text: `${last.scoreRun} SCORE${last.scoreRun === 1 ? '' : 'S'} IN A ROW`, tone: 'stop' }
  return { text: `${last.emptyRun} EMPTY IN A ROW`, tone: 'score' }
}

const halfLabel = (h: Half) => (h === 3 ? 'OT' : `${h}${h === 1 ? 'st' : 'nd'}`)

export default function Header({ game, tagged, n, half }: Props) {
  const nav = useNavigate()
  const g = stats(tagged)
  const badge = streakBadge(tagged[tagged.length - 1])
  const tf = (s: number[]) => s[half - 1] ?? 0
  const out = (ps: Game['rosterUs']) => ps.filter((p) => p.fouls >= 5).length
  return (
    <header className="grid" style={{ gap: 6 }}>
      <div className="row" style={{ minHeight: 48, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>
          #{n} <span className="muted" style={{ fontSize: 18 }}>{halfLabel(half)}</span>
        </div>
        <span className={`badge ${badge.tone}`}>{badge.text}</span>
        <span className="badge" aria-label="game totals">
          PPP {fmtPPP(g.ppp)} · {g.pts} PTS / {g.poss} · TO {g.tos}
        </span>
        <span className="badge" aria-label="shots">
          GOOD SHOTS {fmtPct(g.desirablePct)} · eFG {fmtPct(g.efg)}
        </span>
        <span className="badge" aria-label="paint">
          PAINT {g.paintPoss}/{g.poss}
        </span>
        <span className="badge" aria-label="timeouts left">
          TO {fmtTimeouts(hcTimeoutsLeft(game, half))}
        </span>
        <button className="btn chip" style={{ fontWeight: 800 }} onClick={() => nav('/fouls')} aria-label="foul chart">
          FOULS HC {tf(game.teamFouls.us)} · {game.opponent.toUpperCase().slice(0, 8)} {tf(game.teamFouls.them)}
          {out(game.rosterUs) + out(game.rosterThem) > 0 && ` · ${out(game.rosterUs) + out(game.rosterThem)} OUT`} · ARROW {game.arrowUs ? 'US' : 'THEM'}
        </button>
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <QuickAsk tagged={tagged} game={game} />
      </div>
    </header>
  )
}
