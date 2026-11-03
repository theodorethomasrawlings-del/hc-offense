import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import { loadRoster } from '../rosters/loadRoster'
import { useGameStore } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

const today = () => new Date().toISOString().slice(0, 10)

export default function Setup() {
  const nav = useNavigate()
  const { game, loaded, load, startGame, endGame } = useGameStore()
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState(today())
  const [home, setHome] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [starting, setStarting] = useState(false)

  const settings = useSettings()
  useEffect(() => {
    if (!loaded) void load()
    if (!settings.loaded) void settings.load()
  }, [loaded, load, settings])

  const live = game?.status === 'LIVE'

  const start = async () => {
    setStarting(true)
    try {
      const name = opponent.trim() || 'Opponent'
      const [rosterUs, rosterThem] = await Promise.all([loadRoster('Holy Cross'), loadRoster(name)])
      if (live) await endGame()
      await startGame({ opponent: name, date, home, rosterUs, rosterThem })
      nav('/game')
    } finally {
      setStarting(false)
    }
  }

  return (
    <main className="screen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>HC Offense</h1>
        <Nav />
      </div>

      {live && !showForm ? (
        <div className="panel grid" style={{ gap: 12, maxWidth: 560 }}>
          <div>
            Live game: <b>{game.opponent}</b> <span className="muted">{game.date}</span>
          </div>
          <button className="btn primary" onClick={() => nav('/game')}>
            Resume {game.opponent}
          </button>
          <button className="btn small" onClick={() => setShowForm(true)}>
            Start new (ends current)
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gap: 10, maxWidth: 560 }}>
          <label>
            <h2>Opponent</h2>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              enterKeyHint="done"
              autoFocus
            />
          </label>
          <label>
            <h2>Date</h2>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="row">
            <button className={`btn ${home ? 'on' : ''}`} onClick={() => setHome(true)}>
              Home
            </button>
            <button className={`btn ${!home ? 'on' : ''}`} onClick={() => setHome(false)}>
              Away
            </button>
          </div>
          <button className="btn primary" onClick={start} disabled={starting}>
            {starting ? 'Loading rosters...' : 'Start game'}
          </button>
          <div className="muted" style={{ fontSize: 15 }}>Rosters load by the opponent's name (URI, Villanova, Furman...). Edit them on the foul chart if needed.</div>
        </div>
      )}
    </main>
  )
}
