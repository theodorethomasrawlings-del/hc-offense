import { matchRoster } from '../loadRoster'

const idx = [
  { team: 'Holy Cross', aliases: ['HC'], file: 'holy-cross.json' },
  { team: 'Rhode Island', aliases: ['URI', 'Rhody'], file: 'rhode-island.json' },
  { team: 'Loyola Maryland', aliases: ['Loyola MD', 'Loyola (Md.)'], file: 'loyola-maryland.json' },
]

test('matches exact names, aliases, and partial names, ignoring case and punctuation', () => {
  expect(matchRoster(idx, 'URI')?.file).toBe('rhode-island.json')
  expect(matchRoster(idx, 'rhode island')?.file).toBe('rhode-island.json')
  expect(matchRoster(idx, 'Loyola (Md.)')?.file).toBe('loyola-maryland.json')
  expect(matchRoster(idx, 'Loyola')?.file).toBe('loyola-maryland.json')
  expect(matchRoster(idx, 'Siena')).toBeNull()
  expect(matchRoster(idx, '')).toBeNull()
})
