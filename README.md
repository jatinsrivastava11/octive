# Octive

Your taste, on the record. A social music platform that turns real listening data into collectible cards, ranked lists and ratings backed by actual plays.

## Stack
- Next.js 16 (App Router, Cache Components) + TypeScript (strict)
- Supabase (Postgres, Auth, Storage, Realtime, pg_cron)
- Spotify Web API
- CSS Modules + design tokens (`src/app/globals.css`)
- Vitest

## Getting started
```bash
cp .env.example .env.local   # fill in Supabase + Spotify keys
npm install
npm run dev                  # http://127.0.0.1:3000
```

## Scripts
| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Typecheck + lint + tests |
| `npm run test` | Unit tests |
| `npm run db:types` | Regenerate Supabase types (needs a linked project) |

## Project layout
```
src/
  app/            routes (App Router)
  components/     UI components (CSS Modules)
  lib/
    core/         pure logic: no I/O, fully unit-tested
    providers/    MusicProvider interface + Spotify / Apple
    supabase/     Supabase clients (browser, server, proxy)
supabase/
  migrations/     SQL migrations
```
