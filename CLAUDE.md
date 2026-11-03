# HC Offense

Live offensive possession chart for the Holy Cross bench, run on an iPad in landscape by Colin during games. Sister app of HC Bench (defense) at `../bench-app`.
Vite + React + TypeScript PWA, zustand stores, Dexie (IndexedDB), vitest. Design doc: `docs/2026-11-02-hc-offense-design.md`.

## Commands

- `npm test` — vitest, must pass before any push.
- `npm run build` — static site in `dist/`.
- Every push to `main` deploys to https://theodorethomasrawlings-del.github.io/hc-offense/ via `.github/workflows/`. Do not use Vercel.

## Layout

- `src/domain` types and the play sheet (`DEFAULT_LABELS`: families and actions), shot tiers, results, triggers, clock buckets.
- `src/engine` pure stats: scoring runs and droughts, windows, breakdowns by play / tier / trigger / clock / paint touch, suggestions.
- `src/store` zustand game and settings stores; `src/db` Dexie tables (database `hc-offense`).
- `src/screens` Setup, Game (the live chart), Summary, History, Trends, Settings (edit the play sheet).
- `src/export` text, Excel, JSON backup.

## How Ted works

Ted is a coach, not a developer. Answer in a few lines: what happened, then the one thing you need. Build what he asks, test it, push it, and tell him it is live at the Pages URL.
