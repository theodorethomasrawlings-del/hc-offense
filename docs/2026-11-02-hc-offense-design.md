# HC Offense: live offensive possession chart on an iPad

Date: 2026-11-02
Owner: Ted Rawlings (head coach, Holy Cross MBB). Charted by Colin.
Source: Colin's play sheet (holy cross play sheet_20261102.pdf) and the HC Bench defensive app. Ted asked for it to be built without an interview, so every choice below not on the play sheet is Ted's to veto.

## Intent

Colin tracks every Holy Cross offensive possession from the bench. The app replaces the paper chart: a few taps per possession, and at any moment (media timeout, Ted turning around) the summary answers PPP, shot selection, turnovers, what plays are working, and what the "other things" on the sheet look like.

Standalone bench tool. Not connected to Sportscode, Synergy, or HC Bench.

## What gets tagged per possession

From the play sheet's POSSESSIONS section, every item is a button on the one screen:

- **Play:** family (Tiger, Spider, Point, Through, 5, Stacked, Zone O, Post-up, BLOB, SLOB, Transition, Other), then that family's action. Back doors and Need-3 calls live inside their families (Spider Down, Point Husky, etc.). Editable in Settings.
- **Shot (shot-selection tier):** Rim / deep paint 2 and Paint touch 3 (top tier); Paint 2 logo-to-FTL and Swing swing catch-and-shoot 3 (2nd tier); Mid-range 2 and No paint touch 3 (3rd tier).
- **How it ended:** Made, Missed, Turnover, Fouled (no FGA). Free throws are two taps: + made FT / + missed FT.
- **Points** are computed from the shot, result and FTs, never typed. 2FGA/FGM, 3FGA/FGM, FTA/FTM, turnovers and OREBs roll up from this.
- **Clock at half court:** 26+, 22–25, 18–21, <18.
- **Trigger:** 2nd trigger off make, 1st trigger off miss, 2nd trigger off miss.
- **Late clock at 12:** Bam, Touch.
- **Paint touch** and **reversal** counters (0–3).
- **Note** (optional, remembers earlier notes).

## Multiple shots in one possession (Ted, 2026-11-02)

An offensive rebound keeps the same possession number but gets its own page. "We kept the ball" has OREB keep going / Dead ball OREB / Floor foul inbound: the current shot is banked as a chunk and a fresh shot-and-play screen opens under the same #. Trigger, clock and note belong to the possession and carry across. The summary rolls the chunks up: points are summed, every shot counts in the shot chart, and the possession counts under every play it ran. "Back a shot" undoes a chunk. The OREB button is refused after a made shot.

## Summary (media timeout screen)

- Headline: PPP, pts/poss, scored-on %, 2FG, 3FG, FT, eFG%, TO and TO%, OREB, good shot % (top + 2nd tier share), paint touch possessions, reversals.
- Consider: automatic sentences (shot selection drifting, turnovers in the last 10, paint-touch PPP gap, families well above or below game PPP, good shots not falling).
- Stat table by game, half, since last timeout; bunches of 10; by segment (between timeouts).
- Shot selection chart: FGA, FGM, FG%, share and points per shot for each of the six shot types.
- By family, by play, by shot clock bucket, by trigger, by late clock, paint touch vs none, reversals 0/1/2+, second chance.
- Quick-ask chips in the header on the live screen: Last 3, Last 10, Since TO, Half, 1st half, Game, Shots, TOs. Tap for a big number for 4 seconds.
- Scoring badge: scores in a row / empties in a row; RUN at 3 scores, DROUGHT at 3 empties.

## Game flow

Same as HC Bench: Setup (opponent, date, home/away), Game, Summary, History (every game kept, reopen, delete), Trends (PPP, eFG, good shot %, TO %, paint touch %, OREB per game), Settings (play sheet editor, email, theme, backup/restore). Media TO, Full TO, 30s TO and End half mark windows. Export: xlsx + txt + json via the share sheet.

## Calls Ted did not make (veto any of these)

- Shot clock buckets 26+ / 22–25 / 18–21 / <18.
- Transition and Other families added so a possession always has a play.
- "Good shot %" = top + 2nd tier attempts over all attempts.
- Points cap at 4 per possession (same as HC Bench).
- No refs, no possession arrow (those stay on the defensive iPad).
