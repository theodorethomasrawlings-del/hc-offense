import * as XLSX from 'xlsx'
import type { Game } from '../../domain/types'
import { chunk, poss, reset } from '../../engine/__tests__/helpers'
import { tagPossessions } from '../../engine/streaks'
import { toCSV } from '../csv'
import { toText } from '../text'
import { toWorkbook } from '../xlsx'

const game: Game = { id: 'g', opponent: 'Siena', date: '2026-11-02', home: true, timeouts: [], hcTimeouts: [], halfEnds: [], status: 'FINAL', createdAt: 0 }
beforeEach(reset)
const ts = () =>
  tagPossessions([
    poss({ points: 2, shot: 'RIM2', result: 'MADE', family: 'Tiger', action: 'Ice', clock: '22-25' }),
    poss({ points: 0, result: 'TO', family: 'Spider', action: 'X' }),
    poss({ points: 3, shot: 'SWING3', result: 'MADE', orebs: 1, chunks: [chunk({ shot: 'MID2', result: 'MISSED', family: 'Point', action: 'Roger', cont: 'OREB' }), chunk({ shot: 'SWING3', result: 'MADE' })] }),
  ])

test('text report has the headline and the play table', () => {
  const t = toText(game, ts())
  expect(t).toContain('HOLY CROSS VS SIENA, 2026-11-02 - OFFENSIVE REPORT')
  expect(t).toContain('PPP 1.67 (5 pts / 3 poss)')
  expect(t).toContain('BY PLAY')
  expect(t).toContain('Tiger Ice')
})

test('csv has one row per possession with the chunk trail', () => {
  const lines = toCSV(game, ts()).split('\n')
  expect(lines).toHaveLength(4)
  expect(lines[3]).toContain('Missed Mid-range 2 → OREB > Made Swing swing C&S 3')
})

test('workbook has summary, possessions and shot selection sheets', () => {
  const wb = toWorkbook(game, ts())
  expect(wb.SheetNames).toEqual(['Summary', 'Possessions', 'Shot selection'])
  const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets.Possessions, { header: 1 })
  expect(rows).toHaveLength(4)
})
