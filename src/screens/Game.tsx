import { useEffect, useState } from 'react'
import GameSteps from './GameSteps'
import GameWide from './GameWide'

const QUERY = '(max-width: 900px)'

/** A phone gets one question per screen; an iPad gets the whole chart on one screen. */
export function useNarrow(): boolean {
  const read = () => (typeof window === 'undefined' ? false : window.matchMedia ? window.matchMedia(QUERY).matches : window.innerWidth <= 900)
  const [narrow, setNarrow] = useState(read)
  useEffect(() => {
    const onChange = () => setNarrow(read())
    const mq = window.matchMedia?.(QUERY)
    mq?.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)
    return () => {
      mq?.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])
  return narrow
}

export default function Game() {
  return useNarrow() ? <GameSteps /> : <GameWide />
}
