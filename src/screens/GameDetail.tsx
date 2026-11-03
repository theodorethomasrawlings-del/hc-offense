import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import GameReport from '../components/GameReport'
import Nav from '../components/Nav'
import PossessionChart from '../components/PossessionChart'
import { loadGame } from '../db/games'
import type { Game, Possession } from '../domain/types'
import type { Tagged } from '../engine/streaks'
import { copyText, shareGame } from '../export/share'
import { toText } from '../export/text'

export default function GameDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [data, setData] = useState<{ game: Game; possessions: Possession[]; tagged: Tagged[] } | null | undefined>()
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (id) void loadGame(id).then(setData)
  }, [id])

  if (data === undefined) return null
  if (data === null)
    return (
      <main className="screen">
        <h1>Game not found</h1>
        <Link to="/history">Back</Link>
      </main>
    )
  const { game, possessions, tagged } = data

  const share = async () => {
    const r = await shareGame(game, possessions, tagged)
    setMsg(r === 'shared' ? 'Sent' : r === 'downloaded' ? 'Files saved' : '')
  }
  const copy = async () => setMsg((await copyText(toText(game, tagged))) ? 'Summary copied' : 'Copy failed')
  const reopen = async () => {
    const live = useGameStore.getState().game
    const msg = live && live.status === 'LIVE' && live.id !== game.id
      ? `Reopen ${game.opponent}? The live game vs ${live.opponent} will be marked final.`
      : `Reopen ${game.opponent} and keep logging possessions?`
    if (!window.confirm(msg)) return
    if (live && live.status === 'LIVE' && live.id !== game.id) await useGameStore.getState().endGame()
    await useGameStore.getState().reopenGame(game.id)
    nav('/game')
  }

  return (
    <main className="screen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>
          {game.home ? 'vs' : 'at'} {game.opponent} <span className="muted">{game.date}</span>
        </h1>
        <div className="row">
          {msg && <span className="muted">{msg}</span>}
          <button className="btn small" onClick={share}>
            Export
          </button>
          <button className="btn small" onClick={copy}>
            Copy summary
          </button>
          {game.status === 'FINAL' && (
            <button className="btn small" onClick={reopen}>
              Reopen game
            </button>
          )}
          <Nav />
        </div>
      </div>
      <div className="scroll grid" style={{ gap: 16 }}>
        <GameReport game={game} tagged={tagged} />
        <section>
          <h2>Possession chart</h2>
          <PossessionChart tagged={tagged} />
        </section>
      </div>
    </main>
  )
}
