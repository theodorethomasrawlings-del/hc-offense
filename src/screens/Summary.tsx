import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameReport from '../components/GameReport'
import { copyText, shareGame } from '../export/share'
import { toText } from '../export/text'
import { useGameStore } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

export default function Summary() {
  const nav = useNavigate()
  const g = useGameStore()
  const settings = useSettings()
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!g.loaded) void g.load()
    if (!settings.loaded) void settings.load()
  }, [g, settings])

  useEffect(() => {
    if (g.loaded && !g.game) nav('/history', { replace: true })
  }, [g.loaded, g.game, nav])

  if (!g.game) return null
  const { game } = g
  const final = game.status === 'FINAL'

  const share = async () => {
    const r = await shareGame(game, g.possessions, g.tagged)
    setMsg(r === 'shared' ? 'Sent' : r === 'downloaded' ? 'Files saved' : '')
  }
  const copy = async () => setMsg((await copyText(toText(game, g.tagged))) ? 'Summary copied' : 'Copy failed')

  return (
    <main className="screen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>
          {game.opponent} <span className="muted">{final ? 'Final' : `through #${g.possessions.length}`}</span>
        </h1>
        <div className="row">
          {msg && <span className="muted">{msg}</span>}
          <button className="btn small" onClick={share}>
            Export
          </button>
          <button className="btn small" onClick={copy}>
            Copy summary
          </button>
          {settings.email && <span className="muted" style={{ fontSize: 15 }}>{settings.email}</span>}
          {final ? (
            <button className="btn small" onClick={() => nav('/history')}>
              History
            </button>
          ) : (
            <button className="btn primary" style={{ minWidth: 180 }} onClick={() => nav('/game')}>
              ← Back to game
            </button>
          )}
        </div>
      </div>
      <div className="scroll">
        <GameReport game={game} tagged={g.tagged} />
      </div>
    </main>
  )
}
