import type { Game } from '../domain/types'
import { byFamily, byPaintTouch } from './breakdowns'
import { fmtPPP } from './format'
import type { Tagged } from './streaks'
import { stats, windowSlice } from './windows'

/** Things Colin or Ted might not have asked. Plain sentences, most useful first. */
export function suggestions(ts: Tagged[], game: Pick<Game, 'timeouts' | 'halfEnds'>): string[] {
  const out: string[] = []
  if (ts.length < 5) return out
  const g = stats(ts)
  const last10 = stats(windowSlice(ts, 'LAST10', game))

  if (g.fga2 + g.fga3 >= 8 && g.desirablePct != null && g.desirablePct < 0.6)
    out.push(`Only ${Math.round(g.desirablePct * 100)}% of shots are top or 2nd tier (${g.tier.THIRD} third-tier shots).`)
  if (last10.poss >= 8 && last10.toPct != null && last10.toPct >= 0.3) out.push(`${last10.tos} turnovers in the last ${last10.poss}.`)
  const pt = byPaintTouch(ts)
  if (pt[0].stats.poss >= 4 && pt[1].stats.poss >= 4 && pt[0].stats.ppp != null && pt[1].stats.ppp != null && pt[0].stats.ppp - pt[1].stats.ppp >= 0.3)
    out.push(`Paint touch PPP ${fmtPPP(pt[0].stats.ppp)} vs ${fmtPPP(pt[1].stats.ppp)} without. ${pt[1].stats.poss} possessions never touched the paint.`)
  for (const f of byFamily(ts)) {
    if (f.stats.poss < 4 || f.stats.ppp == null || g.ppp == null) continue
    if (f.stats.ppp >= g.ppp + 0.35) out.push(`${f.label}: ${f.stats.poss} poss, PPP ${fmtPPP(f.stats.ppp)} vs ${fmtPPP(g.ppp)} overall. Go back to it.`)
    else if (f.stats.ppp <= g.ppp - 0.35) out.push(`${f.label}: ${f.stats.poss} poss, PPP ${fmtPPP(f.stats.ppp)} vs ${fmtPPP(g.ppp)} overall.`)
  }
  if (last10.poss >= 8 && last10.efg != null && last10.efg < 0.35 && last10.desirablePct != null && last10.desirablePct >= 0.7)
    out.push(`Shots are good (${Math.round(last10.desirablePct * 100)}% desirable) but not falling: eFG ${Math.round(last10.efg * 100)}% last ${last10.poss}.`)
  return out.slice(0, 5)
}
