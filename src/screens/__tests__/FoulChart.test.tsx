import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../App'
import { db } from '../../db/db'
import { useGameStore } from '../../store/gameStore'

async function chart() {
  await db.games.clear()
  await db.possessions.clear()
  useGameStore.setState({ game: null, possessions: [], tagged: [], draft: {}, loaded: false })
  await useGameStore.getState().startGame({
    opponent: 'Rhode Island', date: '2026-11-03', home: false,
    rosterUs: [{ num: '0', name: 'Arius Alijosius', fouls: 0 }, { num: '15', name: 'Kosi Mgbejiofor', fouls: 0 }],
    rosterThem: [{ num: '1', name: 'Rhody Guard', fouls: 0 }],
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/fouls'] })
  render(<RouterProvider router={router} />)
  await screen.findByText('Foul chart')
  return router
}
const g = () => useGameStore.getState().game!

test('a player foul fills the box and adds a team foul for the current half', async () => {
  await chart()
  fireEvent.click(screen.getByRole('button', { name: 'Holy Cross 15 fouls 2' }))
  await waitFor(() => expect(g().rosterUs[1].fouls).toBe(2))
  expect(g().teamFouls.us).toEqual([2, 0, 0])
  // tapping the top filled box takes one away
  fireEvent.click(screen.getByRole('button', { name: 'Holy Cross 15 fouls 2' }))
  await waitFor(() => expect(g().rosterUs[1].fouls).toBe(1))
  expect(g().teamFouls.us).toEqual([1, 0, 0])
})

test('five fouls marks the player out and the header counts it', async () => {
  const router = await chart()
  fireEvent.click(screen.getByRole('button', { name: 'Rhode Island 1 fouls 5' }))
  await waitFor(() => expect(g().rosterThem[0].fouls).toBe(5))
  expect(screen.getByText('Rhody Guard').closest('.player')).toHaveClass('out')
  await router.navigate('/game')
  expect(await screen.findByRole('button', { name: 'foul chart' })).toHaveTextContent('FOULS HC 0 · RHODE IS 5 · 1 OUT · ARROW US')
})

test('timeouts fill left to right and the opponent has its own set; arrow toggles', async () => {
  await chart()
  fireEvent.click(screen.getByRole('button', { name: 'Rhode Island 30 1' }))
  await waitFor(() => expect(g().oppTimeouts).toHaveLength(1))
  fireEvent.click(screen.getByRole('button', { name: 'Holy Cross full 4' }))
  await waitFor(() => expect(g().hcTimeouts).toEqual([{ n: 0, half: 1, kind: 'FULL' }]))
  expect(screen.getByRole('button', { name: 'Holy Cross full 4' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Holy Cross 30 1' })).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'possession arrow' }))
  await waitFor(() => expect(g().arrowUs).toBe(false))
})

test('edit rosters adds a player', async () => {
  await chart()
  fireEvent.click(screen.getByRole('button', { name: /edit rosters/i }))
  fireEvent.click(screen.getAllByRole('button', { name: /add player/i })[1])
  const nums = screen.getAllByLabelText('number 2')
  fireEvent.change(nums[nums.length - 1], { target: { value: '23' } })
  const names = screen.getAllByLabelText('name 2')
  fireEvent.change(names[names.length - 1], { target: { value: 'New Guy' } })
  fireEvent.click(screen.getByRole('button', { name: /save rosters/i }))
  await waitFor(() => expect(g().rosterThem).toHaveLength(2))
  expect(g().rosterThem[1]).toMatchObject({ num: '23', name: 'New Guy', fouls: 0 })
})
