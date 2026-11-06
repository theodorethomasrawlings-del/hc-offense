import { CONT_LABEL, playLabel, RESULT_LABEL, SHOT_LABEL } from '../domain/labels'
import type { Chunk } from '../domain/types'
import type { Tagged } from '../engine/streaks'
import { chunksOf } from '../engine/windows'

/** "Tiger Ice · Missed" (the full chart's shot location and FTs show when they were recorded). */
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
          <th style={{ textAlign: 'left' }}>Streak</th>
          <th style={{ textAlign: 'left' }}>Play</th>
          <th style={{ textAlign: 'left' }}>Result</th>
          <th>Paint</th>
          <th style={{ textAlign: 'left' }}>Note</th>
        </tr>
      </thead>
      <tbody>
        {tagged.map((t) => (
          <tr key={t.id} className={t.drought ? 'hot' : t.run ? 'good' : undefined}>
            <td>{t.n}</td>
            <td>{t.half === 3 ? 'OT' : t.half}</td>
            <td style={{ textAlign: 'left' }}>{t.tag}</td>
            <td style={{ textAlign: 'left' }}>{t.chunks.length ? [...new Set(t.chunks.map(playLabel).filter(Boolean))].join(' > ') : playLabel(t)}</td>
            <td style={{ textAlign: 'left', whiteSpace: 'normal' }}>{chunksOf(t).map((c) => [RESULT_LABEL[c.result], SHOT_LABEL[c.shot]].filter(Boolean).join(' ')).join(' > ')}</td>
            <td>{chunksOf(t).some((c) => c.paintTouches > 0) ? 'Y' : ''}</td>
            <td style={{ textAlign: 'left', whiteSpace: 'normal' }}>{t.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
