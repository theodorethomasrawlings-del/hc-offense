import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import Setup from './screens/Setup'
import Game from './screens/Game'
import Summary from './screens/Summary'
import History from './screens/History'
import GameDetail from './screens/GameDetail'
import Trends from './screens/Trends'
import Settings from './screens/Settings'

export const routes = [
  { path: '/', element: <Navigate to="/setup" replace /> },
  { path: '/setup', element: <Setup /> },
  { path: '/game', element: <Game /> },
  { path: '/summary', element: <Summary /> },
  { path: '/history', element: <History /> },
  { path: '/history/:id', element: <GameDetail /> },
  { path: '/trends', element: <Trends /> },
  { path: '/settings', element: <Settings /> },
]

export default function App() {
  return <RouterProvider router={createHashRouter(routes)} />
}
