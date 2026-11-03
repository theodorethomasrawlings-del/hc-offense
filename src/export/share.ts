import type { Game, Possession } from '../domain/types'
import type { Tagged } from '../engine/streaks'
import { fileStem, toJSON } from './csv'
import { toXlsx } from './xlsx'
import { toText } from './text'

export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

export function buildFiles(game: Game, ps: Possession[], ts: Tagged[]): File[] {
  const stem = fileStem(game)
  return [
    new File([toXlsx(game, ts)], `${stem}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    new File([toText(game, ts)], `${stem}.txt`, { type: 'text/plain' }),
    new File([toJSON(game, ps)], `${stem}.json`, { type: 'application/json' }),
  ]
}

export async function shareGame(game: Game, ps: Possession[], ts: Tagged[]): Promise<ShareResult> {
  const files = buildFiles(game, ps, ts)
  const title = fileStem(game)
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files })) {
    try {
      await nav.share({ files, title, text: `${title} offensive report` })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  for (const f of files) download(f)
  return 'downloaded'
}

export function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function copyText(s: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(s)
    return true
  } catch {
    return false
  }
}
