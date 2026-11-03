import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ButtonGroup from '../components/ButtonGroup'
import Header from '../components/Header'
import { chunkText } from '../components/PossessionChart'
import { actionsOf, chunkPoints, CLOCKS, CONTINUATIONS, CONT_LABEL, familyNames, LATE_CLOCKS, RESULTS, SHOTS, TRIGGERS } from '../domain/labels'
import type { ClockBucket, Continuation, LateClock, Result, Shot, Trigger } from '../domain/types'
import { draftChunk, draftComplete, rollUp, useGameStore } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

const PAINT_SHOTS: Shot[] = ['RIM2', 'PAINT2', 'PAINT3']

export default function Game() {
  const nav = useNavigate()
  const g = useGameStore()
  const settings = useSettings()
  const [msg, setMsg] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

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
  const chunks = draft.chunks ?? []
  const complete = draftComplete(draft)
  const soFar = chunks.reduce((a, c) => a + chunkPoints(c), 0)
  const thisChunk = chunkPoints(draftChunk(draft))

  const families = familyNames(settings.labels)
  const actions = draft.family ? actionsOf(settings.labels, draft.family) : []

  const pickFamily = (f: string) => g.setDraft(draft.family === f ? { family: '', action: '' } : { family: f, action: '' })
  const pickAction = (a: string) => g.setDraft({ action: draft.action === a ? '' : a })
  const pickShot = (s: Shot) => {
    const shot = draft.shot === s ? undefined : s
    // A rim 2, paint 2 or paint-touch 3 is a paint touch by definition.
    const paint = shot && PAINT_SHOTS.includes(shot) && !(draft.paintTouches ?? 0) ? { paintTouches: 1 } : {}
    g.setDraft({ shot, ...paint })
  }
  const pickResult = (r: Result) => {
    const result = draft.result === r ? undefined : r
    // A turnover has no shot and no free throws.
    g.setDraft(result === 'TO' ? { result, shot: undefined, ftm: 0, fta: 0 } : { result })
  }
  const ftm = draft.ftm ?? 0
  const fta = draft.fta ?? 0
  const madeFT = () => g.setDraft({ ftm: Math.min(3, ftm + 1), fta: Math.min(3, fta + 1), result: draft.result && draft.result !== 'NONE' && draft.result !== 'TO' ? draft.result : 'FOUL' })
  const missedFT = () => g.setDraft({ fta: Math.min(3, fta + 1), result: draft.result && draft.result !== 'NONE' && draft.result !== 'TO' ? draft.result : 'FOUL' })
  const clearFT = () => g.setDraft({ ftm: 0, fta: 0 })
  const paintTouches = draft.paintTouches ?? 0
  const reversals = draft.reversals ?? 0

  const single = <K extends string>(field: 'trigger' | 'lateClock' | 'clock', v: K) => g.setDraft({ [field]: draft[field] === v ? null : v })

  const next = async () => {
    if (!complete) {
      setMsg('Tap how it ended first')
      return
    }
    if (g.committing) return
    setMsg(null)
    if (editing) {
      const all = [...chunks, draftChunk(draft)]
      await g.editPossession(last.id, {
        ...rollUp(all),
        trigger: draft.trigger ?? null,
        lateClock: draft.lateClock ?? null,
        clock: draft.clock ?? null,
        note: draft.note ?? '',
        chunks: all.length > 1 ? all : [],
      })
      g.clearDraft()
      setEditing(false)
    } else {
      await g.commitPossession()
    }
    if (draft.note?.trim()) void settings.rememberNote(draft.note.trim())
  }

  const editLast = () => {
    if (!last) return
    const cs = last.chunks.length ? last.chunks : [draftChunk({ ...last })]
    const tail = cs[cs.length - 1]
    g.setDraft({
      chunks: cs.slice(0, -1),
      shot: tail.shot,
      result: tail.result,
      ftm: tail.ftm,
      fta: tail.fta,
      family: tail.family,
      action: tail.action,
      paintTouches: tail.paintTouches,
      reversals: tail.reversals,
      trigger: last.trigger,
      lateClock: last.lateClock,
      clock: last.clock,
      note: last.note,
    })
    setEditing(true)
    setMsg(`Editing #${last.n}`)
  }

  const undo = async () => {
    if (chunks.length) {
      const prev = chunks[chunks.length - 1]
      g.setDraft({ chunks: chunks.slice(0, -1), shot: prev.shot, result: prev.result, ftm: prev.ftm, fta: prev.fta, family: prev.family, action: prev.action, paintTouches: prev.paintTouches, reversals: prev.reversals })
      setMsg(null)
      return
    }
    if (editing) {
      g.clearDraft()
      setEditing(false)
      setMsg(null)
      return
    }
    await g.undoLast()
    setMsg(null)
  }

  const continuePossession = (c: Continuation) => {
    if (c === 'OREB' || c === 'DEAD_OREB') {
      if (draft.result !== 'MISSED' && !(draft.result === 'FOUL' && fta > 0)) {
        setMsg('An OREB follows a missed shot or missed FT')
        return
      }
    }
    g.continuePossession(c)
    setMsg(null)
  }

  const mediaTO = async () => {
    if (editing) return
    await g.mediaTimeout()
    nav('/summary')
  }
  const hcTO = async (kind: 'FULL' | 'THIRTY') => {
    if (editing) return
    await g.hcTimeout(kind)
    nav('/summary')
  }
  const endHalf = async () => {
    if (editing) return
    await g.endHalf()
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
  const noteHistory = [...new Set([...settings.noteHistory, ...g.possessions.map((p) => p.note.trim()).filter(Boolean)])].slice(0, 60)

  return (
    <main className="screen game" style={{ gap: 8 }}>
      <Header game={game} tagged={g.tagged} n={n} half={half} />
      {chunks.length > 0 && (
        <div className="panel row" style={{ gap: 12, padding: '6px 12px' }} role="status" aria-label="continuation">
          <b>#{n} shot {chunks.length + 1}</b>
          <span className="muted">
            so far: {soFar} pts · {chunks.map((c) => `${chunkText(c)} → ${c.cont ? CONT_LABEL[c.cont] : ''}`).join(' · ')}
          </span>
        </div>
      )}

      <div className="grid cols" style={{ gap: 12, flex: 1, minHeight: 0, alignContent: 'start' }}>
        <div className="grid" style={{ gap: 10, alignContent: 'start' }}>
          <ButtonGroup
            title="Play"
            columns={4}
            height={50}
            fontSize={18}
            options={families.map((f) => ({ key: f, label: f }))}
            selected={draft.family || undefined}
            onSelect={pickFamily}
          />
          {draft.family && (
            <ButtonGroup
              title={`${draft.family} action`}
              columns={3}
              height={46}
              fontSize={17}
              options={actions.map((a) => ({ key: a, label: a }))}
              selected={draft.action || undefined}
              onSelect={pickAction}
            />
          )}
        </div>

        <div className="grid" style={{ gap: 10, alignContent: 'start' }}>
          <ButtonGroup<Shot>
            title="Shot (top · 2nd · 3rd tier)"
            columns={2}
            height={50}
            fontSize={18}
            options={SHOTS.map((s) => ({ key: s.key, label: s.label }))}
            selected={draft.shot}
            onSelect={pickShot}
          />
          <ButtonGroup<Result> title="How it ended" columns={4} height={56} fontSize={18} options={RESULTS} selected={draft.result} onSelect={pickResult} />
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <span className="badge" aria-label="free throws">FT {ftm}/{fta}</span>
            <button className="btn chip" style={{ minHeight: 40 }} onClick={madeFT} aria-label="made FT">+ made FT</button>
            <button className="btn chip" style={{ minHeight: 40 }} onClick={missedFT} aria-label="missed FT">+ missed FT</button>
            {fta > 0 && <button className="btn chip" style={{ minHeight: 40 }} onClick={clearFT}>clear</button>}
            <span className="badge" aria-label="points this possession">{soFar + thisChunk} PTS</span>
          </div>
          <div className="row">
            <button className={`btn chip ${paintTouches ? 'on' : ''}`} style={{ minHeight: 44 }} onClick={() => g.setDraft({ paintTouches: (paintTouches + 1) % 4 })} aria-label="paint touch">
              Paint touch x{paintTouches}
            </button>
            <button className={`btn chip ${reversals ? 'on' : ''}`} style={{ minHeight: 44 }} onClick={() => g.setDraft({ reversals: (reversals + 1) % 4 })} aria-label="reversal">
              Reversal x{reversals}
            </button>
          </div>
        </div>

        <div className="grid" style={{ gap: 10, alignContent: 'start' }}>
          <ButtonGroup<ClockBucket> title="Clock at half court" columns={4} height={44} fontSize={17} options={CLOCKS} selected={draft.clock ?? undefined} onSelect={(v) => single('clock', v)} />
          <ButtonGroup<Trigger> title="Trigger" columns={3} height={44} fontSize={15} options={TRIGGERS} selected={draft.trigger ?? undefined} onSelect={(v) => single('trigger', v)} />
          <ButtonGroup<LateClock> title="Late clock at 12" columns={2} height={44} fontSize={17} options={LATE_CLOCKS} selected={draft.lateClock ?? undefined} onSelect={(v) => single('lateClock', v)} />
          <ButtonGroup<Continuation> title="We kept the ball" columns={3} height={44} fontSize={15} options={CONTINUATIONS} selected={undefined} onSelect={continuePossession} />
          <input
            type="text"
            placeholder="Note (optional)"
            aria-label="note"
            list="note-history"
            value={draft.note ?? ''}
            onChange={(e) => g.setDraft({ note: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            enterKeyHint="done"
          />
          <datalist id="note-history">
            {noteHistory.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </div>
      </div>

      <footer className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
        <div className="row" style={{ gap: 6, fontSize: 15 }}>
          <button className="btn small" onClick={undo} disabled={!g.possessions.length && !editing && !chunks.length}>
            {chunks.length ? 'Back a shot' : editing ? 'Cancel edit' : 'Undo last'}
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
              <button className="btn small" onClick={mediaTO} disabled={!g.possessions.length || editing}>
                Media TO
              </button>
              <button className="btn small" onClick={() => hcTO('FULL')} disabled={editing}>
                Full TO
              </button>
              <button className="btn small" onClick={() => hcTO('THIRTY')} disabled={editing}>
                30s TO
              </button>
              <button className="btn small" onClick={endHalf} disabled={!g.possessions.length || half >= 3 || editing}>
                End half
              </button>
            </>
          )}
          <button className="btn small danger" onClick={endGame}>
            End game
          </button>
          {msg && <span className="warn" role="status">{msg}</span>}
        </div>
        <div className="row">
          <button className="btn" style={{ minHeight: 72, minWidth: 120, background: 'var(--stop)', color: '#000' }} onClick={() => nav('/summary')}>
            Summary
          </button>
          <button className="btn primary" style={{ minWidth: 170, minHeight: 72 }} onClick={next} disabled={!complete || g.committing}>
            {editing ? 'Save' : 'Next'} →
          </button>
        </div>
      </footer>
    </main>
  )
}
