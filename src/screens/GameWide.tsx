import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ButtonGroup from '../components/ButtonGroup'
import Header from '../components/Header'
import { actionsOf, familyNames } from '../domain/labels'
import type { Result } from '../domain/types'
import { useGameStore } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

const RESULT_OPTIONS: { key: Result; label: string; tone?: 'stop' | 'score' }[] = [
  { key: 'MADE', label: 'Made', tone: 'stop' },
  { key: 'MISSED', label: 'Missed', tone: 'score' },
  { key: 'TO', label: 'Turnover', tone: 'score' },
]

/** iPad: play, result and paint touch on one screen. The possession saves itself once result and paint touch are both tapped. */
export default function GameWide() {
  const nav = useNavigate()
  const g = useGameStore()
  const settings = useSettings()
  const [msg, setMsg] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [paint, setPaint] = useState<boolean | null>(null)

  useEffect(() => {
    if (!g.loaded) void g.load()
    if (!settings.loaded) void settings.load()
  }, [g, settings])

  useEffect(() => {
    if (g.loaded && !g.game) nav('/setup', { replace: true })
  }, [g.loaded, g.game, nav])

  const editingRef = useRef(false)
  editingRef.current = editing
  useEffect(() => {
    return () => {
      if (editingRef.current) useGameStore.getState().clearDraft()
    }
  }, [])

  if (!g.game) return null
  const { draft, game } = g
  const last = g.possessions[g.possessions.length - 1]
  const n = editing ? last.n : g.nextN()
  const half = editing ? last.half : g.currentHalf()

  const families = familyNames(settings.labels)
  const actions = draft.family ? actionsOf(settings.labels, draft.family) : []

  const save = async (result: Result, touched: boolean) => {
    if (g.committing) return
    const d = { ...g.draft, result, shot: 'NONE' as const, ftm: 0, fta: 0, paintTouches: touched ? 1 : 0 }
    if (editing) {
      await g.editPossession(last.id, {
        family: d.family ?? '',
        action: d.action ?? '',
        result,
        shot: 'NONE',
        ftm: 0,
        fta: 0,
        points: result === 'MADE' ? 2 : 0,
        paintTouches: d.paintTouches,
        chunks: [],
      })
      g.clearDraft()
      setEditing(false)
      setMsg(`Saved #${last.n}`)
    } else {
      g.setDraft(d)
      await g.commitPossession()
      setMsg(`Saved #${n}`)
    }
    setPaint(null)
  }

  const pickFamily = (f: string) => g.setDraft(draft.family === f ? { family: '', action: '' } : { family: f, action: '' })
  const pickAction = (a: string) => g.setDraft({ action: draft.action === a ? '' : a })
  const pickResult = (r: Result) => {
    if (paint != null) return void save(r, paint)
    g.setDraft({ result: draft.result === r ? undefined : r })
  }
  const pickPaint = (touched: boolean) => {
    if (draft.result && draft.result !== 'NONE') return void save(draft.result, touched)
    setPaint(paint === touched ? null : touched)
  }

  const editLast = () => {
    if (!last) return
    g.setDraft({ family: last.family, action: last.action })
    setPaint(null)
    setEditing(true)
    setMsg(`Editing #${last.n}: tap made/missed/turnover and paint touch again`)
  }
  const undo = async () => {
    if (editing) {
      g.clearDraft()
      setEditing(false)
      setMsg(null)
      return
    }
    await g.undoLast()
    setMsg(null)
  }
  const mark = async (fn: () => Promise<void>) => {
    if (editing) return
    await fn()
    nav('/summary')
  }
  const lastN = last?.n ?? 0
  const hcOnLast = game.hcTimeouts.some((t) => t.n === lastN)
  const markOnLast = hcOnLast || (lastN > 0 && (game.timeouts.includes(lastN) || game.halfEnds.includes(lastN)))
  const markLabel = hcOnLast ? 'HC TO' : game.halfEnds.includes(lastN) ? 'half' : 'media TO'
  const undoMark = async () => {
    if (!window.confirm(`Remove the ${markLabel} after #${lastN}?`)) return
    await g.undoMark()
  }
  const endGame = async () => {
    if (!window.confirm(`End game vs ${game.opponent}?`)) return
    await g.endGame()
    nav('/summary')
  }

  return (
    <main className="screen game" style={{ gap: 8 }}>
      <Header game={game} tagged={g.tagged} n={n} half={half} />

      <div className="grid cols" style={{ gap: 12, flex: 1, minHeight: 0, alignContent: 'start' }}>
        <div className="grid" style={{ gap: 10, alignContent: 'start' }}>
          <ButtonGroup title="Play" columns={3} height={54} fontSize={19} options={families.map((f) => ({ key: f, label: f }))} selected={draft.family || undefined} onSelect={pickFamily} />
          {draft.family && (
            <ButtonGroup
              title={`${draft.family} action`}
              columns={3}
              height={50}
              fontSize={17}
              options={actions.map((a) => ({ key: a, label: a }))}
              selected={draft.action || undefined}
              onSelect={pickAction}
            />
          )}
        </div>

        <div className="grid" style={{ gap: 10, alignContent: 'start' }}>
          <ButtonGroup<Result> title="Made, missed or turnover" columns={1} height={76} fontSize={24} options={RESULT_OPTIONS} selected={draft.result} onSelect={pickResult} />
        </div>

        <div className="grid" style={{ gap: 10, alignContent: 'start' }} role="group" aria-label="paint touch">
          <h2>Paint touch?</h2>
          <button className={`btn stop ${paint === true ? 'on' : ''}`} style={{ minHeight: 76, fontSize: 24 }} aria-pressed={paint === true} onClick={() => pickPaint(true)}>
            Paint touch
          </button>
          <button className={`btn ${paint === false ? 'on' : ''}`} style={{ minHeight: 76, fontSize: 24 }} aria-pressed={paint === false} onClick={() => pickPaint(false)}>
            No paint touch
          </button>
          <div className="muted" style={{ fontSize: 15 }}>Saves itself once result and paint touch are both tapped.</div>
        </div>
      </div>

      <footer className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
        <div className="row" style={{ gap: 6, fontSize: 15 }}>
          <button className="btn small" onClick={undo} disabled={!g.possessions.length && !editing}>
            {editing ? 'Cancel edit' : 'Undo last'}
          </button>
          <button className="btn small" onClick={editLast} disabled={!g.possessions.length || editing}>
            Edit last
          </button>
          {markOnLast ? (
            <button className="btn small warn" onClick={undoMark}>
              Undo {markLabel}
            </button>
          ) : (
            <>
              <button className="btn small" onClick={() => mark(() => g.mediaTimeout())} disabled={!g.possessions.length || editing}>
                Media TO
              </button>
              <button className="btn small" onClick={() => mark(() => g.hcTimeout('FULL'))} disabled={editing}>
                Full TO
              </button>
              <button className="btn small" onClick={() => mark(() => g.hcTimeout('THIRTY'))} disabled={editing}>
                30s TO
              </button>
              <button className="btn small" onClick={() => mark(() => g.endHalf())} disabled={!g.possessions.length || half >= 3 || editing}>
                End half
              </button>
            </>
          )}
          <button className="btn small danger" onClick={endGame}>
            End game
          </button>
          {msg && <span className="muted" role="status">{msg}</span>}
        </div>
        <button className="btn" style={{ minHeight: 64, minWidth: 140, background: 'var(--stop)', color: '#000' }} onClick={() => nav('/summary')}>
          Summary
        </button>
      </footer>
    </main>
  )
}
