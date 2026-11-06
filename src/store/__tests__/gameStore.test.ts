import 'fake-indexeddb/auto'
import { db } from '../../db/db'
import { createGameStore, draftComplete, rollUp } from '../gameStore'
import { chunk } from '../../engine/__tests__/helpers'

const fresh = async () => {
  await db.games.clear()
  await db.possessions.clear()
  const s = createGameStore()
  await s.getState().startGame({ opponent: 'Siena', date: '2026-11-02', home: true })
  return s
}

test('rollUp sums points across chunks and takes the last shot and play', () => {
  const r = rollUp([chunk({ shot: 'MID2', result: 'MISSED', family: 'Tiger', action: 'Ice', cont: 'OREB' }), chunk({ shot: 'RIM2', result: 'MADE', ftm: 1, fta: 1, family: 'Spider', action: 'X', paintTouches: 1 })])
  expect(r).toMatchObject({ points: 3, shot: 'RIM2', result: 'MADE', family: 'Spider', action: 'X', ftm: 1, fta: 1, orebs: 1, paintTouches: 1 })
})

test('draftComplete needs only a result: made, missed or turnover (the shot location is optional)', () => {
  expect(draftComplete({})).toBe(false)
  expect(draftComplete({ result: 'MADE' })).toBe(true)
  expect(draftComplete({ result: 'MADE', shot: 'RIM2' })).toBe(true)
  expect(draftComplete({ result: 'TO' })).toBe(true)
  expect(draftComplete({ result: 'FOUL', ftm: 2, fta: 2 })).toBe(true)
})

test('commit computes points from shot, result and FTs', async () => {
  const s = await fresh()
  s.getState().setDraft({ shot: 'PAINT3', result: 'MADE', ftm: 1, fta: 1, family: 'Tiger', action: 'Blade' })
  await s.getState().commitPossession()
  expect(s.getState().possessions[0]).toMatchObject({ n: 1, points: 4, shot: 'PAINT3', family: 'Tiger', action: 'Blade' })
  expect(s.getState().draft).toEqual({})
})

test('continue banks a chunk under the same possession number and keeps the possession-level fields', async () => {
  const s = await fresh()
  s.getState().setDraft({ shot: 'MID2', result: 'MISSED', family: 'Tiger', action: 'Ice', clock: '22-25', trigger: '1ST_MISS' })
  s.getState().continuePossession('OREB')
  expect(s.getState().draft).toMatchObject({ clock: '22-25', trigger: '1ST_MISS' })
  expect(s.getState().draft.shot).toBeUndefined()
  expect(s.getState().draft.family).toBeUndefined()
  s.getState().setDraft({ shot: 'RIM2', result: 'MADE', family: 'Other', action: 'Freelance' })
  await s.getState().commitPossession()
  const p = s.getState().possessions[0]
  expect(p).toMatchObject({ n: 1, points: 2, orebs: 1, shot: 'RIM2', family: 'Other' })
  expect(p.chunks).toHaveLength(2)
  expect(s.getState().nextN()).toBe(2)
})

test('timeouts, half ends and undo marks', async () => {
  const s = await fresh()
  s.getState().setDraft({ result: 'TO' })
  await s.getState().commitPossession()
  await s.getState().mediaTimeout()
  expect(s.getState().game?.timeouts).toEqual([1])
  await s.getState().endHalf()
  expect(s.getState().currentHalf()).toBe(2)
  await s.getState().undoMark()
  expect(s.getState().game?.halfEnds).toEqual([])
  expect(s.getState().game?.timeouts).toEqual([1])
})
