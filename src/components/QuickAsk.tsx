import { useEffect, useState } from 'react'
import type { Game } from '../domain/types'
import { fmtPct } from '../engine/format'
import type { Tagged } from '../engine/streaks'
import { stats, WINDOW_LABEL, windowSlice, type WindowKey } from '../engine/windows'

type Chip = WindowKey | 'PAINT' | 'TO'
const CHIPS: Chip[] = ['LAST3', 'LAST10', 'SEGMENT', 'HALF', 'HALF1', 'GAME', 'PAINT', 'TO']

interface Props {
  tagged: Tagged[]
  game: Pick<Game, 'timeouts' | 'halfEnds'>
}

export default function QuickAsk({ tagged, game }: Props) {
  const [active, setActive] = useState<Chip | null>(null)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setActive(null), 4000)
    return () => clearTimeout(t)
  }, [active])

  const label = (c: Chip) => (c === 'PAINT' ? 'Paint' : c === 'TO' ? 'TOs' : WINDOW_LABEL[c])
  const inSecondHalf = game.halfEnds.length > 0
  const chips = CHIPS.filter((c) => c !== 'HALF1' || inSecondHalf)

  let big = ''
  let sub = ''
  if (active) {
    const g = stats(tagged)
    if (active === 'PAINT') {
      big = fmtPct(g.poss ? g.paintPoss / g.poss : null)
      sub = `paint touch on ${g.paintPoss} of ${g.poss} poss`
    } else if (active === 'TO') {
      big = `${g.tos}`
      sub = `turnovers · ${fmtPct(g.toPct)} of ${g.poss} poss`
    } else {
      const s = stats(windowSlice(tagged, active, game))
      big = fmtPct(s.scorePct)
      sub = `scored on ${s.scores} of ${s.poss} poss · ${s.tos} TO · paint touch ${s.paintPoss}/${s.poss}`
    }
  }

  return (
    <>
      <div className="row" style={{ gap: 6 }}>
        {chips.map((c) => (
          <button key={c} className={`btn chip ${active === c ? 'on' : ''}`} aria-pressed={active === c} onClick={() => setActive(active === c ? null : c)}>
            {label(c)}
          </button>
        ))}
      </div>
      {active && (
        <div className="overlay" onClick={() => setActive(null)} role="dialog" aria-label={label(active)}>
          <div className="muted" style={{ fontSize: 28 }}>
            {label(active)}
          </div>
          <div className="big">{big}</div>
          <div style={{ fontSize: 28 }}>{sub}</div>
        </div>
      )}
    </>
  )
}
