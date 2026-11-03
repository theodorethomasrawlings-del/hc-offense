import type { ClockBucket, Continuation, Family, Labels, LateClock, Result, Shot, Tier, Trigger } from './types'

/** Colin's play sheet, 2026-11-02. Editable in Settings. */
/** Play-sheet version: bump when the sheet changes so every device picks up the new defaults. */
export const LABELS_VERSION = 2

/** Colin's play call sheet, updated 2026-11-03. Editable in Settings. */
export const DEFAULT_LABELS: Labels = {
  version: LABELS_VERSION,
  families: [
    { name: 'Tiger', actions: ['Ice', 'Twirl', 'Delayed Curl', 'Zoom Next', 'Blade', 'Zoom Blade', 'Twirl Blade', 'Rice', 'Florida', 'Down', 'Down Penny', 'Shirt', 'Opposite', 'Ear'] },
    { name: 'Spider', actions: ['Ice', 'Twirl', 'Delayed Curl', 'Zoom Next', 'Blade', 'Zoom Blade', 'Twirl Blade', 'Roger', 'Rice', 'X', 'Eye', 'Florida', 'Down', 'Down Penny', 'Shirt', 'Opposite', 'Peja'] },
    { name: 'Point', actions: ['Roger', 'X', 'Eye', 'Blade', 'Return', 'Yoga', 'Up', 'Down', 'Down Penny', 'Husky'] },
    { name: 'Through', actions: ['Walmart', 'Twirl', 'Gut', 'Walmart Next', 'Roger', 'X', 'Eye', 'Get your Own'] },
    { name: '5', actions: ['Ice', 'Twirl', 'Delayed Curl', 'Florida', 'Denver Rice', 'Curl', 'Penny', 'Brush', 'Return', 'Ear', 'Oklahoma', 'Zoom Blade', 'Twirl Blade'] },
    {
      name: 'Stacked',
      actions: ['Ace 4 to Deuce 5', 'Ace 4 Deuce 5 Hands', 'Ace 4 to Alley 5', 'Deuce 4 Alley', 'Deuce 4 Ace', 'Ace 5 to Deuce 4', 'Ace 5 to Alley 4', 'Ace 5 to Corner Ghost', 'Alley 5 Pop', 'Alley 5 Hi/Lo', 'Alley 4 Pop'],
    },
    { name: 'Zone O', actions: ['Deuce 5 Runner', 'Ace Rover', 'Alley Rover', 'Alley 5', 'Power', 'Flat 5 / Flat Rover', 'Open'] },
    { name: 'Post-up', actions: ['5 Brush', '5 Return', 'Deuce 5 Philly', '5 Penny', '1'] },
    { name: 'BLOB', actions: ['54 Gut', 'Gut Eye', 'Gut Walmart', '54 Strong', 'Strong Flash', 'Stevie', 'Heat'] },
    { name: 'SLOB', actions: ['Brush', 'Spider', 'Deep', 'Eagle'] },
    { name: 'Other', actions: ['Freelance', 'Broken play', 'End of clock', 'Heave', 'Fast break'] },
  ],
}

export const SHOTS: { key: Shot; label: string; tier: Tier; value: 2 | 3 }[] = [
  { key: 'RIM2', label: 'Rim / deep paint 2', tier: 'TOP', value: 2 },
  { key: 'PAINT3', label: 'Paint touch 3', tier: 'TOP', value: 3 },
  { key: 'PAINT2', label: 'Paint 2 (logo–FTL)', tier: 'SECOND', value: 2 },
  { key: 'SWING3', label: 'Swing swing C&S 3', tier: 'SECOND', value: 3 },
  { key: 'MID2', label: 'Mid-range 2', tier: 'THIRD', value: 2 },
  { key: 'NONPAINT3', label: 'No paint touch 3', tier: 'THIRD', value: 3 },
]

export const SHOT_LABEL: Record<Shot, string> = Object.fromEntries([...SHOTS.map((s) => [s.key, s.label]), ['NONE', '']]) as Record<Shot, string>
export const SHOT_TIER: Partial<Record<Shot, Tier>> = Object.fromEntries(SHOTS.map((s) => [s.key, s.tier]))
export const SHOT_VALUE: Partial<Record<Shot, 2 | 3>> = Object.fromEntries(SHOTS.map((s) => [s.key, s.value]))
export const isThree = (s: Shot): boolean => SHOT_VALUE[s] === 3

export const TIERS: { key: Tier; label: string }[] = [
  { key: 'TOP', label: 'Top tier' },
  { key: 'SECOND', label: '2nd tier' },
  { key: 'THIRD', label: '3rd tier' },
]
export const TIER_LABEL: Record<Tier, string> = { TOP: 'Top', SECOND: '2nd', THIRD: '3rd' }

export const RESULTS: { key: Result; label: string; tone?: 'stop' | 'score' }[] = [
  { key: 'MADE', label: 'Made', tone: 'stop' },
  { key: 'MISSED', label: 'Missed', tone: 'score' },
  { key: 'TO', label: 'Turnover', tone: 'score' },
  { key: 'FOUL', label: 'Fouled, no FGA' },
]
export const RESULT_LABEL: Record<Result, string> = { MADE: 'Made', MISSED: 'Missed', TO: 'TO', FOUL: 'Fouled', NONE: '' }

export const CONTINUATIONS: { key: Continuation; label: string }[] = [
  { key: 'OREB', label: 'OREB, keep going' },
  { key: 'DEAD_OREB', label: 'Dead ball OREB' },
  { key: 'FLOOR_FOUL', label: 'Dead ball, we keep it' },
]
export const CONT_LABEL: Record<Continuation, string> = { OREB: 'OREB', DEAD_OREB: 'Dead OREB', FLOOR_FOUL: 'Dead ball' }

export const TRIGGERS: { key: Trigger; label: string }[] = [
  { key: '2ND_MAKE', label: '2nd trigger off make' },
  { key: '1ST_MISS', label: '1st trigger off miss' },
  { key: '2ND_MISS', label: '2nd trigger off miss' },
]
export const TRIGGER_LABEL: Record<Trigger, string> = { '2ND_MAKE': '2nd off make', '1ST_MISS': '1st off miss', '2ND_MISS': '2nd off miss' }

export const LATE_CLOCKS: { key: LateClock; label: string }[] = [
  { key: 'BAM', label: 'Bam' },
  { key: 'TOUCH', label: 'Touch' },
]
export const LATE_LABEL: Record<LateClock, string> = { BAM: 'Bam', TOUCH: 'Touch' }

export const CLOCKS: { key: ClockBucket; label: string }[] = [
  { key: '26+', label: '26+' },
  { key: '22-25', label: '22–25' },
  { key: '18-21', label: '18–21' },
  { key: '<18', label: '<18' },
]

/** "Tiger Ice", "BLOB 54 Gut", or '' when no play was tapped. */
export const playLabel = (p: { family: string; action: string }): string => [p.family, p.action].filter(Boolean).join(' ')

export const familyNames = (labels: Labels): string[] => labels.families.map((f) => f.name)
export const actionsOf = (labels: Labels, family: string): string[] => labels.families.find((f) => f.name === family)?.actions ?? []

/** Points a chunk is worth from its result, shot and free throws. */
export function chunkPoints(c: Pick<Chunkish, 'shot' | 'result' | 'ftm'>): number {
  const fg = c.result === 'MADE' ? (SHOT_VALUE[c.shot] ?? 2) : 0
  return fg + (c.ftm ?? 0)
}
type Chunkish = { shot: Shot; result: Result; ftm: number }

export const DEFAULT_FAMILY: Family = { name: '', actions: [] }
