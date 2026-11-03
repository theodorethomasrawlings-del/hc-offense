import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Nav from '../components/Nav'
import { loadAllGames } from '../db/games'
import { gameSummaries, type GameSummary } from '../engine/trends'

export default function Trends() {
  const [all, setAll] = useState<GameSummary[]>([])
  const [lastFive, setLastFive] = useState(true)

  useEffect(() => {
    void loadAllGames().then(({ games, byGame }) => setAll(gameSummaries(games.filter((g) => g.status === 'FINAL'), byGame)))
  }, [])

  const rows = useMemo(() => (lastFive ? all.slice(-5) : all), [all, lastFive])
  const pct = (v: number | null) => (v == null ? null : Math.round(v * 100))
  const data = rows.map((r) => ({
    name: r.label,
    PPP: r.stats.ppp == null ? null : +r.stats.ppp.toFixed(2),
    'eFG %': pct(r.stats.efg),
    'Good shot %': pct(r.stats.desirablePct),
    'TO %': pct(r.stats.toPct),
    'Paint touch %': r.stats.poss ? Math.round((100 * r.stats.paintPoss) / r.stats.poss) : null,
    OREB: r.stats.orebs,
  }))

  const chart = (title: string, key: string, color: string) => (
    <section className="panel" key={key}>
      <h2>{title}</h2>
      <div style={{ height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#444" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#9aa4b2" fontSize={13} />
            <YAxis stroke="#9aa4b2" fontSize={13} />
            <Tooltip />
            <Line type="monotone" dataKey={key} stroke={color} strokeWidth={3} dot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  return (
    <main className="screen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Trends</h1>
        <div className="row">
          <button className={`btn chip ${lastFive ? 'on' : ''}`} onClick={() => setLastFive(true)}>
            Last 5
          </button>
          <button className={`btn chip ${!lastFive ? 'on' : ''}`} onClick={() => setLastFive(false)}>
            All
          </button>
          <Nav />
        </div>
      </div>
      <div className="scroll">
        {rows.length === 0 ? (
          <div className="muted">No finished games yet.</div>
        ) : (
          <div className="grid two" style={{ gap: 12 }}>
            {chart('PPP', 'PPP', '#2fbf71')}
            {chart('eFG %', 'eFG %', '#6c8cff')}
            {chart('Good shot %', 'Good shot %', '#b58cff')}
            {chart('Turnover %', 'TO %', '#ff5c5c')}
            {chart('Paint touch %', 'Paint touch %', '#ffb347')}
            {chart('Offensive rebounds', 'OREB', '#4fd1c5')}
          </div>
        )}
      </div>
    </main>
  )
}
