/** Where the shot came from, in Colin's shot-selection tiers. */
export type Shot =
  | 'PAINT3' // paint-touch 3 (top tier)
  | 'RIM2' // rim / deep paint 2, below the logo (top tier)
  | 'PAINT2' // paint 2, logo to the foul line (second tier)
  | 'SWING3' // swing-swing catch and shoot 3 (second tier)
  | 'NONPAINT3' // non-paint-touch 3 (third tier)
  | 'MID2' // mid-range 2 (third tier)
  | 'NONE'

export type Tier = 'TOP' | 'SECOND' | 'THIRD'

/** How the chunk ended. MADE/MISSED go with a shot; FOUL is a shooting foul with no field goal attempt counted. */
export type Result = 'MADE' | 'MISSED' | 'TO' | 'FOUL' | 'NONE'

export type Half = 1 | 2 | 3

export type TimeoutKind = 'FULL' | 'THIRTY'

/** Why a possession kept going: we got the ball back, same possession number, fresh screen. */
export type Continuation = 'OREB' | 'DEAD_OREB' | 'FLOOR_FOUL'

/** Which trigger of early offense, if any. */
export type Trigger = '2ND_MAKE' | '1ST_MISS' | '2ND_MISS'

/** Late clock solution at 12. */
export type LateClock = 'BAM' | 'TOUCH'

/** Shot clock when the ball crossed half court. */
export type ClockBucket = '26+' | '22-25' | '18-21' | '<18'

/** One shot (or turnover) inside a possession. A possession with no OREB has one chunk's worth of fields at the top level. */
export interface Chunk {
  shot: Shot
  result: Result
  ftm: number
  fta: number
  /** Play family and action for this chunk ('' when none tapped). */
  family: string
  action: string
  paintTouches: number
  reversals: number
  cont: Continuation | null
}

export interface Possession {
  id: string
  gameId: string
  n: number
  half: Half
  points: 0 | 1 | 2 | 3 | 4
  /** Roll-up of the last chunk: shot, result, FTs, play. */
  shot: Shot
  result: Result
  ftm: number
  fta: number
  family: string
  action: string
  /** Transition possession (any play can run out of it). */
  transition: boolean
  trigger: Trigger | null
  lateClock: LateClock | null
  clock: ClockBucket | null
  paintTouches: number
  reversals: number
  /** Offensive rebounds in the possession (one per continuation). */
  orebs: number
  note: string
  /** Every chunk when the possession had more than one; [] for a single-shot possession. */
  chunks: Chunk[]
  segment: number
  createdAt: number
}

export interface Player {
  num: string
  name: string
  fouls: number
}

export type Side = 'us' | 'them'

export interface Game {
  id: string
  opponent: string
  date: string
  home: boolean
  /** Foul chart: our roster and theirs, with personal fouls. */
  rosterUs: Player[]
  rosterThem: Player[]
  /** Team fouls by half (index 0 = 1st, 1 = 2nd, 2 = OT). */
  teamFouls: { us: number[]; them: number[] }
  /** Opponent timeouts used, like hcTimeouts. */
  oppTimeouts: { n: number; half: Half; kind: TimeoutKind }[]
  /** Possession arrow points to us. */
  arrowUs: boolean
  /** Media timeouts: after possession n. */
  timeouts: number[]
  /** Holy Cross timeouts: after possession n, in half. */
  hcTimeouts: { n: number; half: Half; kind: TimeoutKind }[]
  halfEnds: number[]
  status: 'LIVE' | 'FINAL'
  createdAt: number
}

export interface Family {
  name: string
  actions: string[]
}

export interface Labels {
  /** Play-sheet version the saved labels came from; older saves are replaced by the new sheet. */
  version?: number
  families: Family[]
}

export type Draft = Partial<
  Pick<Possession, 'shot' | 'result' | 'ftm' | 'fta' | 'family' | 'action' | 'transition' | 'trigger' | 'lateClock' | 'clock' | 'paintTouches' | 'reversals' | 'note' | 'chunks'>
>
