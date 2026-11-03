import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import type { Family } from '../domain/types'
import { buildBackup, restoreBackup } from '../export/backup'
import { download } from '../export/share'
import { useGameStore } from '../store/gameStore'
import { useSettings } from '../store/settingsStore'

function ActionList({ family, onChange, onRemove }: { family: Family; onChange(next: Family): void; onRemove(): void }) {
  const [add, setAdd] = useState('')
  const items = family.actions
  const set = (actions: string[]) => onChange({ ...family, actions })
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    set(next)
  }
  return (
    <section className="panel grid" style={{ gap: 6, alignContent: 'start' }}>
      <div className="row">
        <input type="text" value={family.name} aria-label="family name" style={{ fontWeight: 700 }} onChange={(e) => onChange({ ...family, name: e.target.value })} />
        <button className="btn small danger" onClick={onRemove} aria-label={`remove ${family.name}`}>✕ family</button>
      </div>
      {items.map((it, i) => (
        <div className="row" key={i}>
          <input type="text" value={it} aria-label={`${family.name} ${i + 1}`} onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button className="btn small" onClick={() => move(i, -1)} aria-label="up">↑</button>
          <button className="btn small" onClick={() => move(i, 1)} aria-label="down">↓</button>
          <button className="btn small danger" onClick={() => set(items.filter((_, j) => j !== i))} aria-label="remove">✕</button>
        </div>
      ))}
      <div className="row">
        <input type="text" placeholder="Add action" value={add} onChange={(e) => setAdd(e.target.value)} />
        <button
          className="btn small"
          onClick={() => {
            if (add.trim()) set([...items, add.trim()])
            setAdd('')
          }}
        >
          Add
        </button>
      </div>
    </section>
  )
}

export default function Settings() {
  const s = useSettings()
  const [msg, setMsg] = useState('')
  const [newFamily, setNewFamily] = useState('')

  useEffect(() => {
    if (!s.loaded) void s.load()
  }, [s])

  const families = s.labels.families
  const setFamilies = (next: Family[]) => void s.setLabels({ ...s.labels, families: next })

  const backup = async () => {
    const b = await buildBackup()
    download(new File([JSON.stringify(b)], `hc-offense-backup-${b.exportedAt.slice(0, 10)}.json`, { type: 'application/json' }))
    setMsg('Backup saved')
  }
  const restore = async (file?: File) => {
    if (!file) return
    try {
      const r = await restoreBackup(JSON.parse(await file.text()))
      await useGameStore.getState().load()
      setMsg(`Imported ${r.games} games, ${r.possessions} possessions`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  return (
    <main className="screen">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Settings</h1>
        <Nav />
      </div>
      <div className="scroll grid" style={{ gap: 12 }}>
        <div className="grid three" style={{ gap: 12, alignContent: 'start' }}>
          <section className="panel grid" style={{ gap: 8 }}>
            <h2>Export email</h2>
            <input type="email" value={s.email} placeholder="shown on the export screen" onChange={(e) => void s.setEmail(e.target.value)} />
          </section>
          <section className="panel grid" style={{ gap: 8 }}>
            <h2>Theme</h2>
            <div className="row">
              <button className={`btn small ${s.theme === 'dark' ? 'on' : ''}`} onClick={() => void s.setTheme('dark')}>Dark</button>
              <button className={`btn small ${s.theme === 'light' ? 'on' : ''}`} onClick={() => void s.setTheme('light')}>Light</button>
            </div>
          </section>
          <section className="panel grid" style={{ gap: 8 }}>
            <h2>Backup</h2>
            <div className="row">
              <button className="btn small" onClick={backup}>Export all games</button>
              <label className="btn small" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Import backup
                <input type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => restore(e.target.files?.[0])} />
              </label>
            </div>
            {msg && <div className="muted">{msg}</div>}
          </section>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Play sheet (families and actions)</h2>
          <div className="row">
            <input type="text" placeholder="New family" value={newFamily} onChange={(e) => setNewFamily(e.target.value)} style={{ width: 200 }} />
            <button
              className="btn small"
              onClick={() => {
                if (newFamily.trim()) setFamilies([...families, { name: newFamily.trim(), actions: [] }])
                setNewFamily('')
              }}
            >
              Add family
            </button>
            <button className="btn small danger" onClick={() => window.confirm('Reset the play sheet to the default?') && void s.resetLabels()}>
              Reset to default
            </button>
          </div>
        </div>
        <div className="grid three" style={{ gap: 12, alignContent: 'start' }}>
          {families.map((f, i) => (
            <ActionList key={i} family={f} onChange={(next) => setFamilies(families.map((x, j) => (j === i ? next : x)))} onRemove={() => window.confirm(`Remove ${f.name}?`) && setFamilies(families.filter((_, j) => j !== i))} />
          ))}
        </div>
      </div>
    </main>
  )
}
