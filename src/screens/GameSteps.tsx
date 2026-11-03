import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ButtonGroup from '../components/ButtonGroup'
import Header from '../components/Header'
import { chunkText } from '../components/PossessionChart'
import { actionsOf, chunkPoints, CLOCKS, CONT_LABEL, familyNames, LATE_CLOCKS, playLabel, RESULT_LABEL, SHOTS, SHOT_LABEL, TRIGGERS } from '../domain/labels'
import type { ClockBucket, Continuation, LateClock, Shot, Trigger } from '../domain/types'
import { draftChunk, draftComplete, rollUp, useGameStore } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

/** One question per screen: play → action → how it ended → made? → FTs → rebound → details + save. */
export type Step = 'PLAY' | 'ACTION' | 'END' | 'MADE' | 'FT' | 'REB' | 'DETAILS'

const PAINT_SHOTS: Shot[] = ['RIM2', 'PAINT2', 'PAINT3']
const FT_OPTIONS = ['0/1', '1/1', '0/2', '1/2', '2/2', '1/3', '2/3', '3/3']

export default function GameSteps() {
  const nav = useNavigate()
  const g = useGameStore()
  const settings = useSettings()
  const [msg, setMsg] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState<Step>('PLAY')

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
  const pts = soFar + chunkPoints(draftChunk(draft))
  const ftm = draft.ftm ?? 0
  const fta = draft.fta ?? 0
  const paintTouches = draft.paintTouches ?? 0
  const reversals = draft.reversals ?? 0

  const families = familyNames(settings.labels)
  const actions = draft.family ? actionsOf(settings.labels, draft.family) : []

  // --- steps ---
  const pickFamily = (f: string) => {
    g.setDraft({ family: f, action: '' })
    setStep(actionsOf(settings.labels, f).length ? 'ACTION' : 'END')
  }
  const pickAction = (a: string) => {
    g.setDraft({ action: a })
    setStep('END')
  }
  const pickShot = (s: Shot) => {
    g.setDraft({ shot: s, result: undefined, ftm: 0, fta: 0, paintTouches: PAINT_SHOTS.includes(s) && !paintTouches ? 1 : paintTouches })
    setStep('MADE')
  }
  const turnover = () => {
    g.setDraft({ shot: 'NONE', result: 'TO', ftm: 0, fta: 0 })
    setStep('DETAILS')
  }
  const fouledNoShot = () => {
    g.setDraft({ shot: 'NONE', result: 'FOUL', ftm: 0, fta: 0 })
    setStep('FT')
  }
  const made = () => {
    g.setDraft({ result: 'MADE', ftm: 0, fta: 0 })
    setStep('DETAILS')
  }
  const missed = () => {
    g.setDraft({ result: 'MISSED', ftm: 0, fta: 0 })
    setStep('REB')
  }
  const andOne = () => {
    g.setDraft({ result: 'MADE' })
    setStep('FT')
  }
  const fouledShooting = () => {
    g.setDraft({ result: 'FOUL' })
    setStep('FT')
  }
  const pickFT = (v: string) => {
    const [m, a] = v.split('/').map(Number)
    g.setDraft({ ftm: m, fta: a })
    // A missed last free throw is a live ball: ask about the rebound.
    setStep(m < a ? 'REB' : 'DETAILS')
  }
  const theyGotIt = () => setStep('DETAILS')
  const keepBall = (c: Continuation) => {
    g.continuePossession(c)
    setStep('PLAY')
    setMsg(null)
  }
  const single = <K extends string>(field: 'trigger' | 'lateClock' | 'clock', v: K) => g.setDraft({ [field]: draft[field] === v ? null : v })

  const save = async () => {
    if (!complete) {
      setMsg('Tap how it ended first')
      setStep('END')
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
    setStep('PLAY')
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
    setStep('DETAILS')
    setMsg(`Editing #${last.n}`)
  }

  const back = () => {
    setMsg(null)
    switch (step) {
      case 'PLAY':
        if (chunks.length) {
          const prev = chunks[chunks.length - 1]
          g.setDraft({ chunks: chunks.slice(0, -1), shot: prev.shot, result: prev.result, ftm: prev.ftm, fta: prev.fta, family: prev.family, action: prev.action, paintTouches: prev.paintTouches, reversals: prev.reversals })
          setStep('REB')
        }
        return
      case 'ACTION':
        g.setDraft({ family: '', action: '' })
        setStep('PLAY')
        return
      case 'END':
        setStep(draft.family && actions.length ? 'ACTION' : 'PLAY')
        return
      case 'MADE':
        g.setDraft({ shot: undefined, result: undefined })
        setStep('END')
        return
      case 'FT':
        g.setDraft({ ftm: 0, fta: 0 })
        setStep(draft.shot && draft.shot !== 'NONE' ? 'MADE' : 'END')
        return
      case 'REB':
        setStep(fta ? 'FT' : 'MADE')
        return
      case 'DETAILS':
        setStep(draft.result === 'TO' ? 'END' : draft.result === 'MISSED' || ftm < fta ? 'REB' : fta ? 'FT' : 'MADE')
        return
    }
  }

  const cancelOrUndo = async () => {
    setMsg(null)
    g.clearDraft()
    setStep('PLAY')
    if (editing) {
      setEditing(false)
      return
    }
    if (step === 'PLAY' && !chunks.length) await g.undoLast()
  }

  const mediaTO = async () => {
    await g.mediaTimeout()
    nav('/summary')
  }
  const hcTO = async (kind: 'FULL' | 'THIRTY') => {
    await g.hcTimeout(kind)
    nav('/summary')
  }
  const endHalf = async () => {
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

  // What has been answered so far on this possession.
  const crumbs = [playLabel({ family: draft.family ?? '', action: draft.action ?? '' }), draft.shot && draft.shot !== 'NONE' ? SHOT_LABEL[draft.shot] : '', draft.result ? RESULT_LABEL[draft.result] : '', fta ? `${ftm}/${fta} FT` : '']
    .filter(Boolean)
    .join(' · ')
  const idle = step === 'PLAY' && !draft.family && !chunks.length && !editing

  const question: Record<Step, string> = {
    PLAY: 'What play?',
    ACTION: `${draft.family}: which action?`,
    END: 'How did it end?',
    MADE: `${draft.shot ? SHOT_LABEL[draft.shot] : 'Shot'}: made?`,
    FT: 'Free throws made?',
    REB: 'Who got the rebound?',
    DETAILS: 'Save, or add details first.',
  }

  return (
    <main className="screen game" style={{ gap: 8 }}>
      <Header game={game} tagged={g.tagged} n={n} half={half} />
      {(chunks.length > 0 || crumbs) && (
        <div className="panel row" style={{ gap: 12, padding: '6px 12px', flexWrap: 'wrap' }} role="status" aria-label="so far">
          <b>
            #{n}
            {chunks.length > 0 && ` shot ${chunks.length + 1}`}
          </b>
          {chunks.length > 0 && <span className="muted">{chunks.map((c) => `${chunkText(c)} → ${c.cont ? CONT_LABEL[c.cont] : ''}`).join(' · ')}</span>}
          {crumbs && <span>{crumbs}</span>}
          <span className="badge" aria-label="points this possession">{pts} PTS</span>
        </div>
      )}

      <h1 className="question" aria-live="polite">
        {question[step]}
      </h1>

      <div className="grid step" style={{ gap: 10, alignContent: 'start', flex: 1, minHeight: 0 }}>
        {step === 'PLAY' && <ButtonGroup columns={4} height={64} options={families.map((f) => ({ key: f, label: f }))} selected={draft.family || undefined} onSelect={pickFamily} ariaLabel="play" />}
        {step === 'ACTION' && (
          <>
            <ButtonGroup columns={4} height={60} options={actions.map((a) => ({ key: a, label: a }))} selected={draft.action || undefined} onSelect={pickAction} ariaLabel="action" />
            <button className="btn small" onClick={() => setStep('END')}>
              No action, just {draft.family}
            </button>
          </>
        )}
        {step === 'END' && (
          <>
            <ButtonGroup<Shot> title="Shot (top · 2nd · 3rd tier)" columns={2} height={60} options={SHOTS.map((s) => ({ key: s.key, label: s.label }))} selected={draft.shot} onSelect={pickShot} />
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button className="btn score" style={{ minHeight: 60 }} onClick={turnover}>
                Turnover
              </button>
              <button className="btn" style={{ minHeight: 60 }} onClick={fouledNoShot}>
                Fouled, no shot
              </button>
            </div>
          </>
        )}
        {step === 'MADE' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn stop on" style={{ minHeight: 80 }} onClick={made}>
              Made
            </button>
            <button className="btn score on" style={{ minHeight: 80 }} onClick={missed}>
              Missed
            </button>
            <button className="btn" style={{ minHeight: 64 }} onClick={andOne}>
              And-1 (made + FT)
            </button>
            <button className="btn" style={{ minHeight: 64 }} onClick={fouledShooting}>
              Fouled, missed shot
            </button>
          </div>
        )}
        {step === 'FT' && <ButtonGroup columns={4} height={64} options={FT_OPTIONS.map((o) => ({ key: o, label: o }))} selected={fta ? `${ftm}/${fta}` : undefined} onSelect={pickFT} ariaLabel="free throws" />}
        {step === 'REB' && (
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 8 }}>
            <button className="btn" style={{ minHeight: 72 }} onClick={theyGotIt}>
              They got it (possession over)
            </button>
            <button className="btn stop on" style={{ minHeight: 72 }} onClick={() => keepBall('OREB')}>
              OREB, keep going
            </button>
            <button className="btn" style={{ minHeight: 56 }} onClick={() => keepBall('DEAD_OREB')}>
              Dead ball OREB
            </button>
          </div>
        )}
        {step === 'DETAILS' && (
          <>
            <button className="btn primary" style={{ minHeight: 64 }} onClick={save} disabled={!complete || g.committing}>
              {editing ? 'Save' : 'Save →'}
            </button>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button className={`btn chip ${paintTouches ? 'on' : ''}`} style={{ minHeight: 48 }} onClick={() => g.setDraft({ paintTouches: (paintTouches + 1) % 4 })} aria-label="paint touch">
                Paint touch x{paintTouches}
              </button>
              <button className={`btn chip ${reversals ? 'on' : ''}`} style={{ minHeight: 48 }} onClick={() => g.setDraft({ reversals: (reversals + 1) % 4 })} aria-label="reversal">
                Reversal x{reversals}
              </button>
              {step === 'DETAILS' && (
                <>
                  <button className="btn chip" style={{ minHeight: 48 }} onClick={() => setStep('PLAY')}>
                    Change play
                  </button>
                  <button className="btn chip" style={{ minHeight: 48 }} onClick={() => setStep('END')}>
                    Change shot
                  </button>
                </>
              )}
            </div>
            <ButtonGroup<ClockBucket> title="Clock at half court" columns={4} height={46} fontSize={17} options={CLOCKS} selected={draft.clock ?? undefined} onSelect={(v) => single('clock', v)} />
            <div className="grid two" style={{ gap: 10 }}>
              <ButtonGroup<Trigger> title="Trigger" columns={3} height={46} fontSize={15} options={TRIGGERS} selected={draft.trigger ?? undefined} onSelect={(v) => single('trigger', v)} />
              <ButtonGroup<LateClock> title="Late clock at 12" columns={2} height={46} fontSize={17} options={LATE_CLOCKS} selected={draft.lateClock ?? undefined} onSelect={(v) => single('lateClock', v)} />
            </div>
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
          </>
        )}
      </div>

      <footer className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
        <div className="row" style={{ gap: 6, fontSize: 15, flexWrap: 'wrap' }}>
          {step !== 'PLAY' || chunks.length ? (
            <button className="btn small" onClick={back}>
              ← Back
            </button>
          ) : null}
          <button className="btn small" onClick={cancelOrUndo} disabled={idle && !g.possessions.length}>
            {editing ? 'Cancel edit' : idle ? 'Undo last' : 'Start over'}
          </button>
          {idle && (
            <>
              <button className="btn small" onClick={editLast} disabled={!g.possessions.length}>
                Edit last
              </button>
              {markOnLast ? (
                <button className="btn small warn" onClick={undoMark}>
                  Undo {markLabel}
                </button>
              ) : (
                <>
                  <button className="btn small" onClick={mediaTO} disabled={!g.possessions.length}>
                    Media TO
                  </button>
                  <button className="btn small" onClick={() => hcTO('FULL')}>
                    Full TO
                  </button>
                  <button className="btn small" onClick={() => hcTO('THIRTY')}>
                    30s TO
                  </button>
                  <button className="btn small" onClick={endHalf} disabled={!g.possessions.length || half >= 3}>
                    End half
                  </button>
                </>
              )}
              <button className="btn small danger" onClick={endGame}>
                End game
              </button>
            </>
          )}
          {msg && <span className="warn" role="status">{msg}</span>}
        </div>
        <div className="row">
          {idle && (
            <button className="btn" style={{ minHeight: 64, minWidth: 120, background: 'var(--stop)', color: '#000' }} onClick={() => nav('/summary')}>
              Summary
            </button>
          )}
        </div>
      </footer>
    </main>
  )
}
