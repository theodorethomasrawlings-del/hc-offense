import { CONT_LABEL, LATE_LABEL, playLabel, RESULT_LABEL, SHOT_LABEL, TRIGGER_LABEL } from '../domain/labels'
import type { Chunk } from '../domain/types'
import type { Tagged } from '../engine/streaks'
import { chunksOf } from '../engine/windows'

/** "Tiger Ice · Missed Rim 2 · OREB > Spider Blade · Made Paint touch 3 (1/1 FT)" */
export function chunkText(c: Chunk): string {
  const parts = [playLabel(c), [RESULT_LABEL[c.result], SHOT_LABEL[c.shot]].filter(Boolean).join(' ')].filter(Boolean)
  if (c.fta) parts.push(`${c.ftm}/${c.fta} FT`)
  return parts.join(' · ')
}

export const endedText = (t: Tagged): string =>
  chunksOf(t)
    .map((c) => chunkText(c) + (c.cont ? ` → ${CONT_LABEL[c.cont]}` : ''))
    .join(' > ')

export default function PossessionChart({ tagged }: { tagged: Tagged[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Poss</th>
          <th>Half</th>
          <th>Pts</th>
          <th style={{ textAlign: 'left' }}>Streak</th>
          <th>Trans</th>
          <th style={{ textAlign: 'left' }}>Play</th>
          <th style={{ textAlign: 'left' }}>How it ended</th>
          <th>Clock</th>
          <th style={{ textAlign: 'left' }}>Trigger</th>
          <th>Paint</th>
          <th>Rev</th>
          <th style={{ textAlign: 'left' }}>Note</th>
        </tr>
      </thead>
      <tbody>
        {tagged.map((t) => (
          <tr key={t.id} className={t.drought ? 'hot' : t.run ? 'good' : undefined}>
            <td>{t.n}</td>
            <td>{t.half === 3 ? 'OT' : t.half}</td>
            <td>{t.points}</td>
            <td style={{ textAlign: 'left' }}>{t.tag}</td>
            <td>{t.transition ? 'T' : ''}</td>
            <td style={{ textAlign: 'left' }}>{t.chunks.length ? [...new Set(t.chunks.map(playLabel).filter(Boolean))].join(' > ') : playLabel(t)}</td>
            <td style={{ textAlign: 'left', whiteSpace: 'normal' }}>{endedText(t)}</td>
            <td>{t.clock ?? ''}</td>
            <td style={{ textAlign: 'left' }}>{[t.trigger && TRIGGER_LABEL[t.trigger], t.lateClock && LATE_LABEL[t.lateClock]].filter(Boolean).join(', ')}</td>
            <td>{t.paintTouches || ''}</td>
            <td>{t.reversals || ''}</td>
            <td style={{ textAlign: 'left', whiteSpace: 'normal' }}>{t.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
