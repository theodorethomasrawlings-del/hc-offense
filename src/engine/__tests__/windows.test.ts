import { tagPossessions } from '../streaks'
import { bunchesOf10, segments, stats, windowSlice } from '../windows'
import { chunk, poss, reset } from './helpers'

beforeEach(reset)

test('stats count shots by tier, FTs, turnovers and OREBs across chunks', () => {
  const ts = tagPossessions([
    poss({ points: 2, shot: 'RIM2', result: 'MADE', paintTouches: 1 }),
    poss({ points: 0, shot: 'MID2', result: 'MISSED' }),
    poss({ points: 0, result: 'TO' }),
    poss({ points: 3, shot: 'NONPAINT3', result: 'MADE', ftm: 0, fta: 0 }),
    poss({
      points: 3,
      shot: 'PAINT3',
      result: 'MADE',
      orebs: 1,
      chunks: [chunk({ shot: 'SWING3', result: 'MISSED', cont: 'OREB' }), chunk({ shot: 'PAINT3', result: 'MADE', paintTouches: 2 })],
    }),
    poss({ points: 1, result: 'FOUL', ftm: 1, fta: 2 }),
  ])
  const s = stats(ts)
  expect(s.poss).toBe(6)
  expect(s.pts).toBe(9)
  expect(s.ppp).toBeCloseTo(1.5)
  expect(s.fga2).toBe(2)
  expect(s.fgm2).toBe(1)
  expect(s.fga3).toBe(3)
  expect(s.fgm3).toBe(2)
  expect(s.fta).toBe(2)
  expect(s.ftm).toBe(1)
  expect(s.tos).toBe(1)
  expect(s.orebs).toBe(1)
  expect(s.tier).toEqual({ TOP: 2, SECOND: 1, THIRD: 2 })
  expect(s.desirablePct).toBeCloseTo(3 / 5)
  expect(s.efg).toBeCloseTo((1 + 1.5 * 2) / 5)
  expect(s.paintPoss).toBe(2)
  expect(s.paintTouches).toBe(3)
})

test('windows: last 3, since timeout, half, bunches, segments', () => {
  const ts = tagPossessions(Array.from({ length: 12 }, (_, i) => poss({ points: i % 2 ? 2 : 0, half: i < 7 ? 1 : 2 })))
  const game = { timeouts: [4], halfEnds: [7] }
  expect(windowSlice(ts, 'LAST3', game).map((t) => t.n)).toEqual([10, 11, 12])
  expect(windowSlice(ts, 'SEGMENT', game).map((t) => t.n)).toEqual([8, 9, 10, 11, 12])
  expect(windowSlice(ts, 'HALF', game)).toHaveLength(5)
  expect(windowSlice(ts, 'HALF1', game)).toHaveLength(7)
  expect(bunchesOf10(ts).map((b) => b.label)).toEqual(['1-10', '11-12'])
  expect(segments(ts, game).map((s) => s.label)).toEqual(['1-4', '5-7', '8-12'])
})
