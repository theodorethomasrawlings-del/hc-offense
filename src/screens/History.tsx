import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import { deleteGame, loadAllGames } from '../db/games'
import { fmtPct, fmtPPP } from '../engine/format'
import { gameSummaries, type GameSummary } from '../engine/trends'
import { useGameStore } from '../store/gameStore'

export default function History() {
  const [rows, setRows] = useState<GameSummary[] | null>(null)
  const [live, setLive] = useState<Set<string>>(new Set())

  const refresh = async () => {
    const { games, byGame } = await loadAllGames()
    setLive(new Set(games.filter((g) => g.status === 'LIVE').map((g) => g.id)))
    setRows(gameSummaries(games, byGame).reverse())
  }
  useEffect(() => {
    void refresh()
  }, [])

  const remove = async (r: GameSummary) => {
    if (!window.confirm(`Delete ${r.label} ${r.date}? This cannot be undone.`)) return
    await deleteGame(r.gameId)
    if (useGameStore.getState().game?.id === r.gameId) await useGameStore.getState().load()
    await refresh()
  }

  return (
    <main className="screen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>History</h1>
        <Nav />
      </div>
      <div className="scroll">
        {rows && rows.length === 0 && <div className="muted">No games yet.</div>}
        {rows && rows.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Game</th>
                <th>Date</th>
                <th>Poss</th>
                <th>PPP</th>
                <th>eFG%</th>
                <th>Good shot %</th>
                <th>TO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.gameId}>
                  <td>
                    <Link to={`/history/${r.gameId}`} style={{ color: 'var(--accent)' }}>
                      {r.label}
                    </Link>
                    {live.has(r.gameId) && <span className="muted"> (live)</span>}
                  </td>
                  <td>{r.date}</td>
                  <td>{r.stats.poss}</td>
                  <td>{fmtPPP(r.stats.ppp)}</td>
                  <td>{fmtPct(r.stats.efg)}</td>
                  <td>{fmtPct(r.stats.desirablePct)}</td>
                  <td>{r.stats.tos}</td>
                  <td>
                    <button className="btn small danger" onClick={() => remove(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
