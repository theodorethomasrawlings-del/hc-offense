import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/setup">Game</NavLink>
      <NavLink to="/history">History</NavLink>
      <NavLink to="/trends">Trends</NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </nav>
  )
}
