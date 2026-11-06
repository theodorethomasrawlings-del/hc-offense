import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../App'
import { db } from '../../db/db'
import { useGameStore } from '../../store/gameStore'

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1180 })
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
const poss = () => useGameStore.getState().possessions

test('play, made, paint touch saves itself with 2 points', async () => {
  await liveGame()
  fireEvent.click(btn(/^Tiger$/))
  fireEvent.click(btn(/^Ice$/))
  fireEvent.click(btn(/^made$/i))
  expect(poss()).toHaveLength(0)
  fireEvent.click(btn(/^paint touch$/i))
  await screen.findByText('#2')
  expect(poss()[0]).toMatchObject({ points: 2, family: 'Tiger', action: 'Ice', result: 'MADE', paintTouches: 1 })
  expect(screen.getByLabelText('game totals')).toHaveTextContent('SCORED 100% (1/1)')
})

test('paint touch first, then turnover, also saves; no play needed', async () => {
  await liveGame()
  fireEvent.click(btn(/^no paint touch$/i))
  expect(poss()).toHaveLength(0)
  fireEvent.click(btn(/^turnover$/i))
  await screen.findByText('#2')
  expect(poss()[0]).toMatchObject({ points: 0, family: '', result: 'TO', paintTouches: 0 })
})

test('edit last overwrites the possession', async () => {
  await liveGame()
  fireEvent.click(btn(/^missed$/i))
  fireEvent.click(btn(/^no paint touch$/i))
  await screen.findByText('#2')
  fireEvent.click(btn(/^edit last$/i))
  await screen.findByText(/Editing #1/)
  fireEvent.click(btn(/^Spider$/))
  fireEvent.click(btn(/^made$/i))
  fireEvent.click(btn(/^paint touch$/i))
  await screen.findByText('Saved #1')
  expect(poss()).toHaveLength(1)
  expect(poss()[0]).toMatchObject({ n: 1, points: 2, family: 'Spider', result: 'MADE', paintTouches: 1 })
})

test('media timeout goes to the summary', async () => {
  const router = await liveGame()
  fireEvent.click(btn(/^missed$/i))
  fireEvent.click(btn(/^no paint touch$/i))
  await screen.findByText('#2')
  fireEvent.click(btn(/^media to$/i))
  await waitFor(() => expect(router.state.location.pathname).toBe('/summary'))
  expect(useGameStore.getState().game?.timeouts).toEqual([1])
})
