import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Game, Half, Player, Side, TimeoutKind } from '../domain/types'
import { useGameStore } from '../store/gameStore'

const HALF_LABEL: Record<Half, string> = { 1: '1st', 2: '2nd', 3: 'OT' }
/** Timeouts in the order they sit on the sheet: the first 30 is use-it-or-lose-it in the 1st half, then two 30s, then the full. */
const SLOTS: TimeoutKind[] = ['THIRTY', 'THIRTY', 'THIRTY', 'FULL']

function Boxes({ count, max, onSet, label, warnAt, outAt }: { count: number; max: number; onSet(n: number): void; label: string; warnAt?: number; outAt?: number }) {
  return (
    <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }} role="group" aria-label={label}>
      {Array.from({ length: max }, (_, i) => i + 1).map((k) => {
        const on = k <= count
        const tone = on && outAt && k >= outAt ? 'out' : on && warnAt && k >= warnAt ? 'warn' : ''
        return (
          <button key={k} className={`box ${on ? 'on' : ''} ${tone}`} aria-pressed={on} aria-label={`${label} ${k}`} onClick={() => onSet(k === count ? k - 1 : k)}>
            {k}
          </button>
        )
      })}
    </div>
  )
}

function Timeouts({ used, half, onUse, onUndo, label }: { used: { half: Half; kind: TimeoutKind }[]; half: Half; onUse(kind: TimeoutKind): void; onUndo(): void; label: string }) {
  // Fill slots left to right: 30s first (the 1st-half-only one first), the full last.
  const thirties = used.filter((t) => t.kind === 'THIRTY').length
  const fulls = used.filter((t) => t.kind === 'FULL').length
  const filled = SLOTS.map((k, i) => (k === 'FULL' ? fulls > 0 : i < thirties))
  const lostFirst30 = half > 1 && !used.some((t) => t.kind === 'THIRTY' && t.half === 1)
  return (
    <div className="row" style={{ gap: 6, alignItems: 'center' }} role="group" aria-label={`${label} timeouts`}>
      <span className="muted" style={{ fontSize: 15 }}>TO:</span>
      {SLOTS.map((k, i) => {
        const on = filled[i]
        const lost = i === 0 && lostFirst30 && !on
        return (
          <button
            key={i}
            className={`box to ${on ? 'on' : ''} ${i === 0 ? 'circle' : ''} ${lost ? 'lost' : ''}`}
            aria-pressed={on}
            aria-label={`${label} ${k === 'FULL' ? 'full' : '30'} ${i + 1}`}
            onClick={() => (on ? onUndo() : onUse(k))}
            disabled={lost}
          >
            {k === 'FULL' ? 'Full' : '30'}
          </button>
        )
      })}
    </div>
  )
}

