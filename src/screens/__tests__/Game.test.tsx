import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../App'
import { db } from '../../db/db'
import { useGameStore } from '../../store/gameStore'

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

test('play, shot, made, Next commits with the right points', async () => {
  await liveGame()
  expect(btn(/^next →$/i)).toBeDisabled()
  fireEvent.click(btn(/^Tiger$/))
  fireEvent.click(btn(/^Ice$/))
  fireEvent.click(btn(/^paint touch 3$/i))
  fireEvent.click(btn(/^made$/i))
  expect(screen.getByLabelText('points this possession')).toHaveTextContent('3 PTS')
  fireEvent.click(btn(/^next →$/i))
  await screen.findByText('#2')
  expect(useGameStore.getState().possessions[0]).toMatchObject({ points: 3, family: 'Tiger', action: 'Ice', shot: 'PAINT3', paintTouches: 1 })
  expect(screen.getByLabelText('game totals')).toHaveTextContent('PPP 3.00')
})

test('a turnover needs no shot', async () => {
  await liveGame()
  fireEvent.click(btn(/turnover/i))
  expect(btn(/^next →$/i)).toBeEnabled()
  fireEvent.click(btn(/^next →$/i))
  await screen.findByText('#2')
  expect(useGameStore.getState().possessions[0]).toMatchObject({ points: 0, result: 'TO' })
})

test('OREB opens a fresh page under the same possession number', async () => {
  await liveGame()
  fireEvent.click(btn(/mid-range 2/i))
  fireEvent.click(btn(/^missed$/i))
  fireEvent.click(btn(/OREB, keep going/i))
  expect(screen.getByRole('status', { name: 'continuation' })).toHaveTextContent('#1 shot 2')
  expect(screen.getByText('#1')).toBeInTheDocument()
  fireEvent.click(btn(/rim \/ deep paint 2/i))
  fireEvent.click(btn(/^made$/i))
  fireEvent.click(btn(/made FT/i))
  fireEvent.click(btn(/^next →$/i))
  await screen.findByText('#2')
  const p = useGameStore.getState().possessions[0]
  expect(p).toMatchObject({ n: 1, points: 3, orebs: 1 })
  expect(p.chunks).toHaveLength(2)
})

test('OREB after a made shot is refused', async () => {
  await liveGame()
  fireEvent.click(btn(/rim \/ deep paint 2/i))
  fireEvent.click(btn(/^made$/i))
  fireEvent.click(btn(/OREB, keep going/i))
  expect(screen.getByRole('status')).toHaveTextContent(/follows a missed shot/i)
  expect(useGameStore.getState().draft.chunks).toBeUndefined()
})

test('edit last recomputes points', async () => {
  await liveGame()
  fireEvent.click(btn(/rim \/ deep paint 2/i))
  fireEvent.click(btn(/^made$/i))
  fireEvent.click(btn(/^next →$/i))
  await screen.findByText('#2')
  fireEvent.click(btn(/edit last/i))
  await screen.findByText('#1')
  fireEvent.click(btn(/^missed$/i))
  fireEvent.click(btn(/save/i))
  await screen.findByText('#2')
  expect(useGameStore.getState().possessions[0].points).toBe(0)
})

test('media timeout goes to the summary', async () => {
  const router = await liveGame()
  fireEvent.click(btn(/turnover/i))
  fireEvent.click(btn(/^next →$/i))
  await screen.findByText('#2')
  fireEvent.click(btn(/^media to$/i))
  await waitFor(() => expect(router.state.location.pathname).toBe('/summary'))
  expect(useGameStore.getState().game?.timeouts).toEqual([1])
})
