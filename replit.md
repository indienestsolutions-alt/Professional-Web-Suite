# Workspace

## Overview

pnpm workspace monorepo for **PitchMind AI** — a pitch coaching platform for student / young founders. Helps them turn raw ideas into structured plans, generate decks, and train against AI investor personas.

## Artifacts

- `artifacts/pitchmind` (web) — main React + Vite frontend (Wouter, Tailwind v4, shadcn/ui, Recharts, Framer Motion).
- `artifacts/api-server` (api) — Express 5 backend with Drizzle ORM, mounted at `/api`.
- `artifacts/mockup-sandbox` (design) — component preview server.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24, **pnpm**, **TypeScript 5.9**
- **API**: Express 5, Replit Auth (OIDC), Drizzle ORM, PostgreSQL
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API contract**: OpenAPI → Orval generates React Query hooks + Zod schemas (`lib/api-client-react`)
- **Frontend**: React 19, Vite, Tailwind v4, shadcn/ui, Recharts, Framer Motion, Wouter, TanStack Query

## PitchMind features (built)

- Auth-gated app with public landing + login (Replit Auth)
- Dashboard: stats, progress chart, recent activity, quick actions
- Ideas: list, create, AI-structure, validate (heuristic AI), edit sections inline
- Deck viewer: 9-slide auto-generated pitch decks, slide navigation, fullscreen mode, HTML download
- Pitch arena: pick idea + persona, live chat with per-turn scoring, mistake report on finish
  - AI investor questions: OpenAI gpt-4.1-powered, context-aware, no repeats, idea-specific
  - Voice AI: record → STT transcribe → send pitch → TTS investor response (audio playback)
  - Language switching: 10 languages supported (en/es/fr/de/hi/zh/ar/pt/ja/ko)
  - Auto-end after MAX_SESSION_TURNS (5) turns with full report
  - Full questions list panel (live during session + complete list in report)
- Learning library: founder-focused topics by category
- Settings page

AI layer: `artifacts/api-server/src/lib/pitchAi.ts`
- OpenAI gpt-4.1 for investor question generation (context-aware, language-aware)
- OpenAI gpt-4o-mini-transcribe for STT
- OpenAI gpt-4o-mini-tts for investor TTS voice
- Heuristic scoring fallback (no LLM required) for turn scoring

Seed data (3 personas, 6 learning topics) loads on server start via `artifacts/api-server/src/lib/seed.ts`.

## Brand

- Primary: hsl(16 95% 55%) — vibrant orange "ignition"
- Accent: hsl(250 80% 62%) — electric violet
- Sidebar: deep ink (hsl 240 22% 8%)
- Display font: Space Grotesk; body: Inter; mono: JetBrains Mono
- No emojis in UI text. No Replit branding.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