function RosterEditor({ roster, onChange }: { roster: Player[]; onChange(next: Player[]): void }) {
  const set = (i: number, patch: Partial<Player>) => onChange(roster.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  return (
    <div className="grid" style={{ gap: 4 }}>
      {roster.map((p, i) => (
        <div className="row" key={i}>
          <input type="text" value={p.num} aria-label={`number ${i + 1}`} style={{ width: 70 }} onChange={(e) => set(i, { num: e.target.value })} />
          <input type="text" value={p.name} aria-label={`name ${i + 1}`} onChange={(e) => set(i, { name: e.target.value })} />
          <button className="btn small danger" onClick={() => onChange(roster.filter((_, j) => j !== i))} aria-label="remove">✕</button>
        </div>
      ))}
      <button className="btn small" onClick={() => onChange([...roster, { num: '', name: '', fouls: 0 }])}>
        + Add player
      </button>
    </div>
  )
}

function TeamColumn({ game, side, half, editing, draft, setDraft }: { game: Game; side: Side; half: Half; editing: boolean; draft: Player[]; setDraft(p: Player[]): void }) {
  const g = useGameStore()
  const roster = side === 'us' ? game.rosterUs : game.rosterThem
  const name = side === 'us' ? 'Holy Cross' : game.opponent
  const tos = side === 'us' ? game.hcTimeouts : game.oppTimeouts
  const halves: Half[] = game.halfEnds.length >= 2 || half === 3 ? [1, 2, 3] : [1, 2]
  return (
    <section className="panel grid" style={{ gap: 10, alignContent: 'start', minWidth: 0 }} aria-label={`${name} fouls`}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <h2 style={{ color: 'var(--fg)', fontSize: 22 }}>{name}</h2>
        <Timeouts used={tos} half={half} label={name} onUse={(k) => void (side === 'us' ? g.hcTimeout(k) : g.oppTimeout(k))} onUndo={() => void (side === 'us' ? g.undoHcTimeout() : g.undoOppTimeout())} />
      </div>
      <div className="grid" style={{ gap: 6 }}>
        {halves.map((h) => (
          <div className="row" key={h} style={{ gap: 8 }}>
            <span className={`muted ${h === half ? 'now' : ''}`} style={{ width: 44, fontSize: 15, fontWeight: h === half ? 800 : 500 }}>
              {HALF_LABEL[h]}
            </span>
            <Boxes count={game.teamFouls[side][h - 1] ?? 0} max={10} label={`${name} team fouls ${HALF_LABEL[h]}`} warnAt={7} outAt={10} onSet={(n) => void g.setTeamFouls(side, h, n)} />
          </div>
        ))}
      </div>
      {editing ? (
        <RosterEditor roster={draft} onChange={setDraft} />
      ) : roster.length === 0 ? (
        <div className="muted">No roster loaded. Tap Edit rosters to add players.</div>
      ) : (
        <div className="grid" style={{ gap: 4 }}>
          {roster.map((p) => (
            <div className={`row player ${p.fouls >= 5 ? 'out' : ''}`} key={p.num + p.name} style={{ gap: 8 }}>
              <span className="num">{p.num}</span>
              <span className="name">{p.name}</span>
              <Boxes count={p.fouls} max={5} label={`${name} ${p.num} fouls`} warnAt={4} outAt={5} onSet={(n) => void g.setPlayerFouls(side, p.num, n)} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function FoulChart() {
  const nav = useNavigate()
  const g = useGameStore()
  const [editing, setEditing] = useState(false)
  const [us, setUs] = useState<Player[]>([])
  const [them, setThem] = useState<Player[]>([])

  useEffect(() => {
    if (!g.loaded) void g.load()
  }, [g])
  useEffect(() => {
    if (g.loaded && !g.game) nav('/setup', { replace: true })
  }, [g.loaded, g.game, nav])

  if (!g.game) return null
  const { game } = g
  const half = g.currentHalf()

  const startEdit = () => {
    setUs(game.rosterUs)
    setThem(game.rosterThem)
    setEditing(true)
  }
  const saveEdit = async () => {
    const clean = (ps: Player[]) => ps.filter((p) => p.num.trim() || p.name.trim()).map((p) => ({ ...p, num: p.num.trim(), name: p.name.trim() }))
    await g.setRosters(clean(us), clean(them))
    setEditing(false)
  }

  return (
    <main className="screen fouls">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <h1>
          Foul chart <span className="muted" style={{ fontSize: 18 }}>{HALF_LABEL[half]} half</span>
        </h1>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className={`btn ${game.arrowUs ? 'stop on' : 'score on'}`} style={{ minHeight: 48, fontSize: 18 }} onClick={() => void g.toggleArrow()} aria-label="possession arrow">
            Arrow: {game.arrowUs ? 'HOLY CROSS' : game.opponent.toUpperCase()}
          </button>
          {editing ? (
            <>
              <button className="btn small" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn small primary" onClick={saveEdit}>Save rosters</button>
            </>
          ) : (
            <button className="btn small" onClick={startEdit}>Edit rosters</button>
          )}
          <button className="btn primary" style={{ minHeight: 48, minWidth: 140 }} onClick={() => nav('/game')}>
            Close
          </button>
        </div>
      </div>
      <div className="scroll grid two" style={{ gap: 12, alignContent: 'start' }}>
        <TeamColumn game={game} side="us" half={half} editing={editing} draft={us} setDraft={setUs} />
        <TeamColumn game={game} side="them" half={half} editing={editing} draft={them} setDraft={setThem} />
      </div>
    </main>
  )
}
