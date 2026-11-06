import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ButtonGroup from '../components/ButtonGroup'
import Header from '../components/Header'
import { actionsOf, familyNames } from '../domain/labels'
import type { Result } from '../domain/types'
import { useGameStore } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

/** One question per screen: play → action → made, missed or turnover → paint touch? Saves itself after the last tap. */
export type Step = 'PLAY' | 'ACTION' | 'RESULT' | 'PAINT'

const RESULT_OPTIONS: { key: Result; label: string; tone?: 'stop' | 'score' }[] = [
  { key: 'MADE', label: 'Made', tone: 'stop' },
  { key: 'MISSED', label: 'Missed', tone: 'score' },
  { key: 'TO', label: 'Turnover', tone: 'score' },
]

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

  const families = familyNames(settings.labels)
  const actions = draft.family ? actionsOf(settings.labels, draft.family) : []

  const pickFamily = (f: string) => {
    g.setDraft({ family: f, action: '' })
    setStep(actionsOf(settings.labels, f).length ? 'ACTION' : 'RESULT')
  }
  const noPlay = () => {
    g.setDraft({ family: '', action: '' })
    setStep('RESULT')
  }
  const pickAction = (a: string) => {
    g.setDraft({ action: a })
    setStep('RESULT')
  }
  const pickResult = (r: Result) => {
    g.setDraft({ result: r, shot: 'NONE', ftm: 0, fta: 0 })
    setStep('PAINT')
  }
  const pickPaint = async (touched: boolean) => {
    if (g.committing) return
    g.setDraft({ paintTouches: touched ? 1 : 0 })
    const d = { ...g.draft, paintTouches: touched ? 1 : 0 }
    if (editing) {
      await g.editPossession(last.id, {
        family: d.family ?? '',
        action: d.action ?? '',
        result: d.result ?? 'NONE',
        shot: 'NONE',
        ftm: 0,
        fta: 0,
        points: d.result === 'MADE' ? 2 : 0,
        paintTouches: d.paintTouches,
        chunks: [],
      })
      g.clearDraft()
      setEditing(false)
      setMsg(`Saved #${last.n}`)
    } else {
      await g.commitPossession()
      setMsg(`Saved #${n}`)
    }
    setStep('PLAY')
  }

  const back = () => {
    if (step === 'ACTION') setStep('PLAY')
    else if (step === 'RESULT') setStep(draft.family ? 'ACTION' : 'PLAY')
    else if (step === 'PAINT') setStep('RESULT')
  }

  const editLast = () => {
    if (!last) return
    g.setDraft({ family: last.family, action: last.action, result: last.result, paintTouches: last.paintTouches })
    setEditing(true)
    setStep('PLAY')
    setMsg(`Editing #${last.n}`)
  }
  const cancelEdit = () => {
    g.clearDraft()
    setEditing(false)
    setStep('PLAY')
    setMsg(null)
  }
  const undo = async () => {
    if (editing) return cancelEdit()
    await g.undoLast()
    g.clearDraft()
    setStep('PLAY')
    setMsg(null)
  }
  const mark = async (fn: () => Promise<void>) => {
    if (editing) return
    await fn()
    nav('/summary')
  }
  const endGame = async () => {
    if (!window.confirm(`End game vs ${game.opponent}?`)) return
    await g.endGame()
    nav('/summary')
  }

  const question = (text: string) => (
    <div className="question" role="heading" aria-level={1}>
      {text}
    </div>
  )
  const soFar = [draft.family, draft.action].filter(Boolean).join(' ') || (step !== 'PLAY' ? 'No set play' : '')

  return (
    <main className="screen game step" style={{ gap: 8 }}>
      <Header game={game} tagged={g.tagged} n={n} half={half} />
      {soFar && step !== 'PLAY' && (
        <div className="muted" role="status" aria-label="so far" style={{ fontSize: 16 }}>
          #{n}: {soFar}
          {draft.result && step === 'PAINT' ? ` · ${draft.result === 'TO' ? 'Turnover' : draft.result === 'MADE' ? 'Made' : 'Missed'}` : ''}
        </div>
      )}

      {step === 'PLAY' && (
        <>
          {question(`#${n}: what play?`)}
          <ButtonGroup columns={2} height={56} fontSize={19} options={families.map((f) => ({ key: f, label: f }))} selected={draft.family || undefined} onSelect={pickFamily} ariaLabel="play" />
          <button className="btn" style={{ minHeight: 52 }} onClick={noPlay}>
            No set play
          </button>
        </>
      )}
      {step === 'ACTION' && (
        <>
          {question(`${draft.family}: which action?`)}
          <ButtonGroup columns={2} height={56} fontSize={19} options={actions.map((a) => ({ key: a, label: a }))} selected={draft.action || undefined} onSelect={pickAction} ariaLabel="action" />
          <button className="btn" style={{ minHeight: 52 }} onClick={() => setStep('RESULT')}>
            Just {draft.family}
          </button>
        </>
      )}
      {step === 'RESULT' && (
        <>
          {question('Made, missed or turnover?')}
          <ButtonGroup columns={1} height={64} fontSize={22} options={RESULT_OPTIONS} selected={draft.result} onSelect={pickResult} ariaLabel="result" />
        </>
      )}
      {step === 'PAINT' && (
        <>
          {question('Paint touch?')}
          <div className="grid" style={{ gap: 8 }}>
            <button className="btn stop" style={{ minHeight: 64, fontSize: 22 }} onClick={() => void pickPaint(true)}>
              Paint touch
            </button>
            <button className="btn" style={{ minHeight: 64, fontSize: 22 }} onClick={() => void pickPaint(false)}>
              No paint touch
            </button>
          </div>
        </>
      )}

      <footer className="grid" style={{ gap: 6, marginTop: 'auto' }}>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {step !== 'PLAY' && (
            <button className="btn small" onClick={back}>
              ← Back
            </button>
          )}
          <button className="btn small" onClick={undo} disabled={!g.possessions.length && !editing}>
            {editing ? 'Cancel edit' : 'Undo last'}
          </button>
          <button className="btn small" onClick={editLast} disabled={!g.possessions.length || editing}>
            Edit last
          </button>
          <button className="btn small" onClick={() => mark(() => g.mediaTimeout())} disabled={!g.possessions.length || editing}>
            Media TO
          </button>
          <button className="btn small" onClick={() => mark(() => g.hcTimeout('FULL'))} disabled={editing}>
            HC TO
          </button>
          <button className="btn small" onClick={() => mark(() => g.endHalf())} disabled={!g.possessions.length || half >= 3 || editing}>
            End half
          </button>
          <button className="btn small danger" onClick={endGame}>
            End game
          </button>
          {msg && <span className="muted" role="status">{msg}</span>}
        </div>
        <button className="btn" style={{ minHeight: 52, background: 'var(--stop)', color: '#000' }} onClick={() => nav('/summary')}>
          Summary
        </button>
      </footer>
    </main>
  )
}
