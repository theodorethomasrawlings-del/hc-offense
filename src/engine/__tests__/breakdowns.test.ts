import { afterOreb, byFamily, byPaintTouch, byPlay, shotChart } from '../breakdowns'
import { tagPossessions } from '../streaks'
import { chunk, poss, reset } from './helpers'

beforeEach(reset)

test('by family and by play count a possession under every play it ran', () => {
  const ts = tagPossessions([
    poss({ points: 2, family: 'Tiger', action: 'Ice', shot: 'RIM2', result: 'MADE' }),
    poss({ points: 0, family: 'Tiger', action: 'Blade', shot: 'MID2', result: 'MISSED' }),
    poss({
      points: 3,
      family: 'Spider',
      action: 'X',
      shot: 'SWING3',
      result: 'MADE',
      chunks: [chunk({ family: 'Tiger', action: 'Ice', shot: 'RIM2', result: 'MISSED', cont: 'OREB' }), chunk({ family: 'Spider', action: 'X', shot: 'SWING3', result: 'MADE' })],
    }),
  ])
  const fam = byFamily(ts)
  expect(fam.map((r) => [r.label, r.stats.poss, r.stats.pts])).toEqual([
    ['Tiger', 3, 5],
    ['Spider', 1, 3],
  ])
  expect(byPlay(ts).map((r) => r.label)).toEqual(['Tiger Ice', 'Tiger Blade', 'Spider X'])
})

test('shot chart and second chance', () => {
  const ts = tagPossessions([
    poss({ points: 2, shot: 'RIM2', result: 'MADE', orebs: 1, chunks: [chunk({ shot: 'MID2', result: 'MISSED', cont: 'OREB' }), chunk({ shot: 'RIM2', result: 'MADE' })] }),
    poss({ points: 0, shot: 'RIM2', result: 'MISSED' }),
  ])
  const rows = shotChart(ts)
  expect(rows.find((r) => r.shot === 'RIM2')).toMatchObject({ fga: 2, fgm: 1, pts: 2 })
  expect(rows.find((r) => r.shot === 'MID2')).toMatchObject({ fga: 1, fgm: 0 })
  expect(afterOreb(ts)).toEqual({ chances: 1, pts: 2, scored: 1 })
  expect(byPaintTouch(ts)[1].stats.poss).toBe(2)
})
