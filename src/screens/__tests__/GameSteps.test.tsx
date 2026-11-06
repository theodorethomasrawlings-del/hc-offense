import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../App'
import { db } from '../../db/db'
import { useGameStore } from '../../store/gameStore'

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
})

async function liveGame() {
  await db.games.clear()
  await db.possessions.clear()
  useGameStore.setState({ game: null, possessions: [], tagged: [], draft: {}, loaded: false })
  await useGameStore.getState().startGame({ opponent: 'Siena', date: '2026-11-02', home: true })
  const router = createMemoryRouter(routes, { initialEntries: ['/game'] })
  render(<RouterProvider router={router} />)
  await screen.findByText('#1')
  return router
}
const btn = (name: RegExp) => screen.getByRole('button', { name })
const click = (name: RegExp) => fireEvent.click(btn(name))
const q = (text: string) => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text)

test('play → action → made → paint touch: four taps and it saves itself', async () => {
  await liveGame()
  q('what play?')
  click(/^Tiger$/)
  q('Tiger: which action?')
  click(/^Ice$/)
  q('Made, missed or turnover?')
  click(/^made$/i)
  q('Paint touch?')
  click(/^paint touch$/i)
  await screen.findByText('#2')
  expect(useGameStore.getState().possessions[0]).toMatchObject({ points: 2, family: 'Tiger', action: 'Ice', result: 'MADE', paintTouches: 1 })
  expect(screen.getByLabelText('game totals')).toHaveTextContent('SCORED 100% (1/1)')
  q('what play?')
})

test('no set play, turnover, no paint touch', async () => {
  await liveGame()
  click(/^no set play$/i)
  q('Made, missed or turnover?')
  click(/^turnover$/i)
  click(/^no paint touch$/i)
  await screen.findByText('#2')
  expect(useGameStore.getState().possessions[0]).toMatchObject({ points: 0, family: '', result: 'TO', paintTouches: 0 })
})

test('back retraces a step; edit last re-asks and overwrites', async () => {
  await liveGame()
  click(/^Tiger$/)
  click(/^Ice$/)
  click(/^← back$/i)
  q('Tiger: which action?')
  click(/^Shirt$/)
  click(/^missed$/i)
  click(/^no paint touch$/i)
  await screen.findByText('#2')
  click(/^edit last$/i)
  await screen.findByText('Editing #1')
  click(/^Spider$/)
  click(/^just spider$/i)
  click(/^made$/i)
  click(/^paint touch$/i)
  await screen.findByText('Saved #1')
  await waitFor(() => expect(useGameStore.getState().possessions).toHaveLength(1))
  expect(useGameStore.getState().possessions[0]).toMatchObject({ n: 1, points: 2, family: 'Spider', action: '', result: 'MADE', paintTouches: 1 })
})

test('media timeout goes to the summary', async () => {
  const router = await liveGame()
  click(/^Point$/)
  click(/^just point$/i)
  click(/^missed$/i)
  click(/^no paint touch$/i)
  await screen.findByText('#2')
  click(/^media to$/i)
  await waitFor(() => expect(router.state.location.pathname).toBe('/summary'))
  expect(useGameStore.getState().game?.timeouts).toEqual([1])
})
