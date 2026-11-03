import { tagPossessions } from '../streaks'
import { poss, reset } from './helpers'

beforeEach(reset)

test('three scores in a row is a run and resets', () => {
  const ts = tagPossessions([2, 3, 2, 2].map((points) => poss({ points: points as 2 | 3 })))
  expect(ts.map((t) => t.run)).toEqual([false, false, true, false])
  expect(ts[2].tag).toBe('SCORE (2) – 3 IN A ROW – RUN')
  expect(ts[3].scoreRun).toBe(1)
})

test('three empties in a row is a drought', () => {
  const ts = tagPossessions([0, 0, 0, 2, 0].map((points) => poss({ points: points as 0 | 2 })))
  expect(ts.map((t) => t.drought)).toEqual([false, false, true, false, false])
  expect(ts[1].tag).toBe('EMPTY – 2 IN A ROW')
  expect(ts[4].emptyRun).toBe(1)
})
