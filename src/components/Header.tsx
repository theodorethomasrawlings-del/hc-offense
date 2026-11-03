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
  const g = stats(tagged)
  const badge = streakBadge(tagged[tagged.length - 1])
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
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <QuickAsk tagged={tagged} game={game} />
      </div>
    </header>
  )
}
